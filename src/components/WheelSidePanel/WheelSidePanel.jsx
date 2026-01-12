/**
 * WheelSidePanel - Side panel for YearWheel configuration in Monday.com
 * 
 * Features:
 * - Ring management (visibility, colors, names)
 * - Activity group management
 * - Display settings (week ring, month ring, ring names)
 * - Month/Quarter zoom navigation
 * - Item list with search
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();
import {
  Flex,
  Box,
  Text,
  Button,
  IconButton,
  TextField,
  Checkbox,
  Divider,
  Tooltip,
  Search,
  TabList,
  Tab,
  RadioButton,
  Dropdown,
} from "@vibe/core";
import { Modal } from "@vibe/core/next";
import {
  Settings,
  Show,
  Hide,
  Add,
  Delete,
  Drag,
  NavigationChevronDown,
  NavigationChevronUp,
  Download,
} from "@vibe/icons";
import SettingsDialog from "../SettingsDialog";
import CreateItemDialog from "../CreateItemDialog";
import ConfirmDialog from "../ConfirmDialog";
import { COLOR_THEMES } from "../../constants/colorThemes";
import "./WheelSidePanel.css";

// Color palette options
const COLOR_PALETTES = {
  monday: ["#579bfc", "#9cd326", "#ff642e", "#ff5ac4", "#fdab3d", "#00c875", "#7e3b8a", "#0086c0"],
  pastel: ["#B4D4E7", "#C8E6C9", "#FFCDD2", "#F0E68C", "#E1BEE7", "#FFCCBC", "#B2EBF2", "#D7CCC8"],
  vibrant: ["#FF5733", "#33FF57", "#3357FF", "#FF33F5", "#F5FF33", "#33FFF5", "#FF8C33", "#8C33FF"],
  modern: ["#2D3436", "#636E72", "#B2BEC3", "#DFE6E9", "#74B9FF", "#A29BFE", "#FD79A8", "#FDCB6E"],
};

// Section header component
const SectionHeader = ({ title, expanded, onToggle, count, onAdd }) => (
  <div className="wheel-sidepanel-section-header" onClick={onToggle}>
    <Flex align="center" gap="xs">
      {expanded ? <NavigationChevronDown size={16} /> : <NavigationChevronUp size={16} />}
      <Text type="text2" weight="bold" className="wheel-sidepanel-section-title">
        {title}
      </Text>
      {count > 0 && (
        <span className="wheel-sidepanel-badge">{count}</span>
      )}
    </Flex>
    {onAdd && (
      <IconButton
        icon={Add}
        size="xs"
        kind="tertiary"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        ariaLabel={`Add ${title.toLowerCase()}`}
      />
    )}
  </div>
);

// Ring row component with drag support
const RingRow = ({ 
  ring, 
  onVisibilityChange, 
  onNameChange, 
  onColorChange, 
  onDelete, 
  itemCount,
  disableDelete = false,
  // Drag props
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging = false,
  isDropTarget = false,
}) => {
  const [editingName, setEditingName] = useState(ring.name);

  // Update local state when ring name changes externally
  useEffect(() => {
    setEditingName(ring.name);
  }, [ring.name]);

  const handleNameBlur = () => {
    if (editingName !== ring.name) {
      onNameChange(ring.id, editingName);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Trigger blur to save
    }
  };

  return (
    <div 
      className={`wheel-sidepanel-row ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Flex align="center" gap="xs" className="wheel-sidepanel-row-content">
        <span className="wheel-sidepanel-drag-handle">
          <Drag size={14} />
        </span>
        <Checkbox
          checked={ring.visible}
          onChange={(e) => onVisibilityChange(ring.id, e.target.checked)}
          className="wheel-sidepanel-checkbox"
        />
        <input
          type="color"
          value={ring.color || "#579bfc"}
          onChange={(e) => onColorChange(ring.id, e.target.value)}
          className="wheel-sidepanel-color-picker"
        />
        <input
          type="text"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          className="wheel-sidepanel-name-input"
          placeholder="Ring name"
        />
        <span className="wheel-sidepanel-item-count">{itemCount}</span>
        <IconButton
          icon={Delete}
          size="xs"
          kind="tertiary"
          onClick={() => onDelete(ring.id, ring.name, itemCount)}
          className="wheel-sidepanel-delete-btn"
          ariaLabel={disableDelete ? "Cannot delete the last ring" : "Delete ring"}
          disabled={disableDelete}
        />
      </Flex>
    </div>
  );
};

// Activity group row component
const ActivityGroupRow = ({ group, onVisibilityChange, onNameChange, onColorChange, onDelete, itemCount }) => {
  return (
    <div className="wheel-sidepanel-row">
      <Flex align="center" gap="xs" className="wheel-sidepanel-row-content">
        <Checkbox
          checked={group.visible}
          onChange={(e) => onVisibilityChange(group.id, e.target.checked)}
          className="wheel-sidepanel-checkbox"
        />
        <input
          type="color"
          value={group.color || "#579bfc"}
          onChange={(e) => onColorChange(group.id, e.target.value)}
          className="wheel-sidepanel-color-picker"
        />
        <input
          type="text"
          value={group.name}
          onChange={(e) => onNameChange(group.id, e.target.value)}
          className="wheel-sidepanel-name-input"
          placeholder="Group name"
        />
        <span className="wheel-sidepanel-item-count">{itemCount}</span>
        <IconButton
          icon={Delete}
          size="xs"
          kind="tertiary"
          onClick={() => onDelete(group.id, group.name, itemCount)}
          className="wheel-sidepanel-delete-btn"
          ariaLabel="Delete group"
        />
      </Flex>
    </div>
  );
};

// Month navigator grid
const MonthNavigator = ({ year, zoomedMonth, onZoomToMonth, itemCountByMonth, onZoomToQuarter }) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return (
    <div className="wheel-sidepanel-month-grid">
      {months.map((month, index) => (
        <button
          key={month}
          className={`wheel-sidepanel-month-btn ${zoomedMonth === index ? "active" : ""}`}
          onClick={() => {
            onZoomToMonth(zoomedMonth === index ? null : index);
            // Clear quarter filter when month is selected
            if (zoomedMonth !== index) {
              onZoomToQuarter?.(null);
            }
          }}
        >
          <span>{month}</span>
          {itemCountByMonth[index] > 0 && (
            <span className="wheel-sidepanel-month-count">{itemCountByMonth[index]}</span>
          )}
        </button>
      ))}
    </div>
  );
};

// Quarter navigator
const QuarterNavigator = ({ zoomedQuarter, onZoomToQuarter, onZoomToMonth }) => {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  
  return (
    <Flex gap="xs" className="wheel-sidepanel-quarter-nav">
      {quarters.map((q, index) => (
        <button
          key={q}
          className={`wheel-sidepanel-quarter-btn ${zoomedQuarter === index ? "active" : ""}`}
          onClick={() => {
            onZoomToQuarter(zoomedQuarter === index ? null : index);
            // Clear month filter when quarter is selected
            if (zoomedQuarter !== index) {
              onZoomToMonth?.(null);
            }
          }}
        >
          {q}
        </button>
      ))}
    </Flex>
  );
};

// Item list row
const ItemRow = ({ item, onClick, groupColor }) => (
  <div className="wheel-sidepanel-item-row" onClick={() => onClick(item)}>
    <div
      className="wheel-sidepanel-item-color-bar"
      style={{ backgroundColor: groupColor }}
    />
    <div className="wheel-sidepanel-item-info">
      <Text type="text2" ellipsis>{item.name}</Text>
      <Text type="text3" color="secondary">
        {item.date}{item.endDate && item.endDate !== item.date ? ` → ${item.endDate}` : ""}
      </Text>
      {item.assignedUsers && item.assignedUsers.length > 0 && (
        <div className="wheel-sidepanel-item-users">
          {item.assignedUsers.slice(0, 3).map((user, idx) => (
            <span key={user.id} className="wheel-sidepanel-user-badge" title={user.name}>
              {user.name?.charAt(0).toUpperCase() || '?'}
            </span>
          ))}
          {item.assignedUsers.length > 3 && (
            <span className="wheel-sidepanel-user-badge more">
              +{item.assignedUsers.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
);

function WheelSidePanel({
  // Data
  wheelStructure = { rings: [], activityGroups: [], labels: [], items: [] },
  onWheelStructureChange,
  onResetConfiguration,
  
  // Display settings
  showWeekRing = true,
  onShowWeekRingChange,
  weekRingDisplayMode = 'week-numbers',
  onWeekRingDisplayModeChange,
  showRingNames = true,
  onShowRingNamesChange,
  
  // Year/zoom
  year = new Date().getFullYear(),
  zoomedMonth = null,
  onZoomToMonth,
  zoomedQuarter = null,
  onZoomToQuarter,
  
  // Items (from Monday.com)
  mondayItems = [],
  allItems = [], // All items before filtering (for accurate counts)
  users = [],
  userFilter = null,
  onUserFilterChange,
  onItemClick,
  
  // Colors
  colorTheme = "monday",
  colorMode = "group", // "group" or "theme"
  onThemeChange,
  
  // Export reference
  yearWheelRef,
  
  // Monetization
  isPro = false,
  isTrial = false,
  hasFeature = () => false,
  onUpgrade = () => {},
  
  // Monday.com data and settings
  columns = [],
  groups = [],
  settings = {},
  onSettingsChange = () => {},
  
  // Tab control (for external navigation to Filter tab)
  activeTab: externalActiveTab,
  onActiveTabChange,
  
  // Monday.com API functions
  createGroup, // Function to create Monday.com groups
  updateGroup, // Function to update Monday.com groups
  deleteGroup, // Function to delete Monday.com groups
  createItem, // Function to create Monday.com items
}) {
  const monday = mondaySdk();
  
  // Default colors from current theme
  const colors = COLOR_THEMES[colorTheme]?.colors || COLOR_PALETTES.monday;
  
  const [internalActiveTab, setInternalActiveTab] = useState(0);
  // Use external tab if provided, otherwise use internal
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = onActiveTabChange || setInternalActiveTab;
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPage, setItemsPage] = useState(1);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    innerRings: true,
    outerRings: true,
  });
  
  // Create item dialog state
  const [showCreateItemDialog, setShowCreateItemDialog] = useState(false);
  
  // Confirm delete dialog state
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'ring'|'group', id, name, itemCount }
  
  // Drag and drop state
  const [draggedRing, setDraggedRing] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  
  // Split rings by type
  const { innerRings, outerRings } = useMemo(() => {
    const inner = wheelStructure.rings?.filter(r => r.type === "inner") || [];
    const outer = wheelStructure.rings?.filter(r => r.type === "outer") || [];
    return { innerRings: inner, outerRings: outer };
  }, [wheelStructure.rings]);

  // Total rings count for delete protection
  const totalRingsCount = useMemo(() => {
    return (wheelStructure.rings?.length || 0);
  }, [wheelStructure.rings]);
  
  // Count items per ring and activity group
  const itemCounts = useMemo(() => {
    const byRing = {};
    const byGroup = {};
    const byMonth = Array(12).fill(0);
    
    wheelStructure.items?.forEach(item => {
      // By ring
      if (item.ringId) {
        byRing[item.ringId] = (byRing[item.ringId] || 0) + 1;
      }
      // By activity group
      if (item.activityId) {
        byGroup[item.activityId] = (byGroup[item.activityId] || 0) + 1;
      }
      // By month
      if (item.startDate) {
        const month = new Date(item.startDate).getMonth();
        byMonth[month]++;
      }
    });
    
    return { byRing, byGroup, byMonth };
  }, [wheelStructure.items]);
  
  // Filter items for list view
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return mondayItems;
    
    const query = searchQuery.toLowerCase();
    return mondayItems.filter(item =>
      item.name?.toLowerCase().includes(query) ||
      item.group?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query)
    );
  }, [mondayItems, searchQuery]);
  
  // Pagination for Items tab
  const ITEMS_PER_PAGE = 50;
  const paginatedItems = useMemo(() => {
    const startIndex = (itemsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, itemsPage]);
  
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setItemsPage(1);
  }, [searchQuery]);
  
  // Export handlers with premium checks
  const handleExport = useCallback((format, exportFn) => {
    const featureMap = {
      png: 'exportPNG',
      svg: 'exportSVG',
      pdf: 'exportPDF',
    };
    
    const featureName = featureMap[format];
    
    if (featureName && !hasFeature(featureName)) {
      monday.execute("notice", {
        message: `${format.toUpperCase()} export is a Pro feature`,
        type: "info",
        timeout: 3000,
      });
      onUpgrade();
      return;
    }
    
    // Execute export if allowed
    if (exportFn) {
      exportFn();
    }
  }, [hasFeature, onUpgrade, monday]);
  
  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================
  
  const handleDragStart = useCallback((e, ring) => {
    setDraggedRing(ring);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedRing(null);
    setDragOverSection(null);
  }, []);

  const handleDragOver = useCallback((e, sectionType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionType);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSection(null);
  }, []);

  const handleDragOverRing = useCallback((e, targetRing) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedRing && draggedRing.id !== targetRing.id) {
      e.dataTransfer.dropEffect = 'move';
    }
  }, [draggedRing]);

  const handleDropOnRing = useCallback((e, targetRing) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedRing || draggedRing.id === targetRing.id) {
      return;
    }

    const rings = [...wheelStructure.rings];
    const draggedIndex = rings.findIndex(r => r.id === draggedRing.id);
    const targetIndex = rings.findIndex(r => r.id === targetRing.id);

    // If dragging within same type (reordering)
    if (draggedRing.type === targetRing.type) {
      const [removed] = rings.splice(draggedIndex, 1);
      rings.splice(targetIndex, 0, removed);
      
      // Update ring_order on all rings to reflect new positions
      const updatedRings = rings.map((ring, index) => ({
        ...ring,
        ring_order: index
      }));
      
      onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
      // Ring order persisted automatically by App.jsx when wheelStructure changes
      setDraggedRing(null);
      return;
    }

    // If dragging to different type (type conversion)
    const updatedRing = { ...draggedRing, type: targetRing.type };
    
    // When converting to outer ring, ensure it has a color
    if (targetRing.type === 'outer' && !updatedRing.color) {
      updatedRing.color = colors[rings.length % colors.length] || '#579bfc';
    }
    
    // When converting to inner ring, ensure it has orientation
    if (targetRing.type === 'inner') {
      if (!updatedRing.orientation) {
        updatedRing.orientation = 'vertical';
      }
    }

    // Remove from old position
    rings.splice(draggedIndex, 1);
    // Insert at target position
    rings.splice(targetIndex, 0, updatedRing);
    
    // Update ring_order on all rings to reflect new positions
    const updatedRings = rings.map((ring, index) => ({
      ...ring,
      ring_order: index
    }));

    onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
    // Ring type change persisted automatically by App.jsx when wheelStructure changes
    setDraggedRing(null);
  }, [draggedRing, wheelStructure, onWheelStructureChange, colorTheme]);

  const handleDrop = useCallback((e, targetType) => {
    e.preventDefault();
    setDragOverSection(null);

    if (!draggedRing) {
      return;
    }

    // If same type, don't do anything
    if (draggedRing.type === targetType) {
      setDraggedRing(null);
      return;
    }

    // Update ring type (dropping on empty space in different section)
    const updatedRings = wheelStructure.rings.map(ring => {
      if (ring.id === draggedRing.id) {
        const updatedRing = { ...ring, type: targetType };
        
        // When converting to outer ring, ensure it has a color
        if (targetType === 'outer' && !updatedRing.color) {
          updatedRing.color = colors[wheelStructure.rings.length % colors.length] || '#579bfc';
        }
        
        // When converting to inner ring, ensure it has orientation
        if (targetType === 'inner') {
          if (!updatedRing.orientation) {
            updatedRing.orientation = 'vertical';
          }
        }
        
        return updatedRing;
      }
      return ring;
    });

    onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
    // Ring type change persisted automatically by App.jsx when wheelStructure changes
    setDraggedRing(null);
  }, [draggedRing, wheelStructure, onWheelStructureChange, colorTheme]);
  
  // ============================================================================
  // RING HANDLERS
  // ============================================================================
  
  // Ring handlers
  const handleRingVisibilityChange = useCallback((ringId, visible) => {
    const updatedRings = wheelStructure.rings.map(ring =>
      ring.id === ringId ? { ...ring, visible } : ring
    );
    onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
    // Visibility persisted automatically by App.jsx when wheelStructure changes
  }, [wheelStructure, onWheelStructureChange]);
  
  const handleRingNameChange = useCallback(async (ringId, name) => {
    // Update local state immediately
    const updatedRings = wheelStructure.rings.map(ring =>
      ring.id === ringId ? { ...ring, name } : ring
    );
    onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
    // Name persisted automatically by App.jsx when wheelStructure changes
    
    // If updateGroup function is available, sync to Monday.com
    if (updateGroup) {
      try {
        // Extract the actual Monday group ID (remove 'ring-' prefix)
        const mondayGroupId = ringId.replace('ring-', '');
        await updateGroup(mondayGroupId, { name });
      } catch (err) {
        console.error('Failed to update ring name on Monday.com:', err);
        // Error notice already shown by updateGroup function
      }
    }
  }, [wheelStructure, onWheelStructureChange, updateGroup]);
  
  const handleRingColorChange = useCallback(async (ringId, color) => {
    // Update local state immediately
    const updatedRings = wheelStructure.rings.map(ring =>
      ring.id === ringId ? { ...ring, color } : ring
    );
    onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
    // Color persisted automatically by App.jsx when wheelStructure changes
    
    // If updateGroup function is available, sync to Monday.com
    if (updateGroup) {
      try {
        // Extract the actual Monday group ID (remove 'ring-' prefix)
        const mondayGroupId = ringId.replace('ring-', '');
        await updateGroup(mondayGroupId, { color });
      } catch (err) {
        console.error('Failed to update ring color on Monday.com:', err);
        // Error notice already shown by updateGroup function
      }
    }
  }, [wheelStructure, onWheelStructureChange, updateGroup]);
  
  const handleRingDelete = useCallback(async (ringId, ringName, itemCount) => {
    // Prevent deleting the last group
    if (totalRingsCount <= 1) {
      monday.execute('notice', {
        message: 'Cannot delete the last group. Boards must have at least one group.',
        type: 'error',
        timeout: 3000
      });
      return;
    }
    
    // Show confirmation dialog
    setConfirmDelete({ type: 'ring', id: ringId, name: ringName, itemCount });
  }, [totalRingsCount]);
  
  // Actual delete after confirmation
  const executeRingDelete = useCallback(async (ringId) => {
    // Extract Monday.com group ID from ring ID (remove 'ring-' prefix)
    const mondayGroupId = ringId.replace('ring-', '');
    
    // Delete from Monday.com if deleteGroup is available
    if (deleteGroup) {
      try {
        await deleteGroup(mondayGroupId);
      } catch (err) {
        console.error('❌ Failed to delete group from Monday.com:', err);
        // DO NOT proceed with local deletion if Monday.com rejects it
        // The error notice is already shown by deleteGroup function
        return;
      }
    }
    
    const updatedRings = wheelStructure.rings.filter(ring => ring.id !== ringId);
    // Also remove items associated with this ring
    const updatedItems = wheelStructure.items?.filter(item => item.ringId !== ringId) || [];
    // Also remove the corresponding activity group
    const activityGroupId = `activity-${mondayGroupId}`;
    const updatedActivityGroups = wheelStructure.activityGroups?.filter(g => g.id !== activityGroupId) || [];
    onWheelStructureChange?.({ 
      ...wheelStructure, 
      rings: updatedRings, 
      items: updatedItems,
      activityGroups: updatedActivityGroups 
    });
  }, [wheelStructure, onWheelStructureChange, deleteGroup]);
  
  const handleAddRing = useCallback(async (type) => {
    const ringName = `New ${type} ring`;
    
    // If createGroup function is available, create the group on Monday.com
    if (createGroup) {
      try {
        const newMondayGroup = await createGroup(ringName, type); // Pass ring type
        
        // Create corresponding ring and activity group in wheel structure
        const newRing = {
          id: `ring-${newMondayGroup.id}`,
          name: newMondayGroup.title,
          type,
          visible: true,
          color: newMondayGroup.color || colors[wheelStructure.rings?.length % colors.length] || "#579bfc",
          ring_order: wheelStructure.rings?.length || 0,
          orientation: "horizontal",
        };
        
        const newActivityGroup = {
          id: `activity-${newMondayGroup.id}`,
          name: newMondayGroup.title,
          visible: true,
          color: newMondayGroup.color || colors[wheelStructure.activityGroups?.length % colors.length] || "#579bfc",
        };
        
        const updatedRings = [...(wheelStructure.rings || []), newRing];
        const updatedGroups = [...(wheelStructure.activityGroups || []), newActivityGroup];
        
        onWheelStructureChange?.({
          ...wheelStructure,
          rings: updatedRings,
          activityGroups: updatedGroups,
        });
      } catch (err) {
        console.error('❌ Failed to create ring/group:', err);
        // Error notice already shown by createGroup function
      }
    } else {
      console.warn('⚠️ createGroup function not available, creating local-only ring');
      // Fallback: create local-only ring (won't sync to Monday.com)
      const newRing = {
        id: `ring-${Date.now()}`,
        name: ringName,
        type,
        visible: true,
        color: colors[wheelStructure.rings?.length % colors.length] || "#579bfc",
        ring_order: wheelStructure.rings?.length || 0,
        orientation: "horizontal",
      };
      const updatedRings = [...(wheelStructure.rings || []), newRing];
      onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
    }
  }, [wheelStructure, onWheelStructureChange, colors, createGroup]);
  
  // Activity group handlers
  const handleGroupVisibilityChange = useCallback((groupId, visible) => {
    const updatedGroups = wheelStructure.activityGroups.map(group =>
      group.id === groupId ? { ...group, visible } : group
    );
    onWheelStructureChange?.({ ...wheelStructure, activityGroups: updatedGroups });
  }, [wheelStructure, onWheelStructureChange]);
  
  const handleGroupNameChange = useCallback(async (groupId, name) => {
    // Update local state immediately
    const updatedGroups = wheelStructure.activityGroups.map(group =>
      group.id === groupId ? { ...group, name } : group
    );
    onWheelStructureChange?.({ ...wheelStructure, activityGroups: updatedGroups });
    
    // If updateGroup function is available, sync to Monday.com
    if (updateGroup) {
      try {
        // Extract the actual Monday group ID (remove 'activity-' prefix)
        const mondayGroupId = groupId.replace('activity-', '');
        await updateGroup(mondayGroupId, { name });
      } catch (err) {
        console.error('Failed to update group name on Monday.com:', err);
        // Error notice already shown by updateGroup function
      }
    }
  }, [wheelStructure, onWheelStructureChange, updateGroup]);
  
  const handleGroupColorChange = useCallback(async (groupId, color) => {
    // Update local state immediately
    const updatedGroups = wheelStructure.activityGroups.map(group =>
      group.id === groupId ? { ...group, color } : group
    );
    onWheelStructureChange?.({ ...wheelStructure, activityGroups: updatedGroups });
    
    // If updateGroup function is available, sync to Monday.com
    if (updateGroup) {
      try {
        // Extract the actual Monday group ID (remove 'activity-' prefix)
        const mondayGroupId = groupId.replace('activity-', '');
        await updateGroup(mondayGroupId, { color });
      } catch (err) {
        console.error('Failed to update group color on Monday.com:', err);
        // Error notice already shown by updateGroup function
      }
    }
  }, [wheelStructure, onWheelStructureChange, updateGroup]);
  
  const handleGroupDelete = useCallback(async (groupId, groupName, itemCount) => {
    // Show confirmation dialog
    setConfirmDelete({ type: 'group', id: groupId, name: groupName, itemCount });
  }, []);
  
  // Actual delete after confirmation
  const executeGroupDelete = useCallback(async (groupId) => {
    // Extract Monday.com group ID from activity group ID (remove 'activity-' prefix)
    const mondayGroupId = groupId.replace('activity-', '');
    
    // Optimistically update UI immediately
    const updatedGroups = wheelStructure.activityGroups.filter(group => group.id !== groupId);
    const ringId = `ring-${mondayGroupId}`;
    const updatedRings = wheelStructure.rings?.filter(r => r.id !== ringId) || [];
    const updatedItems = wheelStructure.items?.filter(item => item.ringId !== ringId) || [];
    
    // Update UI immediately for better UX
    onWheelStructureChange?.({ 
      ...wheelStructure, 
      activityGroups: updatedGroups,
      rings: updatedRings,
      items: updatedItems 
    });
    
    // Delete from Monday.com in background
    if (deleteGroup) {
      try {
        await deleteGroup(mondayGroupId);
      } catch (err) {
        console.error('❌ Failed to delete group from Monday.com:', err);
        // TODO: Could implement rollback here if API fails
      }
    }
  }, [wheelStructure, onWheelStructureChange, deleteGroup]);
  
  const handleCreateItem = useCallback(async (itemData) => {
    if (createItem) {
      try {
        await createItem(itemData);
        // The refresh will happen automatically via the createItem function
      } catch (err) {
        console.error('❌ Failed to create item:', err);
      }
    } else {
      console.warn('⚠️ createItem function not available');
    }
  }, [createItem]);
  
  const handleAddGroup = useCallback(async () => {
    const groupName = "New group";
    
    // If createGroup function is available, create the group on Monday.com
    if (createGroup) {
      try {
        const newMondayGroup = await createGroup(groupName, 'inner'); // Activity groups are inner rings
        
        // Create corresponding ring and activity group in wheel structure
        const newRing = {
          id: `ring-${newMondayGroup.id}`,
          name: newMondayGroup.title,
          type: "inner",
          visible: true,
          orientation: "horizontal",
          color: newMondayGroup.color || colors[wheelStructure.rings?.length % colors.length] || "#579bfc",
        };
        
        const newActivityGroup = {
          id: `activity-${newMondayGroup.id}`,
          name: newMondayGroup.title,
          visible: true,
          color: newMondayGroup.color || colors[wheelStructure.activityGroups?.length % colors.length] || "#579bfc",
        };
        
        const updatedRings = [...(wheelStructure.rings || []), newRing];
        const updatedGroups = [...(wheelStructure.activityGroups || []), newActivityGroup];
        
        onWheelStructureChange?.({
          ...wheelStructure,
          rings: updatedRings,
          activityGroups: updatedGroups,
        });
      } catch (err) {
        console.error('❌ Failed to create group:', err);
        // Error notice already shown by createGroup function
      }
    } else {
      console.warn('⚠️ createGroup function not available, creating local-only group');
      // Fallback: create local-only group (won't sync to Monday.com)
      const newGroup = {
        id: `activity-${Date.now()}`,
        name: groupName,
        visible: true,
        color: colors[wheelStructure.activityGroups?.length % colors.length] || "#579bfc",
      };
      const updatedGroups = [...(wheelStructure.activityGroups || []), newGroup];
      onWheelStructureChange?.({ ...wheelStructure, activityGroups: updatedGroups });
    }
  }, [wheelStructure, onWheelStructureChange, colors, createGroup]);
  
  // Bulk visibility toggles
  const setAllRingsVisibility = useCallback((visible) => {
    const updatedRings = wheelStructure.rings?.map(ring => ({ ...ring, visible })) || [];
    onWheelStructureChange?.({ ...wheelStructure, rings: updatedRings });
  }, [wheelStructure, onWheelStructureChange]);
  
  const setAllGroupsVisibility = useCallback((visible) => {
    const updatedGroups = wheelStructure.activityGroups?.map(group => ({ ...group, visible })) || [];
    onWheelStructureChange?.({ ...wheelStructure, activityGroups: updatedGroups });
  }, [wheelStructure, onWheelStructureChange]);
  
  const handleThemeApply = useCallback(({ theme, colorMode }) => {
    onThemeChange?.({ theme, colorMode });
  }, [onThemeChange]);
  
  return (
    <div className="wheel-sidepanel">
      {/* Settings Dialog (Color Theme + Display Options) */}
      <SettingsDialog
        show={showThemeDialog}
        onClose={() => setShowThemeDialog(false)}
        currentTheme={colorTheme}
        currentColorMode={colorMode}
        onThemeChange={handleThemeApply}
        showWeekRing={showWeekRing}
        onShowWeekRingChange={onShowWeekRingChange}
        weekRingDisplayMode={weekRingDisplayMode}
        onWeekRingDisplayModeChange={onWeekRingDisplayModeChange}
        showRingNames={showRingNames}
        onShowRingNamesChange={onShowRingNamesChange}
        columns={columns}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onResetConfiguration={onResetConfiguration}
      />
      
      {/* Tab Navigation */}
      <TabList
        activeTabId={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId)}
        className="wheel-sidepanel-tabs"
        size="sm"
      >
        <Tab>Structure</Tab>
        <Tab>Items</Tab>
        <Tab>Filter</Tab>
        <Tab>Export</Tab>
      </TabList>
      
      <div className="wheel-sidepanel-content">
        {/* Structure Tab */}
        {activeTab === 0 && (
            <div className="wheel-sidepanel-scroll">
              {/* Settings Button - Opens dialog with Color Theme + Display Options */}
              <div className="wheel-sidepanel-section">
                <Button
                  kind="secondary"
                  size="small"
                  leftIcon={Settings}
                  onClick={() => setShowThemeDialog(true)}
                  style={{ width: '100%' }}
                >
                  Wheel Settings
                </Button>
                <Flex direction="column" gap="xxs" style={{ marginTop: '8px' }}>
                  <Text type="text3" color="secondary">
                    Theme: <strong>{COLOR_THEMES[colorTheme]?.name || "Monday Colors"}</strong>
                  </Text>
                  <Text type="text3" color="secondary">
                    Week ring: <strong>{showWeekRing ? (weekRingDisplayMode === 'week-numbers' ? 'Week numbers' : 'Dates') : 'Hidden'}</strong>
                  </Text>
                </Flex>
              </div>
              
              <Divider />
              
              {/* Outer Rings */}
              <div 
                className={`wheel-sidepanel-section ${dragOverSection === 'outer' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'outer')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'outer')}
              >
                <SectionHeader
                  title="Outer Rings"
                  expanded={expandedSections.outerRings}
                  onToggle={() => toggleSection("outerRings")}
                  count={outerRings.length}
                  onAdd={() => handleAddRing("outer")}
                />
                {expandedSections.outerRings && (
                  <>
                    <Flex gap="xs" className="wheel-sidepanel-bulk-actions">
                      <Button
                        kind="tertiary"
                        size="xs"
                        onClick={() => setAllRingsVisibility(true)}
                      >
                        Show all
                      </Button>
                      <Text color="secondary">|</Text>
                      <Button
                        kind="tertiary"
                        size="xs"
                        onClick={() => setAllRingsVisibility(false)}
                      >
                        Hide all
                      </Button>
                    </Flex>
                    {outerRings.map(ring => (
                      <RingRow
                        key={ring.id}
                        ring={ring}
                        onVisibilityChange={handleRingVisibilityChange}
                        onNameChange={handleRingNameChange}
                        onColorChange={handleRingColorChange}
                        onDelete={handleRingDelete}
                        itemCount={itemCounts.byRing[ring.id] || 0}
                        disableDelete={totalRingsCount <= 1}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ring)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverRing(e, ring)}
                        onDrop={(e) => handleDropOnRing(e, ring)}
                        isDragging={draggedRing?.id === ring.id}
                        isDropTarget={draggedRing && draggedRing.id !== ring.id && draggedRing.type === 'outer'}
                      />
                    ))}
                    {outerRings.length === 0 && (
                      <Text type="text3" color="secondary" className="wheel-sidepanel-empty">
                        No outer rings. Click + to add one.
                      </Text>
                    )}
                  </>
                )}
              </div>
              
              <Divider />
              
              {/* Inner Rings */}
              <div 
                className={`wheel-sidepanel-section ${dragOverSection === 'inner' ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'inner')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'inner')}
              >
                <SectionHeader
                  title="Inner Rings"
                  expanded={expandedSections.innerRings}
                  onToggle={() => toggleSection("innerRings")}
                  count={innerRings.length}
                  onAdd={() => handleAddRing("inner")}
                />
                {expandedSections.innerRings && (
                  <>
                    {innerRings.map(ring => (
                      <RingRow
                        key={ring.id}
                        ring={ring}
                        onVisibilityChange={handleRingVisibilityChange}
                        onNameChange={handleRingNameChange}
                        onColorChange={handleRingColorChange}
                        onDelete={handleRingDelete}
                        itemCount={itemCounts.byRing[ring.id] || 0}
                        disableDelete={totalRingsCount <= 1}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ring)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOverRing(e, ring)}
                        onDrop={(e) => handleDropOnRing(e, ring)}
                        isDragging={draggedRing?.id === ring.id}
                        isDropTarget={draggedRing && draggedRing.id !== ring.id && draggedRing.type === 'inner'}
                      />
                    ))}
                    {innerRings.length === 0 && (
                      <Text type="text3" color="secondary" className="wheel-sidepanel-empty">
                        No inner rings. Click + to add one.
                      </Text>
                    )}
                  </>
                )}
              </div>
            </div>
        )}
          
        {/* Items Tab */}
        {activeTab === 1 && (
            <div className="wheel-sidepanel-scroll">
              <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                <Button
                  kind="primary"
                  size="medium"
                  onClick={() => setShowCreateItemDialog(true)}
                  leftIcon={Add}
                  style={{ width: '100%' }}
                >
                  Create Item
                </Button>
              </div>
              
              <div className="wheel-sidepanel-search">
                <Search
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(value) => setSearchQuery(value)}
                  size="small"
                />
                <Text type="text3" color="secondary" style={{ marginTop: '8px', display: 'block', textAlign: 'center' }}>
                  Showing {paginatedItems.length} of {filteredItems.length} items
                  {searchQuery && ` (filtered from ${mondayItems.length} total)`}
                </Text>
              </div>
              
              <div className="wheel-sidepanel-items-list">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onClick={onItemClick}
                      groupColor={
                        wheelStructure.activityGroups?.find(g => 
                          g.name === item.group || g.id === `activity-${item.group}`
                        )?.color || "#579bfc"
                      }
                    />
                  ))
                ) : (
                  <Text type="text3" color="secondary" className="wheel-sidepanel-empty">
                    {searchQuery ? "No items match your search" : "No items to display"}
                  </Text>
                )}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Box style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <Flex justify="space-between" align="center">
                    <Button
                      kind="tertiary"
                      size="small"
                      disabled={itemsPage === 1}
                      onClick={() => setItemsPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Text type="text3" color="secondary">
                      Page {itemsPage} of {totalPages}
                    </Text>
                    <Button
                      kind="tertiary"
                      size="small"
                      disabled={itemsPage === totalPages}
                      onClick={() => setItemsPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </Flex>
                </Box>
              )}
            </div>
        )}
          
        {/* Filter Tab */}
        {activeTab === 2 && (
            <div className="wheel-sidepanel-scroll">
              {/* Team Member Filter */}
              {users && users.length > 0 && (
                <>
                  <div className="wheel-sidepanel-section">
                    <Text type="text2" weight="bold" className="wheel-sidepanel-section-label">
                      Filter by Team Member
                    </Text>
                    <Text type="text3" color="secondary" style={{ marginBottom: '12px', display: 'block' }}>
                      Show items assigned to a specific person
                    </Text>
                    
                    <Dropdown
                      placeholder="👥 All Team Members"
                      clearable
                      searchable
                      options={users.map(user => {
                        const userItemCount = (allItems.length > 0 ? allItems : mondayItems).filter(item => 
                          item.assignedUserIds?.includes(parseInt(user.id))
                        ).length;
                        return {
                          value: user.id,
                          label: `${user.name} (${userItemCount} items)`
                        };
                      })}
                      value={userFilter ? {
                        value: userFilter,
                        label: users.find(u => u.id === userFilter)?.name || userFilter
                      } : null}
                      onChange={(option) => onUserFilterChange?.(option?.value || null)}
                      size="medium"
                    />
                  </div>
                  
                  <Divider />
                </>
              )}
              
              <div className="wheel-sidepanel-section">
                <Text type="text2" weight="bold" className="wheel-sidepanel-section-label">
                  Filter by Month
                </Text>
                <MonthNavigator
                  year={year}
                  zoomedMonth={zoomedMonth}
                  onZoomToMonth={onZoomToMonth}
                  onZoomToQuarter={onZoomToQuarter}
                  itemCountByMonth={itemCounts.byMonth}
                />
              </div>
              
              <Divider />
              
              <div className="wheel-sidepanel-section">
                <Text type="text2" weight="bold" className="wheel-sidepanel-section-label">
                  Filter by Quarter
                </Text>
                <QuarterNavigator
                  zoomedQuarter={zoomedQuarter}
                  onZoomToQuarter={onZoomToQuarter}
                  onZoomToMonth={onZoomToMonth}
                />
              </div>
              
              <Divider />
              
              <div className="wheel-sidepanel-section">
                <Text type="text2" weight="bold" className="wheel-sidepanel-section-label">
                  Reset View
                </Text>
                <Button
                  kind="tertiary"
                  size="small"
                  onClick={() => {
                    onZoomToMonth?.(null);
                    onZoomToQuarter?.(null);
                  }}
                                >
                  Show Full Year
                </Button>
              </div>
            </div>
        )}
        
        {/* Export Tab */}
        {activeTab === 3 && (
          <div className="wheel-sidepanel-scroll">
            <div className="wheel-sidepanel-section">
              <Text type="text2" weight="bold" className="wheel-sidepanel-section-label">
                Export Year Wheel
              </Text>
              <Text type="text2" className="wheel-sidepanel-description">
                Download the wheel in your preferred format
              </Text>
              <Flex direction="column" gap="xs" style={{ marginTop: '12px' }}>
                <Button
                  kind="secondary"
                  size="medium"
                  onClick={() => handleExport('png', () => yearWheelRef?.current?.exportPNG(false))}
                  disabled={!hasFeature('exportPNG')}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download /> PNG (Transparent)
                  </span>
                  {!isPro && !isTrial && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#0073ea',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>PRO</span>
                  )}
                </Button>
                <Button
                  kind="secondary"
                  size="medium"
                  onClick={() => handleExport('png', () => yearWheelRef?.current?.exportPNG(true))}
                  disabled={!hasFeature('exportPNG')}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download /> PNG (White Background)
                  </span>
                  {!isPro && !isTrial && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#0073ea',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>PRO</span>
                  )}
                </Button>
                <Button
                  kind="secondary"
                  size="medium"
                  onClick={() => yearWheelRef?.current?.exportJPEG()}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <Download /> JPEG
                </Button>
                <Button
                  kind="secondary"
                  size="medium"
                  onClick={() => handleExport('svg', () => yearWheelRef?.current?.exportSVG())}
                  disabled={!hasFeature('exportSVG')}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download /> SVG (Vector)
                  </span>
                  {!isPro && !isTrial && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#0073ea',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>PRO</span>
                  )}
                </Button>
                <Button
                  kind="secondary"
                  size="medium"
                  onClick={() => handleExport('pdf', () => yearWheelRef?.current?.exportPDF())}
                  disabled={!hasFeature('exportPDF')}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download /> PDF
                  </span>
                  {!isPro && !isTrial && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#0073ea',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>PRO</span>
                  )}
                </Button>
              </Flex>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Item Dialog */}
      <CreateItemDialog
        show={showCreateItemDialog}
        onClose={() => setShowCreateItemDialog(false)}
        onSave={handleCreateItem}
        groups={groups}
        columns={columns}
        settings={settings}
      />
      
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        show={!!confirmDelete}
        title={confirmDelete?.type === 'ring' ? 'Delete ring?' : 'Delete group?'}
        message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}"? This will remove all ${confirmDelete.itemCount} item${confirmDelete.itemCount !== 1 ? 's' : ''} in this ${confirmDelete.type}.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="negative"
        onConfirm={() => {
          if (confirmDelete?.type === 'ring') {
            executeRingDelete(confirmDelete.id);
          } else if (confirmDelete?.type === 'group') {
            executeGroupDelete(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

export default WheelSidePanel;
