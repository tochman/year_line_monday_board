import DOMPurify from 'dompurify';

/**
 * Sanitization utility functions for user-supplied data
 * Protects against XSS attacks by cleaning HTML and encoding special characters
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 * 
 * @param {string} html - Raw HTML string from user input
 * @returns {string} Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text by stripping all HTML tags
 * Use this for text that should never contain HTML
 * 
 * @param {string} text - Raw text from user input
 * @returns {string} Plain text with all HTML removed
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Strip all HTML tags - only allow plain text
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize item names and similar short text fields
 * Removes HTML but preserves the text content
 * 
 * @param {string} name - Item name or short text field
 * @returns {string} Sanitized name safe for display
 */
export function sanitizeItemName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // For item names, strip all HTML and return clean text
  const cleanText = DOMPurify.sanitize(name, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  // Trim whitespace
  return cleanText.trim();
}

/**
 * Sanitize column values from monday.com boards
 * Handles various column types (text, status, date, etc.)
 * 
 * @param {any} value - Column value from monday.com
 * @returns {any} Sanitized value
 */
export function sanitizeColumnValue(value) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle strings - sanitize as text
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  
  // Handle objects (like date objects, status objects)
  if (typeof value === 'object') {
    // For objects, sanitize string properties recursively
    const sanitizedObj = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'string') {
        sanitizedObj[key] = sanitizeText(val);
      } else {
        sanitizedObj[key] = val;
      }
    }
    return sanitizedObj;
  }
  
  // Return non-string values as-is (numbers, booleans, etc.)
  return value;
}

/**
 * Sanitize group names from monday.com boards
 * 
 * @param {string} groupName - Group name from board
 * @returns {string} Sanitized group name
 */
export function sanitizeGroupName(groupName) {
  return sanitizeItemName(groupName);
}

/**
 * Sanitize board names from monday.com
 * 
 * @param {string} boardName - Board name
 * @returns {string} Sanitized board name
 */
export function sanitizeBoardName(boardName) {
  return sanitizeItemName(boardName);
}
