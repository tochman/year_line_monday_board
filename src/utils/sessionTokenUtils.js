/**
 * Utility functions for handling Monday.com session tokens
 */

/**
 * Decode a JWT token without verification
 * Note: This is safe for reading the payload as Monday.com verifies the token server-side
 * @param {string} token - JWT token string
 * @returns {object|null} - Decoded token payload or null if invalid
 */
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64URL decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if the current user is a viewer (view-only mode)
 * Viewers don't have API access in Monday.com
 * @param {string} sessionToken - Monday.com session token
 * @returns {boolean} - True if user is in view-only mode
 */
export const isViewOnlyUser = (sessionToken) => {
  if (!sessionToken) return false;
  
  const decoded = decodeJWT(sessionToken);
  if (!decoded) return false;
  
  // Check for isViewOnly parameter in the token
  return decoded.isViewOnly === true || decoded.is_view_only === true;
};

/**
 * Get user information from session token
 * @param {string} sessionToken - Monday.com session token
 * @returns {object|null} - User info object or null
 */
export const getUserInfoFromToken = (sessionToken) => {
  if (!sessionToken) return null;
  
  const decoded = decodeJWT(sessionToken);
  if (!decoded) return null;
  
  return {
    userId: decoded.userId || decoded.user_id,
    accountId: decoded.accountId || decoded.account_id,
    isViewOnly: decoded.isViewOnly || decoded.is_view_only || false,
    // Add other relevant fields as needed
  };
};
