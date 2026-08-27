            case 'login': {
                const { data, error } = await supabase.from('users').select('*').eq('username', body.username).single();
                if (error || !data) throw new Error('Username tidak ditemukan.');
                if (String(data.password).trim() !== String(body.password).trim()) throw new Error('Kata sandi salah.');
                if (String(data.is_banned) === 'true') throw new Error('Akun disuspend.');
                
                // Pengecekan otomatis status Owner
                if (body.username.toUpperCase() === "HAOMI" || String(data.role).toLowerCase() === "owner") {
                    data.role = "Owner";
                    data.is_permanent = true;
                    data.limit_count = 9999;
                }
                
                return res.status(200).json({ status: true, data });
            }

