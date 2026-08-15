import { sendJson, cleanString } from "./_upstream.js";

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

  if (req.method !== "POST") {
    return sendJson(res, 405, { status: false, message: "Method tidak diizinkan." });
  }

  const { action, token, days, secret } = req.body || {};

  // Jika action adalah "generate" (Diminta oleh Owner untuk buat token otomatis)
  if (action === "generate") {
    if (secret !== OWNER_SECRET_KEY) {
      return sendJson(res, 401, { status: false, message: "Unauthorized: Secret key salah." });
    }

    const expiryDate = new Date(Date.now() + Number(days || 30) * 24 * 60 * 60 * 1000).toISOString();
    
    global.generatedTokens[token] = {
      expires_at: expiryDate
    };

    return sendJson(res, 200, {
      status: true,
      message: "Token berhasil dibuat.",
      token: token,
      expires_at: expiryDate
    });
  }

  // Jika verifikasi token biasa oleh user reguler
  const cleanToken = cleanString(token, 100).toUpperCase();

  if (!cleanToken) {
    return sendJson(res, 400, { status: false, message: "Token tidak boleh kosong." });
  }

  if (global.blockedIPs.includes(ipAddress)) {
    return sendJson(res, 403, { status: false, message: "IP Anda telah diblokir oleh Admin." });
  }

  const tokenData = global.generatedTokens[cleanToken];

  if (!tokenData) {
    return sendJson(res, 404, { status: false, message: "Token tidak ditemukan atau salah." });
  }

  const now = new Date();
  const expiryTime = new Date(tokenData.expires_at).getTime();

  if (now.getTime() > expiryTime) {
    return sendJson(res, 400, { status: false, message: "Token sudah kedaluwarsa!" });
  }

  const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const randomId = "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  global.activeUsers = global.activeUsers.filter(u => u.token !== cleanToken);
  global.activeUsers.push({
    id: randomId,
    token: cleanToken,
    ip: ipAddress,
    lastLogin: `Hari ini, ${timeString}`
  });

  return sendJson(res, 200, {
    status: true,
    message: "Token valid.",
    expires_at: tokenData.expires_at
  });
}