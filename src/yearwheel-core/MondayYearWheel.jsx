/**
 * MondayYearWheel - React wrapper for YearWheelClass adapted for Monday.com
 *
 * This component bridges the comprehensive YearWheel rendering engine
 * with Monday.com's data model and UI requirements.
 */

import {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import YearWheelClass from "./YearWheelClass.js";

// Simple tooltip component
const ItemTooltip = ({
  item,
  position,
  groupColors,
  onNameUpdate,
  onClose,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item?.name || "");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  if (!item || !position) return null;

  const color = groupColors?.[item.group] || "#579bfc";

  const handleNameSave = async () => {
    if (editedName && editedName !== item.name) {
      await onNameUpdate?.(item.id, editedName);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setEditedName(item.name);
      setIsEditingName(false);
    }
  };

  return (
    <div
      className="yearwheel-tooltip"
      style={{
        position: "fixed",
        left: position.x + 10,
        top: position.y + 10,
        backgroundColor: "white",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 1000,
        maxWidth: "280px",
        pointerEvents: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "#676879",
          padding: "0",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ×
      </button>
      <div
        style={{
          borderLeft: `3px solid ${color}`,
          paddingLeft: "10px",
        }}
      >
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              fontWeight: 600,
              marginBottom: "4px",
              color: "#323338",
              border: "1px solid #579bfc",
              borderRadius: "4px",
              padding: "4px 6px",
              fontSize: "14px",
            }}
          />
        ) : (
          <div
            style={{
              fontWeight: 600,
              marginBottom: "4px",
              color: "#323338",
              cursor: "pointer",
              padding: "4px 0",
            }}
            onClick={() => setIsEditingName(true)}
            title="Click to edit"
          >
            {item.name}
          </div>
        )}
        <div
          style={{ fontSize: "12px", color: "#676879", marginBottom: "2px" }}
        >
          {item.date}
          {item.endDate ? ` → ${item.endDate}` : ""}
        </div>
        {item.group && (
          <div
            style={{
              fontSize: "11px",
              color: color,
              fontWeight: 500,
            }}
          >
            {item.group}
          </div>
        )}
        {item.status && (
          <div
            style={{
              fontSize: "11px",
              color: "#676879",
              marginTop: "4px",
            }}
          >
            Status: {item.status}
          </div>
        )}
      </div>
    </div>
  );
};

