import { useState, useEffect, useCallback } from "react";
import mondaySdk from "monday-sdk-js";
import { isViewOnlyUser } from "../utils/sessionTokenUtils";

const monday = mondaySdk();

// Check if running in development mode (outside Monday.com)
const isDevelopment = !window.location.ancestorOrigins?.length && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// CRITICAL: Mock data should ONLY load in development mode AND when explicitly enabled
// This prevents production builds from accidentally loading mock data
const useMockData = isDevelopment && import.meta.env.VITE_LOAD_MOCK_DATA === 'true';

// Set API token for development mode (only if not using mock data)
if (isDevelopment && !useMockData && import.meta.env.VITE_MONDAY_API_TOKEN) {
  monday.setToken(import.meta.env.VITE_MONDAY_API_TOKEN);
}

// Mock data for development
const MOCK_COLUMNS = [
  { id: "timeline", title: "Timeline", type: "timerange", settings_str: "{}" },
  { id: "date", title: "Date", type: "date", settings_str: "{}" },
  { id: "status", title: "Status", type: "status", settings_str: "{}" },
  { id: "person", title: "Owner", type: "person", settings_str: "{}" }
];

const MOCK_GROUPS = [
  { id: "marketing", title: "Marketing", color: "#579bfc" },
  { id: "development", title: "Development", color: "#9cd326" },
  { id: "design", title: "Design", color: "#ff642e" },
  { id: "sales", title: "Sales", color: "#ff5ac4" }
];

const generateMockItems = () => {
  const items = [];
  const statuses = ["Done", "Working on it", "Stuck", "Not started"];
  const tasks = [
    "Q1 Planning Session", "Product Launch", "Team Retreat", "Budget Review",
    "Marketing Campaign", "Website Redesign", "Client Meeting", "Sprint Review",
    "Annual Report", "Trade Show", "Hiring Drive", "Training Workshop",
    "Feature Release", "Performance Review", "Partner Meeting", "Strategy Session",
    "User Research", "A/B Testing", "Content Creation", "SEO Optimization",
    "Social Media Campaign", "Email Newsletter", "Webinar Preparation", "Customer Survey",
    "Technical Audit", "Security Review", "Backup Testing", "Server Migration",
    "API Integration", "Database Optimization", "Code Refactoring", "Bug Fixing",
    "UI Improvements", "UX Testing", "Mobile Optimization", "Cross-browser Testing",
    "Documentation Update", "Training Material", "Onboarding Guide", "FAQ Update"
  ];
  
  // Generate configurable number of items (default 500 for stress testing)
  const itemCount = parseInt(import.meta.env.VITE_MOCK_ITEM_COUNT) || 500;
  
  // For stress testing: Use only current year and first group
  const year = new Date().getFullYear();
  const group = MOCK_GROUPS[0]; // Use only first group (Marketing)
  
  for (let i = 0; i < itemCount; i++) {
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const date = new Date(year, month, day);
    
    // Create task name with index for uniqueness
    const taskName = `${tasks[i % tasks.length]} #${Math.floor(i / tasks.length) + 1}`;
    
    // All items have duration with various lengths
    let endDate = null;
    const durationType = Math.random();
    let durationDays;
    
    if (durationType < 0.15) {
      // 15% - Very short tasks (1-3 days)
      durationDays = Math.floor(Math.random() * 3) + 1;
    } else if (durationType < 0.35) {
      // 20% - Short tasks (4-7 days, ~1 week)
      durationDays = Math.floor(Math.random() * 4) + 4;
    } else if (durationType < 0.60) {
      // 25% - Medium tasks (1-3 weeks)
      durationDays = Math.floor(Math.random() * 14) + 7;
    } else if (durationType < 0.85) {
      // 25% - Long tasks (3-8 weeks)
      durationDays = Math.floor(Math.random() * 35) + 21;
    } else {
      // 15% - Very long tasks (2-6 months)
      durationDays = Math.floor(Math.random() * 120) + 60;
    }
    
    endDate = new Date(year, month, day + durationDays);
    // If end date goes into next year, clamp to Dec 31
    if (endDate.getFullYear() > year) {
      endDate = new Date(year, 11, 31);
    }
    
    const startDateStr = date.toISOString().split('T')[0];
    const endDateStr = endDate?.toISOString().split('T')[0];
    
    items.push({
      id: `mock-${i}`,
      name: taskName,
      group: {
        id: group.id,
        title: group.title,
        color: group.color
      },
      column_values: [
        // Timeline column with duration
        { 
          id: "timeline", 
          type: "timerange", 
          text: endDateStr ? `${startDateStr} - ${endDateStr}` : startDateStr,
          value: JSON.stringify({ 
            from: startDateStr, 
            to: endDateStr || startDateStr,
            changed_at: new Date().toISOString()
          }) 
        },
        // Single date column (fallback)
        { 
          id: "date", 
          type: "date", 
          text: startDateStr, 
          value: JSON.stringify({ date: startDateStr }) 
        },
        { 
          id: "status", 
          type: "status", 
          text: statuses[Math.floor(Math.random() * statuses.length)], 
          value: "{}" 
        }
      ]
    });
  }
  
  console.log(`📦 Generated ${items.length} mock items in ${year}, group: ${group.title}`);
  return items;
};

/**
 * Custom hook to fetch and manage Monday.com board data for the YearWheel
 */
