import { sendJson, onlyPost } from "./_upstream.js";

if (!global.users) {
  global.users = {
    "admin": { password: "admin123", role: "admin" },
    "user": { password: "user123", role: "user" }
  };
}

if (!global.activeSessions) {
  global.activeSessions = {};
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;

  const { username, password } = req.body || {};

  if (!username || !password) {
    return sendJson(res, 400, {
      status: false,
      message: "Username dan password harus diisi."
    });
  }

  const user = global.users[username];
  
  if (!user || user.password !== password) {
    return sendJson(res, 401, {
      status: false,
      message: "Username atau password salah."
    });
  }

  // Generate session token
  const sessionToken = "SESSION_" + Math.random().toString(36).substring(2, 15) + Date.now();
  
  global.activeSessions[sessionToken] = {
    username,
    role: user.role,
    loginTime: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'Unknown'
  };

  return sendJson(res, 200, {
    status: true,
    message: "Login berhasil!",
    token: sessionToken,
    username,
    role: user.role
  });
}
