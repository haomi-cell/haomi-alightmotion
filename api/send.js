import {
  callAlightMotion,
  onlyPost,
  sendJson,
  validateEmail
} from "./_upstream.js";

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return;

  const email = validateEmail(req.body?.email);
  if (!email) {
    return sendJson(res, 400, {
      status: false,
      message: "Masukkan email yang valid."
    });
  }

  try {
    const upstream = await callAlightMotion("send", { email });
    const code = upstream.ok ? 200 : Math.max(400, upstream.statusCode || 400);
    return sendJson(res, code, upstream.data);
  } catch (error) {
    return sendJson(res, Number(error.statusCode || 500), {
      status: false,
      message: String(error.message || "Permintaan gagal diproses.")
    });
  }
}
