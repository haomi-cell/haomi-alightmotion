// Contoh di dalam file endpoint API Vercel Anda (misal: bulk.js / route.js)
import { callAlightMotion, sendJson, onlyPost } from '../../utils/path-to-your-helper'; // sesuaikan path import

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;

  try {
    // Memanggil fungsi eksekusi bulk
    const result = await callAlightMotion("bulk-endpoint", req.body);

    // Ubah bagian creator langsung pada data respons yang akan dikirim
    if (result.data && typeof result.data === "object") {
      result.data.creator = "𝐱𝙈𝙎𝙃𝙖𝙤𝙢𝙞";
    }

    return sendJson(res, result.statusCode, result.data);
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      status: false,
      creator: "𝐱𝙈𝙎𝙃𝙖𝙤𝙢𝙞",
      message: error.message
    });
  }
}
