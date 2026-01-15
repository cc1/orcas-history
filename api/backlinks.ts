/**
 * API route: GET /api/backlinks
 * Returns related pages (bidirectional links) for a given entity
 *
 * Scans text content of ALL entities to find:
 * 1. Forward links: Entities mentioned in this page's text
 * 2. Backlinks: Other pages that mention this entity in their text
 *
 * Query parameters:
 * - type: 'person' | 'place' | 'topic' (required)
 * - id: entity slug (required)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, person, place, topic } from './lib/db.js'

interface EntityInfo {
  type: 'person' | 'place' | 'topic'
  id: string
  slug: string
  name: string
  text: string // Combined searchable text
  aliases: string[] // Alternative names for matching
}

interface RelatedPagesResponse {
  people: Array<{ slug: string; name: string }>
  places: Array<{ slug: string; name: string }>
  topics: Array<{ slug: string; name: string }>
}

/**
 * Nickname mappings for fuzzy matching
 */
const NICKNAMES: Record<string, string[]> = {
  kenneth: ['ken', 'kenny'],
  william: ['will', 'bill', 'billy', 'wm'],
  robert: ['rob', 'bob', 'bobby'],
  richard: ['rick', 'rich', 'dick'],
  james: ['jim', 'jimmy', 'jamie', 'jas'],
  michael: ['mike', 'mick', 'mickey'],
  elizabeth: ['liz', 'beth', 'betty', 'eliza', 'lizzie'],
  margaret: ['maggie', 'meg', 'peggy', 'marge'],
  catherine: ['kate', 'cathy', 'cat', 'katie'],
  frederick: ['fred', 'freddy'],
  george: ['geo'],
  charles: ['charlie', 'chuck', 'chas'],
  edward: ['ed', 'eddie', 'ted', 'teddy'],
  lawrence: ['larry'],
  virginia: ['ginny'],
  carolyn: ['carol'],
  otis: ['o.h.', 'oh'],
  diana: ['di'],
  florence: ['flo'],
  dorothy: ['dot', 'dottie'],
  theodore: ['theo', 'ted'],
  benjamin: ['ben', 'benny'],
  samuel: ['sam', 'sammy'],
  nathaniel: ['nate', 'nathan'],
  alexander: ['alex'],
  christopher: ['chris'],
  nicholas: ['nick'],
  thomas: ['tom', 'tommy', 'thos'],
  joseph: ['joe', 'joey'],
  daniel: ['dan', 'danny'],
  andrew: ['andy', 'drew'],
  matthew: ['matt'],
  anthony: ['tony'],
  patrick: ['pat'],
  francis: ['frank', 'fran'],
}

/**
 * Generate all name variants for an entity
 */
function generateAliases(name: string): string[] {
  const aliases: string[] = [name.toLowerCase()]
  const words = name.toLowerCase().split(/\s+/)

  // Add individual words as aliases (for single-name mentions like "Diana")
  words.forEach(word => {
    if (word.length > 2 && !['the', 'and', 'of'].includes(word)) {
      aliases.push(word)
    }
  })

  // Handle parenthetical nicknames like "Otis Henry (O.H.) Culver"
  const parenMatch = name.match(/\(([^)]+)\)/)
  if (parenMatch) {
    aliases.push(parenMatch[1].toLowerCase())
    // Also add without parens version
    const withoutParens = name.replace(/\s*\([^)]+\)\s*/, ' ').trim()
    aliases.push(withoutParens.toLowerCase())
  }

  // Generate nickname variants
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '')

    // Check if this word is a full name with nicknames
    if (NICKNAMES[cleanWord]) {
      for (const nickname of NICKNAMES[cleanWord]) {
        // Add nickname + last name (e.g., "Ken Culver" for "Kenneth Culver")
        const lastName = words[words.length - 1]
        if (lastName !== cleanWord) {
          aliases.push(`${nickname} ${lastName}`)
        }
        aliases.push(nickname)
      }
    }

    // Check if this word is a nickname mapping to full name
    for (const [fullName, nicks] of Object.entries(NICKNAMES)) {
      if (nicks.includes(cleanWord)) {
        const lastName = words[words.length - 1]
        if (lastName !== cleanWord) {
          aliases.push(`${fullName} ${lastName}`)
        }
      }
    }
  }

  // Add slug-style version
  aliases.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))

  return [...new Set(aliases.filter(a => a.length > 1))]
}

