require('dotenv').config();

const withLess = require("@zeit/next-less");
const withCSS = require("@zeit/next-css");
const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

module.exports = withLess(withCSS({
  publicRuntimeConfig: {
    // Will be available on both server and client
    serverUrl,
  },
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  webpack: (config, options) => {
    console.log(config, options);
    return config;
  },
}));