export const useMondayBoard = () => {
  const [context, setContext] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(null);
  const [error, setError] = useState(null);
  const [isViewerUser, setIsViewerUser] = useState(false);
  
  // Settings for data mapping
  const [settings, setSettings] = useState({
    dateColumn: null,
    endDateColumn: null,
    statusColumn: null,
    groupFilter: null,
    userFilter: null
  });

  // Check if user is a viewer on mount (MUST run before any data loading)
  useEffect(() => {
    // Check for viewer simulation in development (highest priority)
    if (isDevelopment && import.meta.env.VITE_SIMULATE_VIEWER === 'true') {
      console.log('🧪 Simulating viewer mode (VITE_SIMULATE_VIEWER=true)');
      setIsViewerUser(true);
      setError("viewer_access");
      setLoading(false);
      return;
    }
    
    // Skip real viewer check in mock mode
    if (useMockData) return;
    
    // Get session token from Monday.com
    monday.get("sessionToken").then((res) => {
      const sessionToken = res.data;
      if (sessionToken && isViewOnlyUser(sessionToken)) {
        setIsViewerUser(true);
        setError("viewer_access");
        setLoading(false);
      }
    }).catch((err) => {
      console.error("Error fetching session token:", err);
      // Continue execution - if we can't get the token, assume it's not a viewer issue
    });
  }, []);

  // Initialize context listener
  useEffect(() => {
    console.log('🔧 Initializing useMondayBoard hook', { useMockData, isViewerUser });
    
    // Load mock data if env var is set
    if (useMockData) {
      console.log('📦 Using mock data mode');
      loadMockData();
      return;
    }
    
    // Skip initialization if user is a viewer
    if (isViewerUser) {
      console.log('👁️ User is viewer, skipping initialization');
      return;
    }
    
    let currentBoardId = null;
    
    // Get initial context (important for theme and board ID on first load)
    console.log('🔍 Fetching initial context from Monday.com');
    monday.get("context").then((res) => {
      console.log('📥 Received context:', res.data);
      if (res.data) {
        setContext(res.data);
        currentBoardId = res.data?.boardId || res.data?.boardIds?.[0];
        console.log('🎯 Board ID:', currentBoardId);
      }
    }).catch(err => {
      console.error('❌ Error getting context:', err);
    });
    
    // Listen for context changes (theme changes, board switches, etc.)
    monday.listen("context", (res) => {
      console.log('🔄 Context changed:', res.data);
      setContext(res.data);
      currentBoardId = res.data?.boardId || res.data?.boardIds?.[0];
      console.log('🎯 Updated board ID:', currentBoardId);
    });
    
    monday.listen("settings", (res) => {
      if (res.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data
        }));
      }
    });
    
    // Listen for board changes (items added/updated/deleted)
    monday.listen("events", (res) => {
      
      // IMPORTANT: Don't refetch if we just triggered the update ourselves
      // This prevents overwriting optimistic updates with stale data
      if (window.__skipNextBoardRefetch) {
        window.__skipNextBoardRefetch = false;
        return;
      }
      
      // Refresh items when board changes
      if (currentBoardId) {
        setTimeout(() => {
          fetchBoardData(currentBoardId);
        }, 500); // Small delay to ensure Monday.com has processed the change
      }
    });
  }, [isViewerUser]);

  // Load mock data for development
  const loadMockData = () => {
    console.log('🎭 Generating mock data...');
    const mockItems = generateMockItems();
    console.log(`📦 Loading ${mockItems.length} mock items`);
    console.log('📋 Mock items sample:', mockItems.slice(0, 2));
    
    setColumns(MOCK_COLUMNS);
    setGroups(MOCK_GROUPS);
    console.log('📁 Mock groups:', MOCK_GROUPS);
    setItems(mockItems);
    setBoardData({ id: "mock-board", name: "Development Board" });
    setSettings(prev => ({
      ...prev,
      dateColumn: "timeline", // Use timeline column (has both start and end dates)
      statusColumn: "status"
    }));
    setLoading(false);
    console.log('✅ Mock data loaded successfully');
  };

  // Fetch board data when context is available
  useEffect(() => {
    if (useMockData) return; // Skip if using mock data
    
    if (!context?.boardId && !context?.boardIds?.[0]) {
      // If no boardId after 3 seconds, show empty wheel
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
    
    const boardId = context.boardId || context.boardIds[0];
    fetchBoardData(boardId);
  }, [context]);

  /**
   * Fetch account users (requires users:read permission)
   * Used for displaying assigned users and filtering by team member
   */
  const fetchUsers = async () => {
    if (useMockData || isDevelopment) {
      // Mock users for development
      setUsers([
        { id: 1, name: "Alice Johnson", email: "alice@company.com", photo_thumb: null },
        { id: 2, name: "Bob Smith", email: "bob@company.com", photo_thumb: null },
        { id: 3, name: "Carol Williams", email: "carol@company.com", photo_thumb: null },
      ]);
      return;
    }

    try {
      const usersQuery = `
        query {
          users {
            id
            name
            email
            photo_thumb
          }
        }
      `;
      
      const usersResponse = await monday.api(usersQuery);
      
      if (usersResponse.data?.users) {
        setUsers(usersResponse.data.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      // Don't fail the whole app if users fetch fails
      setUsers([]);
    }
  };

  /**
   * Fetch board structure and items
   */
  const fetchBoardData = async (boardId) => {
    console.log('🔄 Fetching board data for boardId:', boardId);
    setLoading(true);
    setError(null);
    
    try {
      // First, get board structure (columns, groups)
      console.log('📡 Sending GraphQL query for board structure...');
      const boardQuery = `
        query ($boardId: [ID!]) {
          boards(ids: $boardId) {
            id
            name
            columns {
              id
              title
              type
              settings_str
            }
            groups {
              id
              title
              color
            }
          }
        }
      `;
      
      const boardResponse = await monday.api(boardQuery, {
        variables: { boardId: [boardId] }
      });
      
      console.log('📥 Board response:', boardResponse);
      
      // Check for GraphQL errors that prevent data loading
      if (boardResponse.errors && boardResponse.errors.length > 0) {
        console.error('❌ GraphQL errors:', boardResponse.errors);
        const errorMessages = boardResponse.errors.map(e => e.message).join(', ');
        
        // Only treat as viewer error if we got NO data AND specific viewer/auth error
        if (!boardResponse.data?.boards?.[0]) {
          // Check for explicit authentication/authorization errors
          const hasAuthError = boardResponse.errors.some(e => 
            e.extensions?.code === 'authentication_error' ||
            e.extensions?.code === 'authorization_error' ||
            (e.message && e.message.toLowerCase().includes('not authorized'))
          );
          
          if (hasAuthError) {
            console.warn('⚠️ Authentication/authorization error - likely viewer access');
            setIsViewerUser(true);
            setError("viewer_access");
            setLoading(false);
            return;
          }
        }
        
        // If we have data despite errors, continue (partial success)
        if (boardResponse.data?.boards?.[0]) {
          console.warn('⚠️ GraphQL errors present but got data, continuing...', errorMessages);
        }
      }
      
      if (boardResponse.data?.boards?.[0]) {
        const board = boardResponse.data.boards[0];
        console.log('✅ Board data received:', { id: board.id, name: board.name, columnsCount: board.columns.length, groupsCount: board.groups.length });
        console.log('📋 Columns:', board.columns);
        console.log('📁 Groups:', board.groups);
        
        setBoardData(board);
        setColumns(board.columns);
        setGroups(board.groups);
        
        // Auto-select date column: prefer "date" type, fallback to "timeline" type
        if (!settings.dateColumn) {
          const dateCol = board.columns.find(c => c.type === "date");
          const timelineCol = board.columns.find(c => c.type === "timeline");
          const defaultDateCol = dateCol || timelineCol;
          
          if (defaultDateCol) {
            setSettings(prev => ({ ...prev, dateColumn: defaultDateCol.id }));
            console.log(`✓ Auto-selected date column: ${defaultDateCol.title} (${defaultDateCol.type})`);
          }
        }
        
        // Auto-select status column
        if (!settings.statusColumn) {
          const statusCol = board.columns.find(c => c.type === "status" || c.type === "color");
          if (statusCol) {
            setSettings(prev => ({ ...prev, statusColumn: statusCol.id }));
          }
        }
      }
      
      // Fetch users for person column display and filtering
      console.log('👥 Fetching users...');
      await fetchUsers();
      
      // Now fetch items
      console.log('📋 Fetching items...');
      await fetchItems(boardId);
      
    } catch (err) {
      console.error("❌ Error fetching board data:", err);
      
      // Only check for explicit authorization errors, not general errors
      const errorMsg = err.message || err.toString();
      const isAuthError = 
        errorMsg.toLowerCase().includes('not authorized') ||
        errorMsg.toLowerCase().includes('authentication failed') ||
        errorMsg.toLowerCase().includes('viewer') ||
        (err.extensions?.code === 'authentication_error') ||
        (err.extensions?.code === 'authorization_error');
      
      if (isAuthError) {
        console.warn('⚠️ Authentication/authorization error detected');
        setIsViewerUser(true);
        setError("viewer_access");
      } else {
        // Show the actual error message for debugging
        console.error('❌ Board data fetch failed:', errorMsg);
        setError(errorMsg || "Failed to fetch board data");
      }
    } finally {
      setLoading(false);
      console.log('🏁 fetchBoardData completed');
    }
  };

  /**
   * Fetch items from board with pagination support for large boards (1000+ items)
   * Implements cursor-based pagination and rate limit handling
   */
  const fetchItems = async (boardId) => {
    console.log('📋 Starting fetchItems for boardId:', boardId);
    try {
      let allItems = [];
      let cursor = null;
      let hasMore = true;
      let pageCount = 0;
      const pageSize = 500; // Monday.com max limit
      
      while (hasMore) {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount}...`);
        setLoadingProgress(`Loading items (page ${pageCount})...`);
        
        const itemsQuery = `
          query ($boardId: [ID!], $cursor: String) {
            boards(ids: $boardId) {
              items_page(limit: ${pageSize}, cursor: $cursor) {
                cursor
                items {
                  id
                  name
                  group {
                    id
                    title
                    color
                  }
                  column_values {
                    id
                    type
                    text
                    value
                  }
                }
              }
            }
          }
        `;
        
        const variables = { boardId: [boardId] };
        if (cursor) {
          variables.cursor = cursor;
        }
        
        const itemsResponse = await retryWithBackoff(async () => {
          return await monday.api(itemsQuery, { variables });
        });
        
        if (itemsResponse.data?.boards?.[0]?.items_page) {
          const page = itemsResponse.data.boards[0].items_page;
          const items = page.items || [];
          
          console.log(`📄 Page ${pageCount}: Fetched ${items.length} items, cursor: ${page.cursor ? 'exists' : 'null'}`);
          
          allItems = [...allItems, ...items];
          
          // Check if there are more items to fetch
          // Monday.com returns a cursor if there are more pages, null otherwise
          cursor = page.cursor;
          hasMore = !!cursor; // Continue as long as cursor exists
          
          console.log(`📊 Total items so far: ${allItems.length}, hasMore: ${hasMore}`);
          
          // Respect rate limits: small delay between pages
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } else {
          hasMore = false;
        }
      }
      
      setItems(allItems);
      setLoadingProgress(null);
      console.log(`✅ Successfully loaded ${allItems.length} items from board`);
      if (allItems.length > 0) {
        console.log('📋 First item sample:', allItems[0]);
      }
    } catch (err) {
      console.error("❌ Error fetching items:", err);
      setLoadingProgress(null);
      
      // Handle rate limit errors specifically
      if (err.message?.includes('complexity') || err.message?.includes('rate limit')) {
        setError("Rate limit exceeded. Please try again in a moment.");
      } else {
        setError(err.message || "Failed to fetch items");
      }
    }
  };
  
  /**
   * Retry function with exponential backoff for rate limiting
   */
  const retryWithBackoff = async (fn, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isRateLimit = err.message?.includes('complexity') || 
                           err.message?.includes('rate limit') ||
                           err.status === 429;
        
        if (isRateLimit && attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Rate limit hit, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }
  };

  /**
   * Transform Monday items to YearWheel format
   * Uses user-selected columns from settings to support multiple columns of same type
   */
  const getWheelItems = useCallback(() => {
    if (items.length === 0) return [];
    
    // Get available date columns
    const allDateColumns = columns.filter(c => c.type === 'date' || c.type === 'timeline');
    const endDateColumn = settings.endDateColumn ? columns.find(c => c.id === settings.endDateColumn) : null;
    const statusColumn = settings.statusColumn ? columns.find(c => c.id === settings.statusColumn) : null;
    
    // Determine which column to use for start date
    let primaryDateColumn = null;
    if (settings.dateColumn) {
      // User has explicitly selected a column
      primaryDateColumn = columns.find(c => c.id === settings.dateColumn);
    } else {
      // No selection - use first date column, then timeline as fallback
      primaryDateColumn = allDateColumns.find(c => c.type === 'date') || allDateColumns.find(c => c.type === 'timeline');
    }
    
    if (!primaryDateColumn) {
      console.warn('No date or timeline columns available');
      return [];
    }
    
    return items
      .map(item => {
        let startDate = null;
        let endDate = null;
        let usedColumn = null;
        
        // Try the primary date column first
        const primaryValue = item.column_values.find(cv => cv.id === primaryDateColumn.id);
        if (primaryValue?.value) {
          try {
            if (primaryDateColumn.type === 'timeline') {
              const timelineData = JSON.parse(primaryValue.value);
              if (timelineData.from) {
                startDate = timelineData.from;
                endDate = timelineData.to || null;
                usedColumn = primaryDateColumn.title;
              }
            } else if (primaryDateColumn.type === 'date') {
              const dateData = JSON.parse(primaryValue.value);
              if (dateData.date) {
                startDate = dateData.date;
                usedColumn = primaryDateColumn.title;
              }
            }
          } catch (err) {
            console.warn(`Error parsing ${primaryDateColumn.type} for ${item.name}:`, err);
          }
        }
        
        // If primary column didn't have data, try other date/timeline columns
        if (!startDate) {
          for (const col of allDateColumns) {
            if (col.id === primaryDateColumn.id) continue; // Already tried this one
            
            const colValue = item.column_values.find(cv => cv.id === col.id);
            if (colValue?.value) {
              try {
                if (col.type === 'timeline') {
                  const timelineData = JSON.parse(colValue.value);
                  if (timelineData.from) {
                    startDate = timelineData.from;
                    endDate = timelineData.to || null;
                    usedColumn = col.title;
                    break;
                  }
                } else if (col.type === 'date') {
                  const dateData = JSON.parse(colValue.value);
                  if (dateData.date) {
                    startDate = dateData.date;
                    usedColumn = col.title;
                    break;
                  }
                }
              } catch (err) {
                // Continue to next column
              }
            }
          }
        }
        
        // Get end date from user-selected end date column (if specified and not already set)
        if (endDateColumn && !endDate) {
          const endDateValue = item.column_values.find(cv => cv.id === endDateColumn.id);
          if (endDateValue?.value) {
            try {
              if (endDateColumn.type === 'timeline') {
                const timelineData = JSON.parse(endDateValue.value);
                endDate = timelineData.to || timelineData.from;
              } else if (endDateColumn.type === 'date') {
                const dateData = JSON.parse(endDateValue.value);
                endDate = dateData.date;
              }
            } catch (err) {
              console.warn(`Error parsing end date for ${item.name}:`, err);
            }
          }
        }
        
        // Skip items without start date
        if (!startDate) {
          return null;
        }
        
        // Get status from user-selected status column (if specified)
        let status = null;
        if (statusColumn) {
          const statusValue = item.column_values.find(cv => cv.id === statusColumn.id);
          if (statusValue?.text) {
            status = statusValue.text;
          }
        }
        
        // Get assigned users from Person column
        const personColumns = item.column_values.filter(cv => cv.type === 'people');
        const assignedUserIds = [];
        const assignedUsers = [];
        
        personColumns.forEach(personCol => {
          if (personCol?.value) {
            try {
              const personData = JSON.parse(personCol.value);
              if (personData.personsAndTeams) {
                personData.personsAndTeams.forEach(person => {
                  if (person.id && person.kind === 'person') {
                    assignedUserIds.push(person.id);
                    // Find user details from users list
                    const user = users.find(u => u.id === person.id);
                    if (user) {
                      assignedUsers.push({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        photo: user.photo_thumb
                      });
                    }
                  }
                });
              }
            } catch (err) {
              console.warn(`Error parsing Person column for ${item.name}:`, err);
            }
          }
        });
        
        // Filter by user if configured
        if (settings.userFilter) {
          // If item has no assigned users, hide it when filtering by user
          if (assignedUserIds.length === 0) {
            return null;
          }
          // If item has assigned users but not the selected user, hide it
          if (!assignedUserIds.includes(parseInt(settings.userFilter))) {
            return null;
          }
        }
        
        // Filter by group if configured
        if (settings.groupFilter && item.group.id !== settings.groupFilter) {
          return null;
        }
        
        return {
          id: item.id,
          name: item.name,
          startDate: startDate,  // Changed from 'date' to 'startDate' for Gantt compatibility
          endDate: endDate || startDate,  // If no end date, use start date (single-day item)
          status,
          assignedUsers,
          assignedUserIds,
          group: item.group,  // Changed to pass full group object
          groupColor: item.group.color
        };
      })
      .filter(Boolean);
  }, [items, columns, users, settings]);

  /**
   * Open item in Monday.com
   */
  const openItem = useCallback((itemId) => {
    if (useMockData) {
      alert(`Item: ${itemId}\n\nIn Monday.com, this would open the item card.`);
      return;
    }
    monday.execute("openItemCard", { itemId: parseInt(itemId) });
  }, []);

  /**
   * Refresh board data
   */
  const refresh = useCallback(() => {
    if (useMockData) {
      setItems(generateMockItems());
      return;
    }
    if (context?.boardId || context?.boardIds?.[0]) {
      const boardId = context.boardId || context.boardIds[0];
      fetchBoardData(boardId);
    }
  }, [context]);

  /**
   * Update item dates on Monday.com (requires boards:write permission)
   */
  const updateItemDates = async (itemId, startDate, endDate) => {
    
    // OPTIMISTIC UPDATE: Update local state immediately
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const updated = { ...item };
          
          // Update column_values to reflect new dates
          updated.column_values = updated.column_values.map(cv => {
            // Update Timeline column
            if (cv.type === 'timeline' && endDate && endDate !== startDate) {
              return {
                ...cv,
                value: JSON.stringify({ from: startDate, to: endDate }),
                text: `${startDate} - ${endDate}`
              };
            }
            // Update Date column
            if (cv.type === 'date') {
              return {
                ...cv,
                value: JSON.stringify({ date: startDate }),
                text: startDate
              };
            }
            return cv;
          });
          
          return updated;
        }
        return item;
      });
    });
    
    if (useMockData || isDevelopment) {
      return { success: true, mock: true };
    }
    
    try {
      const timelineCol = columns.find(c => c.type === "timeline");
      const dateCol = columns.find(c => c.type === "date");
      const boardId = context?.boardId || context?.boardIds?.[0];
      
      
      if (!boardId) {
        throw new Error('No board ID available');
      }
      
      // Set flag to skip the next board refetch (optimistic update)
      window.__skipNextBoardRefetch = true;
      
      // If item has Timeline column and endDate, update Timeline
      if (timelineCol && endDate && endDate !== startDate) {
        const mutation = `
          mutation (
            $boardId: ID!,
            $itemId: ID!,
            $columnId: String!,
            $value: JSON!
          ) {
            change_column_value(
              board_id: $boardId,
              item_id: $itemId,
              column_id: $columnId,
              value: $value
            ) {
              id
            }
          }
        `;
        
        const variables = {
          boardId: parseInt(boardId),
          itemId: parseInt(itemId),
          columnId: timelineCol.id,
          value: JSON.stringify({ from: startDate, to: endDate })
        };
        
        const result = await monday.api(mutation, { variables });
        
        // Check for GraphQL errors in response
        if (result.errors && result.errors.length > 0) {
          console.error('❌ GraphQL errors in response:', result.errors);
          throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
        }
        
        return { success: true, column: 'Timeline', startDate, endDate };
      }
      // Otherwise update Date column
      else if (dateCol) {
        const mutation = `
          mutation (
            $boardId: ID!,
            $itemId: ID!,
            $columnId: String!,
            $value: JSON!
          ) {
            change_column_value(
              board_id: $boardId,
              item_id: $itemId,
              column_id: $columnId,
              value: $value
            ) {
              id
            }
          }
        `;
        
        const variables = {
          boardId: parseInt(boardId),
          itemId: parseInt(itemId),
          columnId: dateCol.id,
          value: JSON.stringify({ date: startDate })
        };
        
        const result = await monday.api(mutation, { variables });
        
        // Check for GraphQL errors in response
        if (result.errors && result.errors.length > 0) {
          console.error('❌ GraphQL errors in response:', result.errors);
          throw new Error(`GraphQL Error: ${result.errors.map(e => e.message).join(', ')}`);
        }
        
        return { success: true, column: 'Date', startDate };
      } else {
        throw new Error('No date or timeline column found');
      }
    } catch (err) {
      console.error('Error updating item dates:', err);
      monday.execute('notice', {
        message: 'Failed to update item: ' + err.message,
        type: 'error',
        timeout: 3000
      });
      throw err;
    }
  };

  /**
   * Update item group on Monday.com (move item between groups)
   */
  const updateItemGroup = async (itemId, groupId) => {
    if (useMockData || isDevelopment) {
      return { success: true, mock: true };
    }
    
    try {
      const boardId = context?.boardId || context?.boardIds?.[0];
      
      if (!boardId) {
        throw new Error('No board ID available');
      }
      
      const mutation = `
        mutation (
          $itemId: ID!,
          $groupId: String!
        ) {
          move_item_to_group(
            item_id: $itemId,
            group_id: $groupId
          ) {
            id
          }
        }
      `;
      
      const variables = {
        itemId: parseInt(itemId),
        groupId: groupId
      };
      
      await monday.api(mutation, { variables });
      
      // Update local state optimistically
      setItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === itemId) {
            // Find the new group
            const newGroup = groups.find(g => g.id === groupId);
            if (newGroup) {
              return {
                ...item,
                group: newGroup
              };
            }
          }
          return item;
        });
      });
      
      return { success: true, groupId };
    } catch (err) {
      console.error('Error updating item group:', err);
      monday.execute('notice', {
        message: 'Failed to move item: ' + err.message,
        type: 'error',
        timeout: 3000
      });
      throw err;
    }
  };

  /**
   * Update item name on Monday.com
   */
  const updateItemName = async (itemId, newName) => {
    if (useMockData || isDevelopment) {
      return { success: true, mock: true };
    }
    
    try {
      const boardId = context?.boardId || context?.boardIds?.[0];
      
      if (!boardId) {
        throw new Error('No board ID available');
      }
      
      const mutation = `
        mutation (
          $boardId: ID!,
          $itemId: ID!,
          $columnId: String!,
          $value: String!
        ) {
          change_simple_column_value(
            board_id: $boardId,
            item_id: $itemId,
            column_id: $columnId,
            value: $value
          ) {
            id
            name
          }
        }
      `;
      
      const variables = {
        boardId: parseInt(boardId),
        itemId: parseInt(itemId),
        columnId: 'name',
        value: newName
      };
      
      await monday.api(mutation, { variables });
      
      // Set skip flag to prevent immediate refetch from overwriting optimistic update
      window.__skipNextBoardRefetch = true;
      
      // Update local state optimistically
      setItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === itemId) {
            return { ...item, name: newName };
          }
          return item;
        });
      });
      
      return { success: true, newName };
    } catch (err) {
      console.error('❌ Error updating item name:', err);
      monday.execute('notice', {
        message: 'Failed to update name: ' + err.message,
        type: 'error',
        timeout: 3000
      });
      throw err;
    }
  };

  /**
   * Create a new group on the Monday.com board
   * @param {string} groupName - Name for the new group
   * @param {string} ringType - Type of ring ('inner' or 'outer') - stored in App.jsx wheel structure
   * @returns {Promise<{groupId: string, title: string, color: string, ringType: string}>}
   */
  const createGroup = useCallback(async (groupName, ringType = 'inner') => {
    if (useMockData) {
      const mockGroup = {
        id: `group-${Date.now()}`,
        title: groupName,
        color: '#579bfc',
        ringType
      };
      // In mock mode, add to local state
      setGroups(prev => [...prev, mockGroup]);
      return mockGroup;
    }

    const boardId = context?.boardId || context?.boardIds?.[0];
    if (!boardId) {
      throw new Error('No board selected');
    }

    try {
      const mutation = `
        mutation ($boardId: ID!, $groupName: String!) {
          create_group (
            board_id: $boardId,
            group_name: $groupName
          ) {
            id
            title
            color
          }
        }
      `;

      const variables = {
        boardId: parseInt(boardId),
        groupName: groupName
      };

      const result = await monday.api(mutation, { variables });

      if (result.data?.create_group) {
        const newGroup = result.data.create_group;
        
        // Add ring type to the response (App.jsx will handle persisting via wheel structure)
        const groupWithType = {
          ...newGroup,
          ringType
        };
        
        // Update local groups state
        setGroups(prev => [...prev, groupWithType]);
        
        // Show success notice
        monday.execute('notice', {
          message: `Group "${groupName}" created successfully`,
          type: 'success',
          timeout: 2000
        });

        return groupWithType;
      }

      throw new Error('Failed to create group');
    } catch (err) {
      console.error('❌ Error creating group:', err);
      monday.execute('notice', {
        message: 'Failed to create group: ' + err.message,
        type: 'error',
        timeout: 3000
      });
      throw err;
    }
  }, [context, useMockData]);

  /**
   * Update a group on the Monday.com board
   * @param {string} groupId - ID of the group to update
   * @param {Object} updates - Updates to apply (name, color)
   * @returns {Promise<{groupId: string, title: string, color: string}>}
   */
  const updateGroup = useCallback(async (groupId, updates) => {
    if (useMockData) {
      // In mock mode, update local state
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, title: updates.name || g.title, color: updates.color || g.color } : g
      ));
      return { id: groupId, title: updates.name, color: updates.color };
    }

    const boardId = context?.boardId || context?.boardIds?.[0];
    if (!boardId) {
      throw new Error('No board selected');
    }

    try {
      // Monday.com update_group mutation requires group_attribute and new_value as separate args
      const mutation = `
        mutation ($boardId: ID!, $groupId: String!, $groupAttribute: GroupAttributes!, $newValue: String!) {
          update_group (
            board_id: $boardId,
            group_id: $groupId,
            group_attribute: $groupAttribute,
            new_value: $newValue
          ) {
            id
            title
            color
          }
        }
      `;

      let result;
      
      // Update name if provided
      if (updates.name) {
        const nameVariables = {
          boardId: parseInt(boardId),
          groupId: groupId,
          groupAttribute: 'title',
          newValue: updates.name
        };
        result = await monday.api(mutation, { variables: nameVariables });
      }
      
      // Update color if provided (requires separate call)
      if (updates.color) {
        const colorVariables = {
          boardId: parseInt(boardId),
          groupId: groupId,
          groupAttribute: 'color',
          newValue: updates.color
        };
        result = await monday.api(mutation, { variables: colorVariables });
      }

      if (result?.data?.update_group) {
        const updatedGroup = result.data.update_group;
        
        // Update local groups state
        setGroups(prev => prev.map(g => 
          g.id === groupId ? updatedGroup : g
        ));
        
        // Show success notice
        monday.execute('notice', {
          message: 'Group updated successfully',
          type: 'success',
          timeout: 2000
        });

        return updatedGroup;
      }

      throw new Error('Failed to update group');
    } catch (err) {
      console.error('❌ Error updating group:', err);
      monday.execute('notice', {
        message: 'Failed to update group: ' + err.message,
        type: 'error',
        timeout: 3000
      });
      throw err;
    }
  }, [context, useMockData]);

  /**
   * Assign/update users to an item (requires boards:write permission)
   * @param {string} itemId - ID of the item
   * @param {Array<number>} userIds - Array of user IDs to assign
   * @returns {Promise<{success: boolean}>}
   */
  const updateItemUsers = useCallback(async (itemId, userIds) => {
    if (useMockData || isDevelopment) {
      return { success: true, mock: true };
    }

    const boardId = context?.boardId || context?.boardIds?.[0];
    if (!boardId) {
      throw new Error('No board selected');
    }

    try {
      // Find the first Person column
      const personCol = columns.find(c => c.type === 'people');
      if (!personCol) {
        throw new Error('No Person column found on this board');
      }

      // Format user IDs for Monday.com Person column
      const personValue = {
        personsAndTeams: userIds.map(id => ({
          id: parseInt(id),
          kind: 'person'
        }))
      };

      const mutation = `
        mutation (
          $boardId: ID!,
          $itemId: ID!,
          $columnId: String!,
          $value: JSON!
        ) {
          change_column_value(
            board_id: $boardId,
            item_id: $itemId,
            column_id: $columnId,
            value: $value
          ) {
            id
          }
        }
      `;

      const variables = {
        boardId: parseInt(boardId),
        itemId: parseInt(itemId),
        columnId: personCol.id,
        value: JSON.stringify(personValue)
      };

      // Set flag to skip the next board refetch (optimistic update)
      window.__skipNextBoardRefetch = true;

      await monday.api(mutation, { variables });

      // Update local state optimistically
      setItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === itemId) {
            // Update the person column value
            return {
              ...item,
              column_values: item.column_values.map(cv => {
                if (cv.id === personCol.id) {
                  return {
                    ...cv,
                    value: JSON.stringify(personValue),
                    text: userIds.map(uid => users.find(u => u.id === parseInt(uid))?.name).filter(Boolean).join(', ')
                  };
                }
                return cv;
              })
            };
          }
          return item;
        });
      });

      monday.execute('notice', {
        message: 'User assignment updated successfully',
        type: 'success',
        timeout: 2000
      });

      return { success: true };
    } catch (err) {
      console.error('❌ Error updating user assignment:', err);
      monday.execute('notice', {
        message: 'Failed to update user assignment: ' + err.message,
        type: 'error',
        timeout: 3000
      });
      throw err;
    }
  }, [context, columns, users, useMockData]);

  /**
   * Delete a group from the Monday.com board
   * @param {string} groupId - ID of the group to delete
   * @returns {Promise<{success: boolean}>}
   */
  const deleteGroup = useCallback(async (groupId) => {
    console.log('🗑️ Attempting to delete group:', groupId, 'Current groups state:', groups.length, groups);

    if (useMockData) {
      // In mock mode, remove from local state
      if (groups.length <= 1) {
        monday.execute('notice', {
          message: 'Cannot delete the last group. Boards must have at least one group.',
          type: 'error',
          timeout: 3000
        });
        throw new Error('Cannot delete last group - board has to have at least one group');
      }
      setGroups(prev => prev.filter(g => g.id !== groupId));
      return { success: true };
    }

    const boardId = context?.boardId || context?.boardIds?.[0];
    if (!boardId) {
      throw new Error('No board selected');
    }

    try {
      // ROBUST CHECK: Fetch current group count from Monday.com before deleting
      const groupCountQuery = `
        query ($boardId: [ID!]) {
          boards(ids: $boardId) {
            groups {
              id
              title
            }
          }
        }
      `;

      const countResult = await monday.api(groupCountQuery, {
        variables: { boardId: [parseInt(boardId)] }
      });

      const currentGroups = countResult.data?.boards?.[0]?.groups || [];
      console.log('✅ Current groups from Monday.com:', currentGroups.length, currentGroups);

      // Prevent deleting the last group (Monday.com requires at least one group)
      if (currentGroups.length <= 1) {
        monday.execute('notice', {
          message: 'Cannot delete the last group. Boards must have at least one group.',
          type: 'error',
          timeout: 3000
        });
        throw new Error('Cannot delete last group - board has to have at least one group');
      }
      const mutation = `
        mutation ($boardId: ID!, $groupId: String!) {
          delete_group (
            board_id: $boardId,
            group_id: $groupId
          ) {
            id
            deleted
          }
        }
      `;

      const variables = {
        boardId: parseInt(boardId),
        groupId: groupId
      };

      const result = await monday.api(mutation, { variables });

      if (result.data?.delete_group) {
        // Update local groups state
        setGroups(prev => prev.filter(g => g.id !== groupId));
        
        // Show success notice
        monday.execute('notice', {
          message: 'Group deleted successfully',
          type: 'success',
          timeout: 2000
        });

        return { success: true };
      }

      throw new Error('Failed to delete group');
    } catch (err) {
      console.error('❌ Error deleting group:', err);
      monday.execute('notice', {
        message: 'Failed to delete group: ' + err.message,
        type: 'error',
        timeout: 3000
      });
      throw err;
    }
  }, [context, useMockData]);

  /**
   * Create a new item in Monday.com
   */
  const createItem = useCallback(async (itemData) => {
    if (useMockData) {
      console.log('📝 Mock: Creating item', itemData);
      const newItem = {
        id: `mock-${Date.now()}`,
        name: itemData.name,
        group: groups.find(g => g.id === itemData.groupId),
        column_values: [
          {
            id: settings.dateColumn || 'date',
            type: 'date',
            text: itemData.startDate,
            value: JSON.stringify({ date: itemData.startDate })
          }
        ]
      };
      
      if (itemData.endDate) {
        newItem.column_values.push({
          id: settings.endDateColumn || 'timeline',
          type: 'timerange',
          text: `${itemData.startDate} - ${itemData.endDate}`,
          value: JSON.stringify({ from: itemData.startDate, to: itemData.endDate })
        });
      }
      
      setItems(prev => [...prev, newItem]);
      return { success: true, item: newItem, mock: true };
    }

    try {
      const boardId = context?.boardId || context?.boardIds?.[0];
      if (!boardId) throw new Error('No board ID available');

      // Build column values for the new item
      const columnValues = {};
      
      // Add start date
      if (settings.dateColumn && itemData.startDate) {
        columnValues[settings.dateColumn] = { date: itemData.startDate };
      }
      
      // Add end date if provided and we have a timeline/end date column
      if (settings.endDateColumn && itemData.endDate) {
        columnValues[settings.endDateColumn] = { 
          from: itemData.startDate,
          to: itemData.endDate
        };
      }

      const mutation = `
        mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
          create_item(
            board_id: $boardId,
            group_id: $groupId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
            name
          }
        }
      `;

      const response = await monday.api(mutation, {
        variables: {
          boardId: parseInt(boardId),
          groupId: itemData.groupId,
          itemName: itemData.name,
          columnValues: JSON.stringify(columnValues)
        }
      });

      if (response.data?.create_item) {
        console.log('✅ Item created:', response.data.create_item);
        
        // Trigger Monday.com notice
        monday.execute("notice", {
          message: `Item "${itemData.name}" created successfully`,
          type: "success",
          timeout: 3000
        });
        
        // Trigger data refresh
        await refresh();
        
        return { success: true, item: response.data.create_item };
      } else {
        throw new Error('No item returned from create_item mutation');
      }
    } catch (err) {
      console.error('❌ Failed to create item:', err);
      monday.execute("notice", {
        message: `Failed to create item: ${err.message}`,
        type: "error",
        timeout: 5000
      });
      return { success: false, error: err.message };
    }
  }, [context, settings, groups, monday, refresh]);

  return {
    context,
    boardData,
    columns,
    groups,
    items,
    users,
    settings,
    setSettings,
    loading,
    loadingProgress,
    error,
    isViewerUser,
    context,
    wheelItems: getWheelItems(),
    openItem,
    refresh,
    updateItemDates,
    updateItemGroup,
    updateItemName,
    updateItemUsers,
    createItem,
    createGroup,
    updateGroup,
    deleteGroup,
  };
};

/**
 * Get date columns from board columns
 */
export const getDateColumns = (columns) => {
  return columns.filter(col => col.type === "date");
};

/**
 * Get status columns from board columns
 */
export const getStatusColumns = (columns) => {
  return columns.filter(col => col.type === "status" || col.type === "color");
};

export default useMondayBoard;
