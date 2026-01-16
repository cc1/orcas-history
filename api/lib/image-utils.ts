/**
 * Image URL utilities for the API layer
 */

/**
 * Transform a stored image path to a servable URL
 *
 * Database stores paths like: /extraction/data/images/0440.jpg
 * This transforms to static file URL: /images/0440.jpg
 */
export function getImageUrl(webImagePath: string | null, googleUrl: string | null): string | null {
  // Try webImagePath first
  if (webImagePath) {
    // Check if it's a local extraction path that needs transformation
    const match = webImagePath.match(/\/extraction\/data\/images\/(.+\.jpg)$/)
    if (match) {
      // Serve directly from public/images symlink
      return `/images/${match[1]}`
    }
    // If it's already a URL (starts with http or /images), use as-is
    if (webImagePath.startsWith('http') || webImagePath.startsWith('/images')) {
      return webImagePath
    }
  }

  // Fall back to googleUrl (may not work due to referrer restrictions)
  return googleUrl
}
