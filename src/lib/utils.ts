/**
 * Utility functions for the Orcas History application
 */

/**
 * Transform a stored image path to a servable URL
 *
 * Database stores paths like: /extraction/data/images/0440.jpg
 * This transforms to API route: /api/images/0440 (redirects to Vercel Blob)
 *
 * Falls back to the original value if it doesn't match the expected pattern
 * (e.g., for blob URLs or already-transformed paths)
 */
export function getImageUrl(webImagePath: string | null, googleUrl: string | null): string {
  // Try webImagePath first
  if (webImagePath) {
    // Check if it's a local extraction path that needs transformation
    const match = webImagePath.match(/\/extraction\/data\/images\/(\d{4})\.jpg$/)
    if (match) {
      // Use API route which redirects to Vercel Blob
      return `/api/images/${match[1]}`
    }
    // If it's already a full URL (blob or other), use as-is
    if (webImagePath.startsWith('http')) {
      return webImagePath
    }
    // If it's already an API path, use as-is
    if (webImagePath.startsWith('/api/images')) {
      return webImagePath
    }
  }

  // Fall back to googleUrl (may not work due to referrer restrictions)
  if (googleUrl) {
    return googleUrl
  }

  return ''
}
