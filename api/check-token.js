import { sendJson, cleanString } from "./_upstream.js";

const OWNER_SECRET_KEY = "HAOMI_XML";

// Penyimpanan sementara untuk token (bisa diganti database jika sudah ada)
if (!global.generatedTokens) {
  global.generatedTokens = {
    "HAO-1234": { expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
  };
}

// Inisialisasi variabel untuk log user aktif
if (!global.activeUsers) global.activeUsers = [];
if (!global.blockedIPs) global.blockedIPs = [];

export default async function handler(req, res) {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP Tidak Dikenal';

  // 1. Tangani metode PUT (Digunakan oleh Owner untuk membuat token otomatis)
  if (req.method === "PUT") {
    const { token, days, secret } = req.body || {};

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

  // 2. Tangani metode POST (Digunakan oleh User Reguler untuk Verifikasi Token)
  if (req.method === "POST") {
    const token = cleanString(req.body?.token, 100).toUpperCase();

    if (!token) {
      return sendJson(res, 400, { status: false, message: "Token tidak boleh kosong." });
    }

    // Cek apakah IP diblokir
    if (global.blockedIPs.includes(ipAddress)) {
      return sendJson(res, 403, { status: false, message: "IP Anda telah diblokir oleh Admin." });
    }

    // Cek apakah token terdaftar di penyimpanan sementara atau valid
    const tokenData = global.generatedTokens[token];

    if (!tokenData) {
      return sendJson(res, 404, { status: false, message: "Token tidak ditemukan atau salah." });
    }

    const now = new Date();
    const expiryTime = new Date(tokenData.expires_at).getTime();

    if (now.getTime() > expiryTime) {
      return sendJson(res, 400, { status: false, message: "Token sudah kedaluwarsa!" });
    }

    // Catat user ke log aktif untuk panel owner
    const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const randomId = "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    global.activeUsers = global.activeUsers.filter(u => u.token !== token);
    global.activeUsers.push({
      id: randomId,
      token: token,
      ip: ipAddress,
      lastLogin: `Hari ini, ${timeString}`
    });

    return sendJson(res, 200, {
      status: true,
      message: "Token valid.",
      expires_at: tokenData.expires_at
    });
  }

  return sendJson(res, 405, { status: false, message: "Method tidak diizinkan." });
}