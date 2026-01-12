import React, {
  useEffect,
  useCallback,
} from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import { Text, Box } from "@vibe/core";

import GanttView from "./components/GanttView";
import WheelLoader from "./components/WheelLoader";
import useMondayBoard from "./hooks/useMondayBoard";

const monday = mondaySdk();

// Set API token for development mode
const isDevelopment =
  !window.location.ancestorOrigins?.length &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

if (isDevelopment && import.meta.env.VITE_MONDAY_API_TOKEN) {
  monday.setToken(import.meta.env.VITE_MONDAY_API_TOKEN);
}

const App = () => {
  const {
    loading,
    error,
    items,
    groups,
    updateItemDates,
  } = useMondayBoard();

  // Notify Monday that user has value
  useEffect(() => {
    monday.execute("valueCreatedForUser");
  }, []);

  // Handle item update from Gantt (if drag/resize is enabled in future)
  const handleItemUpdate = useCallback(
    async (updatedItem) => {
      if (updatedItem && updatedItem.id) {
        const startDate = updatedItem.startDate;
        const endDate = updatedItem.endDate;

        // Validate dates
        if (endDate && startDate && endDate < startDate) {
          console.warn("End date before start date, skipping update");
          return;
        }

        // Save to Monday.com
        await updateItemDates(updatedItem.id, startDate, endDate);
      }
    },
    [updateItemDates]
  );

  // Show loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <WheelLoader />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box padding="large">
        <Text type="text1" color="negative">
          Error loading board data: {error}
        </Text>
      </Box>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GanttView
        items={items}
        groups={groups}
        onUpdateItem={handleItemUpdate}
      />
    </div>
  );
};

export default App;
