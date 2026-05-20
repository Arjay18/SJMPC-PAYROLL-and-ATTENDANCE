// This file acts as the entry point for Vercel Serverless Functions
// It imports the Express app from your server folder and exports it

module.exports = (req, res) => {
  res.status(200).send('Hello from Vercel API!');
};