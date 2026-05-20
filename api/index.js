// Vercel Serverless Function entry for API routes
// Forwards requests to your Express app (ESM) in server/src/index.js

module.exports = async (req, res) => {
  const mod = await import('../server/src/index.js')
  const expressApp = mod?.app ?? mod?.default

  if (!expressApp) {
    res.status(500).json({ message: 'Express app not exported from server/src/index.js' })
    return
  }

  return expressApp(req, res)
}

