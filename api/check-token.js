// Database penyimpanan token sementara di memori server
let serverTokens = {
  "HAO-PREMIUM-30D": "2027-09-15T23:59:59",
  "VIP-FREE-3DAYS": "2027-08-18T23:59:59"
};

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // METHOD 1: POST untuk verifikasi token
  if (req.method === 'POST') {
    const { token } = req.body;
    const cleanToken = String(token || "").trim().toUpperCase();

    if (!cleanToken) {
      return res.status(400).json({ status: false, message: "Token tidak boleh kosong." });
    }

    const expiryString = serverTokens[cleanToken];

    if (!expiryString) {
      return res.status(400).json({ status: false, message: "Token salah atau tidak terdaftar!" });
    }

    const now = new Date();
    const expiryDate = new Date(expiryString);

    if (now > expiryDate) {
      return res.status(400).json({ status: false, message: "Masa aktif token sudah kedaluarsa!" });
    }

    return res.status(200).json({
      status: true,
      message: "Token valid dan aktif.",
      expires_at: expiryString
    });
  }

  // METHOD 2: PUT untuk menambahkan token baru dari panel owner
  if (req.method === 'PUT') {
    const { token, days, secret } = req.body;
    const OWNER_SECRET_KEY = "HAOMI_XML"; // Key owner diperbarui menjadi HAOMI_XML

    if (secret !== OWNER_SECRET_KEY) {
      return res.status(401).json({ status: false, message: "Otorisasi ditolak. Kata sandi owner salah." });
    }

    const cleanToken = String(token || "").trim().toUpperCase();
    const activeDays = Number(days || 30);

    if (!cleanToken) {
      return res.status(400).json({ status: false, message: "Kode token wajib diisi." });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + activeDays);
    const expiryString = expiryDate.toISOString().split('T')[0] + "T23:59:59";

    serverTokens[cleanToken] = expiryString;

    return res.status(200).json({
      status: true,
      message: `Token ${cleanToken} berhasil dibuat untuk ${activeDays} hari!`,
      expires_at: expiryString
    });
  }

  return res.status(405).json({ status: false, message: "Method tidak diizinkan." });
}