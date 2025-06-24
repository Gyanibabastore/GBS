const axios = require('axios');
const qs = require('qs');

const whatsapp = async (phone, message, imageUrl, buttonText, buttonLink) => {
  try {
    const payload = {
      channel: 'whatsapp',
      source: process.env.GUPSHUP_SOURCE_NUMBER,
      destination: '91' + phone,
      'src.name': process.env.GUPSHUP_APP_NAME,
      message: JSON.stringify({
        type: 'image',
        originalUrl: imageUrl,
        previewUrl: imageUrl,
        caption: message
      }),
      'message-type': 'image'
    };

    const res = await axios.post(
      'https://api.gupshup.io/sm/api/v1/msg',
      qs.stringify(payload),
      {
        headers: {
          apikey: process.env.GUPSHUP_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log(`📤 WhatsApp sent to ${phone}`, res.data);
  } catch (error) {
    console.error(`❌ WhatsApp error for ${phone}:`, error.response?.data || error.message);
  }
};

module.exports = whatsapp;
