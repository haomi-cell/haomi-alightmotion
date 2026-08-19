// Konfigurasi upstream untuk AM Pro Toolkit
const UPSTREAM_CONFIG = {
    // Memasukkan Akses Key VIP yang benar sesuai permintaan Anda
    accessKey: "aks-1d3bd53f4d857a690a77471d",
    
    // Status IP yang sudah di-whitelist sebelumnya (162.120.184.229)
    ipWhitelisted: true,
    
    // Endpoint utama untuk bulk generator
    endpoint: "https://api.am-pro-toolkit.com/v1/bulk-generate",

    // Fungsi untuk memvalidasi konfigurasi sebelum request dijalankan
    validateConfig() {
        if (!this.accessKey || !this.accessKey.startsWith("aks-")) {
            console.error("Format Akses Key tidak valid. Harus diawali dengan 'aks-'.");
            return false;
        }
        return true;
    },

    // Fungsi utama untuk melakukan eksekusi request bulk generator
    async executeBulkGenerate(payload) {
        if (!this.validateConfig()) {
            throw new Error("Konfigurasi Akses Key salah.");
        }

        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Access-Key": this.accessKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Gagal terhubung ke server: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Kesalahan saat eksekusi:", error.message);
            throw error;
        }
    }
};

// Ekspor konfigurasi untuk digunakan modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UPSTREAM_CONFIG;
}