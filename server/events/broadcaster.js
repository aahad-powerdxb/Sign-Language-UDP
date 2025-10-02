// server/events/broadcaster.js
const clients = new Set();

function subscribe(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // send a comment to establish connection
  res.write(': connected\n\n');

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
}

function broadcast(eventName = 'udp', payload = {}) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  for (const res of clients) {
    try {
      if (eventName) res.write(`event: ${eventName}\n`);
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      clients.delete(res);
    }
  }
}

let heartbeatTimer = null;
function startHeartbeat(intervalMs = 20000) {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const res of clients) {
      try { res.write(': ping\n\n'); } catch (e) { clients.delete(res); }
    }
  }, intervalMs);
}
function stopHeartbeat() {
  if (!heartbeatTimer) return;
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

module.exports = { subscribe, broadcast, startHeartbeat, stopHeartbeat };
