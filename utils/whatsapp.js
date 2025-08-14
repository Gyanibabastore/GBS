// utils/whatsappSender.js
const axios = require('axios');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function sendWhatsApp(to, messageText, buttonText, buttonUrl) {
  const apiUrl = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
  const headers = {
    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Simple text with formatting + link
  const textMessage = {
    messaging_product: "whatsapp",
    to: `91${to}`,
    type: "text",
    text: {
      body: `${messageText}`,
      preview_url: true, // if URL present, show preview
    },
  };

  await axios.post(apiUrl, textMessage, { headers });
}

module.exports = sendWhatsApp;
