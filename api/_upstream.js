const DEFAULT_BASE = "https://ndxhs.my.id/service";
const DEFAULT_API_ROOT = "https://ndxhs.my.id";

const HARDCODED_API_KEY = "e329d3cb861969fe599ef5fe";
const HARDCODED_ACCESS_TOKEN = "aks-1d3bd53f4d857a690a77471d";

function cleanString(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

export function validateEmail(value) {
  const email = cleanString(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "";
  }
  return email;
}

export function validateVerificationLink(value) {
  const link = cleanString(value, 4096);

  try {
    const url = new URL(link);
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function sanitize(value, depth = 0) {
  if (depth > 7 || value == null) return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === "object") {
    const out = {};

    for (const [key, item] of Object.entries(value)) {
      if (/token|secret|authorization|api[_-]?key|credential/i.test(key)) {
        continue;
      }

      out[key] = sanitize(item, depth + 1);
    }

    return out;
  }

  if (typeof value === "string") {
    return value
      .replace(/zk_[A-Za-z0-9_-]{16,}/g, "[hidden]")
      .slice(0, 12000);
  }

  return value;
}

export async function callAlightMotion(action, params = {}) {
  const token = cleanString(process.env.ZEN_API_KEY || HARDCODED_API_KEY, 4096);
  const accessToken = cleanString(process.env.ZEN_ACCESS_TOKEN || HARDCODED_ACCESS_TOKEN, 4096);

  if (!token) {
    const error = new Error("API Key belum tersedia.");
    error.statusCode = 500;
    throw error;
  }

  if (!accessToken) {
    const error = new Error("Access Token belum tersedia.");
    error.statusCode = 500;
    throw error;
  }

  const base = cleanString(process.env.ZEN_API_BASE || DEFAULT_BASE, 1024).replace(/\/+$/, "");
  const url = new URL(base + "/" + action);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value) !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-Zen-Access": accessToken,
        "X-Zen-Key": token,
        "user-agent": "zen-service-client/2.0"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(28000)
    });
  } catch {
    const error = new Error("Tidak dapat terhubung ke layanan utama.");
    error.statusCode = 502;
    throw error;
  }

  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {
      status: false,
      message: raw.slice(0, 1000) || "Respons API tidak dapat dibaca."
    };
  }

  const safeData = sanitize(data);

  return {
    ok: response.ok && safeData && safeData.status !== false,
    statusCode: response.status,
    data: safeData
  };
}

export async function callTempMailRead(email) {
  const accessToken = cleanString(process.env.ZEN_ACCESS_TOKEN || HARDCODED_ACCESS_TOKEN, 4096);

  if (!accessToken) {
    const error = new Error("Access Token belum tersedia.");
    error.statusCode = 500;
    throw error;
  }

  const root = cleanString(process.env.TEMPMAIL_API_BASE || DEFAULT_API_ROOT, 1024).replace(/\/+$/, "");
  const url = new URL(root + "/tempmail-read");
  url.searchParams.set("email", email);

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-Zen-Access": accessToken,
        "user-agent": "zen-service-client/2.0"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(28000)
    });
  } catch {
    const error = new Error("Tidak dapat terhubung ke layanan Temp Mail.");
    error.statusCode = 502;
    throw error;
  }

  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {
      status: false,
      message: raw.slice(0, 1000) || "Respons Temp Mail tidak dapat dibaca."
    };
  }

  const safeData = sanitize(data);

  return {
    ok: response.ok && safeData && safeData.status !== false,
    statusCode: response.status,
    data: safeData
  };
}

export function sendJson(res, statusCode, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  return res.status(statusCode).json(payload);
}

export function onlyPost(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, {
      status: false,
      message: "Method tidak didukung."
    });
    return false;
  }
  return true;
}