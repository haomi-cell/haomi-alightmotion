import { sendJson } from "./_upstream.js";

const OWNER_SECRET_KEY = "HAOMI_XML";

if (!global.generatedTokens) {
  global.generatedTokens = {
    "HAO-1234": { expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
  };
}
if (!global.activeUsers) global.activeUsers = [];
if (!global.blockedIPs) global.blockedIPs = [];

export default async function handler(req, res) {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP Tidak Dikenal';
  const body = req.body || {};

  if (req.method !== "POST") {
    return sendJson(res, 405, { status: false, message: "Method tidak diizinkan." });
  }

  const tokenInput = String(body.token || "").trim().toUpperCase();
  if (!tokenInput) return sendJson(res, 400, { status: false, message: "Token tidak boleh kosong." });
  
  if (global.blockedIPs.includes(ipAddress)) {
    return sendJson(res, 403, { status: false, message: "IP Anda telah diblokir oleh Admin." });
  }

  const tokenData = global.generatedTokens[tokenInput];
  if (!tokenData) return sendJson(res, 404, { status: false, message: "Token tidak ditemukan / belum dibuat." });

  const now = new Date();
  if (now.getTime() > new Date(tokenData.expires_at).getTime()) {
    return sendJson(res, 400, { status: false, message: "Token kedaluwarsa!" });
  }

  const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const existingIndex = global.activeUsers.findIndex(u => u.token === tokenInput && u.ip === ipAddress);

  if (existingIndex !== -1) {
    global.activeUsers[existingIndex].lastLogin = `Hari ini, ${timeString}`;
  } else {
    const randomId = "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    global.activeUsers.push({
      id: randomId,
      token: tokenInput,
      ip: ipAddress,
      lastLogin: `Hari ini, ${timeString}`
    });
  }

  return sendJson(res, 200, { status: true, message: "Token valid.", expires_at: tokenData.expires_at });
}