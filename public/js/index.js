// public/js/index.js
import { showStep, setStatus, disableLangButtons, setLastReceived, $id } from './dom.js';
import { postSend, pingHealth, subscribeToEvents } from './network.js';

// elements
const startBtn = $id('start-btn');
const btnEn = $id('btn-en');
const btnAr = $id('btn-ar');
const step3Continue = $id('step3-continue');
const homeBtnId = 'home-btn'; // id used in DOM; home button may or may not exist

let selectedLang = null;
let step4Timer = null;
const STEP4_TIMEOUT_MS = 10000; // 10 seconds
let congratsPrefix = 'end='; // will be overwritten from /api/health if available

/* helper: get current active step number as string */
function getActiveStep() {
  const active = document.querySelector('.step.active');
  return active ? active.getAttribute('data-step') : null;
}

/* helper: attempt to parse "end=n" and return integer n or null */
function parseCongratsN(text, prefix) {
  if (!text || !prefix) return null;
  const t = text.toString().trim();
  if (!t.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  const after = t.slice(prefix.length).trim();
  const m = after.match(/^(-?\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (Number.isNaN(n)) return null;
  return n;
}

/* helper: set the Step 4 message dynamically based on language
   Updates both the H1 and the paragraph, and sets text direction for Arabic.
   This preserves the old working behaviour and only modifies the Home button
   text/dir if the element exists (no early returns that interfere). */
function setStep4Congratulations(n, lang = 'en') {
  const p = document.querySelector('#step4-message');
  const h1 = document.querySelector('#step-4 h1');
  if (!p || !h1) return; // still safe-guard: if the DOM doesn't match, abort

  if (lang === 'ar') {
    // Arabic
    h1.textContent = 'تهانينا!'; // Arabic for "Congratulations!"
    p.innerHTML = `لقد تعلمت ${n} كلمات في لغة الإشارة`;
    // set RTL direction so Arabic renders correctly
    h1.setAttribute('dir', 'rtl');
    p.setAttribute('dir', 'rtl');
    // optionally align right for Arabic
    h1.style.textAlign = 'right';
    p.style.textAlign = 'right';

    // If Home button exists, update its label to Arabic but don't change event listeners
    const homeBtn = document.querySelector('#home-btn');
    if (homeBtn) {
      homeBtn.textContent = 'الرئيسية';
      homeBtn.setAttribute('dir', 'rtl');
      homeBtn.style.textAlign = 'center';
    }
  } else {
    // English
    h1.textContent = 'Congratulations';
    p.innerHTML = `You have learned ${n} words in sign language`;
    // reset direction and alignment to LTR/default
    h1.removeAttribute('dir');
    p.removeAttribute('dir');
    h1.style.textAlign = '';
    p.style.textAlign = '';

    // If Home button exists, restore English label
    const homeBtn = document.querySelector('#home-btn');
    if (homeBtn) {
      homeBtn.textContent = 'Home';
      homeBtn.removeAttribute('dir');
      homeBtn.style.textAlign = '';
    }
  }
}

/* move to home (Step 1), clearing step4 timer and resetting selectedLang.
   Keep this minimal and safe so it doesn't interfere with normal flow. */
function goHome() {
  if (step4Timer) {
    clearTimeout(step4Timer);
    step4Timer = null;
  }

  // reset any session-local state
  selectedLang = null;

  // restore Home button text if present (do not touch event listeners)
  const homeBtn = document.querySelector('#home-btn');
  if (homeBtn) {
    homeBtn.textContent = 'Home';
    homeBtn.removeAttribute('dir');
    homeBtn.style.textAlign = '';
  }

  // show initial Step 1
  showStep(1);
}

/* show step 4 and start auto-return timer */
function enterStep4WithAutoReturn() {
  if (step4Timer) {
    clearTimeout(step4Timer);
    step4Timer = null;
  }

  showStep(4);

  step4Timer = setTimeout(() => {
    step4Timer = null;
    showStep(1);
    selectedLang = null;
  }, STEP4_TIMEOUT_MS);
}

async function init() {
  // query home button here (may be present in DOM)
  const homeBtn = $id(homeBtnId);

  // Step 1: Start
  if (startBtn) startBtn.addEventListener('click', () => {
    showStep(2);
  });

  // Step 2: language buttons
  if (btnEn) btnEn.addEventListener('click', () => langPressed('en'));
  if (btnAr) btnAr.addEventListener('click', () => langPressed('ar'));

  // Home button on Step 4: go back immediately
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      goHome();
    });
  }

  // Optionally wire continue button (disabled now)
  if (step3Continue) step3Continue.addEventListener('click', () => {
    // placeholder
  });

  // Load health/config from server (fetches congrats_string)
  const health = await pingHealth();
  if (!health) {
    setStatus('Offline');
  } else {
    if (health.congrats_string) congratsPrefix = health.congrats_string;
  }

  // Subscribe to SSE /events
  subscribeToEvents(
    (payload) => {
      // Display last received in console / debug area
      const short = payload.text && payload.text.length > 120 ? payload.text.slice(0, 120) + '…' : payload.text;
      setLastReceived(`${payload.timestamp} — ${payload.from.address}:${payload.from.port} → ${short} (${payload.bytes} bytes)`);

      // If payload text contains the congratsPrefix and client is on Step 3, extract n and advance
      try {
        const n = parseCongratsN(payload.text, congratsPrefix);
        if (n !== null) {
          const activeStep = getActiveStep();
          if (activeStep === '3') {
            // set Step 4 message then show Step 4 and start auto-return timer
            setStep4Congratulations(n, selectedLang || 'en');
            if (step3Continue) step3Continue.disabled = false;
            enterStep4WithAutoReturn();
          } else {
            console.log('Congrats trigger received but active step is not 3 — ignoring.');
          }
        }
      } catch (e) {
        console.warn('Error checking congrats trigger:', e);
      }
    },
    () => { /* connected */ },
    (err) => { console.warn('SSE error', err); }
  );
}

async function langPressed(lang) {
  selectedLang = lang;
  disableLangButtons(true);
  setStatus('Sending...');

  try {
    // send UDP via server
    const res = await postSend({ lang });
    const sentText = res.sent || (res.meta ? JSON.stringify(res.meta) : 'OK');
    setStatus(`Sent: ${sentText}`);
  } catch (err) {
    console.error('send error', err);
    setStatus('Error: ' + (err.message || 'send failed'));
  } finally {
    // Navigate to step 3 regardless (per spec)
    showStep(3, { lang: selectedLang });
    disableLangButtons(false);
    setTimeout(() => setStatus('Ready'), 1600);
  }
}

// start app
init();
