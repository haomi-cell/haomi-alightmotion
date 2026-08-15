import { sendJson, onlyPost } from "./_upstream.js";

// Menggunakan global state untuk simulasi database sementara
if (!global.activeUsers) {
  global.activeUsers = [];
}

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;

  const { token } = req.body;

  if (token) {
    // Hapus user dengan token tersebut dari daftar pengguna aktif
    global.activeUsers = global.activeUsers.filter(user => user.token !== token);
  }

  return sendJson(res, 200, {
    status: true,
    message: "Berhasil logout."
  });
}