import { Client, Databases, Query, ID } from 'node-appwrite';
import axios from 'axios';

// --- CONFIGURASI APPWRITE ---
const client = new Client()
    .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || '')
    .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || ''); // Gunakan Appwrite API Key (Server) di environment variables

const databases = new Databases(client);

// Ganti dengan ID Database dan Collection Anda di Appwrite
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID';
const USERS_COLLECTION = process.env.APPWRITE_USERS_COLLECTION_ID || 'users';
const FORUM_COLLECTION = process.env.APPWRITE_FORUM_COLLECTION_ID || 'forum_messages';
const BROADCASTS_COLLECTION = process.env.APPWRITE_BROADCASTS_COLLECTION_ID || 'broadcasts';

// --- CONFIGURASI HAOMI PAY (White-label SairiBot) ---
const HAOMI_BASE_URL = "https://api.sairibot.my.id/api";
const HAOMI_API_KEY = "SKY_39575737d3d744d8";

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

                const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                    Query.equal('username', username),
                    Query.limit(1)
                ]);

                if (userReq.documents.length === 0) {
                    return res.status(200).json({ status: false, error: 'Username tidak ditemukan.' });
                }

                const data = userReq.documents[0];

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

                const checkExist = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                    Query.equal('username', username),
                    Query.limit(1)
                ]);

                if (checkExist.documents.length > 0) {
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
                    is_permanent: false,
                    is_banned: false,
                    role: 'Member',
                    created_at: new Date().toISOString()
                };

                try {
                    const result = await databases.createDocument(DATABASE_ID, USERS_COLLECTION, ID.unique(), newUserData);
                    return res.status(200).json({ status: true, data: result });
                } catch (insertError) {
                    return res.status(200).json({ status: false, error: 'Gagal menyimpan ke database: ' + insertError.message });
                }
            }

            case 'fetchUser': {
                const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                    Query.equal('username', body.username),
                    Query.limit(1)
                ]);
                
                if (userReq.documents.length === 0) {
                    return res.status(200).json({ status: false, error: 'User tidak ditemukan' });
                }
                return res.status(200).json({ status: true, data: userReq.documents[0] });
            }

            case 'fetchStats': {
                const users = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                    Query.limit(1) // Hanya ambil metadata total
                ]);
                return res.status(200).json({ status: true, count: users.total || 0 });
            }

            case 'updateUser': {
                try {
                    const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                        Query.equal('username', body.username),
                        Query.limit(1)
                    ]);
                    
                    if (userReq.documents.length > 0) {
                        const docId = userReq.documents[0].$id;
                        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION, docId, body.updates);
                        return res.status(200).json({ status: true });
                    }
                    return res.status(200).json({ status: false, error: 'User tidak ditemukan' });
                } catch (error) {
                    return res.status(200).json({ status: false, error: error.message });
                }
            }

            case 'getUsers': {
                try {
                    const users = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION);
                    return res.status(200).json({ status: true, data: users.documents });
                } catch (error) {
                    return res.status(200).json({ status: false, error: error.message });
                }
            }

            case 'getBroadcast': {
                try {
                    const broadcasts = await databases.listDocuments(DATABASE_ID, BROADCASTS_COLLECTION, [
                        Query.orderDesc('created_at'),
                        Query.limit(1)
                    ]);
                    return res.status(200).json({ status: true, data: broadcasts.documents.length > 0 ? broadcasts.documents[0] : null });
                } catch (error) {
                    return res.status(200).json({ status: false, error: error.message });
                }
            }

            case 'sendBroadcast': {
                try {
                    await databases.createDocument(DATABASE_ID, BROADCASTS_COLLECTION, ID.unique(), { 
                        message: body.message, 
                        created_at: new Date().toISOString() 
                    });
                    return res.status(200).json({ status: true });
                } catch (error) {
                    return res.status(200).json({ status: false, error: error.message });
                }
            }

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

                try {
                    const data = await databases.createDocument(DATABASE_ID, FORUM_COLLECTION, ID.unique(), {
                        username,
                        role,
                        category,
                        message,
                        time,
                        avatar_url,
                        created_at: new Date().toISOString()
                    });
                    return res.status(200).json({ status: true, data });
                } catch (error) {
                    return res.status(200).json({ status: false, error: 'Appwrite Error: ' + error.message });
                }
            }

            case 'getMessages':
            case 'getFeedbacks': {
                try {
                    const messages = await databases.listDocuments(DATABASE_ID, FORUM_COLLECTION, [
                        Query.orderAsc('created_at'),
                        Query.limit(100)
                    ]);
                    return res.status(200).json({ status: true, data: messages.documents || [] });
                } catch (error) {
                    return res.status(200).json({ status: false, error: 'Appwrite Error: ' + error.message });
                }
            }

            case 'deleteMessage': {
                if (!body.id) {
                    return res.status(200).json({ status: false, error: 'ID pesan tidak ditemukan.' });
                }
                try {
                    await databases.deleteDocument(DATABASE_ID, FORUM_COLLECTION, body.id);
                    return res.status(200).json({ status: true });
                } catch (error) {
                    return res.status(200).json({ status: false, error: error.message });
                }
            }

            // ==========================================
            // --- ENDPOINT PAYMENT GATEWAY HAOMI PAY ---
            // ==========================================
            case 'createQris': {
                try {
                    const response = await axios.get(
                        `${HAOMI_BASE_URL}/invoice?apikey=${HAOMI_API_KEY}&amount=${body.amount}`,
                        { timeout: 9500 }
                    );
                    return res.status(200).json({ status: true, data: response.data });
                } catch (err) {
                    const detailError = err.response && err.response.data ? err.response.data : err.message;
                    console.error("HAOMI Create Error:", detailError);
                    return res.status(200).json({ 
                        status: false, 
                        error: 'HAOMI Pay Gagal: ' + (typeof detailError === 'object' ? JSON.stringify(detailError) : detailError) 
                    });
                }
            }

            case 'checkQris': {
                try {
                    const invoiceId = body.depositId;
                    const username = body.username;
                    const limitAmount = parseInt(body.limitAmount) || 0;

                    const response = await axios.get(
                        `${HAOMI_BASE_URL}/invoice/status?apikey=${HAOMI_API_KEY}&invoice_id=${invoiceId}`,
                        { timeout: 9500 }
                    );
                    
                    const statusData = response.data;
                    const isPaid = (statusData.status === "paid" || statusData.status === "success");

                    // PROTEKSI: Jika lunas, update otomatis di database via backend
                    if (isPaid && username && limitAmount > 0) {
                        const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                            Query.equal('username', username),
                            Query.limit(1)
                        ]);
                            
                        if (userReq.documents.length > 0) {
                            const user = userReq.documents[0];
                            const newLimit = (user.limit_count || 0) + limitAmount;
                            await databases.updateDocument(DATABASE_ID, USERS_COLLECTION, user.$id, { limit_count: newLimit });
                        }
                    }

                    return res.status(200).json({ status: true, data: statusData, isPaid: isPaid });
                } catch (err) {
                    const detailError = err.response && err.response.data ? err.response.data : err.message;
                    console.error("HAOMI Check Error:", detailError);
                    return res.status(200).json({ 
                        status: false, 
                        error: 'HAOMI Cek Gagal: ' + (typeof detailError === 'object' ? JSON.stringify(detailError) : detailError) 
                    });
                }
            }

            default:
                return res.status(400).json({ status: false, error: 'Aksi API tidak valid' });
        }
    } catch (err) {
        return res.status(200).json({ status: false, error: 'Server Exception: ' + err.message });
    }
}
