import { useState, useEffect } from 'react';
import { Box, TextField, Button, Flex, Text, IconButton, Dropdown } from '@vibe/core';
import { Close, Calendar } from '@vibe/icons';

/**
 * ItemEditDialog Component
 * 
 * Modal dialog for editing Gantt item details:
 * - Name
 * - Group assignment
 * - User assignments (multi-select)
 * - Status
 * - Start and end dates
 */
const ItemEditDialog = ({
  item,
  position,
  groups,
  users,
  statusOptions = [],
  onClose,
  onUpdate,
}) => {
  const [editedName, setEditedName] = useState(item?.name || '');
  const [editedStartDate, setEditedStartDate] = useState(item?.startDate || '');
  const [editedEndDate, setEditedEndDate] = useState(item?.endDate || '');
  const [editedGroupId, setEditedGroupId] = useState(item?.group?.id || '');
  const [editedUserIds, setEditedUserIds] = useState(item?.assignedUserIds || []);
  const [editedStatusIndex, setEditedStatusIndex] = useState(item?.statusIndex ?? null);
  const [hasChanges, setHasChanges] = useState(false);

  // Track if any field changed
  useEffect(() => {
    const nameChanged = editedName !== item.name;
    const startDateChanged = editedStartDate !== item.startDate;
    const endDateChanged = editedEndDate !== (item.endDate || '');
    const groupIdChanged = editedGroupId !== item.group?.id;
    const usersChanged = JSON.stringify(editedUserIds.sort()) !== JSON.stringify((item.assignedUserIds || []).sort());
    const statusChanged = editedStatusIndex !== (item.statusIndex ?? null);
    
    setHasChanges(
      nameChanged || startDateChanged || endDateChanged || groupIdChanged || usersChanged || statusChanged
    );
  }, [editedName, editedStartDate, editedEndDate, editedGroupId, editedUserIds, editedStatusIndex, item]);

  // Validate dates
  const hasDateError = 
    editedEndDate && editedStartDate && editedEndDate < editedStartDate;
  const canSave = hasChanges && !hasDateError && editedName.trim();

  if (!item || !position) return null;

  const handleSave = async () => {
    await onUpdate?.({
      id: item.id,
      name: editedName,
      startDate: editedStartDate,
      endDate: editedEndDate || null,
      groupId: editedGroupId,
      userIds: editedUserIds,
      statusIndex: editedStatusIndex,
    });

    onClose();
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedStartDate(item.startDate);
    setEditedEndDate(item.endDate || '');
    setEditedGroupId(item.group?.id || '');
    setEditedUserIds(item.assignedUserIds || []);
    setEditedStatusIndex(item.statusIndex ?? null);
    onClose();
  };

  return (
    <Box
      style={{
        position: 'fixed',
        left: position.x + 10,
        top: position.y + 10,
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      border
      rounded="medium"
      shadow="medium"
      padding="medium"
      className="item-edit-dialog"
    >
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
        <Text type="text1" weight="bold">Edit Item</Text>
        <IconButton
          icon={Close}
          size="xs"
          kind="tertiary"
          ariaLabel="Close"
          onClick={handleCancel}
        />
      </Flex>

      {/* Name field */}
      <div style={{ marginBottom: '12px' }}>
        <TextField
          title="Name"
          value={editedName}
          onChange={(value) => setEditedName(value)}
          placeholder="Item name"
          size="medium"
          required
        />
      </div>

      {/* Group selector */}
      <div style={{ marginBottom: '12px' }}>
        <Text type="text3" weight="medium" color="secondary" style={{ marginBottom: '4px', display: 'block' }}>
          Group
        </Text>
        <Dropdown
          placeholder="Select group"
          options={groups?.map((group) => ({
            value: group.id,
            label: group.title,
          })) || []}
          value={editedGroupId ? { value: editedGroupId, label: groups?.find(g => g.id === editedGroupId)?.title } : null}
          onChange={(option) => setEditedGroupId(option?.value || '')}
          size="medium"
          clearable={false}
        />
      </div>

      {/* User assignment */}
      <div style={{ marginBottom: '12px' }}>
        <Text type="text3" weight="medium" color="secondary" style={{ marginBottom: '4px', display: 'block' }}>
          Assigned To
        </Text>
        {users && users.length > 0 ? (
          <Dropdown
            placeholder="Select team members..."
            multi
            multiline
            clearable
            searchable
            options={users.map(user => ({
              value: parseInt(user.id),
              label: user.name
            }))}
            value={editedUserIds.map(id => {
              const user = users.find(u => parseInt(u.id) === id);
              return user ? { value: id, label: user.name } : null;
            }).filter(Boolean)}
            onChange={(selectedOptions) => {
              const newIds = selectedOptions 
                ? selectedOptions.map(opt => opt.value) 
                : [];
              setEditedUserIds(newIds);
            }}
            size="medium"
          />
        ) : (
          <Text type="text2" color="secondary" style={{ fontStyle: 'italic', padding: '8px' }}>
            No team members available
          </Text>
        )}
      </div>

      {/* Status selector */}
      {statusOptions.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Text type="text3" weight="medium" color="secondary" style={{ marginBottom: '4px', display: 'block' }}>
            Status
          </Text>
          <Dropdown
            placeholder="Select status"
            options={statusOptions.map((status) => ({
              value: status.index,
              label: status.label,
            }))}
            value={editedStatusIndex !== null ? {
              value: editedStatusIndex,
              label: statusOptions.find(s => s.index === editedStatusIndex)?.label || 'Unknown'
            } : null}
            onChange={(option) => setEditedStatusIndex(option?.value ?? null)}
            size="medium"
            clearable
          />
        </div>
      )}

      {/* Start date */}
      <div style={{ marginBottom: '12px' }}>
        <TextField
          title="Start Date"
          type="date"
          value={editedStartDate}
          onChange={(value) => setEditedStartDate(value)}
          size="medium"
          iconName={Calendar}
          required
        />
      </div>

      {/* End date */}
      <div style={{ marginBottom: '16px' }}>
        <TextField
          title="End Date (optional)"
          type="date"
          value={editedEndDate}
          onChange={(value) => setEditedEndDate(value)}
          size="medium"
          iconName={Calendar}
          validation={hasDateError ? { status: 'error', text: 'End date cannot be before start date' } : null}
        />
      </div>

      {/* Action buttons */}
      <Flex gap="small" justify="end">
        <Button
          kind="tertiary"
          onClick={handleCancel}
          size="small"
        >
          Cancel
        </Button>
        <Button
          kind="primary"
          onClick={handleSave}
          disabled={!canSave}
          size="small"
        >
          Save
        </Button>
      </Flex>
    </Box>
  );
};

export default ItemEditDialog;
