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

/* helper: map single western digit 0-9 to Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)
   If n is a single digit 0..9 it returns the mapped char, otherwise returns null. */
function mapSingleDigitToArabicIndic(n) {
  const map = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  if (typeof n !== 'number') return null;
  if (!Number.isInteger(n)) return null;
  if (n >= 0 && n <= 9) return map[n];
  return null;
}

/* helper: set the Step 4 message dynamically based on language
   Shows a different H1 when n === 0 ("Better luck next time!") and the Arabic equivalent.
   Also adjusts dir/textAlign for Arabic and updates Home button label if present.
*/
function setStep4Congratulations(n, lang = 'en') {
  // Select the new bilingual containers
  const msgContainer = document.querySelector('#step4-message');
  const h1Container = document.querySelector('#step4-heading');
  const homeBtn = document.querySelector('#home-btn');

  if (!msgContainer || !h1Container) return;

  // Spans for the message text
  const pAr = msgContainer.querySelector('.message-ar');
  const pEn = msgContainer.querySelector('.message-en');
  // Spans for the heading text
  const h1Ar = h1Container.querySelector('.heading-ar');
  const h1En = h1Container.querySelector('.heading-en');

  if (!pAr || !pEn || !h1Ar || !h1En) return;

  // Decide content based on n === 0 vs n > 0
  const isZero = Number(n) === 0;

  // --- ARABIC Content ---
  if (isZero) {
    h1Ar.textContent = 'حظًا أوفر في المرة القادمة!'; // "Better luck next time!"
    pAr.innerHTML = 'لم تتعلّم أي كلمات هذه المرة.';   // "You didn\'t learn any words this time."
  } else {
    h1Ar.textContent = 'تهانينا!'; // "Congratulations!"

    // Try to map single digit 0-9 to Arabic-Indic.
    const mapped = mapSingleDigitToArabicIndic(n);
    if (mapped !== null) {
      // Example Arabic sentence: "لقد تعلمت ٥ كلمات في لغة الإشارة"
      pAr.innerHTML = `لقد تعلمت ${mapped} كلمات في لغة الإشارة`;
    } else {
      // No mapping (multi-digit or out-of-range): show the number as-is
      pAr.innerHTML = `لقد تعلمت ${n} كلمات في لغة الإشارة`;
    }
  }

  // --- ENGLISH Content ---
  if (isZero) {
    h1En.textContent = 'Better luck next time!';
    pEn.innerHTML = "You didn't learn any words this time.";
  } else {
    h1En.textContent = 'Congratulations!';
    pEn.innerHTML = `You have learned ${n} words in sign language`;
  }


  // --- Home button language setting (UPDATED TO USE SPANS) ---
  if (homeBtn) {
    const arSpan = homeBtn.querySelector('.home-btn-ar');
    const enSpan = homeBtn.querySelector('.home-btn-en');
    
    // Ensure spans exist before trying to set properties
    if (arSpan && enSpan) {
        // Set the text for both spans (always the same, regardless of session lang)
        arSpan.textContent = 'الرئيسية';
        enSpan.textContent = 'Home';
    }

    // Set the overall button direction/alignment (optional, for consistency)
    if (lang === 'ar') {
      // NOTE: We no longer set textContent, but we keep dir/textAlign in case it's used
      homeBtn.setAttribute('dir', 'rtl');
      homeBtn.style.textAlign = 'center';
    } else {
      homeBtn.removeAttribute('dir');
      homeBtn.style.textAlign = '';
    }
  }
}

// ... (rest of index.js) ...

/* move to home (Step 1), clearing step4 timer and resetting selectedLang.
   Keep this minimal and safe so it doesn't interfere with normal flow. */
function goHome() {
  if (step4Timer) {
    clearTimeout(step4Timer);
    step4Timer = null;
  }

  // reset any session-local state
  selectedLang = null;

  // restore Home button text if present (UPDATED TO USE SPANS)
  const homeBtn = document.querySelector('#home-btn');
  if (homeBtn) {
    const arSpan = homeBtn.querySelector('.home-btn-ar');
    const enSpan = homeBtn.querySelector('.home-btn-en');

    // Restore text content to spans
    if (arSpan && enSpan) {
        arSpan.textContent = 'الرئيسية';
        enSpan.textContent = 'Home';
    }

    // Restore direction/alignment
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