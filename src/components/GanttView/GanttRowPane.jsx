import { NavigationChevronDown, NavigationChevronRight } from "@vibe/icons";
import { Text } from "@vibe/core";

/**
 * GanttRowPane Component
 * 
 * Left panel showing grouped rows (Monday groups or status)
 * Uses themeColors from parent for proper Monday.com theme adaptation
 */
const GanttRowPane = ({
  groupedItems,
  expandedGroups,
  selectedItemId,
  groups,
  groupBy = 'groups',
  themeColors,
  onToggleGroup,
  onItemClick,
  contentHeight,
}) => {
  // Get group metadata based on groupBy mode
  const getGroupInfo = (groupId) => {
    if (groupBy === 'groups') {
      return groups.find(g => g.id === groupId) || { title: 'Unknown', color: '#94A3B8' };
    } else if (groupBy === 'status') {
      // For status grouping, use the first item's statusLabel
      const items = groupedItems[groupId] || [];
      const label = items[0]?.statusLabel || (groupId === 'no-status' ? 'No Status' : groupId);
      return { title: label, color: '#94A3B8' };
    }
    return { title: 'Unknown', color: '#94A3B8' };
  };
  
  const renderGroup = (groupId, items) => {
    const groupInfo = getGroupInfo(groupId);
    const isExpanded = expandedGroups[groupId];
    const itemCount = items.length;
    
    return (
      <div key={groupId} style={{ borderBottom: `1px solid ${themeColors.uiBorder}` }}>
        {/* Group header */}
        <div
          onClick={() => onToggleGroup(groupId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 12px',
            height: '36px',
            cursor: 'pointer',
            backgroundColor: themeColors.primaryBackground,
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.backgroundHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeColors.primaryBackground}
        >
          {isExpanded ? (
            <NavigationChevronDown style={{ width: '16px', height: '16px', color: themeColors.secondaryText }} />
          ) : (
            <NavigationChevronRight style={{ width: '16px', height: '16px', color: themeColors.secondaryText }} />
          )}
          
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: groupInfo.color,
              flexShrink: 0
            }}
          />
          
          <span style={{ 
            fontWeight: '500', 
            fontSize: '14px', 
            color: themeColors.primaryText,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {groupInfo.title}
          </span>
          
          <span style={{
            fontSize: '12px',
            color: themeColors.secondaryText,
            backgroundColor: themeColors.backgroundHover,
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {itemCount}
          </span>
        </div>
        
        {/* Group items (when expanded) */}
        {isExpanded && (
          <div style={{ backgroundColor: themeColors.backgroundHover }}>
            {items.map(item => (
              <div
                key={item.id}
                onClick={(e) => onItemClick(item, e)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 12px 0 40px',
                  height: '40px',
                  cursor: 'pointer',
                  backgroundColor: selectedItemId === item.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  borderLeft: selectedItemId === item.id ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedItemId !== item.id) {
                    e.currentTarget.style.backgroundColor = themeColors.primaryBackground;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedItemId !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    color: themeColors.primaryText,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div 
      style={{
        width: '320px',
        backgroundColor: themeColors.primaryBackground,
        borderRight: `1px solid ${themeColors.uiBorder}`,
        flexShrink: 0,
        height: `${contentHeight}px`
      }}
    >
      {/* Groups */}
      <div>
        {Object.keys(groupedItems).length === 0 ? (
          <div style={{ 
            padding: '32px 12px', 
            textAlign: 'center', 
            fontSize: '14px', 
            color: themeColors.secondaryText 
          }}>
            No items to display
          </div>
        ) : (
          Object.entries(groupedItems).map(([groupId, items]) =>
            renderGroup(groupId, items)
          )
        )}
      </div>
    </div>
  );
};

export default GanttRowPane;
