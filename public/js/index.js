// public/js/index.js
import { ids, setStatus, disableButtons, $, setLastReceived } from './dom.js';
import { postSend, pingHealth, subscribeToEvents } from './network.js';

const btnEn = $(ids.btnEn);
const btnAr = $(ids.btnAr);

async function sendLang(lang) {
  try {
    setStatus('Sending...');
    disableButtons(true);
    const data = await postSend({ lang });
    const sentText = data.sent || (data.meta ? JSON.stringify(data.meta) : 'OK');
    setStatus(`Sent: ${sentText}`);
  } catch (err) {
    console.error(err);
    setStatus('Error: ' + (err.message || 'unknown'));
  } finally {
    disableButtons(false);
    setTimeout(() => setStatus('Ready'), 1400);
  }
}

btnEn.addEventListener('click', () => sendLang('en'));
btnAr.addEventListener('click', () => sendLang('ar'));

// show offline quickly if health fails
(async () => {
  const healthy = await pingHealth();
  if (!healthy) setStatus('Offline');

  // subscribe to server-sent UDP events
  subscribeToEvents(
    (payload) => {
      // payload: { timestamp, from: {address,port}, text, hex, bytes }
      const short = payload.text && payload.text.length > 120 ? payload.text.slice(0, 120) + '…' : payload.text;
      setLastReceived(`${payload.timestamp} — ${payload.from.address}:${payload.from.port} → ${short} (${payload.bytes} bytes)`);
      // also log
      console.log('UDP event:', payload);
    },
    () => console.log('SSE connected'),
    (err) => {
      console.warn('SSE error', err);
      // don't clobber UI if health check said okay
    }
  );
})();
