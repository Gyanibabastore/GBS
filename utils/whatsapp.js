const axios = require('axios');

// Load credentials from environment
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Main function
const sendWhatsApp = async (phone, message, imageUrl, buttonText, buttonLink) => {
  if (!phone || !message || !imageUrl) {
    console.error("❌ Missing required fields: phone, message, or imageUrl");
    return;
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      to: '91' + phone,
      type: 'image',
      image: {
        link: imageUrl,
        caption: message
      }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ WhatsApp message sent to ${phone}`, response.data);
  } catch (error) {
    console.error(`❌ WhatsApp send failed for ${phone}:`, error.response?.data || error.message);
  }
};

module.exports = sendWhatsApp;
