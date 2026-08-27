const axios = require('axios');

const RAMASHOP_BASE_URL = "https://ramashop.my.id/api/public";
const RAMASHOP_API_KEY = "rg_ea029ad8b5262570682db8bbc92a43";

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;
    const payload = req.body || {};

    try {
        if (action === 'login') {
            const { username, password } = payload;
            // Bypass untuk Owner
            if (username === "HAOMI" && password === "HAOMI_XML") {
                return res.json({
                    status: true,
                    data: {
                        username: "HAOMI",
                        role: "Owner",
                        limit_count: 999,
                        is_permanent: true,
                        id_code: "MSH-OWNER",
                        wa: "082231669053"
                    }
                });
            }
            // Tambahkan logika database Supabase Anda di sini untuk user biasa
            return res.json({ status: false, error: "Username atau Password salah" });
        }

        if (action === 'register') {
            const { username, password, wa } = payload;
            return res.json({
                status: true,
                data: {
                    username: username,
                    role: "Member",
                    limit_count: 3,
                    is_permanent: false,
                    id_code: "MSH-" + Math.floor(Math.random() * 900 + 100),
                    wa: wa
                }
            });
        }

        if (action === 'updateUser') {
            return res.json({ status: true });
        }

        // --- ENDPOINT QRIS RAMASHOP ---
        if (action === 'createQris') {
            const { amount } = payload;
            const response = await axios.post(`${RAMASHOP_BASE_URL}/deposit/create`, {
                amount: amount,
                method: "qris"
            }, {
                headers: {
                    "X-API-Key": RAMASHOP_API_KEY,
                    "Content-Type": "application/json"
                },
                timeout: 20000
            });
            return res.json({ status: true, data: response.data });
        }

        if (action === 'checkQris') {
            const { depositId } = payload;
            const response = await axios.get(`${RAMASHOP_BASE_URL}/deposit/status/${depositId}`, {
                headers: {
                    "X-API-Key": RAMASHOP_API_KEY,
                    "Content-Type": "application/json"
                },
                timeout: 20000
            });
            return res.json({ status: true, data: response.data });
        }

        return res.status(400).json({ status: false, error: "Aksi API tidak valid" });

    } catch (error) {
        return res.status(500).json({ 
            status: false, 
            error: error.response?.data?.message || error.message || "Terjadi kesalahan pada server" 
        });
    }
};