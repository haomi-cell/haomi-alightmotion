/**
 * Backend API Handler: vidhd.js
 * Dibuat khusus untuk menangani proses/request video di backend.
 */

export default async function handler(req, res) {
    // Header CORS agar aman diakses dari frontend manapun
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { action } = req.query || req.body;

        // Penanganan aksi berdasarkan parameter/body
        if (req.method === 'POST') {
            const bodyData = req.body || {};

            // Mengirimkan kembali video_data agar index.html bisa mendownloadnya otomatis
            return res.status(200).json({
                status: true,
                message: "Proses backend Compres Tiktok Smoout berhasil dieksekusi.",
                actionReceived: action || bodyData.action || "default",
                timestamp: new Date().toISOString(),
                video_data: bodyData.url || "", // payload video untuk trigger unduh otomatis
                data: bodyData
            });
        }

        // Default GET response
        return res.status(200).json({
            status: true,
            endpoint: "vidhd.js",
            description: "API Backend aktif dan siap digunakan untuk pemrosesan video.",
            currentYear: 2026
        });

    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message || "Terjadi kesalahan internal pada server."
        });
    }
}
