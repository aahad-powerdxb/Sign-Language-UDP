// public/js/network.js
export async function postSend(body) {
  const res = await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    const errMsg = (data && data.error) ? data.error : 'Server error';
    const err = new Error(errMsg);
    err.response = data;
    throw err;
  }
  return data;
}

export async function pingHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('health check failed');
    return true;
  } catch (e) {
    return false;
  }
}

// subscribeToEvents: accepts a callback (payload) => {}
export function subscribeToEvents(onMessage, onOpen, onError) {
  if (!window.EventSource) {
    onError && onError(new Error('EventSource not supported in this browser'));
    return null;
  }

  const es = new EventSource('/events');

  es.addEventListener('udp', (ev) => {
    try {
      const parsed = JSON.parse(ev.data);
      onMessage && onMessage(parsed);
    } catch (e) {
      onError && onError(e);
    }
  });

  es.onopen = () => onOpen && onOpen();
  es.onerror = (err) => onError && onError(err);

  return es;
}
