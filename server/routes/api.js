// server/routes/api.js
const express = require('express');
const router = express.Router();

const config = require('../config');
const { sendUdp } = require('../udp/sender');
const { startListener } = require('../udp/listener');
const broadcaster = require('../events/broadcaster');

let listenerInstance = null;

// POST /api/send
router.post('/send', async (req, res) => {
  try {
    const { lang, host, port, message } = req.body || {};
    let payload;

    if (message != null) payload = message;
    else if (lang === 'en') payload = config.UDP_MESSAGE_EN;
    else if (lang === 'ar') payload = config.UDP_MESSAGE_AR;
    else return res.status(400).json({ error: 'Missing lang or message in body' });

    const targetHost = host || config.UDP_TARGET_HOST;
    const targetPort = port ? parseInt(port, 10) : config.UDP_TARGET_PORT;

    if (config.LOG_UDP) {
      console.log(`[UDP Send] -> ${targetHost}:${targetPort}  (${Buffer.byteLength(String(payload), 'utf8')} bytes)`);
      console.log(String(payload));
    }

    const result = await sendUdp(payload, { host: targetHost, port: targetPort });

    const sentObj = { payload: String(payload), ...result };
    const sentText = `${sentObj.payload}${sentObj.host ? ` → ${sentObj.host}:${sentObj.port}` : ''}${typeof sentObj.bytes === 'number' ? ` (${sentObj.bytes} bytes)` : ''}`;
    return res.json({ ok: true, sent: sentText, meta: sentObj });
  } catch (err) {
    console.error('Error in /api/send:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    udpTarget: { host: config.UDP_TARGET_HOST, port: config.UDP_TARGET_PORT },
    listener: config.START_UDP_LISTENER ? { host: config.UDP_LISTEN_HOST, port: config.UDP_LISTEN_PORT } : null
  });
});

// Maybe start UDP listener and broadcast packets to SSE clients
function maybeStartListener() {
  if (!config.START_UDP_LISTENER) return null;

  listenerInstance = startListener(
    config.UDP_LISTEN_HOST,
    config.UDP_LISTEN_PORT,
    (msg, rinfo) => {
      const ts = new Date().toISOString();
      let asText = '[invalid utf8]';
      try { asText = msg.toString('utf8'); } catch (e) {}
      const hex = msg.toString('hex').match(/.{1,2}/g)?.join(' ') || '';

      // Log locally
      console.log('--------------------------------------------------');
      console.log(`${ts}  Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port} (${rinfo.family})`);
      console.log('');
      console.log('== As UTF-8 ==');
      console.log(asText);
      console.log('');
      console.log('== As hex ==');
      console.log(hex);
      console.log('--------------------------------------------------\n');

      // Broadcast to connected browser clients via SSE
      const payload = {
        timestamp: ts,
        from: { address: rinfo.address, port: rinfo.port, family: rinfo.family },
        text: asText,
        hex,
        bytes: msg.length
      };
      broadcaster.broadcast('udp', payload);
    },
    (err) => { console.error('[UDP Listener] error:', err); },
    (addr) => { console.log(`[UDP Listener] listening on ${addr.address}:${addr.port}`); }
  );

  // start a heartbeat so browsers don't drop idle connections
  broadcaster.startHeartbeat(20000);

  return listenerInstance;
}

module.exports = { router, maybeStartListener };
