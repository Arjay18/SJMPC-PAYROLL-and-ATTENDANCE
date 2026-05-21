// Vercel Serverless Function entry for API routes.
// Note: This file only matches the exact /api path.
// Use api/[...path].js to forward /api/* routes (auth, etc.).

module.exports = async (req, res) => {
  res.status(404).json({ message: 'Not found. Use /api/[...path] catch-all.' })
}


