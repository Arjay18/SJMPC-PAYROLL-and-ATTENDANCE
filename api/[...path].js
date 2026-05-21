// Catch-all Vercel API route.
// Forwards ANY /api/* request to your Express app in server/src/index.js

module.exports = async (req, res) => {
  const mod = await import('../server/src/index.js')
  const expressApp = mod?.app ?? mod?.default

  if (!expressApp) {
    res.status(500).json({ message: 'Express app not exported from server/src/index.js' })
    return
  }

  // Express expects req.url to include the path/query after the mount.
  // Vercel provides originalUrl; keep it.
  return expressApp(req, res)
}

