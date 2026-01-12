import React from "react";
import { Flex, Text } from "@vibe/core";
import "./Legend.css";

const STATUS_COLORS = {
  "Working on it": "#FDAB3D",
  "Done": "#00C875",
  "Stuck": "#E2445C",
  "Not Started": "#C4C4C4"
};

const Legend = ({ items, statusColumn }) => {
  // Extract unique statuses from items
  const statuses = [...new Set(items.map(item => item.status).filter(Boolean))];
  
  // Extract unique groups from items
  const groups = [...new Set(items.map(item => item.group).filter(Boolean))];

  if (statuses.length === 0 && groups.length === 0) {
    return null;
  }

  return (
    <div className="legend-container">
      {statuses.length > 0 && (
        <div className="legend-section">
          <Text type="text2" weight="medium" className="legend-title">
            Status
          </Text>
          <Flex direction="column" gap="xs">
            {statuses.map(status => (
              <Flex key={status} align="center" gap="xs" className="legend-item">
                <span 
                  className="legend-dot"
                  style={{ 
                    backgroundColor: STATUS_COLORS[status] || "#579BFC" 
                  }}
                />
                <Text type="text3">{status}</Text>
              </Flex>
            ))}
          </Flex>
        </div>
      )}
      
      {groups.length > 0 && (
        <div className="legend-section">
          <Text type="text2" weight="medium" className="legend-title">
            Groups ({groups.length})
          </Text>
          <Flex direction="column" gap="xs">
            {groups.slice(0, 5).map(group => (
              <Flex key={group} align="center" gap="xs" className="legend-item">
                <span className="legend-line" />
                <Text type="text3">{group}</Text>
              </Flex>
            ))}
            {groups.length > 5 && (
              <Text type="text3" className="legend-more">
                +{groups.length - 5} more
              </Text>
            )}
          </Flex>
        </div>
      )}
      
      <div className="legend-section">
        <Flex align="center" gap="xs" className="legend-item">
          <span className="legend-today" />
          <Text type="text3">Today</Text>
        </Flex>
      </div>
    </div>
  );
};

export default Legend;
