import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to get Monday.com theme colors from CSS variables
 * 
 * IMPORTANT: This hook relies on the App component applying the theme class to document.body:
 *   document.body.classList.add(`${theme}-app-theme`)
 * 
 * When that class is applied, @vibe/core/tokens automatically sets CSS variables like:
 *   --primary-background-color, --primary-text-color, etc.
 */
export const useMondayTheme = () => {
  const [themeColors, setThemeColors] = useState({
    primaryBackground: '#ffffff',
    primaryText: '#323338',
    secondaryText: '#676879',
    uiBorder: '#c3c6d4',
    backgroundHover: '#f5f6f8',
  });

  // Read CSS variables from computed styles
  const updateThemeColors = useCallback(() => {
    const computedStyle = getComputedStyle(document.body);
    
    const colors = {
      primaryBackground: computedStyle.getPropertyValue('--primary-background-color').trim() || '#ffffff',
      primaryText: computedStyle.getPropertyValue('--primary-text-color').trim() || '#323338',
      secondaryText: computedStyle.getPropertyValue('--secondary-text-color').trim() || '#676879',
      uiBorder: computedStyle.getPropertyValue('--ui-border-color').trim() || '#c3c6d4',
      backgroundHover: computedStyle.getPropertyValue('--primary-background-hover-color').trim() || '#f5f6f8',
    };
    
    setThemeColors(colors);
  }, []);

  useEffect(() => {
    // Initial read (with small delay to ensure body class is applied)
    const initialTimer = setTimeout(updateThemeColors, 50);
    
    // Watch for body class changes (theme switches)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // Small delay to let CSS variables update
          setTimeout(updateThemeColors, 50);
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      clearTimeout(initialTimer);
      observer.disconnect();
    };
  }, [updateThemeColors]);

  return { themeColors };
};

export default useMondayTheme;
