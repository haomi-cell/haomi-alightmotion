export async function callAlightMotion(action, params = {}) {
  const apiKey = cleanString(process.env.ISAAW_API_KEY || "e329d3cb861969fe599ef5fe", 4096);
  const accessToken = cleanString(process.env.ISAAW_ACCESS_TOKEN || "aks-1d3bd53f4d857a690a77471d", 4096);

  const base = cleanString(process.env.ISAAW_API_BASE || DEFAULT_BASE, 1024).replace(/\/+$/, "");
  
  // PERBAIKAN: Mengembalikan struktur ke query parameter ?action=...
  const url = new URL(`${base}/api/am`);
  url.searchParams.set("action", action);
  url.searchParams.set("apikey", apiKey);

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
        "X-Zen-Key": apiKey,
        "user-agent": "znn-am-activation/1.3"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(28000)
    });
  } catch {
    const error = new Error("Tidak dapat terhubung ke layanan upstream.");
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
