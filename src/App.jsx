import React, {
  useEffect,
  useCallback,
  useState,
} from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import "@vibe/core/tokens";
import { Text, Box } from "@vibe/core";

import GanttView from "./components/GanttView";
import TimelineLoader from "./components/TimelineLoader";
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
  // Track Monday.com theme for applying body class
  const [mondayTheme, setMondayTheme] = useState('light');
  
  const {
    context,
    loading,
    error,
    items,
    groups,
    users,
    updateItemDates,
    updateItemName,
    updateItemGroup,
    updateItemUsers,
  } = useMondayBoard();

  // Apply Monday.com theme class to body - THIS IS WHAT MAKES CSS VARIABLES WORK
  useEffect(() => {
    const theme = context?.theme || 'light';
    setMondayTheme(theme);
    
    // Remove any existing theme classes
    document.body.classList.remove(
      'light-app-theme', 
      'dark-app-theme', 
      'black-app-theme', 
      'night-app-theme', 
      'hacker-app-theme', 
      'hacker_theme-app-theme'
    );
    
    // Add current theme class - this triggers CSS variables from @vibe/core/tokens
    document.body.classList.add(`${theme}-app-theme`);
  }, [context?.theme]);

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
          return;
        }

        try {
          await updateItemDates(updatedItem.id, startDate, endDate);
        } catch (error) {
          console.error('Error updating item:', error);
          throw error;
        }
      }
    },
    [updateItemDates]
  );

  // Show loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <TimelineLoader size="lg" />
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
        users={users}
        onUpdateItem={handleItemUpdate}
        updateItemName={updateItemName}
        updateItemGroup={updateItemGroup}
        updateItemUsers={updateItemUsers}
      />
    </div>
  );
};

export default App;
