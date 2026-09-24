import axios from 'axios';

// Konfigurasi Autentikasi Star Indopay menggunakan Cookie Sesi
const INDOPAY_COOKIES = "csrf_cookie=274e8d23f6958b14ed2414dc3acb5bc7; sid=02uoisfam1qgak3bl21qtq9hn4br97gm; save_browser=8c908c4a333346756dab08ada61dfa4e; user_id=NjUzODk%3D; user_key=49e6bc8ee19c0b5676d84d433c768437";

// Sesuaikan BASE_URL ini dengan URL API endpoint Star Indopay yang asli
const INDOPAY_BASE_URL = "https://api.starindopay.com/v1"; 

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;
    let body = {};
    
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (e) {
        body = {};
    }

    // Konfigurasi header Axios wajib dengan Cookie sesi
    const axiosConfig = {
        headers: {
            'Cookie': INDOPAY_COOKIES,
            'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 detik timeout
    };

    try {
        if (!action) {
            return res.status(400).json({ status: false, error: 'Aksi gateway tidak ditentukan' });
        }

        switch (action) {
            case 'deposit': {
                // Proses pembuatan QRIS / deposit
                const response = await axios.post(
                    `${INDOPAY_BASE_URL}/deposit`,
                    { amount: body.amount },
                    axiosConfig
                );
                return res.status(200).json({ status: true, data: response.data });
            }

            case 'cekmutasi': {
                // Proses verifikasi status pembayaran
                const response = await axios.post(
                    `${INDOPAY_BASE_URL}/cekmutasi`,
                    { invoice_id: body.invoice_id },
                    axiosConfig
                );
                return res.status(200).json({ status: true, data: response.data });
            }
            
            case 'cancel': {
                // Proses membatalkan transaksi yang pending
                const response = await axios.post(
                    `${INDOPAY_BASE_URL}/cancel`,
                    { invoice_id: body.invoice_id },
                    axiosConfig
                );
                return res.status(200).json({ status: true, data: response.data });
            }

            default:
                return res.status(400).json({ status: false, error: 'Aksi gateway tidak valid' });
        }
    } catch (err) {
        return res.status(200).json({ 
            status: false, 
            error: 'Payment Gateway Error: ' + (err.response?.data?.message || err.message) 
        });
    }
}
