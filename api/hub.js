const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Mengambil kunci rahasia dari Environment Variables Vercel
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const RAMASHOP_BASE_URL = "https://ramashop.my.id/api/public";
const RAMASHOP_API_KEY = "rg_ea029ad8b5262570682db8bbc92a43";

export default async function handler(req, res) {
    // Pengaturan CORS agar aman
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action } = req.query;
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    try {
        switch (action) {
            case 'login': {
                const { data, error } = await supabase.from('users').select('*').eq('username', body.username).single();
                if (error || !data || data.password !== body.password) throw new Error('Kredensial salah.');
                if (data.is_banned === 'true') throw new Error('Akun disuspend.');
                return res.status(200).json({ status: true, data });
            }
            case 'register': {
                // Pengecekan IP & Hardware
                const { data: ipCheck } = await supabase.from('users').select('id').eq('ip_address', body.ip_address);
                if (ipCheck && ipCheck.length >= 2) throw new Error('Limit pendaftaran pada jaringan IP ini terlampaui.');
                const { data: fpCheck } = await supabase.from('users').select('id').eq('device_id', body.device_id);
                if (fpCheck && fpCheck.length >= 1) throw new Error('Identitas hardware Anda telah dikaitkan dengan entitas akun lain.');
                
                // Cek Username & WA
                const { data: existingUser } = await supabase.from('users').select('username').eq('username', body.username);
                if (existingUser && existingUser.length > 0) throw new Error('Username telah digunakan node lain.');
                const { data: existingWa } = await supabase.from('users').select('wa').eq('wa', body.wa);
                if (existingWa && existingWa.length > 0) throw new Error('Nomor kontak telah terdaftar dalam sistem.');

                const newUserData = { ...body, id_code: 'MSH-' + Math.floor(1000 + Math.random() * 9000), limit_count: 3, is_permanent: 'false', is_banned: 'false', role: 'Member', created_at: new Date().toISOString() };
                const { error } = await supabase.from('users').insert([newUserData]);
                if (error) throw new Error('Database Error: ' + error.message);
                return res.status(200).json({ status: true, data: newUserData });
            }
            case 'fetchUser': {
                const { data, error } = await supabase.from('users').select('*').eq('username', body.username).single();
                if (error || !data) throw new Error('User tidak ditemukan');
                return res.status(200).json({ status: true, data });
            }
            case 'fetchStats': {
                const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
                return res.status(200).json({ status: true, count });
            }
            case 'updateUser': {
                const { error } = await supabase.from('users').update(body.updates).eq('username', body.username);
                if (error) throw new Error(error.message);
                return res.status(200).json({ status: true });
            }
            case 'getUsers': {
                const { data, error } = await supabase.from('users').select('*');
                if (error) throw new Error(error.message);
                return res.status(200).json({ status: true, data });
            }
            case 'getBroadcast': {
                const { data, error } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(1);
                return res.status(200).json({ status: true, data: data ? data[0] : null });
            }
            case 'sendBroadcast': {
                const { error } = await supabase.from('broadcasts').insert([{ message: body.message, created_at: new Date().toISOString() }]);
                if (error) throw new Error(error.message);
                return res.status(200).json({ status: true });
            }

            // --- TAMBAHAN ENDPOINT QRIS RAMASHOP ---
            case 'createQris': {
                const response = await axios.post(`${RAMASHOP_BASE_URL}/deposit/create`, {
                    amount: body.amount,
                    method: "qris"
                }, {
                    headers: {
                        "X-API-Key": RAMASHOP_API_KEY,
                        "Content-Type": "application/json"
                    },
                    timeout: 20000
                });
                return res.status(200).json({ status: true, data: response.data });
            }
            case 'checkQris': {
                const response = await axios.get(`${RAMASHOP_BASE_URL}/deposit/status/${body.depositId}`, {
                    headers: {
                        "X-API-Key": RAMASHOP_API_KEY,
                        "Content-Type": "application/json"
                    },
                    timeout: 20000
                });
                return res.status(200).json({ status: true, data: response.data });
            }

            default:
                return res.status(400).json({ status: false, error: 'Aksi API tidak valid' });
        }
    } catch (error) {
        return res.status(200).json({ status: false, error: error.message });
    }
}
