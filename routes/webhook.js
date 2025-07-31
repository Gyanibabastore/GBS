// routes/webhook.js
const express = require('express');
const router = express.Router();

// GET route to verify webhook
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed.');
    res.sendStatus(403);
  }
});

// POST route to handle actual incoming messages (optional for now)
router.post('/webhook', (req, res) => {
  console.log('📩 Incoming WhatsApp Webhook Message:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200); // Must respond within 10 seconds
});

module.exports = router;
