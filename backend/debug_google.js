require('dotenv').config();
const axios = require('axios');

async function debugGoogleOAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.REFRESH_TOKEN;

  console.log("=== Debugging Google OAuth Refresh ===");
  console.log("Client ID ends with:", clientId.slice(-10));
  console.log("Client Secret ends with:", clientSecret.slice(-5));
  console.log("Refresh Token ends with:", refreshToken.slice(-10));

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    console.log("✅ SUCCESS! Google accepted the refresh token and returned a new Access Token.");
    console.log("Access Token starts with:", response.data.access_token.substring(0, 10));
  } catch (error) {
    console.log("❌ FAILED! Google rejected the refresh token.");
    if (error.response) {
      console.log("Error Status:", error.response.status);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Error Message:", error.message);
    }
  }
}

debugGoogleOAuth();
