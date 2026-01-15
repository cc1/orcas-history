/**
 * Seed media-entity relationships (media_person, media_place, media_topic)
 *
 * This seeder parses the text fields from media records and creates
 * junction table entries by fuzzy-matching to existing entities.
 */
import { db } from '../index'
import { media, person, place, topic, mediaPerson, mediaPlace, mediaTopic } from '../schema'
import { eq, sql } from 'drizzle-orm'

interface MatchResult {
  id: string
  confidence: 'confirmed' | 'likely' | 'uncertain'
}

/**
 * Common nickname mappings for fuzzy name matching
 */
const NICKNAMES: Record<string, string[]> = {
  kenneth: ['ken', 'kenny'],
  william: ['will', 'bill', 'billy'],
  robert: ['rob', 'bob', 'bobby'],
  richard: ['rick', 'rich', 'dick'],
  james: ['jim', 'jimmy', 'jamie'],
  michael: ['mike', 'mick', 'mickey'],
  elizabeth: ['liz', 'beth', 'betty', 'eliza'],
  margaret: ['maggie', 'meg', 'peggy', 'marge'],
  catherine: ['kate', 'cathy', 'cat', 'katie'],
  frederick: ['fred', 'freddy'],
  george: ['geo'],
  charles: ['charlie', 'chuck'],
  edward: ['ed', 'eddie', 'ted', 'teddy'],
  lawrence: ['larry'],
  helge: ['helge'],
  virginia: ['ginny'],
  carolyn: ['carol'],
  bruce: ['bruce'],
}

/**
 * Expand a name to include all possible nickname variants
 */
function expandNicknames(name: string): string[] {
  const lower = name.toLowerCase()
  const variants = [lower]

  // Check if this name is a full name that has nicknames
  if (NICKNAMES[lower]) {
    variants.push(...NICKNAMES[lower])
  }

  // Check if this name is a nickname that maps to a full name
  for (const [fullName, nicks] of Object.entries(NICKNAMES)) {
    if (nicks.includes(lower)) {
      variants.push(fullName)
    }
  }

  return variants
}

/**
 * Normalize a name for matching:
 * - Lowercase
 * - Remove parenthetical content like "(Culver)" or "(O.H.)"
 * - Remove common titles/suffixes
 * - Remove extra whitespace
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/\b(dr\.?|mr\.?|mrs\.?|ms\.?|sr\.?|jr\.?)\b/gi, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract individual names from a people string or array
 * Handles formats like:
 * - "Ken Culver"
 * - "Ken Culver, Jean Culver"
 * - "Florian, Mary, and Leda"
 * - ["Ken Culver", "Jean Culver"]
 * - "TBD" or "NA" (skip these)
 */
function parsePeopleString(peopleStr: string | string[] | null | undefined): string[] {
  if (!peopleStr) return []

  // Handle array format
  if (Array.isArray(peopleStr)) {
    return peopleStr.filter(s =>
      typeof s === 'string' && s.length > 0 && s !== 'TBD' && s !== 'NA' && s !== 'Unknown'
    )
  }

  // Handle string format
  if (typeof peopleStr !== 'string') return []

  if (peopleStr === 'TBD' || peopleStr === 'NA' || peopleStr === 'Unknown') {
    return []
  }

  // Split by comma, "and", or "&"
  const parts = peopleStr
    .split(/,|\band\b|&/i)
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== 'TBD' && s !== 'NA')

  return parts
}

/**
 * Check if two normalized names likely refer to the same person
 */
