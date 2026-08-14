import {
  callAlightMotion,
  onlyPost,
  sendJson,
  validateEmail,
  validateVerificationLink
} from "./_upstream.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;

  const email = validateEmail(req.body?.email);
  const link = validateVerificationLink(req.body?.link);

  if (!email) {
    return sendJson(res, 400, {
      status: false,
      message: "Masukkan email yang valid."
    });
  }

  if (!link) {
    return sendJson(res, 400, {
      status: false,
      message: "Masukkan link verifikasi HTTPS yang valid."
    });
  }

  try {
    const upstream = await callAlightMotion("verify", { email, link });
    const code = upstream.ok ? 200 : Math.max(400, upstream.statusCode || 400);
    return sendJson(res, code, upstream.data);
  } catch (error) {
    return sendJson(res, Number(error.statusCode || 500), {
      status: false,
      message: String(error.message || "Permintaan gagal diproses.")
    });
  }
}
