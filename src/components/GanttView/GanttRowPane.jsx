import { NavigationChevronDown, NavigationChevronRight } from "@vibe/icons";
import { Text } from "@vibe/core";

/**
 * GanttRowPane Component
 * 
 * Left panel showing grouped rows (Monday groups)
 */
const GanttRowPane = ({
  groupedItems,
  expandedGroups,
  selectedItemId,
  groups,
  onToggleGroup,
  onItemClick,
  contentHeight,
}) => {
  // Get group metadata
  const getGroupInfo = (groupId) => {
    return groups.find(g => g.id === groupId) || { title: 'Unknown', color: '#94A3B8' };
  };
  
  const renderGroup = (groupId, items) => {
    const groupInfo = getGroupInfo(groupId);
    const isExpanded = expandedGroups[groupId];
    const itemCount = items.length;
    
    return (
      <div key={groupId} style={{ borderBottom: '1px solid #e5e7eb' }}>
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
            backgroundColor: 'white',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          {isExpanded ? (
            <NavigationChevronDown style={{ width: '16px', height: '16px', color: '#6B7280' }} />
          ) : (
            <NavigationChevronRight style={{ width: '16px', height: '16px', color: '#6B7280' }} />
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
            color: '#111827',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {groupInfo.title}
          </span>
          
          <span style={{
            fontSize: '12px',
            color: '#6B7280',
            backgroundColor: '#F3F4F6',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {itemCount}
          </span>
        </div>
        
        {/* Group items (when expanded) */}
        {isExpanded && (
          <div style={{ backgroundColor: '#f9fafb' }}>
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0 12px 0 40px',
                  height: '40px',
                  cursor: 'pointer',
                  backgroundColor: selectedItemId === item.id ? '#eff6ff' : 'transparent',
                  borderLeft: selectedItemId === item.id ? '2px solid #3b82f6' : '2px solid transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedItemId !== item.id) {
                    e.currentTarget.style.backgroundColor = 'white';
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
                    color: '#111827',
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
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
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
            color: '#6B7280' 
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
