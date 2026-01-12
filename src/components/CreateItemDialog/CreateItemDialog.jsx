/**
 * CreateItemDialog - Dialog for creating new items in Monday.com
 */

import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  TextField,
  Dropdown,
  Divider,
} from "@vibe/core";
import { Calendar } from "@vibe/icons";
import "./CreateItemDialog.css";

const CreateItemDialog = ({
  show,
  onClose,
  onSave,
  groups = [],
  columns = [],
  settings = {},
}) => {
  const [itemName, setItemName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasDateError, setHasDateError] = useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (show) {
      setItemName("");
      setSelectedGroup(groups.length > 0 ? groups[0]?.id : null);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate("");
      setHasDateError(false);
    }
  }, [show, groups]);

  // Validate dates
  React.useEffect(() => {
    if (endDate && startDate && endDate < startDate) {
      setHasDateError(true);
    } else {
      setHasDateError(false);
    }
  }, [startDate, endDate]);

  const canSave = itemName.trim() && selectedGroup && startDate && !hasDateError;

  const handleSave = async () => {
    if (!canSave) return;

    await onSave({
      name: itemName,
      groupId: selectedGroup,
      startDate,
      endDate: endDate || null,
    });

    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && canSave) {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!show) return null;

  // Convert groups to dropdown options
  const groupOptions = groups.map(group => ({
    value: group.id,
    label: group.title,
  }));

  return (
    <div className="create-item-dialog-overlay" onClick={onClose}>
      <div className="create-item-dialog" onClick={(e) => e.stopPropagation()}>
        <Flex direction="column" style={{ height: '100%' }}>
          {/* Header */}
          <Box padding="large" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <Flex direction="column" gap="xs">
              <Text type="text1" weight="bold">Create New Item</Text>
              <Text type="text3" color="secondary">
                Add a new item to your board
              </Text>
            </Flex>
          </Box>

          {/* Form Fields */}
          <Box padding="large" style={{ flex: 1, overflowY: 'auto' }}>
            <Flex direction="column" gap="large" align="stretch" className="create-item-dialog-form">
              {/* Item Name */}
              <div>
                <TextField
                  title="Item Name"
                  value={itemName}
                  onChange={(value) => setItemName(value)}
                  placeholder="e.g., Q1 Planning Meeting"
                  size="medium"
                  onKeyDown={handleKeyDown}
                  required
                  autoFocus
                />
              </div>

              {/* Group Selection */}
              <div className="group-dropdown-wrapper">
                <Text type="text3" weight="medium" style={{ marginBottom: '8px', display: 'block' }}>
                  Group <span style={{ color: 'var(--color-error)' }}>*</span>
                </Text>
                <Dropdown
                  placeholder="Select a group"
                  options={groupOptions}
                  value={selectedGroup}
                  onChange={(option) => setSelectedGroup(option.value)}
                  size="medium"
                  insideOverflowContainer
                  menuPlacement="bottom"
                />
              </div>

              <Divider />

              {/* Date Fields Row */}
              <div className="create-item-dialog-dates">
                {/* Start Date */}
                <div>
                  <TextField
                    title="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(value) => setStartDate(value)}
                    size="medium"
                    required
                  />
                </div>

                {/* End Date (Optional) */}
                <div>
                  <TextField
                    title="End Date"
                    type="date"
                    value={endDate}
                    onChange={(value) => setEndDate(value)}
                    size="medium"
                    validation={hasDateError ? { status: "error", text: "End date cannot be before start date" } : null}
                  />
                  <Text type="text3" color="secondary" style={{ marginTop: '4px', display: 'block', fontSize: '11px' }}>
                    Optional - leave empty for single day
                  </Text>
                </div>
              </div>
            </Flex>
          </Box>

          {/* Action Buttons */}
          <Box padding="large" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Flex gap="medium" justify="end">
              <Button
                kind="tertiary"
                onClick={onClose}
                size="medium"
              >
                Cancel
              </Button>
              <Button
                kind="primary"
                onClick={handleSave}
                disabled={!canSave}
                size="medium"
              >
                Create Item
              </Button>
            </Flex>
          </Box>
        </Flex>
      </div>
    </div>
  );
};

export default CreateItemDialog;
