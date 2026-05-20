// This file acts as the entry point for Vercel Serverless Functions
// It loads the Express app from your ESM server and forwards the request.

module.exports = async (req, res) => {
  const app = await import('./server/src/index.js')
  // server/src/index.js exports `app` by default as side-effect; for safety support both shapes
  const expressApp = app?.default ?? app
  return expressApp(req, res)
}

