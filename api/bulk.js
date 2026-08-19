function cleanString(value, max = 4000) {
  return String(value ?? "").trim().slice(0, max);
}

function sendJson(res, statusCode, payload) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(statusCode).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { status: false, message: "Method tidak didukung." });
  }

  const amount = Number(req.body?.amount);
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    return sendJson(res, 400, {
      status: false,
      message: "Jumlah bulk harus berupa angka 1 sampai 100."
    });
  }

  const apiKey = cleanString(process.env.ISAAW_API_KEY || "e329d3cb861969fe599ef5fe", 4096);
  const accessToken = cleanString(process.env.ISAAW_ACCESS_TOKEN || "aks-1d3bd53f4d857a690a77471d", 4096);
  const base = cleanString(process.env.ISAAW_API_BASE || "https://ndxhs.my.id", 1024).replace(/\/+$/, "");

  const url = new URL(`${base}/bulk`);
  url.searchParams.set("amount", String(amount));

  try {
    const upstreamRes = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-Zen-Access": accessToken,
        "X-Zen-Key": apiKey,
        "user-agent": "znn-am-activation/1.3"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(28000)
    });

    const raw = await upstreamRes.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { status: false, message: raw.slice(0, 1000) || "Respons API tidak dapat dibaca." };
    }

    const code = upstreamRes.ok ? 200 : Math.max(400, upstreamRes.status || 400);
    return sendJson(res, code, data);
  } catch (error) {
    return sendJson(res, 502, {
      status: false,
      message: String(error.message || "Bulk email gagal diproses.")
    });
  }
}