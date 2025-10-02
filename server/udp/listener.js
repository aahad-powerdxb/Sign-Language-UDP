// server/udp/listener.js
const dgram = require('dgram');

function startListener(host, port, onMessage, onError, onListening) {
  const server = dgram.createSocket('udp4');

  server.on('error', (err) => {
    if (onError) onError(err);
    // do not crash the whole app
  });

  server.on('message', (msg, rinfo) => {
    if (onMessage) onMessage(msg, rinfo);
  });

  server.on('listening', () => {
    if (onListening) onListening(server.address());
  });

  server.bind(port, host);
  return server; // caller can close server via server.close()
}

module.exports = { startListener };
