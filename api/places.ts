/**
 * API route: GET /api/places
 * Returns all places with coordinates
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, place } from './_lib/db.js'
import { asc } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        imageUrl: place.imageUrl,
      })
      .from(place)
      .orderBy(asc(place.name))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: results })
  } catch (error) {
    console.error('Error fetching places:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
