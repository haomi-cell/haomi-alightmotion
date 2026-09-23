// File: api/reactch.js
export default async function handler(req, res) {
  // Cek method, kudu POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method Not Allowed' });
  }

  const { url, reaction } = req.body;
  if (!url || !reaction) {
    return res.status(400).json({ status: false, message: 'URL lan Emoji Reaksi wajib diisi.' });
  }

  try {
    const fetchRes = await fetch('https://api.jerexd.my.id/api/whatsapp/reactch?apikey=jere_sTl9OLzPIyMn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, reaction })
    });
    
    const data = await fetchRes.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ status: false, message: 'Galat Server Internal', error: error.message });
  }
}
