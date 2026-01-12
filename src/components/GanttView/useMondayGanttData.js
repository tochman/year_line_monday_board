import { useMemo } from 'react';

/**
 * useMondayGanttData Hook
 * 
 * Transforms Monday.com board data into Gantt-ready format
 * Parses column_values to extract dates from timeline/date columns
 * Groups items by Monday groups or status column
 * Filters by year if specified
 * 
 * @param {Array} items - Monday.com items with column_values array
 * @param {Array} groups - Monday.com groups
 * @param {Array} columns - Monday.com columns (for status label mapping)
 * @param {string} yearFilter - 'all' or specific year
 * @param {string} groupBy - 'groups' or 'status'
 * @param {string} userFilter - 'all' or user ID
 * @returns {Object} { groupedItems, allItems, availableYears, statusLabels }
 */
export const useMondayGanttData = ({
  items = [],
  groups = [],
  columns = [],
  yearFilter,
  groupBy = 'groups',
  userFilter = 'all',
}) => {
  // Extract status labels from column settings
  const statusLabelsMap = useMemo(() => {
    const statusColumn = columns.find(col => col.type === 'status' || col.type === 'color');
    if (!statusColumn || !statusColumn.settings_str) return {};
    
    try {
      const settings = JSON.parse(statusColumn.settings_str);
      if (settings.labels) {
        // Create a map from index to label info
        const map = {};
        Object.entries(settings.labels).forEach(([index, label]) => {
          map[index] = {
            label: label,
            color: settings.labels_colors?.[index]?.color || '#94A3B8'
          };
        });
        return map;
      }
    } catch (err) {
      // Ignore parse errors
    }
    return {};
  }, [columns]);

  // Transform Monday items to extract dates and status from column_values
  const transformedItems = useMemo(() => {
    return items.map(item => {
      let startDate = null;
      let endDate = null;
      let statusIndex = null;
      let statusLabel = 'No Status';
      let statusColor = '#94A3B8';
      let assignedUserIds = [];
      
      // Parse column_values to find dates, status, and assigned users
      item.column_values?.forEach(col => {
        if (!col.value) return;
        
        try {
          if (col.type === 'timeline') {
            const timelineData = JSON.parse(col.value);
            if (timelineData.from) {
              startDate = timelineData.from;
              endDate = timelineData.to || timelineData.from;
            }
          } else if (col.type === 'date' && !startDate) {
            const dateData = JSON.parse(col.value);
            if (dateData.date) {
              startDate = dateData.date;
              endDate = dateData.date; // Single day item
            }
          } else if (col.type === 'status' && statusIndex === null) {
            // Parse status column
            const statusData = JSON.parse(col.value);
            if (statusData.index !== undefined) {
              statusIndex = statusData.index;
              // Look up label from column settings
              const labelInfo = statusLabelsMap[statusData.index];
              if (labelInfo) {
                statusLabel = labelInfo.label;
                statusColor = labelInfo.color;
              } else if (statusData.label || statusData.text) {
                statusLabel = statusData.label || statusData.text;
              }
            } else if (statusData.label || statusData.text) {
              statusLabel = statusData.label || statusData.text;
            }
          } else if (col.type === 'people' || col.type === 'person') {
            // Parse people column
            const peopleData = JSON.parse(col.value);
            if (peopleData.personsAndTeams) {
              peopleData.personsAndTeams.forEach(person => {
                if (person.id && person.kind === 'person') {
                  assignedUserIds.push(person.id);
                }
              });
            }
          }
        } catch (err) {
          // Skip invalid JSON
        }
      });
      
      return {
        ...item,
        startDate,
        endDate: endDate || startDate,
        statusIndex,
        statusLabel,
        statusColor,
        assignedUserIds,
      };
    }).filter(item => item.startDate); // Only include items with dates
  }, [items, statusLabelsMap]);

  // Extract years from items and calculate available years
  const availableYears = useMemo(() => {
    const years = new Set();
    transformedItems.forEach(item => {
      if (item.startDate) {
        years.add(new Date(item.startDate).getFullYear());
      }
      if (item.endDate) {
        years.add(new Date(item.endDate).getFullYear());
      }
    });
    return [...years].sort((a, b) => a - b);
  }, [transformedItems]);

  // Filter items based on yearFilter
  const yearFilteredItems = useMemo(() => {
    if (yearFilter === 'all') {
      return transformedItems;
    }
    
    const filterYear = parseInt(yearFilter, 10);
    return transformedItems.filter(item => {
      if (!item.startDate || !item.endDate) return false;
      
      const startYear = new Date(item.startDate).getFullYear();
      const endYear = new Date(item.endDate).getFullYear();
      // Include if item overlaps with the filtered year
      return startYear <= filterYear && endYear >= filterYear;
    });
  }, [transformedItems, yearFilter]);
  
  // Filter items based on userFilter
  const filteredItems = useMemo(() => {
    if (userFilter === 'all') {
      return yearFilteredItems;
    }
    
    return yearFilteredItems.filter(item => {
      // Include items assigned to the selected user
      return item.assignedUserIds && item.assignedUserIds.includes(parseInt(userFilter, 10));
    });
  }, [yearFilteredItems, userFilter]);

  // Group items by Monday group or status
  const groupedItems = useMemo(() => {
    const grouped = {};
    
    if (groupBy === 'groups') {
      // Initialize groups from Monday groups
      groups.forEach(group => {
        grouped[group.id] = [];
      });
      
      // Distribute items to groups
      filteredItems.forEach(item => {
        const groupId = item.group?.id;
        if (groupId && grouped[groupId]) {
          grouped[groupId].push(item);
        }
      });
    } else if (groupBy === 'status') {
      // Group by status label (the human-readable text)
      filteredItems.forEach(item => {
        const statusKey = item.statusLabel || 'No Status';
        if (!grouped[statusKey]) {
          grouped[statusKey] = [];
        }
        grouped[statusKey].push(item);
      });
    }
    
    // Sort items within each group by start date
    Object.keys(grouped).forEach(groupId => {
      grouped[groupId].sort((a, b) => 
        new Date(a.startDate) - new Date(b.startDate)
      );
    });
    
    return grouped;
  }, [filteredItems, groups, groupBy]);

  return {
    groupedItems,
    allItems: filteredItems,
    availableYears,
    statusLabelsMap,
  };
};
