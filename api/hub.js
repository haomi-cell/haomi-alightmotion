import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// --- CLASS GATEWAY NEVAPEDIA ---
// ==========================================
class NevapediaPay {
    constructor() {
        this.apiKey = 'SKY_45a18f8910ed4fb2';
        this.baseURL = 'https://app.nevapedia.com/api';
    }

    async _get(endpoint, params = {}) {
        params.apikey = this.apiKey;
        try {
            const response = await axios.get(`${this.baseURL}${endpoint}`, { params });
            return response.data;
        } catch (error) {
            if (error.response) return { error: true, detail: error.response.data };
            return { error: true, message: error.message };
        }
    }

    async cekSaldo() {
        return await this._get('/balance');
    }

    async buatInvoice(amount) {
        return await this._get('/invoice', { amount: amount });
    }

    async cekStatusInvoice(invoiceId) {
        return await this._get('/invoice/status', { invoice_id: invoiceId });
    }

    async metodeWithdraw() {
        return await this._get('/withdraw/methods');
    }

    async withdraw(amount, method, accountNumber, instant = false) {
        return await this._get('/withdraw', {
            amount: amount,
            method: method,
            account_number: accountNumber,
            instant: instant ? 'true' : 'false'
        });
    }

    async cekStatusWithdraw(withdrawId) {
        return await this._get('/withdraw/status', { id: withdrawId });
    }
}

const pembayaran = new NevapediaPay();

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

            // ==========================================
            // --- FITUR FORUM CHAT & SURAT DEVELOPER ---
            // ==========================================
            case 'sendMessage':
            case 'sendFeedback': {
                const username = body.username ? String(body.username).trim() : 'Anonim';
                const message = body.message ? String(body.message).trim() : '';
                const role = body.role || 'Member';
                const category = body.category || 'PUBLIC';
                const time = body.time || new Date().toLocaleString('id-ID');
                const avatar_url = body.avatar_url || '';

                if (!message) {
                    return res.status(200).json({ status: false, error: 'Pesan tidak boleh kosong.' });
                }

                const { data, error } = await supabase.from('forum_messages').insert([{
                    username, role, category, message, time, avatar_url, created_at: new Date().toISOString()
                }]).select();

                if (error) {
                    return res.status(200).json({ status: false, error: 'Supabase Error: ' + error.message });
                }

                return res.status(200).json({ status: true, data: data && data.length > 0 ? data[0] : null });
            }

            case 'getMessages':
            case 'getFeedbacks': {
                const { data, error } = await supabase.from('forum_messages').select('*').order('created_at', { ascending: true }).limit(100);
                if (error) {
                    return res.status(200).json({ status: false, error: 'Supabase Error: ' + error.message });
                }
                return res.status(200).json({ status: true, data: data || [] });
            }

            case 'deleteMessage': {
                if (!body.id) {
                    return res.status(200).json({ status: false, error: 'ID pesan tidak ditemukan.' });
                }
                const { error } = await supabase.from('forum_messages').delete().eq('id', body.id);
                if (error) return res.status(200).json({ status: false, error: error.message });
                return res.status(200).json({ status: true });
            }

            // ==========================================
            // --- ENDPOINT QRIS NEVAPEDIA ---
            // ==========================================
            case 'createQris': {
                if (!body.amount) {
                    return res.status(200).json({ status: false, error: 'Amount tidak valid' });
                }

                const invoiceData = await pembayaran.buatInvoice(body.amount);
                if (invoiceData.error) {
                    return res.status(200).json({ status: false, error: invoiceData.detail?.message || invoiceData.message || 'Gagal membuat invoice.' });
                }
                return res.status(200).json({ status: true, data: invoiceData });
            }

            case 'checkQris': {
                const targetId = body.invoiceId || body.depositId;
                if (!targetId) {
                    return res.status(200).json({ status: false, error: 'Invoice ID tidak ditemukan' });
                }

                const statusData = await pembayaran.cekStatusInvoice(targetId);
                if (statusData.error) {
                    return res.status(200).json({ status: false, error: statusData.detail?.message || statusData.message || 'Gagal mengecek status pembayaran.' });
                }
                return res.status(200).json({ status: true, data: statusData });
            }

            // ==========================================
            // --- ENDPOINT ALIGHT MOTION (AM) API ---
            // ==========================================
            case 'sendMagicLink': {
                if (!body.email) {
                    return res.status(200).json({ status: false, error: 'Email wajib diisi' });
                }
                
                try {
                    const response = await axios.get(`https://api.jerexd.my.id/api/am`, {
                        params: {
                            action: 'send',
                            apikey: 'jere_sTl9OLzPIyMn', // API Key diamankan di server
                            email: body.email
                        }
                    });
                    return res.status(200).json(response.data);
                } catch (error) {
                    return res.status(200).json({ status: false, error: 'Gagal menghubungi server AM (Jerexd).' });
                }
            }

            case 'verifMagicLink': {
                if (!body.email || !body.url) {
                    return res.status(200).json({ status: false, error: 'Email dan URL wajib diisi' });
                }
                
                try {
                    const response = await axios.get(`https://api.jerexd.my.id/api/am`, {
                        params: {
                            action: 'verif',
                            apikey: 'jere_sTl9OLzPIyMn', // API Key diamankan di server
                            email: body.email,
                            url: body.url
                        }
                    });
                    return res.status(200).json(response.data);
                } catch (error) {
                    return res.status(200).json({ status: false, error: 'Gagal memverifikasi lisensi.' });
                }
            }

            default:
                return res.status(400).json({ status: false, error: 'Aksi API tidak valid' });
        }
    } catch (err) {
        return res.status(200).json({ status: false, error: 'Server Exception: ' + err.message });
    }
}
