import { callAlightMotion, onlyPost, sendJson, validateEmail } from "./_upstream.js";

function validAlightUrl(value) {
  try {
    const url = new URL(String(value || "").replace(/&amp;/g, "&"));
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch (e) {
    return "";
  }
}

function latestMessagePayload(data, email) {
  const latest = Array.isArray(data) ? data[0] : data;
  if (!latest) {
    return { status: false, message: "Inbox kosong", data: [] };
  }

  const preferredLink = validAlightUrl(
    latest.login_url ?? 
    latest.loginUrl ?? 
    latest.verification_url ?? 
    latest.verificationUrl
  );

  return {
    status: true,
    data: {
      email: email,
      link: preferredLink || "",
      message: latest
    }
  };
}

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
    const upstream = await callAlightMotion("inbox", { email });
    return sendJson(res, 200, latestMessagePayload(upstream.data, email));
  } catch (error) {
    return sendJson(res, Number(error.statusCode || 500), {
      status: false,
      message: String(error.message || "Inbox gagal dibaca.")
    });
  }
}
