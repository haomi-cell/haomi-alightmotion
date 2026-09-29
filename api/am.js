const API_BASE = 'https://api.jerexd.my.id';
const API_KEY = 'jere_sTl9OLzPIyMn';

export default async function handler(req, res) {
  // Mendukung parameter dari req.query (GET) maupun req.body (POST)
  const { action, email, url, link } = { ...req.query, ...req.body };
  const targetLink = link || url;

  if (!action) {
    return res.status(400).json({ status: false, error: 'Action wajib diisi.' });
  }

  if (!email) {
    return res.status(400).json({ status: false, error: 'Email wajib diisi.' });
  }

  let target;
  if (action === 'send') {
    target = `${API_BASE}/api/am/send?apikey=${API_KEY}&email=${encodeURIComponent(email)}`;
  } else if (action === 'verif') {
    if (!targetLink) {
      return res.status(400).json({ status: false, error: 'Tautan (link/url) aktivasi wajib diisi.' });
    }
    target = `${API_BASE}/api/am/verif?apikey=${API_KEY}&email=${encodeURIComponent(email)}&link=${encodeURIComponent(targetLink)}`;
  } else {
    return res.status(404).json({ status: false, error: 'Action tidak valid.' });
  }

  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({ status: false, error: 'Koneksi Gateway Gagal: ' + (error.message || error) });
  }
}
