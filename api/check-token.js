import { sendJson } from "./_upstream.js";

const OWNER_SECRET_KEY = "HAOMI_XML";

// Penyimpanan sementara token dan log user
if (!global.generatedTokens) {
  global.generatedTokens = {
    "HAO-1234": { expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
  };
}

if (!global.activeUsers) global.activeUsers = [];
if (!global.blockedIPs) global.blockedIPs = [];

export default async function handler(req, res) {
  // Izinkan method POST maupun PUT agar tidak ada error "Method tidak diizinkan"
  if (req.method !== "POST" && req.method !== "PUT") {
    return sendJson(res, 405, { status: false, message: "Method tidak diizinkan." });
  }

  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP Tidak Dikenal';
  const body = req.body || {};
  
  // ==========================================
  // 1. AKSI: OWNER MEMBUAT TOKEN OTOMATIS
  // ==========================================
  if (body.secret === OWNER_SECRET_KEY || req.method === "PUT" || body.action === "generate") {
    
    if (body.secret !== OWNER_SECRET_KEY) {
      return sendJson(res, 401, { status: false, message: "Akses ditolak: Kata sandi Owner salah." });
    }

    const days = Number(body.days || 30);
    const token = String(body.token || "").trim().toUpperCase();

    if (!token) {
      return sendJson(res, 400, { status: false, message: "Token tidak valid." });
    }

    // Hitung masa aktif
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    
    // Simpan token
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


  // ==========================================
  // 2. AKSI: USER REGULER LOGIN / VERIFIKASI
  // ==========================================
  const tokenInput = String(body.token || "").trim().toUpperCase();

  if (!tokenInput) {
    return sendJson(res, 400, { status: false, message: "Token tidak boleh kosong." });
  }

  if (global.blockedIPs.includes(ipAddress)) {
    return sendJson(res, 403, { status: false, message: "IP Anda telah diblokir oleh Admin." });
  }

  const tokenData = global.generatedTokens[tokenInput];

  if (!tokenData) {
    return sendJson(res, 404, { status: false, message: "Token tidak ditemukan atau belum dibuat oleh Owner." });
  }

  const now = new Date();
  const expiryTime = new Date(tokenData.expires_at).getTime();

  if (now.getTime() > expiryTime) {
    return sendJson(res, 400, { status: false, message: "Token sudah kedaluwarsa!" });
  }

  // Rekam aktivitas login untuk ditampilkan di Dashboard Owner
  const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const randomId = "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  global.activeUsers = global.activeUsers.filter(u => u.token !== tokenInput);
  global.activeUsers.push({
    id: randomId,
    token: tokenInput,
    ip: ipAddress,
    lastLogin: `Hari ini, ${timeString}`
  });

  return sendJson(res, 200, {
    status: true,
    message: "Token valid.",
    expires_at: tokenData.expires_at
  });
}