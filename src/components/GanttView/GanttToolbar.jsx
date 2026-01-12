import { Add, Remove, Calendar, Favorite } from "@vibe/icons";
import { Button, Dropdown, Flex } from "@vibe/core";
import { COLOR_THEMES } from '../../constants/colorThemes';

/**
 * GanttToolbar Component
 * 
 * Top toolbar with controls for:
 * - Year selection
 * - Group by selection
 * - Today button
 * - Zoom controls
 * - Color theme selection
 */
const GanttToolbar = ({
  yearFilter,
  availableYears,
  groupBy,
  zoomLevel,
  colorTheme = 'monday',
  themeColors,
  onYearChange,
  onGroupByChange,
  onZoomIn,
  onZoomOut,
  onTodayClick,
  onColorThemeChange,
}) => {
  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...availableYears.map(year => ({ value: String(year), label: String(year) }))
  ];
  
  const groupByOptions = [
    { value: 'groups', label: 'Groups' },
    { value: 'status', label: 'Status' }
  ];

  const zoomLevels = {
    month: 'Month',
    week: 'Week',
    day: 'Day'
  };
  
  const themeOptions = Object.keys(COLOR_THEMES).map(key => ({
    value: key,
    label: COLOR_THEMES[key].name
  }));
  
  return (
    <Flex 
      justify="space-between" 
      align="center"
      style={{ 
        padding: '16px 24px', 
        backgroundColor: themeColors.primaryBackground, 
        borderBottom: `1px solid ${themeColors.uiBorder}`,
        position: 'relative',
        zIndex: 100
      }}
    >
      {/* Left: Title and Year selector */}
      <Flex gap="large" align="center">
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: themeColors.primaryText }}>
          Gantt Timeline
        </h2>
        
        <Flex gap="medium" align="center">
          <div style={{ minWidth: '140px' }}>
            <Dropdown
              placeholder="Select year"
              options={yearOptions}
              value={yearOptions.find(opt => opt.value === yearFilter)}
              onChange={(option) => onYearChange(option?.value)}
              size="medium"
              clearable={false}
            />
          </div>
          
          <div style={{ minWidth: '140px' }}>
            <Dropdown
              placeholder="Group by"
              options={groupByOptions}
              value={groupByOptions.find(opt => opt.value === groupBy)}
              onChange={(option) => onGroupByChange(option?.value)}
              size="medium"
              clearable={false}
            />
          </div>
          
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
      
      {/* Right: Color theme and Zoom controls */}
      <Flex gap="medium" align="center">
        <div style={{ minWidth: '160px' }}>
          <Dropdown
            placeholder="Color theme"
            options={themeOptions}
            value={themeOptions.find(opt => opt.value === colorTheme)}
            onChange={(option) => {
              console.log('🎨 Color theme changed:', option);
              onColorThemeChange?.(option?.value);
            }}
            size="medium"
            clearable={false}
          />
        </div>
        
        <span style={{ fontSize: '14px', color: themeColors.secondaryText }}>Zoom:</span>
        <Flex gap="xs" align="center">
          <Button
            onClick={() => {
              console.log('🔍 Zoom out clicked');
              onZoomOut();
            }}
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
            color: themeColors.secondaryText,
            backgroundColor: themeColors.backgroundHover,
            borderRadius: '4px',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {zoomLevels[zoomLevel]}
          </span>
          <Button
            onClick={() => {
              console.log('🔍 Zoom in clicked');
              onZoomIn();
            }}
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
