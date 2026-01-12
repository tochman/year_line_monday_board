/**
 * Theme colors for Monday.com light and dark themes
 * Based on Monday.com's design system
 */

export const getThemeColors = (theme) => {
  const isDark = theme === 'dark' || theme === 'black';
  
  return {
    // Background colors
    background: isDark ? '#1c1f3b' : '#f9fafb',
    surfaceBackground: isDark ? '#292f4c' : '#ffffff',
    headerBackground: isDark ? '#1c1f3b' : '#f3f4f6',
    
    // Text colors
    primaryText: isDark ? '#ffffff' : '#323338',
    secondaryText: isDark ? '#c5c7d0' : '#676879',
    tertiaryText: isDark ? '#9699a6' : '#9CA3AF',
    
    // Border colors
    border: isDark ? '#3f4458' : '#e5e7eb',
    borderLight: isDark ? '#323546' : '#f0f0f0',
    
    // Interactive elements
    hover: isDark ? '#3f4458' : '#f5f6f8',
    selected: isDark ? '#4353ff' : '#0073ea',
    
    // Grid and timeline
    gridLine: isDark ? '#3f4458' : '#e5e7eb',
    todayLine: isDark ? '#ff5ac4' : '#ff0000',
    
    // Accent colors (consistent across themes)
    primary: '#0073ea',
    success: '#00c875',
    warning: '#fdab3d',
    error: '#e44258',
  };
};

export const getTextColor = (backgroundColor) => {
  // Simple contrast check - if background is dark, use white text
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#323338' : '#ffffff';
};
