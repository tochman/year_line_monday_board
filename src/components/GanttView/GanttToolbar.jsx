import { Add, Remove, Calendar } from "@vibe/icons";
import { Button, Dropdown, Flex } from "@vibe/core";

/**
 * GanttToolbar Component
 * 
 * Top toolbar with controls for:
 * - Year selection
 * - Today button
 * - Zoom controls
 */
const GanttToolbar = ({
  yearFilter,
  availableYears,
  zoomLevel,
  onYearChange,
  onZoomIn,
  onZoomOut,
  onTodayClick,
}) => {
  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...availableYears.map(year => ({ value: String(year), label: String(year) }))
  ];

  const zoomLevels = {
    month: 'Month',
    week: 'Week',
    day: 'Day'
  };
  
  return (
    <Flex 
      justify="space-between" 
      align="center"
      style={{ 
        padding: '16px 24px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb' 
      }}
    >
      {/* Left: Title and Year selector */}
      <Flex gap="large" align="center">
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
          Gantt Timeline
        </h2>
        
        <Flex gap="medium" align="center">
          <Dropdown
            placeholder="Select year"
            options={yearOptions}
            value={yearOptions.find(opt => opt.value === yearFilter)}
            onChange={(option) => onYearChange(option.value)}
            size="medium"
            clearable={false}
          />
          
          <Button
            onClick={onTodayClick}
            kind="tertiary"
            size="medium"
            leftIcon={Calendar}
          >
            Today
          </Button>
        </Flex>
      </Flex>
      
      {/* Right: Zoom controls */}
      <Flex gap="medium" align="center">
        <span style={{ fontSize: '14px', color: '#6B7280' }}>Zoom:</span>
        <Flex gap="xs" align="center">
          <Button
            onClick={onZoomOut}
            disabled={zoomLevel === 'month'}
            kind="tertiary"
            size="small"
            leftIcon={Remove}
          >
            Out
          </Button>
          <span style={{ 
            padding: '4px 8px', 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#6B7280',
            backgroundColor: '#F3F4F6',
            borderRadius: '4px',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {zoomLevels[zoomLevel]}
          </span>
          <Button
            onClick={onZoomIn}
            disabled={zoomLevel === 'day'}
            kind="tertiary"
            size="small"
            leftIcon={Add}
          >
            In
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default GanttToolbar;