function namesMatch(name1: string, name2: string): { matches: boolean; confidence: 'confirmed' | 'likely' | 'uncertain' } {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)

  // Exact match after normalization
  if (n1 === n2) {
    return { matches: true, confidence: 'confirmed' }
  }

  // Check if one contains the other (e.g., "Ken Culver" matches "Kenneth Louis Culver")
  const words1 = n1.split(' ').filter(w => w.length > 1)
  const words2 = n2.split(' ').filter(w => w.length > 1)

  // Get last names
  const lastName1 = words1[words1.length - 1]
  const lastName2 = words2[words2.length - 1]

  // Check if last names match
  const lastNameMatches = lastName1 && lastName2 && (
    lastName1 === lastName2 ||
    lastName1.includes(lastName2) ||
    lastName2.includes(lastName1)
  )

  if (!lastNameMatches) {
    return { matches: false, confidence: 'uncertain' }
  }

  // Get first names (all words except last)
  const firstNames1 = words1.slice(0, -1)
  const firstNames2 = words2.slice(0, -1)

  // Check for nickname match on first names
  for (const fn1 of firstNames1) {
    const variants1 = expandNicknames(fn1)
    for (const fn2 of firstNames2) {
      const variants2 = expandNicknames(fn2)
      // Check if any variant of name1's first name matches any variant of name2's first name
      for (const v1 of variants1) {
        if (variants2.includes(v1)) {
          return { matches: true, confidence: 'likely' }
        }
      }
    }
  }

  // Count matching FIRST NAME words only (exclude last name from this check)
  // This prevents "Ken Culver" from matching "Carroll Culver" just because of shared last name
  const matchingFirstNames = firstNames1.filter(fn1 =>
    firstNames2.some(fn2 => fn2.includes(fn1) || fn1.includes(fn2))
  )

  if (matchingFirstNames.length >= 1) {
    return { matches: true, confidence: 'likely' }
  }

  // Check for first name initial match (e.g., "O.H. Culver" vs "Otis Henry Culver")
  const hasInitials = /^[a-z]\.?[a-z]?\.?\s/i.test(name1) || /^[a-z]\.?[a-z]?\.?\s/i.test(name2)
  if (hasInitials) {
    return { matches: true, confidence: 'uncertain' }
  }

  return { matches: false, confidence: 'uncertain' }
}

/**
 * Find matching person for a name string
 *
 * STRICT MATCHING: Only matches when we have both first AND last name.
 * Single names like "Culver" are ambiguous and should NOT match.
 */
function findPersonMatch(
  nameToFind: string,
  people: Array<{ id: string; displayName: string; slug: string }>
): MatchResult | null {
  const normalized = normalizeName(nameToFind)
  const words = normalized.split(' ').filter(w => w.length > 1)

  // Reject single-word names - too ambiguous (e.g., just "Culver")
  if (words.length < 2) {
    return null
  }

  // Try matching against displayName with strict first+last name requirement
  for (const p of people) {
    const result = namesMatch(nameToFind, p.displayName)
    if (result.matches) {
      return { id: p.id, confidence: result.confidence }
    }
  }

  return null
}

/**
 * Find matching place for a location string
 */
function findPlaceMatch(
  locationText: string,
  places: Array<{ id: string; name: string; slug: string }>
): MatchResult | null {
  if (!locationText || locationText === 'TBD' || locationText === 'Unknown') {
    return null
  }

  const normalizedLocation = normalizeName(locationText)

  for (const p of places) {
    const normalizedPlaceName = normalizeName(p.name)

    // Exact match
    if (normalizedLocation === normalizedPlaceName) {
      return { id: p.id, confidence: 'confirmed' }
    }

    // Contains match (e.g., "Point Lawrence Lodge" contains "pt lawrence")
    if (normalizedLocation.includes(normalizedPlaceName) ||
        normalizedPlaceName.includes(normalizedLocation)) {
      return { id: p.id, confidence: 'likely' }
    }

    // Check slug match
    const slugMatch = p.slug.replace(/-/g, ' ')
    if (normalizedLocation.includes(slugMatch) || slugMatch.includes(normalizedLocation)) {
      return { id: p.id, confidence: 'likely' }
    }
  }

  return null
}

