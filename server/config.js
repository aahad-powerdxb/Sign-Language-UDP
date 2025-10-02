// server/config.js
require('dotenv').config();
const parseIntOr = (v, d) => (v ? parseInt(v, 10) : d);

module.exports = {
  WEB_PORT: parseIntOr(process.env.PORT, 3000),

  UDP_TARGET_HOST: process.env.UDP_HOST || '127.0.0.1',
  UDP_TARGET_PORT: parseIntOr(process.env.UDP_PORT, 41234),

  START_UDP_LISTENER: (process.env.START_UDP_LISTENER || 'false').toLowerCase() === 'true',
  UDP_LISTEN_HOST: process.env.UDP_LISTEN_HOST || '127.0.0.1',
  UDP_LISTEN_PORT: parseIntOr(process.env.UDP_LISTEN_PORT, 41235),

  UDP_MESSAGE_EN: process.env.UDP_MESSAGE_EN || 'ENGLISH_SIGNAL',
  UDP_MESSAGE_AR: process.env.UDP_MESSAGE_AR || 'ARABIC_SIGNAL',

  LOG_UDP: (process.env.LOG_UDP || 'true').toLowerCase() === 'true'
};
