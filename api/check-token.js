  // Taruh ini di bagian atas file check-token.js
  if (!global.activeUsers) global.activeUsers = [];
  if (!global.blockedIPs) global.blockedIPs = [];

  // ... (Di dalam fungsi handler Anda) ...
  const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'IP Tidak Dikenal';

  // 1. Cek Blokir
  if (global.blockedIPs.includes(ipAddress)) {
    return sendJson(res, 403, { status: false, message: "IP Anda telah diblokir oleh Admin." });
  }

  // 2. Jika Token VALID, catat user ke daftar aktif
  // (Letakkan kode di bawah ini setelah logika verifikasi token berhasil)
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  
  const randomId = "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  // Hapus data lama dengan IP/Token yang sama agar tidak double
  global.activeUsers = global.activeUsers.filter(u => u.token !== tokenInput);
  
  // Simpan data login baru
  global.activeUsers.push({
    id: randomId,
    token: tokenInput,
    ip: ipAddress,
    lastLogin: `Hari ini, ${timeString}`
  });

Dengan penyesuaian ini:
1. Setiap orang yang login, akan masuk ke Panel Admin.
2. Saat orang itu klik **Keluar Sesi Token**, datanya akan **HILANG** dari panel Admin.
3. Owner bisa menekan **Cabut Token** untuk mematikan sesi orang tersebut (jika dikombinasikan dengan database).
