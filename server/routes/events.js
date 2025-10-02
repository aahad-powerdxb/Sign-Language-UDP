// server/routes/events.js
const express = require('express');
const router = express.Router();
const broadcaster = require('../events/broadcaster');

router.get('/', (req, res) => {
  broadcaster.subscribe(req, res);
});

module.exports = router;
