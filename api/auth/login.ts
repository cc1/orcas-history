/**
 * API route: POST /api/auth/login
 * Simple password-based site access
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { password } = req.body

    const sitePassword = process.env.SITE_PASSWORD || process.env.VITE_SITE_PASSWORD

    if (!sitePassword) {
      // No password configured - allow access (development mode)
      return res.status(200).json({ success: true })
    }

    if (password === sitePassword) {
      return res.status(200).json({ success: true })
    }

    return res.status(401).json({ error: 'Invalid password' })
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({ error: 'Authentication failed' })
  }
}
