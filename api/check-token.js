const OWNER_SECRET_KEY = "HAOMI_XML";

if (!global.generatedTokens) {
  global.generatedTokens = {
    "HAO-1234": { expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
  };
}

if (!global.activeUsers) global.activeUsers = [];
if (!global.blockedIPs) global.blockedIPs = [];

export default async function handler(req, res) {
  // Set header agar respon selalu berupa JSON murni
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP Tidak Dikenal';

  // Hanya izinkan POST
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method tidak diizinkan." });
  }

  try {
    const body = req.body || {};
    const action = body.action;

    // 1. Aksi Generate Token oleh Owner
    if (action === "generate") {
      if (body.secret !== OWNER_SECRET_KEY) {
        return res.status(401).json({ status: false, message: "Unauthorized: Secret key salah." });
      }

      const days = Number(body.days || 30);
      const token = String(body.token || "").trim().toUpperCase();

      if (!token) {
        return res.status(400).json({ status: false, message: "Token tidak valid." });
      }

      const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      
      global.generatedTokens[token] = {
        expires_at: expiryDate
      };

      return res.status(200).json({
        status: true,
        message: "Token berhasil dibuat.",
        token: token,
        expires_at: expiryDate
      });
    }

    // 2. Aksi Verifikasi Token oleh User Reguler
    const tokenInput = String(body.token || "").trim().toUpperCase();

    if (!tokenInput) {
      return res.status(400).json({ status: false, message: "Token tidak boleh kosong." });
    }

    if (global.blockedIPs.includes(ipAddress)) {
      return res.status(403).json({ status: false, message: "IP Anda telah diblokir oleh Admin." });
    }

    const tokenData = global.generatedTokens[tokenInput];

    if (!tokenData) {
      return res.status(404).json({ status: false, message: "Token tidak ditemukan atau salah." });
    }

    const now = new Date();
    const expiryTime = new Date(tokenData.expires_at).getTime();

    if (now.getTime() > expiryTime) {
      return res.status(400).json({ status: false, message: "Token sudah kedaluwarsa!" });
    }

    const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    const randomId = "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    global.activeUsers = global.activeUsers.filter(u => u.token !== tokenInput);
    global.activeUsers.push({
      id: randomId,
      token: tokenInput,
      ip: ipAddress,
      lastLogin: `Hari ini, ${timeString}`
    });

    return res.status(200).json({
      status: true,
      message: "Token valid.",
      expires_at: tokenData.expires_at
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Server Error: " + (err.message || "Terjadi kesalahan internal.")
    });
  }
}