/**
 * API route to serve images from Vercel Blob storage
 *
 * Redirects to blob CDN URLs. Uses blob-urls.json mapping.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load blob URL mapping once at module level
let blobUrls: Record<string, string> | null = null

function loadBlobUrls(): Record<string, string> {
  if (blobUrls) return blobUrls

  const blobUrlsPath = join(process.cwd(), 'extraction', 'data', 'blob-urls.json')
  const content = readFileSync(blobUrlsPath, 'utf-8')
  const data = JSON.parse(content)
  const urls: Record<string, string> = data.photos || {}
  blobUrls = urls
  return urls
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const { number } = req.query

  if (typeof number !== 'string') {
    res.status(400).json({ error: 'Invalid image number' })
    return
  }

  // Sanitize to prevent injection
  const sanitized = number.replace(/[^0-9]/g, '').padStart(4, '0')
  if (sanitized.length !== 4) {
    res.status(400).json({ error: 'Invalid image number format' })
    return
  }

  const urls = loadBlobUrls()
  const blobUrl = urls[sanitized]

  if (!blobUrl) {
    res.status(404).json({ error: 'Image not found', number: sanitized })
    return
  }

  // Redirect to Vercel Blob CDN
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  res.redirect(302, blobUrl)
}
