const { Client, Databases, Query, ID } = require('node-appwrite');
const axios = require('axios');

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

exports.handler = async (event, context) => {
    // 1. Setup Headers untuk CORS di Netlify
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // Tangani preflight request (CORS)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Helper function agar return data mirip dengan format Vercel (res.status.json)
    const sendRes = (statusCode, data) => {
        return { statusCode, headers, body: JSON.stringify(data) };
    };

    // 2. Ambil parameter action dari URL (Netlify style)
    const action = event.queryStringParameters ? event.queryStringParameters.action : null;
    let body = {};
    
    // 3. Parsing body (Netlify menerima body sebagai string, harus di-parse manual)
    try {
        body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
        body = {};
    }

    try {
        if (!action) {
            return sendRes(400, { status: false, error: 'Aksi tidak ditentukan' });
        }

        switch (action) {
            case 'login': {
                const username = body.username ? String(body.username).trim() : '';
                const password = body.password ? String(body.password).trim() : '';

                if (!username || !password) {
                    return sendRes(200, { status: false, error: 'Username dan kata sandi wajib diisi.' });
                }

                const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                    Query.equal('username', username),
                    Query.limit(1)
                ]);

                if (userReq.documents.length === 0) {
                    return sendRes(200, { status: false, error: 'Username tidak ditemukan.' });
                }

                const data = userReq.documents[0];

                if (String(data.password).trim() !== password) {
                    return sendRes(200, { status: false, error: 'Kata sandi salah.' });
                }

                if (String(data.is_banned) === 'true') {
                    return sendRes(200, { status: false, error: 'Akun ini telah ditangguhkan.' });
                }

                if (username.toUpperCase() === 'HAOMI' || data.role === 'Owner') {
                    data.role = 'Owner';
                    data.is_permanent = true;
                    data.limit_count = 9999;
                }

                return sendRes(200, { status: true, data });
            }

            case 'register': {
                const username = body.username ? String(body.username).trim() : '';
                const password = body.password ? String(body.password).trim() : '';
                const wa = body.wa ? String(body.wa).trim() : '';

                if (!username || !password || !wa) return sendRes(200, { status: false, error: 'Semua kolom registrasi wajib diisi.' });

                const checkExist = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                    Query.equal('username', username), Query.limit(1)
                ]);

                if (checkExist.documents.length > 0) return sendRes(200, { status: false, error: 'Username sudah digunakan.' });

                const newUserData = {
                    username, password, wa,
                    ip_address: body.ip_address || '127.0.0.1',
                    device_id: body.device_id || 'WEB-CLIENT',
                    id_code: 'MSH-' + Math.floor(1000 + Math.random() * 9000),
                    limit_count: 3, is_permanent: false, is_banned: false,
                    role: 'Member', created_at: new Date().toISOString()
                };

                try {
                    const result = await databases.createDocument(DATABASE_ID, USERS_COLLECTION, ID.unique(), newUserData);
                    return sendRes(200, { status: true, data: result });
                } catch (insertError) {
                    return sendRes(200, { status: false, error: 'Gagal menyimpan ke database: ' + insertError.message });
                }
            }

            case 'fetchUser': {
                const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                    Query.equal('username', body.username), Query.limit(1)
                ]);
                if (userReq.documents.length === 0) return sendRes(200, { status: false, error: 'User tidak ditemukan' });
                return sendRes(200, { status: true, data: userReq.documents[0] });
            }

            case 'fetchStats': {
                const users = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [ Query.limit(1) ]);
                return sendRes(200, { status: true, count: users.total || 0 });
            }

            case 'updateUser': {
                try {
                    const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                        Query.equal('username', body.username), Query.limit(1)
                    ]);
                    if (userReq.documents.length > 0) {
                        const docId = userReq.documents[0].$id;
                        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION, docId, body.updates);
                        return sendRes(200, { status: true });
                    }
                    return sendRes(200, { status: false, error: 'User tidak ditemukan' });
                } catch (error) { return sendRes(200, { status: false, error: error.message }); }
            }

            case 'getUsers': {
                try {
                    const users = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION);
                    return sendRes(200, { status: true, data: users.documents });
                } catch (error) { return sendRes(200, { status: false, error: error.message }); }
            }

            case 'getBroadcast': {
                try {
                    const broadcasts = await databases.listDocuments(DATABASE_ID, BROADCASTS_COLLECTION, [
                        Query.orderDesc('created_at'), Query.limit(1)
                    ]);
                    return sendRes(200, { status: true, data: broadcasts.documents.length > 0 ? broadcasts.documents[0] : null });
                } catch (error) { return sendRes(200, { status: false, error: error.message }); }
            }

            case 'sendBroadcast': {
                try {
                    await databases.createDocument(DATABASE_ID, BROADCASTS_COLLECTION, ID.unique(), { 
                        message: body.message, created_at: new Date().toISOString() 
                    });
                    return sendRes(200, { status: true });
                } catch (error) { return sendRes(200, { status: false, error: error.message }); }
            }

            case 'sendMessage':
            case 'sendFeedback': {
                const username = body.username ? String(body.username).trim() : 'Anonim';
                const message = body.message ? String(body.message).trim() : '';
                if (!message) return sendRes(200, { status: false, error: 'Pesan tidak boleh kosong.' });

                try {
                    const data = await databases.createDocument(DATABASE_ID, FORUM_COLLECTION, ID.unique(), {
                        username, role: body.role || 'Member', category: body.category || 'PUBLIC',
                        message, time: body.time || new Date().toLocaleString('id-ID'),
                        avatar_url: body.avatar_url || '', created_at: new Date().toISOString()
                    });
                    return sendRes(200, { status: true, data });
                } catch (error) { return sendRes(200, { status: false, error: 'Appwrite Error: ' + error.message }); }
            }

            case 'getMessages':
            case 'getFeedbacks': {
                try {
                    const messages = await databases.listDocuments(DATABASE_ID, FORUM_COLLECTION, [
                        Query.orderAsc('created_at'), Query.limit(100)
                    ]);
                    return sendRes(200, { status: true, data: messages.documents || [] });
                } catch (error) { return sendRes(200, { status: false, error: 'Appwrite Error: ' + error.message }); }
            }

            case 'deleteMessage': {
                if (!body.id) return sendRes(200, { status: false, error: 'ID pesan tidak ditemukan.' });
                try {
                    await databases.deleteDocument(DATABASE_ID, FORUM_COLLECTION, body.id);
                    return sendRes(200, { status: true });
                } catch (error) { return sendRes(200, { status: false, error: error.message }); }
            }

            case 'createQris': {
                try {
                    const response = await axios.get(`${HAOMI_BASE_URL}/invoice?apikey=${HAOMI_API_KEY}&amount=${body.amount}`, { timeout: 9500 });
                    return sendRes(200, { status: true, data: response.data });
                } catch (err) {
                    const detailError = err.response && err.response.data ? err.response.data : err.message;
                    return sendRes(200, { status: false, error: 'HAOMI Pay Gagal: ' + (typeof detailError === 'object' ? JSON.stringify(detailError) : detailError) });
                }
            }

            case 'checkQris': {
                try {
                    const response = await axios.get(`${HAOMI_BASE_URL}/invoice/status?apikey=${HAOMI_API_KEY}&invoice_id=${body.depositId}`, { timeout: 9500 });
                    const isPaid = (response.data.status === "paid" || response.data.status === "success");

                    if (isPaid && body.username && parseInt(body.limitAmount) > 0) {
                        const userReq = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION, [
                            Query.equal('username', body.username), Query.limit(1)
                        ]);
                        if (userReq.documents.length > 0) {
                            const user = userReq.documents[0];
                            await databases.updateDocument(DATABASE_ID, USERS_COLLECTION, user.$id, { limit_count: (user.limit_count || 0) + parseInt(body.limitAmount) });
                        }
                    }
                    return sendRes(200, { status: true, data: response.data, isPaid: isPaid });
                } catch (err) {
                    const detailError = err.response && err.response.data ? err.response.data : err.message;
                    return sendRes(200, { status: false, error: 'HAOMI Cek Gagal: ' + (typeof detailError === 'object' ? JSON.stringify(detailError) : detailError) });
                }
            }

            default:
                return sendRes(400, { status: false, error: 'Aksi API tidak valid' });
        }
    } catch (err) {
        return sendRes(200, { status: false, error: 'Server Exception: ' + err.message });
    }
};