/**
 * Extract searchable text from an entity
 */
function extractText(entity: any, type: 'person' | 'place' | 'topic'): string {
  const parts: string[] = []

  if (type === 'person') {
    if (entity.biography) parts.push(entity.biography)
    if (entity.connectionToPtLawrence) parts.push(entity.connectionToPtLawrence)
    if (entity.miscellaneous) parts.push(entity.miscellaneous)
    if (entity.keyDatesText) parts.push(entity.keyDatesText)
  } else {
    // Place or Topic
    if (entity.description) parts.push(entity.description)
    if (entity.contentSections) {
      try {
        const sections = typeof entity.contentSections === 'string'
          ? JSON.parse(entity.contentSections)
          : entity.contentSections
        if (Array.isArray(sections)) {
          sections.forEach((s: any) => {
            if (s.heading) parts.push(s.heading)
            if (s.content) parts.push(s.content)
          })
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  return parts.join(' ').toLowerCase()
}

/**
 * Check if text mentions an entity (using fuzzy matching)
 */
function textMentionsEntity(text: string, entity: EntityInfo): boolean {
  const lowerText = text.toLowerCase()

  for (const alias of entity.aliases) {
    // Use word boundary matching to avoid partial matches
    // e.g., "Culver" shouldn't match inside "CulverCity"
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i')

    if (pattern.test(lowerText)) {
      return true
    }
  }

  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, id } = req.query

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: type' })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: id' })
  }

  if (!['person', 'place', 'topic'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be person, place, or topic' })
  }

  try {
    // Load all entities
    const [allPeople, allPlaces, allTopics] = await Promise.all([
      db.select().from(person),
      db.select().from(place),
      db.select().from(topic),
    ])

    // Build entity info with searchable text and aliases
    const entities: EntityInfo[] = []

    for (const p of allPeople) {
      entities.push({
        type: 'person',
        id: p.id,
        slug: p.slug,
        name: p.displayName,
        text: extractText(p, 'person'),
        aliases: generateAliases(p.displayName),
      })
    }

    for (const p of allPlaces) {
      entities.push({
        type: 'place',
        id: p.id,
        slug: p.slug,
        name: p.name,
        text: extractText(p, 'place'),
        aliases: generateAliases(p.name),
      })
    }

    for (const t of allTopics) {
      entities.push({
        type: 'topic',
        id: t.id,
        slug: t.slug,
        name: t.name,
        text: extractText(t, 'topic'),
        aliases: generateAliases(t.name),
      })
    }

    // Find the current entity
    const currentEntity = entities.find(e => e.type === type && e.slug === id)

    if (!currentEntity) {
      return res.status(404).json({ error: `${type} not found` })
    }

    // Find related pages (bidirectional)
    const relatedPages: RelatedPagesResponse = {
      people: [],
      places: [],
      topics: [],
    }

    for (const entity of entities) {
      // Skip self
      if (entity.type === currentEntity.type && entity.slug === currentEntity.slug) {
        continue
      }

      // Check for bidirectional mention
      const currentMentionsEntity = textMentionsEntity(currentEntity.text, entity)
      const entityMentionsCurrent = textMentionsEntity(entity.text, currentEntity)

      if (currentMentionsEntity || entityMentionsCurrent) {
        const item = { slug: entity.slug, name: entity.name }

        if (entity.type === 'person') {
          relatedPages.people.push(item)
        } else if (entity.type === 'place') {
          relatedPages.places.push(item)
        } else if (entity.type === 'topic') {
          relatedPages.topics.push(item)
        }
      }
    }

    // Sort alphabetically
    relatedPages.people.sort((a, b) => a.name.localeCompare(b.name))
    relatedPages.places.sort((a, b) => a.name.localeCompare(b.name))
    relatedPages.topics.sort((a, b) => a.name.localeCompare(b.name))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).json({ data: relatedPages })
  } catch (error) {
    console.error('Error fetching related pages:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
