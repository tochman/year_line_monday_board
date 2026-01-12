import { useRef, useEffect, useState, useMemo } from 'react';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';

/**
 * GanttTimelinePane Component
 * 
 * Right panel showing the timeline with:
 * - SVG bars for items
 * - Today marker
 * - Grid lines
 */
const GanttTimelinePane = ({
  groupedItems,
  expandedGroups,
  selectedItemId,
  timeScale,
  groups,
  onItemClick,
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
  
  const getGroupColor = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group?.color || '#94A3B8';
  };
  
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
    
    Object.entries(groupedItems).forEach(([groupId, items]) => {
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
          
          const color = getGroupColor(groupId);
          const isSelected = selectedItemId === item.id;
          
          bars.push(
            <g 
              key={item.id}
              onClick={(e) => {
                if (onItemClick) {
                  onItemClick(item, e);
                }
              }}
              style={{ cursor: 'pointer' }}
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
        backgroundColor: 'white',
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
                stroke="#E5E7EB"
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
