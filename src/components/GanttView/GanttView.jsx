import { useState, useMemo, useEffect, useRef } from 'react';
import { startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek, addWeeks, getISOWeek, format, addDays } from 'date-fns';
import GanttToolbar from './GanttToolbar';
import GanttRowPane from './GanttRowPane';
import GanttTimelinePane from './GanttTimelinePane';
import ItemEditDialog from '../ItemEditDialog';
import { useMondayGanttData } from './useMondayGanttData';
import { useTimeScale } from './useTimeScale';
import { useMondayTheme } from '../../hooks/useMondayTheme';
import { Text } from "@vibe/core";

/**
 * GanttView Component
 * 
 * Displays Monday.com items in a Gantt chart with:
 * - Group-based swimlanes
 * - Timeline bars
 * - Pan and zoom capabilities
 * - Item editing dialog
 * - Automatic theme adaptation via CSS variables
 * 
 * @param {Array} items - Monday.com items with startDate/endDate
 * @param {Array} groups - Monday.com groups
 * @param {Array} users - Monday.com users for assignment
 * @param {Function} onUpdateItem - Callback when item is updated
 * @param {Function} updateItemName - Callback to update item name
 * @param {Function} updateItemGroup - Callback to update item group
 * @param {Function} updateItemUsers - Callback to update item users
 */
