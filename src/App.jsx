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
  console.log('🚀 App component mounting');
  
  // Track Monday.com theme for applying body class
  const [mondayTheme, setMondayTheme] = useState('light');
  
  const {
    context,
    loading,
    error,
    items,
    groups,
    updateItemDates,
  } = useMondayBoard();

  console.log('📊 App state:', { loading, error, itemsCount: items?.length, groupsCount: groups?.length });

  // Apply Monday.com theme class to body - THIS IS WHAT MAKES CSS VARIABLES WORK
  useEffect(() => {
    const theme = context?.theme || 'light';
    console.log('🎨 Monday theme from context:', theme);
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
    console.log('🎨 Applied body class:', `${theme}-app-theme`);
  }, [context?.theme]);

  // Notify Monday that user has value
  useEffect(() => {
    console.log('✅ Executing valueCreatedForUser');
    monday.execute("valueCreatedForUser");
  }, []);

  // Log whenever items or groups change
  useEffect(() => {
    console.log('📦 Data updated - Items:', items?.length || 0, 'Groups:', groups?.length || 0);
    if (items?.length > 0) {
      console.log('📋 First item sample:', items[0]);
    }
    if (groups?.length > 0) {
      console.log('📁 Groups:', groups);
    }
  }, [items, groups]);

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
    console.log('⏳ Rendering loading state');
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <WheelLoader />
      </div>
    );
  }

  // Show error state
  if (error) {
    console.error('❌ Rendering error state:', error);
    return (
      <Box padding="large">
        <Text type="text1" color="negative">
          Error loading board data: {error}
        </Text>
      </Box>
    );
  }

  console.log('✨ Rendering GanttView with', items?.length, 'items and', groups?.length, 'groups');
  
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
