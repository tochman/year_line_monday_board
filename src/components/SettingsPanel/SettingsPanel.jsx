import React from "react";
import { 
  Dropdown, 
  Flex, 
  Box,
  Button,
  Divider,
  Text,
  AttentionBox
} from "@vibe/core";
import { Update } from "@vibe/icons";
import "./SettingsPanel.css";

const SettingsPanel = ({
  columns,
  groups,
  settings,
  onSettingsChange,
  onRefresh,
  year,
  onYearChange
}) => {
  // Get date columns for dropdown (both "date" and "timeline" types)
  const dateColumns = columns
    .filter(col => col.type === "date" || col.type === "timeline")
    .map(col => ({ 
      value: col.id, 
      label: `${col.title} (${col.type})` 
    }));

  // Get status columns for dropdown
  const statusColumns = columns
    .filter(col => col.type === "status" || col.type === "color")
    .map(col => ({ value: col.id, label: col.title }));

  // Get groups for dropdown
  const groupOptions = [
    { value: null, label: "All Groups" },
    ...groups.map(g => ({ value: g.id, label: g.title }))
  ];

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: currentYear - 1, label: String(currentYear - 1) },
    { value: currentYear, label: String(currentYear) },
    { value: currentYear + 1, label: String(currentYear + 1) }
  ];

  const handleChange = (key) => (option) => {
    onSettingsChange({
      ...settings,
      [key]: option?.value ?? null
    });
  };

  return (
    <div className="settings-panel">
      <Flex direction="column" gap="medium">
        <Flex justify="space-between" align="center">
          <Text type="text1" weight="bold">YearWheel Settings</Text>
          <Button
            kind="tertiary"
            size="small"
            leftIcon={Update}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </Flex>
        
        <Divider />
        
        {!settings.dateColumn && dateColumns.length > 0 && (
          <AttentionBox
            title="Date column required"
            text="Please select a date column to display items on the wheel"
            type="warning"
            compact
          />
        )}
        
        {dateColumns.length === 0 && (
          <AttentionBox
            title="No date columns found"
            text="Add a date or timeline column to your board to use YearWheel"
            type="danger"
            compact
          />
        )}
        
        <Box>
          <Text type="text2" weight="medium" className="setting-label">
            Year
          </Text>
          <Dropdown
            size="small"
            options={yearOptions}
            value={yearOptions.find(o => o.value === year)}
            onChange={(option) => onYearChange(option.value)}
            clearable={false}
          />
        </Box>
        
        <Box>
          <Text type="text2" weight="medium" className="setting-label">
            Date Column *
          </Text>
          <Dropdown
            size="small"
            placeholder="Select date column"
            options={dateColumns}
            value={dateColumns.find(o => o.value === settings.dateColumn)}
            onChange={handleChange("dateColumn")}
            clearable={false}
          />
          <Text type="text3" color="secondary" style={{ marginTop: '4px', display: 'block' }}>
            Supports boards with multiple date columns
          </Text>
        </Box>
        
        <Box>
          <Text type="text2" weight="medium" className="setting-label">
            End Date Column (for ranges)
          </Text>
          <Dropdown
            size="small"
            placeholder="Optional: end date"
            options={dateColumns}
            value={dateColumns.find(o => o.value === settings.endDateColumn)}
            onChange={handleChange("endDateColumn")}
            clearable
          />
        </Box>
        
        <Box>
          <Text type="text2" weight="medium" className="setting-label">
            Status Column
          </Text>
          <Dropdown
            size="small"
            placeholder="Select status column"
            options={statusColumns}
            value={statusColumns.find(o => o.value === settings.statusColumn)}
            onChange={handleChange("statusColumn")}
            clearable
          />
        </Box>
        
        <Box>
          <Text type="text2" weight="medium" className="setting-label">
            Filter by Group
          </Text>
          <Dropdown
            size="small"
            placeholder="All groups"
            options={groupOptions}
            value={groupOptions.find(o => o.value === settings.groupFilter)}
            onChange={handleChange("groupFilter")}
            clearable
          />
        </Box>
      </Flex>
    </div>
  );
};

export default SettingsPanel;
