import React, { useState, useEffect } from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  Button, 
  Flex, 
  Text, 
  RadioButton, 
  Box,
  Checkbox,
  Divider,
  TabList,
  Tab,
  Dropdown
} from "@vibe/core";
import { COLOR_THEMES } from "../../constants/colorThemes";
import "./SettingsDialog.css";

const SettingsDialog = ({ 
  show, 
  onClose,
  // Color theme settings
  currentTheme = "monday",
  currentColorMode = "group",
  onThemeChange,
  // Display settings
  showWeekRing = true,
  onShowWeekRingChange,
  weekRingDisplayMode = 'week-numbers',
  onWeekRingDisplayModeChange,
  showRingNames = true,
  onShowRingNamesChange,
  // Data settings (Monday.com columns)
  columns = [],
  settings = {},
  onSettingsChange,
  // Reset handler
  onResetConfiguration
}) => {
  // Local state for theme (applied on save)
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [colorMode, setColorMode] = useState(currentColorMode);
  
  // Local state for display options (apply immediately for preview, revert on cancel)
  const [localShowWeekRing, setLocalShowWeekRing] = useState(showWeekRing);
  const [localWeekRingDisplayMode, setLocalWeekRingDisplayMode] = useState(weekRingDisplayMode);
  const [localShowRingNames, setLocalShowRingNames] = useState(showRingNames);
  
  const [activeTab, setActiveTab] = useState(0);

  // Sync local state when dialog opens
  useEffect(() => {
    if (show) {
      setSelectedTheme(currentTheme);
      setColorMode(currentColorMode);
      setLocalShowWeekRing(showWeekRing);
      setLocalWeekRingDisplayMode(weekRingDisplayMode);
      setLocalShowRingNames(showRingNames);
    }
  }, [show, currentTheme, currentColorMode, showWeekRing, weekRingDisplayMode, showRingNames]);

  // Apply display changes in real-time for preview
  const handleShowWeekRingChange = (checked) => {
    setLocalShowWeekRing(checked);
    onShowWeekRingChange?.(checked);
  };

  const handleWeekRingDisplayModeChange = (mode) => {
    setLocalWeekRingDisplayMode(mode);
    onWeekRingDisplayModeChange?.(mode);
  };

  const handleShowRingNamesChange = (checked) => {
    setLocalShowRingNames(checked);
    onShowRingNamesChange?.(checked);
  };

  const handleApply = () => {
    // Apply theme changes
    onThemeChange?.({ theme: selectedTheme, colorMode });
    onClose();
  };

  const handleCancel = () => {
    // Revert display settings to original values
    onShowWeekRingChange?.(showWeekRing);
    onWeekRingDisplayModeChange?.(weekRingDisplayMode);
    onShowRingNamesChange?.(showRingNames);
    onClose();
  };

  if (!show) return null;

  const currentThemeData = COLOR_THEMES[selectedTheme];

  return (
    <Modal show={show} onClose={handleCancel} width="large" className="settings-dialog-modal">
      <ModalHeader title="Wheel Settings" onClose={handleCancel} />
      
      <ModalContent>
        <TabList
          activeTabId={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId)}
          className="settings-dialog-tabs"
        >
          <Tab>Wheel Colors</Tab>
          <Tab>Display</Tab>
          <Tab>Data</Tab>
        </TabList>

        <div className="settings-dialog-content">{/* Removed inline styles - now in CSS */}
          {/* Wheel Colors Tab */}
          {activeTab === 0 && (
            <div className="settings-colors-tab">
              {/* Item Color Source */}
              <div className="settings-section">
                <Text type="text1" weight="bold">Item Colors</Text>
                <Text type="text3" color="secondary" className="settings-help-text">
                  How should items on the wheel be colored?
                </Text>
                
                <div className="settings-color-mode">
                  <label className="settings-radio-row">
                    <RadioButton 
                      name="colorMode"
                      value="group"
                      checked={colorMode === 'group'}
                      onSelect={() => setColorMode('group')}
                    />
                    <div>
                      <Text type="text2" weight="medium">Monday.com group colors</Text>
                      <Text type="text3" color="secondary">Each item uses its group's color</Text>
                    </div>
                  </label>
                  
                  <label className="settings-radio-row">
                    <RadioButton 
                      name="colorMode"
                      value="theme"
                      checked={colorMode === 'theme'}
                      onSelect={() => setColorMode('theme')}
                    />
                    <div>
                      <Text type="text2" weight="medium">Theme palette colors</Text>
                      <Text type="text3" color="secondary">Items use colors from selected palette below</Text>
                    </div>
                  </label>
                </div>
              </div>

              <Divider className="settings-divider" />

              {/* Color Palette Selection */}
              <div className="settings-section">
                <Text type="text1" weight="bold">Color Palette</Text>
                <Text type="text3" color="secondary" className="settings-help-text">
                  Colors for month/week rings{colorMode === 'theme' ? ' and items' : ''}
                </Text>
                
                <div className="settings-palette-list">
                  {Object.entries(COLOR_THEMES).map(([key, theme]) => (
                    <div
                      key={key}
                      className={`settings-palette-row ${selectedTheme === key ? 'selected' : ''}`}
                      onClick={() => setSelectedTheme(key)}
                    >
                      <div className="settings-palette-info">
                        <RadioButton 
                          name="theme"
                          value={key}
                          checked={selectedTheme === key}
                          onSelect={() => setSelectedTheme(key)}
                        />
                        <div className="settings-palette-text">
                          <Text type="text2" weight="medium">{theme.name}</Text>
                          <Text type="text3" color="secondary">{theme.description}</Text>
                        </div>
                      </div>
                      <div className="settings-palette-colors">
                        {theme.colors.slice(0, 8).map((color, index) => (
                          <div 
                            key={index}
                            className="settings-swatch"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {currentThemeData && (
                <>
                  <Divider className="settings-divider" />
                  <div className="settings-section">
                    <Text type="text1" weight="bold">Ring Preview</Text>
                    <div className="settings-ring-preview">
                      <div className="settings-preview-row">
                        <Text type="text3" color="secondary">Month rings:</Text>
                        <div className="settings-preview-swatches">
                          {currentThemeData.monthRing.map((color, idx) => (
                            <div 
                              key={idx}
                              className="settings-preview-swatch"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="settings-preview-row">
                        <Text type="text3" color="secondary">Week ring:</Text>
                        <div className="settings-preview-swatches">
                          <div 
                            className="settings-preview-swatch"
                            style={{ backgroundColor: currentThemeData.weekRing }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 1 && (
            <div className="settings-display-tab">
              {/* Week Ring */}
              <div className="settings-section">
                <Text type="text1" weight="bold">Week Ring</Text>
                <Text type="text3" color="secondary" className="settings-help-text">
                  The inner ring showing week indicators
                </Text>
                
                <div className="settings-toggle-row">
                  <Checkbox
                    label="Show week ring"
                    checked={localShowWeekRing}
                    onChange={(e) => handleShowWeekRingChange(e.target.checked)}
                  />
                </div>
                
                {localShowWeekRing && (
                  <div className="settings-sub-options">
                    <Text type="text3" color="secondary" style={{ marginBottom: '8px' }}>
                      Display format:
                    </Text>
                    <label className="settings-radio-row compact">
                      <RadioButton 
                        name="weekRingMode"
                        value="week-numbers"
                        checked={localWeekRingDisplayMode === 'week-numbers'}
                        onSelect={() => handleWeekRingDisplayModeChange('week-numbers')}
                      />
                      <Text type="text2">Week numbers (1-53)</Text>
                    </label>
                    <label className="settings-radio-row compact">
                      <RadioButton 
                        name="weekRingMode"
                        value="dates"
                        checked={localWeekRingDisplayMode === 'dates'}
                        onSelect={() => handleWeekRingDisplayModeChange('dates')}
                      />
                      <Text type="text2">Dates</Text>
                    </label>
                  </div>
                )}
              </div>

              <Divider className="settings-divider" />

              {/* Ring Labels */}
              <div className="settings-section">
                <Text type="text1" weight="bold">Ring Labels</Text>
                <Text type="text3" color="secondary" className="settings-help-text">
                  Show group names on outer edge of rings
                </Text>
                
                <div className="settings-toggle-row">
                  <Checkbox
                    label="Show ring names"
                    checked={localShowRingNames}
                    onChange={(e) => handleShowRingNamesChange(e.target.checked)}
                  />
                </div>
              </div>

              {/* Reset */}
              {onResetConfiguration && (
                <>
                  <Divider className="settings-divider" />
                  <div className="settings-section">
                    <Text type="text1" weight="bold">Reset</Text>
                    <Text type="text3" color="secondary" className="settings-help-text">
                      Restore ring configuration from Monday.com groups
                    </Text>
                    <Button
                      kind="tertiary"
                      size="small"
                      onClick={() => {
                        onResetConfiguration();
                        onClose();
                      }}
                      style={{ marginTop: '12px' }}
                    >
                      Reset Ring Configuration
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 2 && (
            <div className="settings-data-tab">
              {/* Date Column Selection */}
              <div className="settings-section">
                <Text type="text1" weight="bold">Date Column</Text>
                <Text type="text3" color="secondary" className="settings-help-text">
                  Select which date or timeline column to use for displaying items
                </Text>
                
                <Box style={{ marginTop: '12px' }}>
                  <Dropdown
                    size="medium"
                    placeholder="Select date column"
                    options={columns
                      .filter(col => col.type === "date" || col.type === "timeline")
                      .map(col => ({ value: col.id, label: `${col.title} (${col.type})` }))}
                    value={settings.dateColumn ? {
                      value: settings.dateColumn,
                      label: (() => {
                        const col = columns.find(c => c.id === settings.dateColumn);
                        return col ? `${col.title} (${col.type})` : settings.dateColumn;
                      })()
                    } : null}
                    onChange={(option) => onSettingsChange?.({ ...settings, dateColumn: option?.value || null })}
                    clearable={false}
                  />
                </Box>
              </div>

              <Divider className="settings-divider" />

              {/* End Date Column Selection */}
              <div className="settings-section">
                <Text type="text1" weight="bold">End Date Column</Text>
                <Text type="text3" color="secondary" className="settings-help-text">
                  Optional: Select a separate column for end dates (for items with duration)
                </Text>
                
                <Box style={{ marginTop: '12px' }}>
                  <Dropdown
                    size="medium"
                    placeholder="Use start date only"
                    options={columns
                      .filter(col => col.type === "date" || col.type === "timeline")
                      .map(col => ({ value: col.id, label: `${col.title} (${col.type})` }))}
                    value={settings.endDateColumn ? {
                      value: settings.endDateColumn,
                      label: (() => {
                        const col = columns.find(c => c.id === settings.endDateColumn);
                        return col ? `${col.title} (${col.type})` : settings.endDateColumn;
                      })()
                    } : null}
                    onChange={(option) => onSettingsChange?.({ ...settings, endDateColumn: option?.value || null })}
                    clearable={true}
                  />
                </Box>
              </div>

              <Divider className="settings-divider" />

              {/* Status Column Selection */}
              <div className="settings-section">
                <Text type="text1" weight="bold">Status Column</Text>
                <Text type="text3" color="secondary" className="settings-help-text">
                  Optional: Select a status column for additional item metadata
                </Text>
                
                <Box style={{ marginTop: '12px' }}>
                  <Dropdown
                    size="medium"
                    placeholder="No status column"
                    options={columns
                      .filter(col => col.type === "status" || col.type === "color")
                      .map(col => ({ value: col.id, label: col.title }))}
                    value={settings.statusColumn ? {
                      value: settings.statusColumn,
                      label: columns.find(c => c.id === settings.statusColumn)?.title || settings.statusColumn
                    } : null}
                    onChange={(option) => onSettingsChange?.({ ...settings, statusColumn: option?.value || null })}
                    clearable={true}
                  />
                </Box>
              </div>
            </div>
          )}
        </div>
      </ModalContent>
      
      <ModalFooter>
        <Button kind="tertiary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleApply}>
          Apply
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SettingsDialog;
