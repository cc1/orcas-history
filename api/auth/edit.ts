/**
 * API route: POST /api/auth/edit
 * Validates the edit password without storing session state
 * Used for item-by-item editing where each component manages its own edit state
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { password } = req.body

    // Edit password can be same as site password or a separate one
    const editPassword = process.env.EDIT_PASSWORD || process.env.SITE_PASSWORD || process.env.VITE_EDIT_PASSWORD || process.env.VITE_SITE_PASSWORD

    if (!editPassword) {
      // No password configured - allow editing
      return res.status(200).json({ success: true })
    }

    if (password === editPassword) {
      return res.status(200).json({ success: true })
    }

    return res.status(401).json({ error: 'Invalid password' })
  } catch (error) {
    console.error('Edit auth error:', error)
    return res.status(500).json({ error: 'Authentication failed' })
  }
}
