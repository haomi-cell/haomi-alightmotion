import { sendJson } from "./_upstream.js";

const OWNER_SECRET_KEY = "HAOMI_XML";

// Memori Global Sementara
if (!global.generatedTokens) global.generatedTokens = {};
if (!global.activeUsers) global.activeUsers = [];
if (!global.blockedIPs) global.blockedIPs = [];

export default async function handler(req, res) {
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP Tidak Dikenal';
  const body = req.body || {};
  const query = req.query || {};

  // ==========================================
  // 1. FITUR GET (OWNER MELIHAT DATA LOGIN)
  // ==========================================
  if (req.method === "GET" && query.action === "get_users") {
    if (req.headers.authorization !== OWNER_SECRET_KEY) {
      return sendJson(res, 401, { status: false, message: "Akses Ditolak." });
    }
    return sendJson(res, 200, { status: true, data: global.activeUsers });
  }

  // Izinkan POST dan PUT
  if (req.method !== "POST" && req.method !== "PUT") {
    return sendJson(res, 405, { status: false, message: "Method tidak diizinkan." });
  }

  // ==========================================
  // 2. FITUR ADMIN (BUAT TOKEN, CABUT, BLOKIR IP)
  // ==========================================
  
  // A. Generate Token
  if (body.action === "generate" || req.method === "PUT") {
    if (body.secret !== OWNER_SECRET_KEY) return sendJson(res, 401, { status: false, message: "Secret key salah." });
    const days = Number(body.days || 30);
    const token = String(body.token || "").trim().toUpperCase();
    if (!token) return sendJson(res, 400, { status: false, message: "Token tidak valid." });
    
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    global.generatedTokens[token] = { expires_at: expiryDate };
    return sendJson(res, 200, { status: true, message: "Token berhasil dibuat.", token: token, expires_at: expiryDate });
  }

  // B. Cabut Token
  if (body.action === "revoke") {
    if (req.headers.authorization !== OWNER_SECRET_KEY) return sendJson(res, 401, { status: false, message: "Akses Ditolak." });
    global.activeUsers = global.activeUsers.filter(user => user.token !== body.token);
    return sendJson(res, 200, { status: true, message: "Token berhasil dicabut." });
  }

  // C. Blokir IP
  if (body.action === "block_ip") {
    if (req.headers.authorization !== OWNER_SECRET_KEY) return sendJson(res, 401, { status: false, message: "Akses Ditolak." });
    if (!global.blockedIPs.includes(body.ip)) global.blockedIPs.push(body.ip);
    global.activeUsers = global.activeUsers.filter(user => user.ip !== body.ip);
    return sendJson(res, 200, { status: true, message: "IP berhasil diblokir." });
  }

  // ==========================================
  // 3. FITUR USER LOGOUT
  // ==========================================
  if (body.action === "logout") {
    global.activeUsers = global.activeUsers.filter(user => user.token !== body.token);
    return sendJson(res, 200, { status: true, message: "Berhasil logout." });
  }

  // ==========================================
  // 4. FITUR USER LOGIN (VERIFIKASI TOKEN)
  // ==========================================
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

  // Catat Aktivitas Login
  const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const randomId = "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  // Hapus jika token ini login sebelumnya biar tidak ganda
  global.activeUsers = global.activeUsers.filter(u => u.token !== tokenInput);
  
  // Masukkan ke log
  global.activeUsers.push({
    id: randomId,
    token: tokenInput,
    ip: ipAddress,
    lastLogin: `Hari ini, ${timeString}`
  });

  return sendJson(res, 200, { status: true, message: "Token valid.", expires_at: tokenData.expires_at });
}