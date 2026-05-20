// This file acts as the entry point for Vercel Serverless Functions
// It loads the Express app from your ESM server and forwards the request.

module.exports = async (req, res) => {
  // Vercel must not start a separate listener. server/src/index.js currently calls app.listen.
  // Instead, forward to an Express app export. (server/src/index.js should export the app.)
  const mod = await import('./server/src/index.js')
  const expressApp = mod?.app ?? mod?.default
  if (!expressApp) {
    res.status(500).json({ message: 'Express app not exported from server/src/index.js' })
    return
  }

  // Avoid Express hanging on serverless environments
  // Express error handling might depend on having res.locals, etc.
  return expressApp(req, res)
}




