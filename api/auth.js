/**
 * Modul Keamanan Lokal (Auth & Storage Security)
 * Tools xMSXiaomi AM - Client-Side Security Foundation
 */

const DB_KEY = 'mshaomi_db_users_v10';
const SESSION_KEY = 'mshaomi_active_session_v10';
const DEVICE_REG_KEY = 'mshaomi_device_reg_count_v10';
const SECRET_SALT = 'MSXIAOMI_SECURE_SALT_2026';

// 1. Enkripsi Sederhana & Checksum untuk Melindungi LocalStorage dari Tampering
function encodeData(data) {
    try {
        const jsonStr = JSON.stringify(data);
        // Menggunakan btoa dengan kombinasi salt sederhana untuk mengaburkan data di localStorage
        return btoa(encodeURIComponent(jsonStr + '::' + SECRET_SALT));
    } catch (e) {
        console.error('Gagal mengenkripsi data:', e);
        return null;
    }
}

function decodeData(encodedStr) {
    try {
        const decodedStr = decodeURIComponent(atob(encodedStr));
        const parts = decodedStr.split('::');
        if (parts.length < 2 || parts[1] !== SECRET_SALT) {
            throw new Error('Integritas data rusak atau dimanipulasi!');
        }
        return JSON.parse(parts[0]);
    } catch (e) {
        console.error('Peringatan: Data localStorage tidak sah atau telah diubah!', e);
        return null;
    }
}

// 2. Inisialisasi & Amankan Database Lokal
export function initDatabase() {
    let encryptedDb = localStorage.getItem(DB_KEY);
    if (!encryptedDb) {
        const initialDb = {
            'HAOMI': { 
                password: 'HAOMI_XML', 
                role: 'Owner', 
                name: 'HAOMI', 
                wa: '082231669053', 
                id: 'OWNER-01',
                editQuota: { username: 99, password: 99, wa: 99 },
                limit: 999,
                lastReset: Date.now(),
                isBanned: false,
                isPermanent: true
            }
        };
        localStorage.setItem(DB_KEY, encodeData(initialDb));
        return initialDb;
    }

    const dbData = decodeData(encryptedDb);
    if (!dbData) {
        // Jika data dirusak, reset aman atau clear untuk mencegah crash
        localStorage.removeItem(DB_KEY);
        return initDatabase();
    }
    return dbData;
}

export function saveToDatabase(dbData) {
    const encrypted = encodeData(dbData);
    if (encrypted) {
        localStorage.setItem(DB_KEY, encrypted);
    }
}

// 3. Validasi Nomor WhatsApp yang Ketat
export function isValidWhatsApp(number) {
    const cleanNum = number.replace(/[^0-9]/g, '');
    const phoneRegex = /^(08|628)\d{8,13}$/;
    if (!phoneRegex.test(cleanNum)) return false;

    // Mencegah deretan angka berurutan atau berulang
    const sequentialPattern = /(0123|1234|2345|3456|4567|5678|6789|7890|9876|8765|7654|6543|5432|4321)/;
    if (sequentialPattern.test(cleanNum)) return false;

    const repeatingPattern = /^(\d)\1{7,}$/;
    if (repeatingPattern.test(cleanNum.substring(2))) return false;

    return true;
}

// 4. Manajemen Sesi & Autentikasi Aman
export function getCurrentSessionUser() {
    const sessionUser = sessionStorage.getItem(SESSION_KEY);
    if (!sessionUser) return null;

    const db = initDatabase();
    if (!db[sessionUser] || db[sessionUser].isBanned) {
        logoutUser();
        return null;
    }
    return { username: sessionUser, data: db[sessionUser] };
}

export function loginUser(username, password) {
    const db = initDatabase();
    const user = db[username];

    if (!user || user.password !== password) {
        return { success: false, message: 'Username atau Kata Laluan salah.' };
    }

    if (user.isBanned) {
        return { success: false, message: 'Akaun anda telah disekat oleh Owner.' };
    }

    sessionStorage.setItem(SESSION_KEY, username);
    return { success: true, user };
}

export function registerUser(username, wa, password) {
    const db = initDatabase();
    
    if (db[username]) {
        return { success: false, message: 'Nama pengguna sudah digunakan.' };
    }

    if (!isValidWhatsApp(wa)) {
        return { success: false, message: 'Nombor WhatsApp tidak sah atau terdeteksi palsu.' };
    }

    if (password.length < 5) {
        return { success: false, message: 'Kata laluan minimal 5 aksara.' };
    }

    // Batasi pembuatan akun per perangkat (maksimal 2 akun)
    let deviceCount = parseInt(localStorage.getItem(DEVICE_REG_KEY) || '0');
    if (deviceCount >= 2) {
        return { success: false, message: 'Had maksimum pendaftaran pada peranti ini telah tercapai.' };
    }

    db[username] = {
        password: password,
        role: 'Member',
        wa: wa,
        id: 'MSH-' + Math.floor(10000 + Math.random() * 90000),
        editQuota: { username: 1, password: 1, wa: 1 },
        limit: 3,
        lastReset: Date.now(),
        isBanned: false,
        isPermanent: false
    };

    saveToDatabase(db);
    localStorage.setItem(DEVICE_REG_KEY, (deviceCount + 1).toString());
    sessionStorage.setItem(SESSION_KEY, username);

    return { success: true, user: db[username] };
}

export function logoutUser() {
    sessionStorage.removeItem(SESSION_KEY);
}

// 5. Proteksi Guard untuk Aksi Owner (Mencegah Eksekusi dari Console oleh Non-Owner)
export function verifyOwnerPrivilege() {
    const session = getCurrentSessionUser();
    if (!session || session.data.role !== 'Owner') {
        console.warn('Akses ditolak: Percobaan eksekusi fungsi administratif tanpa hak akses Owner.');
        return false;
    }
    return true;
}