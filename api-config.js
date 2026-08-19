/**
 * API Configuration & Helper Functions
 * Connects Frontend to All API Endpoints
 */

// Detect environment
const API_BASE_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:3000' 
  : 'https://haomi-alightmotion.vercel.app';

// API Endpoints
const API_ENDPOINTS = {
  send: `${API_BASE_URL}/api/send`,
  verify: `${API_BASE_URL}/api/verify`,
  bulk: `${API_BASE_URL}/api/bulk`,
  inbox: `${API_BASE_URL}/api/inbox`,
  checkToken: `${API_BASE_URL}/api/check-token`,
  generateToken: `${API_BASE_URL}/api/generate-token`,
  admin: `${API_BASE_URL}/api/admin`,
  logout: `${API_BASE_URL}/api/logout`
};

/**
 * Generic API Call Handler
 */
async function apiCall(endpoint, method = 'POST', data = {}) {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Error ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Send Magic Link - API Call
 */
async function callApiSendMagicLink(email) {
  return apiCall(API_ENDPOINTS.send, 'POST', { email });
}

/**
 * Verify Magic Link - API Call
 */
async function callApiVerifyMagicLink(email, link) {
  return apiCall(API_ENDPOINTS.verify, 'POST', { email, link });
}

/**
 * Bulk Process - API Call
 */
async function callApiBulk(amount) {
  return apiCall(API_ENDPOINTS.bulk, 'POST', { amount });
}

/**
 * Inbox Check - API Call
 */
async function callApiInbox(email) {
  return apiCall(API_ENDPOINTS.inbox, 'POST', { email });
}

/**
 * Check Token - API Call
 */
async function callApiCheckToken(token) {
  return apiCall(API_ENDPOINTS.checkToken, 'POST', { token });
}

/**
 * Generate Token - API Call
 */
async function callApiGenerateToken(duration) {
  return apiCall(API_ENDPOINTS.generateToken, 'POST', { duration });
}

/**
 * Admin Action - API Call
 */
async function callApiAdmin(action, payload) {
  return apiCall(API_ENDPOINTS.admin, 'POST', { action, ...payload });
}

/**
 * Logout - API Call
 */
async function callApiLogout(token) {
  return apiCall(API_ENDPOINTS.logout, 'POST', { token });
}

// Export untuk digunakan di index.html
window.API = {
  sendMagicLink: callApiSendMagicLink,
  verifyMagicLink: callApiVerifyMagicLink,
  bulk: callApiBulk,
  inbox: callApiInbox,
  checkToken: callApiCheckToken,
  generateToken: callApiGenerateToken,
  admin: callApiAdmin,
  logout: callApiLogout
};
