require('dotenv').config();

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

module.exports = {
  publicRuntimeConfig: {
    // Will be available on both server and client
    serverUrl,
  },
};
