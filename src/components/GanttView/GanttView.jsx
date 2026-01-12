import { useState, useMemo, useEffect, useRef } from 'react';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import GanttToolbar from './GanttToolbar';
import GanttRowPane from './GanttRowPane';
import GanttTimelinePane from './GanttTimelinePane';
import { useMondayGanttData } from './useMondayGanttData';
import { useTimeScale } from './useTimeScale';
import { Text } from "@vibe/core";

/**
 * GanttView Component
 * 
 * Displays Monday.com items in a Gantt chart with:
 * - Group-based swimlanes
 * - Timeline bars
 * - Pan and zoom capabilities
 * 
 * @param {Array} items - Monday.com items with startDate/endDate
 * @param {Array} groups - Monday.com groups
 * @param {Function} onUpdateItem - Callback when item is updated
 */
const GanttView = ({
  items = [],
  groups = [],
  onUpdateItem,
}) => {
  // View state
  const [yearFilter, setYearFilter] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedItemId, setSelectedItemId] = useState(null);
  
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
    let current = startOfMonth(viewStart);
    const end = endOfMonth(viewEnd);
    
    // Determine if we're showing multiple years
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
  }, [timeScale, viewStart, viewEnd, yearFilter]);
  
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
  
  const handleRowItemClick = (item) => {
    setSelectedItemId(item.id);
    
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
    // Could show a tooltip here in the future
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f9fafb' }}>
      {/* Toolbar */}
      <GanttToolbar
        yearFilter={yearFilter}
        availableYears={availableYears}
        zoomLevel={zoomLevel}
        onYearChange={handleYearChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onTodayClick={handleTodayClick}
      />
      
      {/* Unified sticky header row */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white',
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
          backgroundColor: '#f3f4f6',
          borderRight: '1px solid #e5e7eb'
        }}>
          <Text type="text2" weight="bold" style={{ color: '#374151' }}>
            Groups
          </Text>
        </div>
        
        {/* Right: Timeline header */}
        <div 
          ref={timelineHeaderRef}
          style={{
            flex: 1,
            overflowX: 'hidden',
            backgroundColor: '#f9fafb',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div style={{ display: 'flex', height: '40px', alignItems: 'stretch', width: `${timelineWidth}px` }}>
            {timelineTicks.map((tick, index) => (
              <div
                key={index}
                style={{
                  flexShrink: 0,
                  borderRight: '1px solid #e5e7eb',
                  padding: '4px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  width: `${tick.width}px`
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#6B7280', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tick.label}
                </span>
                {tick.labelLine2 && (
                  <span style={{ fontSize: '10px', color: '#9CA3AF', lineHeight: '1.2' }}>
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
          onItemClick={handleBarClick}
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
    </div>
  );
};

export default GanttView;
