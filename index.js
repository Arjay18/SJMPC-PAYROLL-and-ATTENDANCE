// This file acts as the entry point for Vercel Serverless Functions
// It imports the Express app from your server folder and exports it
require('dotenv').config();
const app = require('./server/index.js');

module.exports = app;