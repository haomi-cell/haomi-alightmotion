/**
 * API Configuration - Login Based System
 */

const API_BASE_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:3000' 
  : 'https://haomi-alightmotion.vercel.app';

const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/login`,
  logout: `${API_BASE_URL}/api/logout`,
  checkToken: `${API_BASE_URL}/api/check-token`,
  generateToken: `${API_BASE_URL}/api/generate-token`,
  send: `${API_BASE_URL}/api/send`,
  verify: `${API_BASE_URL}/api/verify`,
  bulk: `${API_BASE_URL}/api/bulk`,
  inbox: `${API_BASE_URL}/api/inbox`
};

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

// LOGIN
window.API_login = (username, password) => apiCall(API_ENDPOINTS.login, 'POST', { username, password });

// LOGOUT
window.API_logout = (token) => apiCall(API_ENDPOINTS.logout, 'POST', { token });

// CHECK TOKEN
window.API_checkToken = (token) => apiCall(API_ENDPOINTS.checkToken, 'POST', { token });

// GENERATE TOKEN (Admin)
window.API_generateToken = (token, duration) => apiCall(API_ENDPOINTS.generateToken, 'POST', { token, duration });

// SEND MAGIC LINK
window.API_sendMagicLink = (email) => apiCall(API_ENDPOINTS.send, 'POST', { email });

// VERIFY MAGIC LINK
window.API_verifyMagicLink = (email, link) => apiCall(API_ENDPOINTS.verify, 'POST', { email, link });

// BULK
window.API_bulk = (amount) => apiCall(API_ENDPOINTS.bulk, 'POST', { amount });

// INBOX
window.API_inbox = (email) => apiCall(API_ENDPOINTS.inbox, 'POST', { email });
