import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const RAMASHOP_BASE_URL = "https://ramashop.my.id/api/public";
const RAMASHOP_API_KEY = "rg_ea029ad8b5262570682db8bbc92a43";

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

    try {
        if (!action) {
            return res.status(400).json({ status: false, error: 'Aksi tidak ditentukan' });
        }

        switch (action) {
            case 'login': {
                const username = body.username ? String(body.username).trim() : '';
                const password = body.password ? String(body.password).trim() : '';

                if (!username || !password) {
                    return res.status(200).json({ status: false, error: 'Username dan kata sandi wajib diisi.' });
                }

                const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
                if (error || !data) {
                    return res.status(200).json({ status: false, error: 'Username tidak ditemukan.' });
                }

                if (String(data.password).trim() !== password) {
                    return res.status(200).json({ status: false, error: 'Kata sandi salah.' });
                }

                if (String(data.is_banned) === 'true') {
                    return res.status(200).json({ status: false, error: 'Akun ini telah ditangguhkan.' });
                }

                // Proteksi khusus Owner
                if (username.toUpperCase() === 'HAOMI' || data.role === 'Owner') {
                    data.role = 'Owner';
                    data.is_permanent = true;
                    data.limit_count = 9999;
                }

                return res.status(200).json({ status: true, data });
            }

            case 'register': {
                const username = body.username ? String(body.username).trim() : '';
                const password = body.password ? String(body.password).trim() : '';
                const wa = body.wa ? String(body.wa).trim() : '';

                if (!username || !password || !wa) {
                    return res.status(200).json({ status: false, error: 'Semua kolom registrasi wajib diisi.' });
                }

                // Cek duplikasi username
                const { data: existingUser } = await supabase.from('users').select('username').eq('username', username);
                if (existingUser && existingUser.length > 0) {
                    return res.status(200).json({ status: false, error: 'Username sudah digunakan.' });
                }

                const newUserData = {
                    username,
                    password,
                    wa,
                    ip_address: body.ip_address || '127.0.0.1',
                    device_id: body.device_id || 'WEB-CLIENT',
                    id_code: 'MSH-' + Math.floor(1000 + Math.random() * 9000),
                    limit_count: 3,
                    is_permanent: 'false',
                    is_banned: 'false',
                    role: 'Member',
                    created_at: new Date().toISOString()
                };

                const { error: insertError } = await supabase.from('users').insert([newUserData]);
                if (insertError) {
                    return res.status(200).json({ status: false, error: 'Gagal menyimpan ke database: ' + insertError.message });
                }

                return res.status(200).json({ status: true, data: newUserData });
            }

            case 'fetchUser': {
                const { data, error } = await supabase.from('users').select('*').eq('username', body.username).single();
                if (error || !data) return res.status(200).json({ status: false, error: 'User tidak ditemukan' });
                return res.status(200).json({ status: true, data });
            }

            case 'fetchStats': {
                const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
                return res.status(200).json({ status: true, count: count || 0 });
            }

            case 'updateUser': {
                const { error } = await supabase.from('users').update(body.updates).eq('username', body.username);
                if (error) return res.status(200).json({ status: false, error: error.message });
                return res.status(200).json({ status: true });
            }

            case 'getUsers': {
                const { data, error } = await supabase.from('users').select('*');
                if (error) return res.status(200).json({ status: false, error: error.message });
                return res.status(200).json({ status: true, data });
            }

            case 'getBroadcast': {
                const { data } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(1);
                return res.status(200).json({ status: true, data: data && data.length > 0 ? data[0] : null });
            }

            case 'sendBroadcast': {
                const { error } = await supabase.from('broadcasts').insert([{ message: body.message, created_at: new Date().toISOString() }]);
                if (error) return res.status(200).json({ status: false, error: error.message });
                return res.status(200).json({ status: true });
            }

            // --- ENDPOINT QRIS RAMASHOP ---
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
    } catch (err) {
        return res.status(200).json({ status: false, error: 'Server Exception: ' + err.message });
    }
}