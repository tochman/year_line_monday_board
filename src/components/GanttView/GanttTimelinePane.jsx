import { useRef, useEffect, useState, useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { COLOR_THEMES } from '../../constants/colorThemes';

/**
 * GanttTimelinePane Component
 * 
 * Right panel showing the timeline with:
 * - SVG bars for items
 * - Today marker
 * - Grid lines
 * - Theme-aware colors from Monday.com
 */
const GanttTimelinePane = ({
  groupedItems,
  expandedGroups,
  selectedItemId,
  timeScale,
  groups,
  colorTheme = 'monday',
  themeColors,
  onItemClick,
  onItemUpdate,
  onHeaderScroll,
  effectiveWidth,
  scrollRef,
  contentHeight,
}) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const internalScrollRef = useRef(null);
  const scrollContainerRef = scrollRef || internalScrollRef;
  
  // Drag state
  const [dragState, setDragState] = useState(null);
  // dragState = { item, mode: 'move' | 'resize-start' | 'resize-end', startX, startY, originalStartDate, originalEndDate, originalGroupId, currentStartDate, currentEndDate, targetGroupId }
  
  // Hover state for showing resize handles
  const [hoveredBarId, setHoveredBarId] = useState(null);
  
  // Track if we're dragging to prevent click from firing
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  
  // Get bar colors from color theme
  const barColors = COLOR_THEMES[colorTheme]?.colors || COLOR_THEMES.monday.colors;
  
  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Calculate row height (same as row pane)
  const GROUP_HEADER_HEIGHT = 36;
  const ITEM_ROW_HEIGHT = 40;
  
  const getGroupColor = (groupIndex) => {
    // Use bar colors from color theme, cycling through the palette
    return barColors[groupIndex % barColors.length];
  };
  
  // Calculate Y positions for each group
  const groupYPositions = useMemo(() => {
    const positions = [];
    let currentY = 0;
    
    Object.entries(groupedItems).forEach(([groupId, items]) => {
      const startY = currentY;
      currentY += GROUP_HEADER_HEIGHT;
      
      if (expandedGroups[groupId]) {
        currentY += items.length * ITEM_ROW_HEIGHT;
      }
      
      positions.push({
        groupId,
        startY,
        endY: currentY
      });
    });
    
    return positions;
  }, [groupedItems, expandedGroups]);
  
  // Get group at Y position
  const getGroupAtY = (y) => {
    for (const pos of groupYPositions) {
      if (y >= pos.startY && y < pos.endY) {
        return pos.groupId;
      }
    }
    return null;
  };
  
  // Detect drag zone based on mouse position relative to bar
  const getDragZone = (mouseX, barStartX, barWidth) => {
    const RESIZE_ZONE = 10; // pixels from edge to trigger resize
    
    if (mouseX < barStartX + RESIZE_ZONE) {
      return 'resize-start';
    } else if (mouseX > barStartX + barWidth - RESIZE_ZONE) {
      return 'resize-end';
    }
    return 'move';
  };
  
  // Handle drag start on bar
  const handleBarMouseDown = (e, item, barStartX, barWidth, groupId) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft;
    const mode = getDragZone(mouseX, barStartX, barWidth);
    
    // Track start position to detect if it's a click or drag
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    
    setDragState({
      item,
      mode,
      startX: mouseX,
      startY: e.clientY - rect.top + scrollContainerRef.current.scrollTop,
      originalStartDate: new Date(item.startDate),
      originalEndDate: new Date(item.endDate),
      originalGroupId: item.group?.id,
      currentStartDate: new Date(item.startDate),
      currentEndDate: new Date(item.endDate),
      targetGroupId: groupId,
      currentY: e.clientY - rect.top,
    });
  };
  
  // Handle drag move
  const handleDragMove = (e) => {
    if (!dragState) return;
    
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft;
    const mouseY = e.clientY - rect.top;
    const deltaX = mouseX - dragState.startX;
    
    // Check if we've moved enough to consider this a drag
    const moveThreshold = 3;
    const totalMove = Math.abs(e.clientX - dragStartPosRef.current.x) + Math.abs(e.clientY - dragStartPosRef.current.y);
    if (totalMove > moveThreshold) {
      isDraggingRef.current = true;
    }
    
    // Calculate pixels per day - use effectiveWidth if containerWidth is not available
    const width = timeScale.containerWidth || effectiveWidth || containerWidth;
    const totalMs = timeScale.viewEnd.getTime() - timeScale.viewStart.getTime();
    const totalDays = totalMs / (1000 * 60 * 60 * 24);
    const pixelsPerDay = width / totalDays;
    
    // Validate calculation inputs
    if (!width || !totalDays || !pixelsPerDay || isNaN(pixelsPerDay)) {
      console.error('Invalid scale calculation:', { width, totalDays, pixelsPerDay, timeScale });
      return;
    }
    
    // Convert pixel delta to days
    const deltaDays = Math.round(deltaX / pixelsPerDay);
    
    let newStartDate, newEndDate;
    
    if (dragState.mode === 'move') {
      // Move both dates by same amount using milliseconds for accuracy
      newStartDate = new Date(dragState.originalStartDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      newEndDate = new Date(dragState.originalEndDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      
      // Detect target group from Y position
      const targetGroup = getGroupAtY(mouseY + scrollContainerRef.current.scrollTop);
      if (targetGroup && targetGroup !== dragState.targetGroupId) {
        setDragState(prev => ({ ...prev, targetGroupId: targetGroup }));
      }
    } else if (dragState.mode === 'resize-start') {
      // Only change start date using milliseconds
      newStartDate = new Date(dragState.originalStartDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      newEndDate = new Date(dragState.originalEndDate.getTime());
      
      // Ensure start date doesn't go past end date (keep at least 1 day duration)
      if (newStartDate.getTime() >= newEndDate.getTime()) {
        newStartDate = new Date(newEndDate.getTime() - 24 * 60 * 60 * 1000);
      }
    } else if (dragState.mode === 'resize-end') {
      // Only change end date using milliseconds
      newStartDate = new Date(dragState.originalStartDate.getTime());
      newEndDate = new Date(dragState.originalEndDate.getTime() + deltaDays * 24 * 60 * 60 * 1000);
      
      // Ensure end date doesn't go before start date (keep at least 1 day duration)
      if (newEndDate.getTime() <= newStartDate.getTime()) {
        newEndDate = new Date(newStartDate.getTime() + 24 * 60 * 60 * 1000);
      }
    } else {
      // Fallback - shouldn't happen but prevents undefined dates
      console.warn('Unknown drag mode:', dragState.mode);
      newStartDate = new Date(dragState.originalStartDate.getTime());
      newEndDate = new Date(dragState.originalEndDate.getTime());
    }
    
    // Validate dates before updating state
    if (!newStartDate || !newEndDate || isNaN(newStartDate.getTime()) || isNaN(newEndDate.getTime())) {
      console.error('Invalid dates calculated during drag:', {
        mode: dragState.mode,
        deltaDays,
        deltaX,
        width,
        totalDays,
        pixelsPerDay,
        originalStart: dragState.originalStartDate,
        originalEnd: dragState.originalEndDate,
        newStartDate,
        newEndDate
      });
      return;
    }
    
    setDragState(prev => ({
      ...prev,
      currentStartDate: newStartDate,
      currentEndDate: newEndDate,
      currentY: mouseY,
    }));
  };
  
  // Handle drag end
  const handleDragEnd = (e) => {
    if (!dragState) return;
    
    const { item, mode, currentStartDate, currentEndDate, targetGroupId, originalStartDate, originalEndDate, originalGroupId } = dragState;
    
    // If we didn't actually drag (just clicked), and it was in 'move' zone, show tooltip
    if (!isDraggingRef.current && mode === 'move') {
      // It was a click, not a drag
      if (onItemClick) {
        onItemClick(item, e);
      }
      setDragState(null);
      return;
    }
    
    // Check if anything changed
    const startChanged = currentStartDate.getTime() !== originalStartDate.getTime();
    const endChanged = currentEndDate.getTime() !== originalEndDate.getTime();
    const groupChanged = targetGroupId !== originalGroupId;
    
    if (startChanged || endChanged || groupChanged) {
      // Validate dates before formatting
      if (!currentStartDate || !currentEndDate || isNaN(currentStartDate.getTime()) || isNaN(currentEndDate.getTime())) {
        console.error('Invalid dates at drag end, skipping update');
        setDragState(null);
        return;
      }
      
      // Format dates as ISO strings (date only)
      const formatDate = (d) => d.toISOString().split('T')[0];
      
      const updatedItem = {
        ...item,
        startDate: formatDate(currentStartDate),
        endDate: formatDate(currentEndDate),
      };
      
      // Update group if moved between groups
      if (groupChanged) {
        updatedItem.groupId = targetGroupId;
      }
      
      if (onItemUpdate) {
        onItemUpdate(updatedItem);
      }
    }
    
    setDragState(null);
  };
  
  // Store handlers in refs to avoid stale closures
  const dragMoveRef = useRef(handleDragMove);
  const dragEndRef = useRef(handleDragEnd);
  
  useEffect(() => {
    dragMoveRef.current = handleDragMove;
    dragEndRef.current = handleDragEnd;
  });
  
  // Global mouse move/up handlers for drag
  useEffect(() => {
    if (dragState) {
      const handleMouseMoveGlobal = (e) => dragMoveRef.current(e);
      const handleMouseUpGlobal = (e) => dragEndRef.current(e);
      
      window.addEventListener('mousemove', handleMouseMoveGlobal);
      window.addEventListener('mouseup', handleMouseUpGlobal);
      
      // Set cursor
      if (dragState.mode === 'resize-start' || dragState.mode === 'resize-end') {
        document.body.style.cursor = 'ew-resize';
      } else {
        document.body.style.cursor = 'move';
      }
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMoveGlobal);
        window.removeEventListener('mouseup', handleMouseUpGlobal);
        document.body.style.cursor = '';
      };
    }
  }, [dragState !== null]);
  
  // Generate time ticks based on zoom level
  const generateTimeTicks = () => {
    const { viewStart, viewEnd } = timeScale;
    
    // Show months
    const months = [];
    let current = startOfMonth(viewStart);
    const end = endOfMonth(viewEnd);
    
    while (current <= end) {
      const monthEnd = endOfMonth(current);
      months.push({
        date: current,
        label: format(current, 'MMM'),
        labelLine2: format(current, 'yy'),
        width: timeScale.dateToX(monthEnd) - timeScale.dateToX(current),
      });
      current = addMonths(current, 1);
    }
    return months;
  };
  
  const timeTicks = generateTimeTicks();
  
  // Use effectiveWidth from parent
  const timelineWidth = effectiveWidth;
  
  // Notify parent of scroll position for header sync
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !onHeaderScroll) return;
    
    const handleScroll = () => {
      onHeaderScroll(scrollContainer.scrollLeft);
    };
    
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [onHeaderScroll]);
  
  // Use contentHeight from parent (calculated in GanttView)
  const totalHeight = contentHeight;
  
  // Render timeline bars
  const renderBars = () => {
    const bars = [];
    let currentY = 0;
    
    Object.entries(groupedItems).forEach(([groupId, items], groupIndex) => {
      // Add space for group header
      currentY += GROUP_HEADER_HEIGHT;
      
      const isExpanded = expandedGroups[groupId];
      
      if (isExpanded) {
        items.forEach((item, index) => {
          // Skip items without valid dates
          if (!item.startDate || !item.endDate) {
            return;
          }
          
          // Calculate position
          const startX = timeScale.dateToX(new Date(item.startDate));
          const endX = timeScale.dateToX(new Date(item.endDate));
          const width = Math.max(endX - startX, 20);
          
          // Y position - center 24px bar within 40px row (8px padding top/bottom)
          const y = currentY + index * ITEM_ROW_HEIGHT + 8;
          
          const color = getGroupColor(groupIndex);
          const isSelected = selectedItemId === item.id;
          
          // Check if this bar is currently being dragged
          const isBeingDragged = dragState && dragState.item.id === item.id;
          const isHovered = hoveredBarId === item.id;
          
          // If dragging, render ghost + preview bars
          if (isBeingDragged) {
            // Ghost bar at original position
            bars.push(
              <g key={`${item.id}-ghost`}>
                <rect
                  x={startX}
                  y={y}
                  width={width}
                  height={24}
                  rx={12}
                  ry={12}
                  fill={color}
                  opacity={0.3}
                  stroke="none"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={startX + 14}
                  y={y + 16}
                  fontSize="12"
                  fill="white"
                  opacity={0.5}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {item.name.length > 25 ? item.name.slice(0, 25) + '...' : item.name}
                </text>
              </g>
            );
            
            // Preview bar at new position
            const { currentStartDate, currentEndDate } = dragState;
            if (currentStartDate && currentEndDate && !isNaN(currentStartDate.getTime()) && !isNaN(currentEndDate.getTime())) {
              const previewStartX = timeScale.dateToX(currentStartDate);
              const previewEndX = timeScale.dateToX(currentEndDate);
              const previewWidth = Math.max(previewEndX - previewStartX, 20);
              
              bars.push(
                <g key={`${item.id}-preview`}>
                  <rect
                    x={previewStartX}
                    y={y}
                    width={previewWidth}
                    height={24}
                    rx={12}
                    ry={12}
                    fill={color}
                    opacity={0.85}
                    stroke="#3B82F6"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x={previewStartX + 14}
                    y={y + 16}
                    fontSize="12"
                    fill="white"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {item.name.length > 25 ? item.name.slice(0, 25) + '...' : item.name}
                  </text>
                </g>
              );
            }
          } else {
            // Normal bar rendering when not dragging
            const cursorStyle = isHovered ? 'move' : 'pointer';
            
            bars.push(
              <g 
                key={item.id}
                onMouseDown={(e) => {
                  handleBarMouseDown(e, item, startX, width, groupId);
                }}
                onMouseEnter={() => setHoveredBarId(item.id)}
                onMouseLeave={() => setHoveredBarId(null)}
                style={{ cursor: cursorStyle }}
              >
                {/* Bar background (rounded pill) */}
                <rect
                  x={startX}
                  y={y}
                  width={width}
                  height={24}
                  rx={12}
                  ry={12}
                  fill={color}
                  opacity={isSelected ? 1 : 0.9}
                  stroke={isSelected ? '#3B82F6' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
                
                {/* Resize handles on hover */}
                {isHovered && (
                  <>
                    <rect
                      x={startX}
                      y={y}
                      width={10}
                      height={24}
                      fill="white"
                      opacity={0.3}
                      rx={12}
                      style={{ cursor: 'ew-resize' }}
                    />
                    <rect
                      x={startX + width - 10}
                      y={y}
                      width={10}
                      height={24}
                      fill="white"
                      opacity={0.3}
                      rx={12}
                      style={{ cursor: 'ew-resize' }}
                    />
                  </>
                )}
                
                {/* Item name text */}
                <text
                  x={startX + 14}
                  y={y + 16}
                  fontSize="12"
                  fill="white"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {item.name.length > 25 ? item.name.slice(0, 25) + '...' : item.name}
                </text>
              </g>
            );
          }
        });
        
        // Advance Y position by height of all items in this group
        currentY += items.length * ITEM_ROW_HEIGHT;
      }
    });
    
    return bars;
  };
  
  // Today marker
  const todayX = timeScale.dateToX(new Date());
  const showTodayMarker = todayX >= 0 && todayX <= containerWidth;
  
  return (
    <div 
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowX: 'auto',
        backgroundColor: themeColors.primaryBackground,
        minWidth: 0,
        height: `${totalHeight}px`
      }}
    >
      <div ref={containerRef} style={{ 
        position: 'relative', 
        height: `${totalHeight}px`, 
        width: `${timelineWidth}px`, 
        minWidth: '100%' 
      }}>
        {/* Grid lines */}
        <svg
          ref={svgRef}
          style={{ 
            position: 'absolute', 
            inset: 0, 
            pointerEvents: 'none' 
          }}
          width={timelineWidth}
          height={totalHeight}
        >
          {timeTicks.map((tick, index) => {
            const x = timeScale.dateToX(tick.date);
            return (
              <line
                key={index}
                x1={x}
                y1={0}
                x2={x}
                y2={totalHeight}
                stroke={themeColors.uiBorder}
                strokeWidth={1}
              />
            );
          })}
          
          {/* Today marker */}
          {showTodayMarker && (
            <>
              <line
                x1={todayX}
                y1={0}
                x2={todayX}
                y2={totalHeight}
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="4 2"
              />
              <circle
                cx={todayX}
                cy={8}
                r={4}
                fill="#EF4444"
              />
            </>
          )}
        </svg>
        
        {/* Item bars */}
        <svg
          style={{ 
            position: 'absolute', 
            inset: 0 
          }}
          width={timelineWidth}
          height={totalHeight}
        >
          {renderBars()}
        </svg>
      </div>
    </div>
  );
};

export default GanttTimelinePane;
