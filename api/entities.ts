/**
 * API route: GET /api/entities
 * Returns all entities (people, places, topics) for autocomplete
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, person, place, topic } from './lib/db.js'
import { asc } from 'drizzle-orm'

interface Entity {
  type: 'person' | 'place' | 'topic'
  slug: string
  name: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const [allPeople, allPlaces, allTopics] = await Promise.all([
      db.select({ slug: person.slug, name: person.displayName }).from(person).orderBy(asc(person.displayName)),
      db.select({ slug: place.slug, name: place.name }).from(place).orderBy(asc(place.name)),
      db.select({ slug: topic.slug, name: topic.name }).from(topic).orderBy(asc(topic.name)),
    ])

    const entities: Entity[] = [
      ...allPeople.map(p => ({ type: 'person' as const, slug: p.slug, name: p.name })),
      ...allPlaces.map(p => ({ type: 'place' as const, slug: p.slug, name: p.name })),
      ...allTopics.map(t => ({ type: 'topic' as const, slug: t.slug, name: t.name })),
    ]

    // Sort all together by name
    entities.sort((a, b) => a.name.localeCompare(b.name))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: entities })
  } catch (error) {
    console.error('Error fetching entities:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
