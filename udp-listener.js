/**
 * udp-listener.js
 *
 * Usage:
 *   node udp-listener.js                # binds to 127.0.0.1:41234
 *   node udp-listener.js 0.0.0.0 5000   # bind to 0.0.0.0:5000 (all interfaces)
 *   node udp-listener.js 127.0.0.1 41234 ipv6
 *
 * Arguments:
 *   [host]  - host/IP to bind to (default: 127.0.0.1)
 *   [port]  - port to listen on (default: 41234)
 *   [proto] - optional 'ipv6' to use udp6 (default: udp4)
 */

const dgram = require('dgram');

const argv = process.argv.slice(2);
const HOST = argv[0] || '127.0.0.1';
const PORT = parseInt(argv[1] || '41234', 10);
const USE_IPV6 = (argv[2] || '').toLowerCase() === 'ipv6';
const TYPE = USE_IPV6 ? 'udp6' : 'udp4';

const server = dgram.createSocket(TYPE);

server.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] Listener error:\n`, err);
  server.close();
  process.exit(1);
});

server.on('message', (msg, rinfo) => {
  const ts = new Date().toISOString();
  // try decode as UTF-8 without throwing
  let asText = '';
  try { asText = msg.toString('utf8'); } catch (e) { asText = '[invalid utf8]'; }

  console.log('--------------------------------------------------');
  console.log(`${ts}  Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port} (${rinfo.family})`);
  console.log('');
  console.log('== As UTF-8 ==');
  console.log(asText);
  console.log('');
  console.log('== As hex ==');
  console.log(msg.toString('hex').match(/.{1,2}/g).join(' '));
  console.log('--------------------------------------------------\n');
});

server.on('listening', () => {
  const address = server.address();
  console.log(`UDP listener started on ${address.address}:${address.port} (${TYPE})`);
});

server.bind(PORT, HOST);

// graceful shutdown
function shutdown() {
  console.log('Shutting down UDP listener...');
  server.close(() => {
    console.log('Closed.');
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);