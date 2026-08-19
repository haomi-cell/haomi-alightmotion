import {
  callTempMailRead,
  onlyPost,
  sendJson,
  validateEmail
} from "./_upstream.js";

function firstString(value, keys) {
  if (!value || typeof value !== "object") return "";

  for (const key of keys) {
    const item = value[key];
    if (typeof item === "string" && item.trim()) return item.trim();
    if (typeof item === "number") return String(item);
  }

  return "";
}

function normalizeMessages(data) {
  const payload = data?.data ?? data?.result ?? data ?? {};
  const source = payload?.messages ?? payload?.inbox ?? payload?.mails ?? [];

  if (Array.isArray(source)) return source.filter(Boolean);

  if (source && typeof source === "object") {
    const messageKeys = ["subject", "title", "body", "text", "html", "from", "sender"];
    if (messageKeys.some((key) => Object.prototype.hasOwnProperty.call(source, key))) {
      return [source];
    }

    return Object.values(source).filter(
      (item) => item && typeof item === "object"
    );
  }

  return [];
}

function newestMessage(messages) {
  if (!messages.length) return null;

  return messages.reduce((latest, message) => {
    const keys = [
      "received", "date", "received_at", "receivedAt", "created_at", "createdAt", "time"
    ];
    const latestDate = Date.parse(firstString(latest, keys));
    const messageDate = Date.parse(firstString(message, keys));

    if (Number.isFinite(messageDate) && (!Number.isFinite(latestDate) || messageDate > latestDate)) {
      return message;
    }

    return latest;
  }, messages[0]);
}

function validAlightUrl(value) {
  try {
    const url = new URL(String(value || "").replace(/&amp;/g, "&"));
    if (url.protocol !== "https:") return "";
    if (!/alight-creative|alightcreative/i.test(url.hostname + url.pathname)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function collectAlightLinks(value, output = [], depth = 0) {
  if (depth > 7 || value == null) return output;

  if (typeof value === "string") {
    const urls = value.match(/https?:\/\/[^\s<>"']+/gi) || [];
    urls.forEach((item) => {
      const url = validAlightUrl(item.replace(/[),.;]+$/, ""));
      if (url && !output.includes(url)) output.push(url);
    });
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectAlightLinks(item, output, depth + 1));
    return output;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectAlightLinks(item, output, depth + 1));
  }

  return output;
}

function latestMessagePayload(data, email) {
  const latest = newestMessage(normalizeMessages(data));

  if (!latest) {
    return {
      status: true,
      creator: "x-znn",
      data: { email, count: 0, messages: [] }
    };
  }

  const preferredLink = validAlightUrl(
    latest.login_url ??
    latest.loginUrl ??
    latest.verification_url ??
    latest.verificationUrl
  );
  const loginUrl = preferredLink || collectAlightLinks(latest)[0] || "";
  const summary = {
    subject: firstString(latest, ["subject", "title", "topic"]),
    from: firstString(latest, [
      "from", "sender", "from_address", "fromAddress", "sender_email", "senderEmail"
    ]),
    received: firstString(latest, [
      "received", "date", "received_at", "receivedAt", "created_at", "createdAt", "time"
    ])
  };

  if (loginUrl) summary.login_url = loginUrl;

  return {
    status: true,
    creator: "x-znn",
    data: {
      email,
      count: 1,
      messages: [summary]
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
    const upstream = await callTempMailRead(email);
    const code = upstream.ok ? 200 : Math.max(400, upstream.statusCode || 400);

    if (!upstream.ok) {
      return sendJson(res, code, upstream.data);
    }

    return sendJson(res, 200, latestMessagePayload(upstream.data, email));
  } catch (error) {
    return sendJson(res, Number(error.statusCode || 500), {
      status: false,
      message: String(error.message || "Inbox gagal dibaca.")
    });
  }
}
