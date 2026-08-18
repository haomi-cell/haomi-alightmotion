// Accessibility enhancements: add ARIA attributes, ensure important IDs exist, and add a lightweight focus-trap for active modals
(function(){
  function setToastA11y(){
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    toast.setAttribute('aria-atomic','true');
  }

  function ensureAriaOnInputs(){
    const inputs = [
      'inputUsername','inputPassword','inputWa','inputCaptcha','inputEmail','inputLink',
      'inputBulkAmount','inputInboxEmail','imageUrl','fileInput','strengthRange','inputLink'
    ];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;
      if(!el.getAttribute('aria-label')){
        const placeholder = el.getAttribute('placeholder') || el.getAttribute('name') || id;
        el.setAttribute('aria-label', placeholder);
      }
    });
  }

  function ensureTogglePasswordIcon(){
    // find the eye icon (fontawesome) inside the auth modal area
    const auth = document.getElementById('authModal');
    if(!auth) return;
    let eye = document.getElementById('togglePasswordIcon');
    if(!eye){
      // try to find by class
      eye = auth.querySelector('.fa-eye, .fa-eye-slash');
      if(eye) {
        eye.id = 'togglePasswordIcon';
      }
    }
    if(eye){
      eye.setAttribute('role','button');
      eye.setAttribute('tabindex','0');
      eye.setAttribute('aria-label','Toggle password visibility');
      // make keyboard toggling work
      eye.addEventListener('keydown', (ev) => {
        if(ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); eye.click(); }
      });
    }
  }

  function ensureVerifySpinner(){
    const bot = document.getElementById('botVerifyModal');
    if(!bot) return;
    let spinner = document.getElementById('verifySpinner');
    if(!spinner){
      // insert a spinner element before the start button
      const btn = document.getElementById('btnStartVerify');
      spinner = document.createElement('div');
      spinner.id = 'verifySpinner';
      spinner.className = 'w-24 h-24 mx-auto rounded-full border-2 border-dashed border-cyan-400 flex items-center justify-center mb-5';
      spinner.innerHTML = '<i class="fa-solid fa-microchip text-4xl text-cyan-400"></i>';
      if(btn && btn.parentNode) btn.parentNode.insertBefore(spinner, btn);
    }
  }

  // add role/aria to modals and mark them for trapping
  function markModals(){
    const modalIds = ['legalModal','botVerifyModal','authModal','profileModal','modeModalOverlay','ownerDashboardModal'];
    modalIds.forEach(id => {
      const m = document.getElementById(id);
      if(!m) return;
      m.setAttribute('role','dialog');
      m.setAttribute('aria-modal','true');
      // keep modal hidden state in sync
      if(!m.dataset.trap) m.dataset.trap = 'true';
    });
  }

  // focus trap implementation for modals with data-trap="true"
  let activeTrap = null;
  function trapFocus(modal){
    if(!modal) return;
    const focusableSelector = 'a[href], area[href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(modal.querySelectorAll(focusableSelector)).filter(el => el.offsetParent !== null);
    if(focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();

    function handleKey(e){
      if(e.key === 'Tab'){
        if(e.shiftKey){
          if(document.activeElement === first){ e.preventDefault(); last.focus(); }
        } else {
          if(document.activeElement === last){ e.preventDefault(); first.focus(); }
        }
      }
      if(e.key === 'Escape'){
        // try graceful close: if modal has a close function name convention close<IdCamelCase>() call it
        const id = modal.id;
        const closeName = 'close' + id.charAt(0).toUpperCase() + id.slice(1);
        if(typeof window[closeName] === 'function'){
          try { window[closeName](); } catch(e){}
        } else {
          // fallback: remove active class to hide modal
          modal.classList.remove('active');
        }
      }
    }

    document.addEventListener('keydown', handleKey);
    activeTrap = { modal, handler: handleKey };
  }

  function releaseTrap(){
    if(activeTrap){
      document.removeEventListener('keydown', activeTrap.handler);
      activeTrap = null;
    }
  }

  // observe modal active state changes
  function observeModals(){
    const modals = Array.from(document.querySelectorAll('.modal-backdrop'));
    modals.forEach(m => {
      // ensure hidden state
      if(!m.classList.contains('active')) m.setAttribute('aria-hidden','true');
    });

    const observer = new MutationObserver(muts => {
      muts.forEach(m => {
        if(m.type === 'attributes' && m.attributeName === 'class'){
          const target = m.target;
          if(target.classList.contains('modal-backdrop') && target.dataset.trap === 'true'){
            if(target.classList.contains('active')){
              target.setAttribute('aria-hidden','false');
              // small timeout to ensure DOM focusable nodes are rendered
              setTimeout(() => trapFocus(target), 50);
            } else {
              target.setAttribute('aria-hidden','true');
              releaseTrap();
            }
          }
        }
      });
    });

    modals.forEach(m => observer.observe(m, { attributes: true, attributeFilter: ['class'] }));
  }

  function init(){
    setToastA11y();
    ensureAriaOnInputs();
    ensureTogglePasswordIcon();
    ensureVerifySpinner();
    markModals();
    observeModals();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
