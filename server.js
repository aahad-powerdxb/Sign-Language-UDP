// server.js
const express = require('express');
const path = require('path');
const config = require('./server/config');

const { router: apiRouter, maybeStartListener } = require('./server/routes/api');
const eventsRouter = require('./server/routes/events');
const { closeSocket } = require('./server/udp/sender');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRouter);

// SSE events route (EventSource connects here)
app.use('/events', eventsRouter);

// root serves the index.html
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const server = app.listen(config.WEB_PORT, () => {
  console.log(`HTTP server running on http://0.0.0.0:${config.WEB_PORT}`);
  console.log(`Default UDP target: ${config.UDP_TARGET_HOST}:${config.UDP_TARGET_PORT}`);
  if (config.START_UDP_LISTENER) console.log(`UDP listener will be started on ${config.UDP_LISTEN_HOST}:${config.UDP_LISTEN_PORT}`);
});

// Start listener (and SSE) as configured
const listenerInstance = maybeStartListener();

// Graceful shutdown (close listener and sender socket)
function shutdown() {
  console.log('Shutting down...');
  try {
    if (listenerInstance) listenerInstance.close();
    closeSocket();
  } catch (e) {
    console.warn('Error while closing sockets:', e);
  }
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
