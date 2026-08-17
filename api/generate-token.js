const OWNER_SECRET_KEY = "HAOMI_XML";

if (!global.generatedTokens) {
  global.generatedTokens = {
    "HAO-1234": { expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ status: false, message: "Method tidak diizinkan." });
  }

  try {
    const body = req.body || {};

    if (body.secret !== OWNER_SECRET_KEY) {
      return res.status(401).json({ status: false, message: "Unauthorized: Secret key salah." });
    }

    const rawDays = body.days;
    const token = String(body.token || "").trim().toUpperCase();

    if (!token) {
      return res.status(400).json({ status: false, message: "Token tidak valid." });
    }

    let expiryDate;
    if (rawDays === "PERMANENT") {
      expiryDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(); // +100 tahun
    } else if (rawDays === "5_MIN") {
      expiryDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    } else {
      const days = Number(rawDays || 30);
      expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
    
    global.generatedTokens[token] = {
      expires_at: expiryDate
    };

    return res.status(200).json({
      status: true,
      message: "Token berhasil dibuat.",
      token: token,
      expires_at: expiryDate
    });

  } catch (err) {
    return res.status(500).json({ status: false, message: "Server Error" });
  }
}