const GanttView = ({
  items = [],
  groups = [],
  users = [],
  onUpdateItem,
  updateItemName,
  updateItemGroup,
  updateItemUsers,
}) => {
  
  // Get theme colors from CSS variables (requires body class to be set by App.jsx)
  const { themeColors } = useMondayTheme();
  
  // View state
  const [yearFilter, setYearFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('groups'); // 'groups' or 'status'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [colorTheme, setColorTheme] = useState('monday');
  
  // Edit dialog state
  const [editingItem, setEditingItem] = useState(null);
  const [dialogPosition, setDialogPosition] = useState(null);
  
  // Time scale state
  const [viewStart, setViewStart] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), 0, 1); // Start of current year
  });
  const [viewEnd, setViewEnd] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), 11, 31); // End of current year
  });
  const [zoomLevel, setZoomLevel] = useState('month'); // 'day' | 'week' | 'month'
  
  // Shared scroll position for syncing row pane and timeline
  const scrollContainerRef = useRef(null);
  const headerScrollRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const timelineHeaderRef = useRef(null);
  
  // Calculate timeline width based on zoom level and date range
  const timelineWidth = useMemo(() => {
    const totalMs = viewEnd.getTime() - viewStart.getTime();
    const totalDays = totalMs / (1000 * 60 * 60 * 24);
    
    // Pixels per day based on zoom level
    let pixelsPerDay;
    switch (zoomLevel) {
      case 'day':
        pixelsPerDay = 30; // Very detailed
        break;
      case 'week':
        pixelsPerDay = 10; // Medium detail
        break;
      case 'month':
      default:
        pixelsPerDay = 5; // Overview
        break;
    }
    
    return Math.max(800, totalDays * pixelsPerDay);
  }, [viewStart, viewEnd, zoomLevel]);
  
  // Transform data for Gantt display
  const { groupedItems, allItems, availableYears } = useMondayGanttData({
    items,
    groups,
    yearFilter,
    groupBy,
  });
  
  // Constants for row heights - must match both panes
  const GROUP_HEADER_HEIGHT = 36;
  const ITEM_ROW_HEIGHT = 40;
  
  // Calculate total content height based on expanded groups
  const contentHeight = useMemo(() => {
    let height = 0;
    Object.entries(groupedItems).forEach(([groupId, items]) => {
      height += GROUP_HEADER_HEIGHT;
      if (expandedGroups[groupId]) {
        height += items.length * ITEM_ROW_HEIGHT;
      }
    });
    return Math.max(height, 400);
  }, [groupedItems, expandedGroups]);
  
  // Initialize all groups as expanded when groupedItems changes
  useEffect(() => {
    if (Object.keys(groupedItems).length > 0) {
      setExpandedGroups(prev => {
        const newExpanded = { ...prev };
        Object.keys(groupedItems).forEach(groupId => {
          // Only set to true if not already defined (preserve user's collapse state)
          if (newExpanded[groupId] === undefined) {
            newExpanded[groupId] = true;
          }
        });
        return newExpanded;
      });
    }
  }, [groupedItems]);
  
  // Initialize view range when available years change and "all" is selected
  useEffect(() => {
    if (yearFilter === 'all' && availableYears.length > 0) {
      const minYear = Math.min(...availableYears);
      const maxYear = Math.max(...availableYears);
      setViewStart(new Date(minYear, 0, 1));
      setViewEnd(new Date(maxYear, 11, 31));
    }
  }, [availableYears, yearFilter]);
  
  // Time scale calculations
  const timeScale = useTimeScale({
    viewStart,
    viewEnd,
    containerWidth: timelineWidth,
    zoomLevel,
  });
  
  // Generate timeline ticks for header
  const timelineTicks = useMemo(() => {
    const ticks = [];
    const startYear = viewStart.getFullYear();
    const endYear = viewEnd.getFullYear();
    const showYear = yearFilter === 'all' || startYear !== endYear;
    
    if (zoomLevel === 'month') {
      // Monthly ticks
      let current = startOfMonth(viewStart);
      const end = endOfMonth(viewEnd);
      
      while (current <= end) {
        const tickEnd = endOfMonth(current);
        ticks.push({
          date: current,
          label: format(current, 'MMM'),
          labelLine2: showYear ? format(current, 'yy') : null,
          width: timeScale.dateToX(tickEnd) - timeScale.dateToX(current),
        });
        current = addMonths(current, 1);
      }
    } else if (zoomLevel === 'week') {
      // Weekly ticks
      let current = startOfWeek(viewStart, { weekStartsOn: 1 }); // Monday
      const end = viewEnd;
      
      while (current <= end) {
        const tickEnd = endOfWeek(current, { weekStartsOn: 1 });
        const weekNum = getISOWeek(current);
        ticks.push({
          date: current,
          label: `W${weekNum}`,
          labelLine2: showYear ? format(current, 'yy') : null,
          width: timeScale.dateToX(tickEnd) - timeScale.dateToX(current),
        });
        current = addWeeks(current, 1);
      }
    } else if (zoomLevel === 'day') {
      // Daily ticks
      let current = new Date(viewStart);
      const end = viewEnd;
      
      while (current <= end) {
        ticks.push({
          date: current,
          label: format(current, 'd'),
          labelLine2: null,
          width: timeScale.dateToX(addDays(current, 1)) - timeScale.dateToX(current),
        });
        current = addDays(current, 1);
      }
    }
    
    return ticks;
  }, [timeScale, viewStart, viewEnd, yearFilter, zoomLevel]);
  
  // Generate month span ticks for day view (top row)
  const monthSpanTicks = useMemo(() => {
    if (zoomLevel !== 'day') return [];
    
    const ticks = [];
    let current = startOfMonth(viewStart);
    const end = endOfMonth(viewEnd);
    const startYear = viewStart.getFullYear();
    const endYear = viewEnd.getFullYear();
    const showYear = yearFilter === 'all' || startYear !== endYear;
    
    while (current <= end) {
      const tickEnd = endOfMonth(current);
      ticks.push({
        date: current,
        label: format(current, 'MMM'),
        labelLine2: showYear ? format(current, 'yy') : null,
        width: timeScale.dateToX(tickEnd) - timeScale.dateToX(current),
      });
      current = addMonths(current, 1);
    }
    
    return ticks;
  }, [timeScale, viewStart, viewEnd, yearFilter, zoomLevel]);
  
  // Scroll to appropriate position when year filter changes
  useEffect(() => {
    if (!timelineScrollRef.current || !timeScale) return;
    
    const scrollTimer = setTimeout(() => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const filterYear = yearFilter === 'all' ? null : parseInt(yearFilter, 10);
      
      // Determine target date
      let targetDate;
      if (yearFilter === 'all' || filterYear === currentYear) {
        targetDate = today;
      } else {
        targetDate = new Date(filterYear, 0, 1);
      }
      
      const targetX = timeScale.dateToX(targetDate);
      const viewportWidth = timelineScrollRef.current.clientWidth;
      const targetScroll = Math.max(0, targetX - viewportWidth / 3);
      
      timelineScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
      
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      }
    }, 100);
    
    return () => clearTimeout(scrollTimer);
  }, [yearFilter, timeScale]);
  
  // Handlers
  const handleZoomIn = () => {
    const levels = ['month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex < levels.length - 1) {
      setZoomLevel(levels[currentIndex + 1]);
    }
  };
  
  const handleZoomOut = () => {
    const levels = ['month', 'week', 'day'];
    const currentIndex = levels.indexOf(zoomLevel);
    if (currentIndex > 0) {
      setZoomLevel(levels[currentIndex - 1]);
    }
  };
  
  const handleTodayClick = () => {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    setViewStart(yearStart);
    setViewEnd(yearEnd);
  };
  
  const handleYearChange = (year) => {
    setYearFilter(year);
    if (year !== 'all') {
      const yearNum = parseInt(year, 10);
      setViewStart(new Date(yearNum, 0, 1));
      setViewEnd(new Date(yearNum, 11, 31));
    } else if (availableYears.length > 0) {
      const minYear = Math.min(...availableYears);
      const maxYear = Math.max(...availableYears);
      setViewStart(new Date(minYear, 0, 1));
      setViewEnd(new Date(maxYear, 11, 31));
    }
  };
  
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  const handleRowItemClick = (item, event) => {
    setSelectedItemId(item.id);
    
    // Open edit dialog
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setDialogPosition({
        x: rect.right,
        y: rect.top
      });
      setEditingItem(item);
    }
    
    if (timelineScrollRef.current && item.startDate) {
      const scrollContainer = timelineScrollRef.current;
      const itemStartX = timeScale.dateToX(new Date(item.startDate));
      const itemEndX = item.endDate ? timeScale.dateToX(new Date(item.endDate)) : itemStartX;
      const itemCenterX = (itemStartX + itemEndX) / 2;
      const viewportWidth = scrollContainer.clientWidth;
      
      const targetScroll = Math.max(0, itemCenterX - viewportWidth / 2);
      scrollContainer.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };
  
  const handleBarClick = (item, event) => {
    setSelectedItemId(item.id);
    
    // Open edit dialog at click position
    if (event) {
      setDialogPosition({
        x: event.clientX,
        y: event.clientY
      });
      setEditingItem(item);
    }
  };

  const handleCloseDialog = () => {
    setEditingItem(null);
    setDialogPosition(null);
  };

  const handleItemUpdate = async (updates) => {
    try {
      // Update name if changed
      if (updates.name !== editingItem.name && updateItemName) {
        await updateItemName(updates.id, updates.name);
      }

      // Update group if changed
      if (updates.groupId !== editingItem.group?.id && updateItemGroup) {
        await updateItemGroup(updates.id, updates.groupId);
      }

      // Update users if changed
      if (JSON.stringify(updates.userIds?.sort()) !== JSON.stringify(editingItem.assignedUserIds?.sort()) && updateItemUsers) {
        await updateItemUsers(updates.id, updates.userIds || []);
      }

      // Update dates if changed
      if ((updates.startDate !== editingItem.startDate || updates.endDate !== editingItem.endDate) && onUpdateItem) {
        await onUpdateItem({
          ...editingItem,
          startDate: updates.startDate,
          endDate: updates.endDate
        });
      }
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  // Handle drag/drop updates from timeline (optimistic)
  const handleDragDropUpdate = async (updatedItem) => {
    try {
      const originalItem = allItems.find(i => i.id === updatedItem.id);
      if (!originalItem) {
        return;
      }

      const datesChanged = updatedItem.startDate !== originalItem.startDate || updatedItem.endDate !== originalItem.endDate;
      const groupChanged = updatedItem.groupId && updatedItem.groupId !== originalItem.group?.id;

      // Set flag to skip next board refetch (optimistic update)
      if (datesChanged || groupChanged) {
        window.__skipNextBoardRefetch = true;
      }

      // Update dates if changed
      if (datesChanged && onUpdateItem) {
        await onUpdateItem({
          ...originalItem,
          startDate: updatedItem.startDate,
          endDate: updatedItem.endDate
        });
      }

      // Update group if changed (only if groupId is explicitly set)
      if (groupChanged && updateItemGroup) {
        await updateItemGroup(updatedItem.id, updatedItem.groupId);
      }
    } catch (err) {
      console.error('Error in drag/drop update:', err);
      
      // Clear the skip flag on error
      delete window.__skipNextBoardRefetch;
      
      // Show user-friendly error
      if (window.mondaySDK) {
        window.mondaySDK.execute('notice', {
          message: 'Failed to update item. The page will refresh.',
          type: 'error',
          timeout: 3000
        });
      }
      
      // Reload after a delay to show the error
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } finally {
      // Clear the flag after a short delay
      setTimeout(() => {
        delete window.__skipNextBoardRefetch;
      }, 500);
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: themeColors.primaryBackground }}>
      {/* Toolbar */}
      <GanttToolbar
        yearFilter={yearFilter}
        availableYears={availableYears}
        groupBy={groupBy}
        zoomLevel={zoomLevel}
        colorTheme={colorTheme}
        themeColors={themeColors}
        onYearChange={handleYearChange}
        onGroupByChange={setGroupBy}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onTodayClick={handleTodayClick}
        onColorThemeChange={setColorTheme}
      />
      
      {/* Unified sticky header row */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: `1px solid ${themeColors.uiBorder}`,
        backgroundColor: themeColors.primaryBackground,
        position: 'sticky',
        top: 0,
        zIndex: 20,
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      }}>
        {/* Left: Row pane header */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          padding: '12px',
          backgroundColor: themeColors.backgroundHover,
          borderRight: `1px solid ${themeColors.uiBorder}`
        }}>
          <Text type="text2" weight="bold" style={{ color: themeColors.primaryText }}>
            Groups
          </Text>
        </div>
        
        {/* Right: Timeline header */}
        <div 
          ref={timelineHeaderRef}
          style={{
            flex: 1,
            overflowX: 'hidden',
            backgroundColor: themeColors.primaryBackground,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Month span row for day view */}
          {zoomLevel === 'day' && monthSpanTicks.length > 0 && (
            <div style={{ display: 'flex', height: '24px', alignItems: 'stretch', width: `${timelineWidth}px`, borderBottom: `1px solid ${themeColors.uiBorder}` }}>
              {monthSpanTicks.map((tick, index) => (
                <div
                  key={index}
                  style={{
                    flexShrink: 0,
                    borderRight: `1px solid ${themeColors.uiBorder}`,
                    padding: '2px 4px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    width: `${tick.width}px`,
                    backgroundColor: themeColors.primaryBackground
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '600', color: themeColors.secondaryText, lineHeight: '1.2' }}>
                    {tick.label}
                  </span>
                  {tick.labelLine2 && (
                    <span style={{ fontSize: '9px', color: themeColors.secondaryText, lineHeight: '1.2', opacity: 0.7 }}>
                      {tick.labelLine2}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Main tick row */}
          <div style={{ display: 'flex', height: zoomLevel === 'day' ? '32px' : '40px', alignItems: 'stretch', width: `${timelineWidth}px` }}>
            {timelineTicks.map((tick, index) => (
              <div
                key={index}
                style={{
                  flexShrink: 0,
                  borderRight: `1px solid ${themeColors.uiBorder}`,
                  padding: '4px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  width: `${tick.width}px`
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: '500', color: themeColors.secondaryText, lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tick.label}
                </span>
                {tick.labelLine2 && (
                  <span style={{ fontSize: '10px', color: themeColors.secondaryText, lineHeight: '1.2', opacity: 0.7 }}>
                    {tick.labelLine2}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content area - shared scroll container */}
      <div ref={scrollContainerRef} style={{
        flex: 1,
        display: 'flex',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        minWidth: 0
      }}>
        {/* Left: Row pane with groups */}
        <GanttRowPane
          groupedItems={groupedItems}
          expandedGroups={expandedGroups}
          selectedItemId={selectedItemId}
          groups={groups}
          groupBy={groupBy}
          themeColors={themeColors}
          onToggleGroup={toggleGroup}
          onItemClick={handleRowItemClick}
          contentHeight={contentHeight}
        />
        
        {/* Right: Timeline pane with bars */}
        <GanttTimelinePane
          groupedItems={groupedItems}
          expandedGroups={expandedGroups}
          selectedItemId={selectedItemId}
          timeScale={timeScale}
          groups={groups}
          colorTheme={colorTheme}
          themeColors={themeColors}
          onItemClick={handleBarClick}
          onItemUpdate={handleDragDropUpdate}
          onHeaderScroll={(scrollLeft) => {
            if (timelineHeaderRef.current) {
              timelineHeaderRef.current.scrollLeft = scrollLeft;
            }
          }}
          contentHeight={contentHeight}
          effectiveWidth={timelineWidth}
          scrollRef={timelineScrollRef}
        />
      </div>

      {/* Item Edit Dialog */}
      {editingItem && dialogPosition && (
        <ItemEditDialog
          item={editingItem}
          position={dialogPosition}
          groups={groups}
          users={users}
          onClose={handleCloseDialog}
          onUpdate={handleItemUpdate}
        />
      )}
    </div>
  );
};

export default GanttView;
