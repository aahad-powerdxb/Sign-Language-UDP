// public/js/dom.js
export const ids = {
  startBtn: 'start-btn',
  btnEn: 'btn-en',
  btnAr: 'btn-ar',
  step3Message: 'step3-message',
  homeBtn: 'home-btn',
};

export function $id(id) { return document.getElementById(id); }

export function setStatus(txt) {
  // const el = $id(ids.status);
  // if (el) el.textContent = txt;

  console.log("Status: ", txt);
}

export function disableLangButtons(state) {
  const en = $id(ids.btnEn);
  const ar = $id(ids.btnAr);
  if (en) en.disabled = state;
  if (ar) ar.disabled = state;
}

export function setLastReceived(txt) {
  // const el = $id(ids.lastReceivedText);
  // if (el) el.textContent = txt;

  console.log("Last Received: ", txt);
}

const bodyEl = document.body; // Reference the body element once

/**
 * showStep(n, opts)
 *  n: integer 1..4
 *  opts: { lang: 'en'|'ar' } optional, allows step-specific updates (e.g. for step 3)
 */
export function showStep(n, opts = {}) {
  const all = document.querySelectorAll('[data-step]');
  all.forEach((el) => {
    const step = Number(el.getAttribute('data-step'));
    if (step === n) {
      el.classList.add('active');
      el.setAttribute('aria-hidden', 'false');
    } else {
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
    }
  });

    // --- Background Image Change Logic (Class Toggling) ---
  if (bodyEl) {
    // If n is NOT 1 (i.e., step 2, 3, or 4), add the 'active-app' class.
    // If n IS 1, remove the 'active-app' class.
    bodyEl.classList.toggle('active-app', n !== 1);
  }
  // -----------------------------------------------------

  // If showing step 3 and language provided, update message text
  if (n === 3 && opts.lang) {
    const msgEl = $id(ids.step3Message);
    if (msgEl) {
      if (opts.lang === 'ar') {
        // Arabic translation
        msgEl.textContent = 'ﺣﺎول ﻣﻄﺎﺑﻘﺔ ﺣﺮﻛﺎت اﻟﺸﺨﺼﻴﺔ';
      } else {
        msgEl.textContent = 'Try to follow the avatar';
      }
    }
  }
}