export async function seedMediaLinks(): Promise<void> {
  console.log('Seeding media-entity relationships...')

  // Fetch all required data
  const [allMedia, allPeople, allPlaces, allTopics] = await Promise.all([
    db.select({
      id: media.id,
      number: media.number,
      locationText: media.locationText,
      description: media.description,
    }).from(media),

    db.select({
      id: person.id,
      displayName: person.displayName,
      slug: person.slug,
    }).from(person),

    db.select({
      id: place.id,
      name: place.name,
      slug: place.slug,
    }).from(place),

    db.select({
      id: topic.id,
      name: topic.name,
      slug: topic.slug,
    }).from(topic),
  ])

  console.log(`  Found ${allMedia.length} media, ${allPeople.length} people, ${allPlaces.length} places, ${allTopics.length} topics`)

  // We need the original people text from the JSON files since it's not in the DB
  // Let's read it from the extraction files
  const fs = await import('fs')
  const path = await import('path')

  const parsedDir = path.join(process.cwd(), 'extraction/data/parsed')
  const photoFiles = fs.readdirSync(parsedDir)
    .filter((f: string) => f.startsWith('photos-') && f.endsWith('.json'))

  // Build a map of photo number -> people text
  const photoPeopleMap = new Map<string, string>()

  for (const file of photoFiles) {
    const filePath = path.join(parsedDir, file)
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const photos = Array.isArray(rawData) ? rawData : rawData.photos || []

    for (const photo of photos) {
      if (photo.number && photo.people) {
        photoPeopleMap.set(photo.number, photo.people)
      }
    }
  }

  let personLinks = 0
  let placeLinks = 0
  const unmatchedPeople: string[] = []
  const unmatchedPlaces: string[] = []

  // Clear existing links first
  await db.delete(mediaPerson)
  await db.delete(mediaPlace)
  await db.delete(mediaTopic)
  console.log('  Cleared existing media links')

  // Process each media item
  for (const m of allMedia) {
    // Match people from the JSON data
    const peopleText = photoPeopleMap.get(m.number)
    if (peopleText) {
      const names = parsePeopleString(peopleText)

      for (const name of names) {
        const match = findPersonMatch(name, allPeople)
        if (match) {
          await db.insert(mediaPerson).values({
            mediaId: m.id,
            personId: match.id,
            confidence: match.confidence,
            notes: `Matched from: "${name}"`,
          }).onConflictDoNothing()
          personLinks++
        } else {
          if (!unmatchedPeople.includes(name)) {
            unmatchedPeople.push(name)
          }
        }
      }
    }

    // Match places
    if (m.locationText) {
      const match = findPlaceMatch(m.locationText, allPlaces)
      if (match) {
        await db.insert(mediaPlace).values({
          mediaId: m.id,
          placeId: match.id,
          confidence: match.confidence,
        }).onConflictDoNothing()
        placeLinks++
      } else if (m.locationText !== 'TBD' && m.locationText !== 'Unknown') {
        if (!unmatchedPlaces.includes(m.locationText)) {
          unmatchedPlaces.push(m.locationText)
        }
      }
    }
  }

  console.log(`\n  Created ${personLinks} media-person links`)
  console.log(`  Created ${placeLinks} media-place links`)

  if (unmatchedPeople.length > 0) {
    console.log(`\n  Unmatched people names (${unmatchedPeople.length}):`)
    unmatchedPeople.slice(0, 20).forEach(name => console.log(`    - ${name}`))
    if (unmatchedPeople.length > 20) {
      console.log(`    ... and ${unmatchedPeople.length - 20} more`)
    }
  }

  if (unmatchedPlaces.length > 0) {
    console.log(`\n  Unmatched place names (${unmatchedPlaces.length}):`)
    unmatchedPlaces.slice(0, 10).forEach(name => console.log(`    - ${name}`))
    if (unmatchedPlaces.length > 10) {
      console.log(`    ... and ${unmatchedPlaces.length - 10} more`)
    }
  }

  console.log('\nMedia-entity linking complete')
}
