export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Metode tidak diizinkan.' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ status: false, message: 'Token tidak boleh kosong.' });
  }

  // --- TEMPAT DAFTAR TOKEN PEMBELI ---
  const databaseTokens = {
    "HAO-PREMIUM-30D": "2026-09-15T23:59:59", // Contoh: Aktif sampai 15 September 2026
    "VIP-CUY-7DAYS": "2026-08-25T23:59:59"    // Contoh: Aktif sampai 25 Agustus 2026
  };

  const expiryString = databaseTokens[token.trim().toUpperCase()];

  if (!expiryString) {
    return res.status(401).json({ status: false, message: 'Token salah atau tidak terdaftar!' });
  }

  const now = new Date();
  const expiryDate = new Date(expiryString);

  if (now > expiryDate) {
    return res.status(403).json({ status: false, message: 'Token sudah kedaluarsa/habis masa aktifnya!' });
  }

  return res.status(200).json({ 
    status: true, 
    message: 'Token valid!', 
    expires_at: expiryString 
  });
}
