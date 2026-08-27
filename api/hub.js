            case 'login': {
                const { data, error } = await supabase.from('users').select('*').eq('username', body.username).single();
                if (error || !data || data.password !== body.password) throw new Error('Kredensial salah.');
                if (data.is_banned === 'true') throw new Error('Akun disuspend.');
                
                // Pastikan jika username atau role-nya Owner, berikan izin penuh
                if (body.username === "HAOMI" || data.role === "Owner") {
                    data.role = "Owner";
                    data.is_permanent = true;
                    data.limit_count = 9999;
                }
                
                return res.status(200).json({ status: true, data });
            }

Perbaikan Penanganan Tampilan Owner di Frontend (index.html)
Di bagian fungsi loadAppView pada index.html Anda, pastikan tombol panel admin owner ikut dibuka jika role-nya adalah Owner:
    window.loadAppView = function(user) {
        currentUserData = user;
        document.querySelectorAll('.disp-username').forEach(el => el.textContent = user.username);
        document.querySelectorAll('.disp-userid').forEach(el => el.textContent = user.id_code || 'MSH-01');
        document.querySelectorAll('.disp-userwa').forEach(el => el.textContent = user.wa || '-');
        
        const isVip = user.is_permanent === true || user.is_permanent === 'true' || user.role === 'Owner';
        const roleBadges = document.querySelectorAll('.disp-userrole');
        const ownerDashBtn = document.getElementById('toggleOwnerDashBtn');

        if (user.role === 'Owner') {
            roleBadges.forEach(rb => { rb.className = 'role-badge vip disp-userrole'; rb.textContent = 'OWNER'; rb.style.background = '#fff'; rb.style.color = '#000'; });
            if(ownerDashBtn) ownerDashBtn.classList.remove('hidden');
        } else if (isVip) {
            roleBadges.forEach(rb => { rb.className = 'role-badge vip disp-userrole'; rb.textContent = 'VIP PREMIUM'; });
            if(ownerDashBtn) ownerDashBtn.classList.add('hidden');
        } else {
            roleBadges.forEach(rb => { rb.className = 'role-badge disp-userrole'; rb.textContent = 'MEMBER'; });
            if(ownerDashBtn) ownerDashBtn.classList.add('hidden');
        }

        const limitBars = document.querySelectorAll('.disp-limit-bar');
        if (user.role === 'Owner' || isVip) {
            document.querySelectorAll('.disp-limit-label').forEach(el => el.textContent = "Status Lisensi");
            document.querySelectorAll('.disp-limit-value').forEach(el => { el.textContent = "UNLIMITED ∞"; el.style.color = "var(--accent-vip)"; });
            limitBars.forEach(bar => bar.classList.add('vip'));
        } else {
            const currentLimit = user.limit_count ?? 3;
            document.querySelectorAll('.disp-limit-label').forEach(el => el.textContent = "Batas API Tersisa");
            document.querySelectorAll('.disp-limit-value').forEach(el => { el.textContent = `${currentLimit} Kuota`; el.style.color = "var(--text-pure)"; });
            limitBars.forEach(bar => { bar.classList.remove('vip'); bar.style.width = Math.min(100, (currentLimit / 10) * 100) + "%"; });
        }
        switchView('appView');
    };

