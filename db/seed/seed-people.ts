/**
 * Seed people from extracted JSON files
 */
import fs from 'fs'
import path from 'path'
import { db } from '../index'
import { person, dateValue } from '../schema'

interface ExtractedPerson {
  slug: string
  displayName: string
  connectionToPtLawrence?: string
  miscellaneous?: string
  family?: {
    parents?: string[]
    spouses?: string[]
    children?: string[]
    siblings?: string[]
  }
  keyDates?: string
  birthDate?: {
    original?: string
    year?: number
    month?: number
    day?: number
    location?: string
    precision?: string
  }
  deathDate?: {
    original?: string
    year?: number
    precision?: string
  }
  timeline?: Array<{
    year: number
    age?: number
    event: string
  }>
  biography?: string
  imageUrl?: string
}

interface PersonFile {
  pageUrl: string
  extractedAt: string
  person: ExtractedPerson
}

export async function seedPeople(): Promise<void> {
  console.log('Seeding people...')

  const peopleDir = path.join(process.cwd(), 'extraction/data/parsed/people')

  if (!fs.existsSync(peopleDir)) {
    console.log('No people directory found, skipping...')
    return
  }

  const files = fs.readdirSync(peopleDir)
    .filter(f => f.endsWith('.json'))
    .sort()

  let totalPeople = 0

  for (const file of files) {
    const filePath = path.join(peopleDir, file)
    const data: PersonFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const p = data.person

    // Create birth date value if available
    let birthDateId: string | null = null
    if (p.birthDate?.year || p.birthDate?.original) {
      const [insertedDate] = await db.insert(dateValue).values({
        originalText: p.birthDate.original || `${p.birthDate.year}`,
        yearStart: p.birthDate.year || null,
        yearEnd: null,
        month: p.birthDate.month || null,
        day: p.birthDate.day || null,
        precision: (p.birthDate.precision as 'exact' | 'year_month' | 'year_only' | 'range' | 'approximate' | 'unknown') || 'year_only'
      }).returning({ id: dateValue.id })
      birthDateId = insertedDate.id
    }

    // Create death date value if available
    let deathDateId: string | null = null
    if (p.deathDate?.year || p.deathDate?.original) {
      const [insertedDate] = await db.insert(dateValue).values({
        originalText: p.deathDate.original || `${p.deathDate.year}`,
        yearStart: p.deathDate.year || null,
        yearEnd: null,
        month: null,
        day: null,
        precision: (p.deathDate.precision as 'exact' | 'year_month' | 'year_only' | 'range' | 'approximate' | 'unknown') || 'year_only'
      }).returning({ id: dateValue.id })
      deathDateId = insertedDate.id
    }

    // Build family data JSON
    const familyData = p.family ? {
      parents: p.family.parents || [],
      spouses: p.family.spouses || [],
      children: p.family.children || [],
      siblings: p.family.siblings || []
    } : null

    // Insert person record
    await db.insert(person).values({
      slug: p.slug,
      displayName: p.displayName,
      biography: p.biography || null,
      connectionToPtLawrence: p.connectionToPtLawrence || null,
      miscellaneous: p.miscellaneous || null,
      keyDatesText: p.keyDates || null,
      birthYear: p.birthDate?.year || null,
      deathYear: p.deathDate?.year || null,
      birthDateId,
      deathDateId,
      familyData,
      timeline: p.timeline || null,
      imageUrl: p.imageUrl || null,
      sourcePageUrl: data.pageUrl
    }).onConflictDoNothing()

    totalPeople++
    console.log(`  Seeded: ${p.displayName}`)
  }

  console.log(`Seeded ${totalPeople} people`)
}

/**
 * Link people by family relationships after all people are inserted
 * This is a second pass to create personRelationship records
 */
export async function linkPeopleRelationships(): Promise<void> {
  console.log('Linking people relationships...')

  // This would query all people, look at their familyData,
  // and try to match names to existing person records
  // For now, we'll skip this complex step - it can be done manually
  // or in a future iteration

  console.log('  (Family relationship linking deferred to future iteration)')
}