const MondayYearWheel = forwardRef(
  (
    {
      // Data
      items = [],
      groups = [],
      year = new Date().getFullYear(),
      title = "",

      // External wheel structure (optional - if provided, overrides internal generation)
      externalWheelStructure = null,

      // Configuration
      // First 2 colors are for month ring (alternating), 3rd is for week ring
      // Using neutral grays for month/week, then vibrant colors for activities
      colors = [
        "#334155",
        "#475569",
        "#94a3b8",
        "#579bfc",
        "#9cd326",
        "#ff642e",
        "#ff5ac4",
        "#fdab3d",
      ],
      showWeekRing = true,
      weekRingDisplayMode = "week-numbers",
      showMonthRing = true,
      showRingNames = true,
      showLabels = true,
      ringMode = "group", // 'group' (one ring per Monday group) or 'single' (all items in one ring)

      // Zoom
      zoomedMonth = null,
      zoomedQuarter = null,

      // Background color for canvas (dynamically detected from CSS variable)
      canvasBackgroundColor = null,

      // Callbacks
      onItemClick,
      onItemHover,
      onItemUpdate,
      onItemNameUpdate,

      // Canvas settings
      renderSize = 2000,
      readonly = false,
    },
    ref
  ) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const wheelRef = useRef(null); // Use ref to avoid re-render loops
    const [isWheelReady, setIsWheelReady] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState(null);

    // Build group color mapping
    const groupColors = useMemo(() => {
      const colorMap = {};
      groups.forEach((group, index) => {
        colorMap[group.title] = group.color || colors[index % colors.length];
      });
      return colorMap;
    }, [groups, colors]);

    // Transform Monday.com items to YearWheel format (or use external structure)
    const wheelStructure = useMemo(() => {
      // If external structure is provided, use it
      if (externalWheelStructure && externalWheelStructure.rings?.length > 0) {
        return externalWheelStructure;
      }

      // Otherwise generate from Monday.com data
      // Create rings based on ringMode
      const rings = [];
      const activityGroups = [];

      if (ringMode === "group" && groups.length > 0) {
        // One ring per Monday group
        groups.forEach((group, index) => {
          rings.push({
            id: `ring-${group.id}`,
            name: group.title,
            type: "outer",
            visible: true,
            orientation: "horizontal",
            ring_order: index,
            color: group.color || colors[index % colors.length],
          });

          activityGroups.push({
            id: `activity-${group.id}`,
            name: group.title,
            color: group.color || colors[index % colors.length],
            visible: true,
          });
        });
      } else {
        // Single ring for all items
        rings.push({
          id: "ring-main",
          name: "Items",
          type: "outer",
          visible: true,
          orientation: "horizontal",
          ring_order: 0,
        });

        // Create activity groups from unique statuses or just one default
        const uniqueGroups = [
          ...new Set(items.map((i) => i.group).filter(Boolean)),
        ];
        if (uniqueGroups.length > 0) {
          uniqueGroups.forEach((groupName, index) => {
            activityGroups.push({
              id: `activity-${groupName}`,
              name: groupName,
              color: groupColors[groupName] || colors[index % colors.length],
              visible: true,
            });
          });
        } else {
          activityGroups.push({
            id: "activity-default",
            name: "Items",
            color: colors[0],
            visible: true,
          });
        }
      }

      // Transform items
      const wheelItems = items.map((item, index) => {
        let ringId, activityId;

        if (ringMode === "group") {
          const group = groups.find((g) => g.title === item.group);
          ringId = group ? `ring-${group.id}` : rings[0]?.id;
          activityId = group ? `activity-${group.id}` : activityGroups[0]?.id;
        } else {
          ringId = "ring-main";
          activityId = item.group
            ? `activity-${item.group}`
            : "activity-default";
        }

        return {
          id: item.id,
          name: item.name,
          startDate: item.date,
          endDate: item.endDate || item.date,
          ringId,
          activityId,
          labelId: null,
          // Preserve original dates for cross-year items (before clamping)
          _originalStartDate: item._originalStartDate || item.date,
          _originalEndDate: item._originalEndDate || item.endDate || item.date,
          // Store original Monday.com data for callbacks
          _mondayData: item,
        };
      });

      return {
        rings,
        activityGroups,
        labels: [],
        items: wheelItems,
      };
    }, [externalWheelStructure, items, groups, ringMode, colors, groupColors]);

    // Initialize YearWheel
    useLayoutEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;

      // Dynamically get background color from CSS variable (works for ALL Monday.com themes)
      const computedBgColor = canvasBackgroundColor || 
        getComputedStyle(document.body).getPropertyValue('--primary-background-color').trim() || 
        '#ffffff';

      const canvas = canvasRef.current;
      canvas.width = renderSize;
      canvas.height = renderSize;

      // Disable image smoothing for crisp rendering
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;

      // Clean up existing wheel
      if (wheelRef.current?.interactionHandler) {
        wheelRef.current.interactionHandler.destroy();
      }

      // Calculate initial rotation to place current month at top
      // Each month = 30 degrees (360 / 12)
      // Negative rotation because wheel rotates counterclockwise
      const currentMonth = new Date().getMonth(); // 0-11
      const initialRotation = -(currentMonth * (Math.PI / 6)); // Convert to radians

      const wheel = new YearWheelClass(
        canvas,
        year,
        title,
        colors,
        renderSize,
        {}, // events
        {
          wheelStructure,
          showWeekRing,
          showMonthRing,
          showRingNames,
          showLabels,
          weekRingDisplayMode,
          readonly,
          zoomedMonth,
          zoomedQuarter,
          zoomLevel: 100,
          initialRotation, // Set initial rotation based on current month
          backgroundColor: computedBgColor, // Pass computed background color for canvas
          activeEditors: [],
          broadcastOperation: null,
          onRotationChange: null,
          // Drag callbacks (required by InteractionHandler)
          onDragStart: (item) => {
            // Drag started
          },
          onDrag: (item) => {
            // Called during drag
          },
          onDragEnd: async (item) => {
            if (item && onItemUpdate) {
              // The item from drag has startDate/endDate properties
              const updateData = {
                id: item.id,
                name: item.name,
                startDate: item.startDate,
                endDate: item.endDate,
                date: item.startDate, // For compatibility
              };

              try {
                await onItemUpdate(updateData);
              } catch (err) {
                console.error("❌ Failed to update item:", err);
              }
            }
          },
          // Item update callback (called when drag completes or item resized)
          onActivityUpdate: async (updatedItem) => {
            if (onItemUpdate) {
              try {
                await onItemUpdate(updatedItem);
              } catch (err) {
                console.error("❌ Failed to update item:", err);
              }
            }
          },
          onItemClick: (item) => {
            if (onItemClick) {
              onItemClick(item);
            }
          },
          onItemHover: (item, rect) => {
            if (onItemHover) {
              onItemHover(item, rect);
            }
          },
        }
      );

      wheel.create();
      wheelRef.current = wheel;
      setIsWheelReady(true);

      return () => {
        // Cleanup
        if (wheelRef.current?.interactionHandler) {
          wheelRef.current.interactionHandler.destroy();
        }
      };
    }, [
      year,
      title,
      renderSize,
      showWeekRing,
      showMonthRing,
      showRingNames,
      showLabels,
      readonly,
      canvasBackgroundColor, // Recreate wheel when background color changes
    ]); // Removed wheelStructure and colors

    // Update wheel when data changes
    useEffect(() => {
      if (!wheelRef.current || !isWheelReady) return;

      // Use updateWheelStructure to properly invalidate DataProcessor cache
      wheelRef.current.updateWheelStructure(wheelStructure);
      wheelRef.current.create();
    }, [wheelStructure, externalWheelStructure, isWheelReady]);

    // Update wheel when zoom changes
    useEffect(() => {
      if (!wheelRef.current || !isWheelReady) return;

      wheelRef.current.zoomedMonth = zoomedMonth;
      wheelRef.current.zoomedQuarter = zoomedQuarter;
      wheelRef.current.create();
    }, [zoomedMonth, zoomedQuarter, isWheelReady]);

    // Update wheel when week ring display mode changes
    useEffect(() => {
      if (!wheelRef.current || !isWheelReady) return;

      wheelRef.current.weekRingDisplayMode = weekRingDisplayMode;
      wheelRef.current.create();
    }, [weekRingDisplayMode, isWheelReady]);

    // Sync selected item to wheel for cross-year highlighting
    // Use a ref to track the last highlighted ID to prevent unnecessary redraws
    const lastHighlightedIdRef = useRef(null);

    useEffect(() => {
      if (!wheelRef.current || !isWheelReady) return;

      const newId = selectedItem?.id ?? null;

      // Only update if the highlighted item actually changed
      if (lastHighlightedIdRef.current === newId) return;
      lastHighlightedIdRef.current = newId;

      // Find the wheel item from externalWheelStructure or items
      // The items in externalWheelStructure.items have _originalStartDate/_originalEndDate for cross-year items
      const wheelItem = selectedItem
        ? externalWheelStructure?.items?.find(
            (i) => String(i.id) === String(selectedItem.id)
          ) || items.find((i) => String(i.id) === String(selectedItem.id))
        : null;

      // If found, use original dates if available (for cross-year items)
      const highlightData = wheelItem
        ? {
            id: wheelItem.id,
            startDate:
              wheelItem._originalStartDate ||
              wheelItem.startDate ||
              wheelItem.date,
            endDate:
              wheelItem._originalEndDate || wheelItem.endDate || wheelItem.date,
          }
        : null;

      wheelRef.current.setHighlightedItem(highlightData);
    }, [selectedItem?.id, isWheelReady, items, externalWheelStructure, year]);

    // Handle mouse interactions
    const handleCanvasClick = useCallback(
      (e) => {
        const wheel = wheelRef.current;
        if (!wheel) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = renderSize / rect.width;
        const scaleY = renderSize / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check if clicked on any items - find ALL overlapping items
        const clickedItems =
          wheel.clickableItems?.filter((region) => {
            // Use wheel's built-in hit detection
            const dx = x - wheel.center.x;
            const dy = y - wheel.center.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < region.startRadius || distance > region.endRadius)
              return false;

            let angle = Math.atan2(dy, dx) - wheel.rotationAngle;
            // Normalize angle
            while (angle < 0) angle += Math.PI * 2;
            while (angle >= Math.PI * 2) angle -= Math.PI * 2;

            // Check if angle is within item's arc
            let startAngle = region.startAngle;
            let endAngle = region.endAngle;

            // Handle wraparound
            if (endAngle < startAngle) {
              if (angle >= startAngle || angle <= endAngle) return true;
            } else {
              if (angle >= startAngle && angle <= endAngle) return true;
            }

            return false;
          }) || [];

        if (clickedItems.length > 0) {
          // Check if any of the clicked items is a cluster
          // Cluster data is in the 'clusterData' property with isCluster flag
          const clusterItem = clickedItems.find(
            (ci) => ci.clusterData?.isCluster === true
          );

          if (clusterItem) {
            // Found a cluster - extract all items from it
            // These items already have the correct wheelStructure format with startDate/endDate
            const clusteredItems = clusterItem.clusterData.items || [];

            if (clusteredItems.length > 0) {
              // Show tooltip (always as cluster selection for clusters)
              setSelectedItem(null);
              setTooltipPosition({ x: e.clientX, y: e.clientY });

              // Call external click handler with array of items from cluster
              // Pass the cluster items directly - they already have the correct structure
              if (onItemClick) {
                onItemClick(clusteredItems, e);
              }
            }
          } else {
            // No cluster - map clickable regions to Monday items
            const mondayItems = clickedItems
              .map((clickedItem) => {
                const itemData = clickedItem.item || clickedItem;
                const itemId = itemData?.id;
                if (itemId) {
                  return items.find((i) => i.id === itemId);
                }
                return null;
              })
              .filter(Boolean);

            if (mondayItems.length > 0) {
              // Show tooltip (single or cluster)
              setSelectedItem(mondayItems.length === 1 ? mondayItems[0] : null);
              setTooltipPosition({ x: e.clientX, y: e.clientY });

              // Call external click handler with single item or array
              if (onItemClick) {
                const dataToSend =
                  mondayItems.length === 1 ? mondayItems[0] : mondayItems;
                onItemClick(dataToSend, e);
              }
            }
          }
        } else {
          // Clicked outside items - hide tooltip
          setSelectedItem(null);
          setTooltipPosition(null);
        }
      },
      [onItemClick, items, renderSize]
    );

    const handleMouseMove = useCallback(
      (e) => {
        const wheel = wheelRef.current;
        if (!wheel) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = renderSize / rect.width;
        const scaleY = renderSize / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check if hovering over an item
        const hoveredRegion = wheel.clickableItems?.find((region) => {
          const dx = x - wheel.center.x;
          const dy = y - wheel.center.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < region.startRadius || distance > region.endRadius)
            return false;

          let angle = Math.atan2(dy, dx) - wheel.rotationAngle;
          while (angle < 0) angle += Math.PI * 2;
          while (angle >= Math.PI * 2) angle -= Math.PI * 2;

          // Normalize region angles to 0-2π range for consistent comparison
          let startAngle = region.startAngle;
          let endAngle = region.endAngle;
          while (startAngle < 0) startAngle += Math.PI * 2;
          while (startAngle >= Math.PI * 2) startAngle -= Math.PI * 2;
          while (endAngle < 0) endAngle += Math.PI * 2;
          while (endAngle >= Math.PI * 2) endAngle -= Math.PI * 2;

          if (endAngle < startAngle) {
            return angle >= startAngle || angle <= endAngle;
          }
          return angle >= startAngle && angle <= endAngle;
        });

        if (hoveredRegion) {
          // hoveredRegion may have item directly or nested - handle both cases
          const itemData = hoveredRegion.item || hoveredRegion;
          const itemId = itemData?.id || itemData?.itemId;

          if (itemId) {
            // Use string comparison to handle different ID types
            const mondayItem = items.find(
              (i) => String(i.id) === String(itemId)
            );
            setSelectedItem(mondayItem || null);
            setTooltipPosition({ x: e.clientX, y: e.clientY });
            canvasRef.current.style.cursor = "pointer";

            if (onItemHover && mondayItem) {
              onItemHover(mondayItem);
            }
          }
        } else {
          setSelectedItem(null);
          setTooltipPosition(null);
          canvasRef.current.style.cursor = "default";

          if (onItemHover) {
            onItemHover(null);
          }
        }
      },
      [items, onItemHover, renderSize]
    );

    const handleMouseLeave = useCallback(() => {
      setSelectedItem(null);
      setTooltipPosition(null);
      if (onItemHover) {
        onItemHover(null);
      }
    }, [onItemHover]);

    // Expose export methods via ref
    useImperativeHandle(
      ref,
      () => ({
        exportPNG: (whiteBackground = false) => {
          if (wheelRef.current) {
            wheelRef.current.downloadAsPNG(whiteBackground);
          }
        },
        exportJPEG: () => {
          if (wheelRef.current) {
            wheelRef.current.downloadAsJPEG();
          }
        },
        exportSVG: () => {
          if (wheelRef.current) {
            wheelRef.current.downloadAsSVG();
          }
        },
        exportPDF: async () => {
          if (wheelRef.current) {
            await wheelRef.current.downloadAsPDF();
          }
        },
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        className="monday-yearwheel-container"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: canvasBackgroundColor || "var(--primary-background-color, #ffffff)",
          position: "relative",
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            opacity: isWheelReady ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
          }}
        />

        {/* Tooltip */}
        {selectedItem && tooltipPosition && (
          <ItemTooltip
            item={selectedItem}
            position={tooltipPosition}
            groupColors={groupColors}
            onNameUpdate={onItemNameUpdate}
            onClose={() => {
              setSelectedItem(null);
              setTooltipPosition(null);
            }}
          />
        )}
      </div>
    );
  }
);

MondayYearWheel.displayName = "MondayYearWheel";

export default MondayYearWheel;
