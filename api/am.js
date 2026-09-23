const API_BASE = 'https://skyp.isaaw.web.id';
const API_KEY = 'ISAAW-matchalatte';

export default async function handler(req, res) {
  // Ambil parameter yang dikirim dari HTML
  // (HTML kamu mengirimkan 'url' untuk link magic-nya)
  const { action, email, url } = req.query || {};

  if (!action) {
    return res.status(400).json({ status: false, error: 'Action wajib diisi.' });
  }

  let target;

  // Sesuaikan URL tujuan ke API utama
  if (action === 'send') {
    if (!email) return res.status(400).json({ status: false, error: 'Email kosong.' });
    target = `${API_BASE}/api/am/sendlink?email=${encodeURIComponent(email)}`;
    
  } else if (action === 'verif') {
    if (!email || !url) return res.status(400).json({ status: false, error: 'Email atau URL kosong.' });
    target = `${API_BASE}/api/amp/reqprem?email=${encodeURIComponent(email)}&link=${encodeURIComponent(url)}`;
    
  } else {
    return res.status(404).json({ status: false, error: 'Action tidak valid.' });
  }

  // Lakukan request ke server upstream skyp.isaaw
  try {
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(502).json({
      status: false,
      error: 'Gagal menghubungi server utama (Gateway Error).'
    });
  }
}
