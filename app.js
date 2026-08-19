/**
 * Main App Functions - Connected to API Endpoints
 */

// ============================================
// TAB 1: AKTIVASI (Send Magic Link)
// ============================================

async function handleSendMagicLink() {
  const email = document.getElementById('inputEmail')?.value?.trim();
  const resultDiv = document.getElementById('sendResult');

  if (!email) {
    showToast('Masukkan email terlebih dahulu!', 'error');
    return;
  }

  try {
    resultDiv.classList.add('hidden');
    const response = await window.API.sendMagicLink(email);

    if (response.status) {
      showToast('Magic link berhasil dikirim!', 'success');
      document.getElementById('stepEmailBox').classList.add('hidden');
      document.getElementById('stepVerifyBox').classList.remove('hidden');
      resultDiv.innerHTML = `<span class="text-emerald-400">✓ Silakan check email Anda dan paste magic link di bawah</span>`;
      resultDiv.classList.remove('hidden');
    } else {
      showToast(response.message || 'Gagal mengirim magic link', 'error');
      resultDiv.innerHTML = `<span class="text-red-400">✗ ${response.message}</span>`;
      resultDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Send Magic Link Error:', error);
    showToast(error.message || 'Terjadi kesalahan', 'error');
    resultDiv.innerHTML = `<span class="text-red-400">✗ Error: ${error.message}</span>`;
    resultDiv.classList.remove('hidden');
  }
}

async function handleVerifyMagicLink() {
  const email = document.getElementById('inputEmail')?.value?.trim();
  const link = document.getElementById('inputLink')?.value?.trim();
  const resultDiv = document.getElementById('sendResult');

  if (!email || !link) {
    showToast('Masukkan email dan magic link!', 'error');
    return;
  }

  try {
    resultDiv.classList.add('hidden');
    const response = await window.API.verifyMagicLink(email, link);

    if (response.status) {
      showToast('Verifikasi berhasil! Akun premium aktif.', 'success');
      resultDiv.innerHTML = `<span class="text-emerald-400">✓ Selamat! Akun Anda sudah premium.</span>`;
      resultDiv.classList.remove('hidden');
      setTimeout(() => resetInjectFlow(), 2000);
    } else {
      showToast(response.message || 'Verifikasi gagal', 'error');
      resultDiv.innerHTML = `<span class="text-red-400">✗ ${response.message}</span>`;
      resultDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Verify Magic Link Error:', error);
    showToast(error.message || 'Terjadi kesalahan', 'error');
    resultDiv.innerHTML = `<span class="text-red-400">✗ Error: ${error.message}</span>`;
    resultDiv.classList.remove('hidden');
  }
}

function resetInjectFlow() {
  document.getElementById('stepEmailBox').classList.remove('hidden');
  document.getElementById('stepVerifyBox').classList.add('hidden');
  document.getElementById('sendResult').classList.add('hidden');
  document.getElementById('inputEmail').value = '';
  document.getElementById('inputLink').value = '';
}

// ============================================
// TAB 2: BULK
// ============================================

async function runBulkInject() {
  const amount = parseInt(document.getElementById('inputBulkAmount')?.value) || 50;
  const resultDiv = document.getElementById('bulkResult');

  if (amount < 1 || amount > 100) {
    showToast('Jumlah harus 1-100!', 'error');
    return;
  }

  try {
    resultDiv.classList.add('hidden');
    resultDiv.innerHTML = '<span class="text-blue-400">⏳ Memproses...</span>';
    resultDiv.classList.remove('hidden');

    const response = await window.API.bulk(amount);

    if (response.status) {
      showToast(`${amount} akun berhasil dibuat!`, 'success');
      resultDiv.innerHTML = `<pre class="text-emerald-400">✓ Batch Success\n\n${JSON.stringify(response.data, null, 2)}</pre>`;
    } else {
      showToast(response.message || 'Bulk gagal', 'error');
      resultDiv.innerHTML = `<pre class="text-red-400">✗ Error\n${response.message}</pre>`;
    }
    resultDiv.classList.remove('hidden');
  } catch (error) {
    console.error('Bulk Error:', error);
    showToast(error.message || 'Terjadi kesalahan', 'error');
    resultDiv.innerHTML = `<pre class="text-red-400">✗ Error: ${error.message}</pre>`;
    resultDiv.classList.remove('hidden');
  }
}

// ============================================
// TAB 3: INBOX
// ============================================

async function runInboxCheck() {
  const email = document.getElementById('inputInboxEmail')?.value?.trim();
  const resultDiv = document.getElementById('inboxResult');
  const noticeDiv = document.getElementById('inboxNotice');

  if (!email) {
    showToast('Masukkan email terlebih dahulu!', 'error');
    return;
  }

  try {
    resultDiv.innerHTML = '';
    noticeDiv.classList.add('hidden');
    const response = await window.API.inbox(email);

    if (response.status) {
      showToast('Inbox berhasil dipindai!', 'success');
      
      if (response.data.count > 0) {
        response.data.messages.forEach((msg, idx) => {
          const msgEl = document.createElement('div');
          msgEl.className = 'pro-card p-3 text-[10px] space-y-2 border border-purple-500/30';
          msgEl.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="font-bold text-purple-400">📧 Pesan #${idx + 1}</span>
              <span class="text-[9px] text-slate-400">${msg.received || 'N/A'}</span>
            </div>
            <div class="border-t border-white/10 pt-2">
              <div><strong>Dari:</strong> ${msg.from || 'N/A'}</div>
              <div><strong>Subject:</strong> ${msg.subject || 'N/A'}</div>
              ${msg.login_url ? `<div class="text-[9px] bg-black/40 p-2 rounded mt-1 break-all text-cyan-400"><strong>Link:</strong> ${msg.login_url}</div>` : ''}
            </div>
          `;
          resultDiv.appendChild(msgEl);
        });
      } else {
        noticeDiv.innerHTML = '❌ Tidak ada pesan di inbox email ini';
        noticeDiv.classList.remove('hidden');
      }
    } else {
      showToast(response.message || 'Inbox scan gagal', 'error');
      noticeDiv.innerHTML = `❌ Error: ${response.message}`;
      noticeDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Inbox Error:', error);
    showToast(error.message || 'Terjadi kesalahan', 'error');
    noticeDiv.innerHTML = `❌ Error: ${error.message}`;
    noticeDiv.classList.remove('hidden');
  }
}

// ============================================
// TOKEN & ADMIN FUNCTIONS
// ============================================

async function verifyTokenAccess() {
  const token = document.getElementById('inputTokenAccess')?.value?.trim();
  
  if (!token) {
    showToast('Masukkan token terlebih dahulu!', 'error');
    return;
  }

  try {
    const response = await window.API.checkToken(token);
    
    if (response.status) {
      showToast('Token valid! Akses diberikan.', 'success');
      localStorage.setItem('activeToken', token);
      document.getElementById('tokenModal').classList.add('hidden');
      showMainApp();
    } else {
      showToast(response.message || 'Token tidak valid', 'error');
    }
  } catch (error) {
    console.error('Token Verification Error:', error);
    showToast(error.message || 'Terjadi kesalahan', 'error');
  }
}

async function claimFreeTrialToken() {
  try {
    showToast('Menghasilkan token trial...', 'info');
    const response = await window.API.generateToken('5_MIN');
    
    if (response.status) {
      const token = response.data.token;
      document.getElementById('inputTokenAccess').value = token;
      showToast('Token trial berhasil! Auto-login dalam 3 detik...', 'success');
      setTimeout(() => verifyTokenAccess(), 3000);
    } else {
      showToast(response.message || 'Gagal membuat token', 'error');
    }
  } catch (error) {
    console.error('Free Trial Error:', error);
    showToast(error.message || 'Terjadi kesalahan', 'error');
  }
}

async function generateOwnerToken() {
  const duration = document.getElementById('newGenDays')?.value;
  const resultDiv = document.getElementById('ownerTokenResult');

  try {
    resultDiv.classList.add('hidden');
    const response = await window.API.generateToken(duration);

    if (response.status) {
      const token = response.data.token;
      document.getElementById('ownerTokenText').innerHTML = `
        <div class="text-[10px] mb-2">Token Generated:</div>
        <div class="bg-black/50 p-2 rounded font-mono text-[11px] break-all text-cyan-400">${token}</div>
        <div class="text-[9px] mt-2 text-slate-400">Expires: ${response.data.expires || 'N/A'}</div>
      `;
      resultDiv.classList.remove('hidden');
      showToast('Token berhasil dibuat!', 'success');
    } else {
      showToast(response.message || 'Gagal membuat token', 'error');
    }
  } catch (error) {
    console.error('Generate Token Error:', error);
    showToast(error.message || 'Terjadi kesalahan', 'error');
  }
}

function copyGeneratedToken() {
  const tokenText = document.getElementById('ownerTokenText')?.innerText;
  if (tokenText) {
    navigator.clipboard.writeText(tokenText);
    showToast('Token copied!', 'success');
  }
}

async function logoutToken() {
  const token = localStorage.getItem('activeToken');
  
  try {
    if (token) {
      await window.API.logout(token);
    }
    localStorage.removeItem('activeToken');
    document.getElementById('profileModal').classList.add('hidden');
    document.getElementById('tokenModal').classList.remove('hidden');
    showToast('Logout berhasil', 'success');
  } catch (error) {
    console.error('Logout Error:', error);
    localStorage.removeItem('activeToken');
  }
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

function switchTab(tab) {
  document.querySelectorAll('[id^="tab"]').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('[id^="content"]').forEach(c => c.classList.add('hidden'));
  
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.add('active');
  document.getElementById(`content${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.remove('hidden');
}

function switchAdminTab(tab) {
  document.querySelectorAll('[id^="tabAdmin"]').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('[id^="adminContent"]').forEach(c => c.classList.add('hidden'));
  
  const tabEl = document.getElementById(`tabAdmin${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  const contentEl = document.getElementById(`adminContent${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  
  if (tabEl) tabEl.classList.add('active');
  if (contentEl) contentEl.classList.remove('hidden');
}

function openProfileModal() {
  const token = localStorage.getItem('activeToken');
  if (token) {
    document.getElementById('profileActiveToken').innerText = token.substring(0, 20) + '...';
  }
  document.getElementById('profileModal').classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('profileModal').classList.add('hidden');
}

function openOwnerDashboardModal() {
  document.getElementById('ownerDashboardModal').classList.remove('hidden');
}

function closeOwnerDashboard() {
  document.getElementById('ownerDashboardModal').classList.add('hidden');
}

function toggleTokenPackages() {
  const section = document.getElementById('tokenPackagesSection');
  section.classList.toggle('hidden');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-pro show fixed bottom-5 left-1/2 px-4 py-3 rounded-lg text-[12px] font-mono z-50`;
  
  const colors = {
    success: 'bg-emerald-600/80 text-emerald-100 border-emerald-500',
    error: 'bg-red-600/80 text-red-100 border-red-500',
    info: 'bg-blue-600/80 text-blue-100 border-blue-500'
  };
  
  toast.className += ' ' + (colors[type] || colors.info);
  toast.innerHTML = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

function showMainApp() {
  document.getElementById('tokenModal').classList.add('hidden');
  // App sudah terlihat
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if already authenticated
  const token = localStorage.getItem('activeToken');
  
  if (token) {
    // Try to verify token
    window.API.checkToken(token).then(response => {
      if (!response.status) {
        localStorage.removeItem('activeToken');
        document.getElementById('tokenModal').classList.remove('hidden');
      }
    }).catch(() => {
      document.getElementById('tokenModal').classList.remove('hidden');
    });
  } else {
    document.getElementById('tokenModal').classList.remove('hidden');
  }
});
