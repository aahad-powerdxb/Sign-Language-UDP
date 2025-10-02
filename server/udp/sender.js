// server/udp/sender.js
const dgram = require('dgram');
const socket = dgram.createSocket('udp4');

function sendUdp(message, opts = {}) {
  const targetHost = opts.host;
  const targetPort = opts.port;
  const buf = Buffer.isBuffer(message) ? message : Buffer.from(String(message), 'utf8');

  return new Promise((resolve, reject) => {
    socket.send(buf, 0, buf.length, targetPort, targetHost, (err) => {
      if (err) return reject(err);
      resolve({ host: targetHost, port: targetPort, bytes: buf.length });
    });
  });
}

function closeSocket() {
  try { socket.close(); } catch (e) {}
}

module.exports = { sendUdp, closeSocket };
