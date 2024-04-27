require('dotenv').config();

module.exports = {
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'accessToken123',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'refreshToken123'
};
