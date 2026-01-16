/**
 * API route: GET /api/people
 * Returns all people
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, person } from './_lib/db.js'
import { asc } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = await db
      .select({
        id: person.id,
        slug: person.slug,
        displayName: person.displayName,
        keyDatesText: person.keyDatesText,
        birthYear: person.birthYear,
        deathYear: person.deathYear,
        imageUrl: person.imageUrl,
        connectionToPtLawrence: person.connectionToPtLawrence,
      })
      .from(person)
      .orderBy(asc(person.displayName))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: results })
  } catch (error) {
    console.error('Error fetching people:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
