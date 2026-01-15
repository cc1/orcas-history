/**
 * Seed media (photos and documents) from extracted JSON files
 */
import fs from 'fs'
import path from 'path'
import { db } from '../index'
import { media, dateValue } from '../schema'
import { parseDate, KNOWN_DUPLICATES, HIDDEN_PHOTOS, getImagePath } from './utils'

interface ExtractedPhoto {
  number: string
  imageUrl: string
  date?: string
  location?: string
  people?: string
  description?: string
  source?: string
  hasHighRes?: boolean | string
  notes?: string
  duplicate?: string // For photos that are duplicates
}

interface PhotoBatch {
  pageUrl: string
  extractedAt: string
  photos: ExtractedPhoto[]
}

export async function seedMedia(): Promise<void> {
  console.log('Seeding media...')

  const parsedDir = path.join(process.cwd(), 'extraction/data/parsed')

  // Find all photo batch files
  const files = fs.readdirSync(parsedDir)
    .filter(f => f.startsWith('photos-') && f.endsWith('.json'))
    .sort()

  let totalPhotos = 0
  let skippedDuplicates = 0
  let skippedHidden = 0

  for (const file of files) {
    const filePath = path.join(parsedDir, file)
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Handle both formats: { photos: [...] } or direct array [...]
    const photos: ExtractedPhoto[] = Array.isArray(rawData) ? rawData : rawData.photos
    const pageUrl = Array.isArray(rawData) ? null : rawData.pageUrl

    for (const photo of photos) {
      // Skip if missing required number field
      if (!photo.number) {
        console.warn(`  Skipping photo without number in ${file}`)
        continue
      }

      // Skip if this is a known duplicate entry
      if (photo.duplicate) {
        skippedDuplicates++
        continue
      }

      // Parse the date
      const parsedDate = parseDate(photo.date)

      // Create date value record if we have any date info
      let dateId: string | null = null
      if (parsedDate.yearStart || parsedDate.originalText) {
        const [insertedDate] = await db.insert(dateValue).values({
          originalText: parsedDate.originalText,
          yearStart: parsedDate.yearStart,
          yearEnd: parsedDate.yearEnd,
          month: parsedDate.month,
          day: parsedDate.day,
          precision: parsedDate.precision
        }).returning({ id: dateValue.id })
        dateId = insertedDate.id
      }

      // Check if this is a known duplicate
      const isDuplicate = photo.number in KNOWN_DUPLICATES
      const duplicateOf = isDuplicate ? KNOWN_DUPLICATES[photo.number] : null

      // Check if this should be hidden
      const isHidden = HIDDEN_PHOTOS.includes(photo.number)

      // Determine category (photo vs document)
      // Photos 0185-0192 were moved to documents section
      const isDocument = parseInt(photo.number) >= 185 && parseInt(photo.number) <= 192
      const category = isDocument ? 'document' : 'photo'

      // Insert media record
      await db.insert(media).values({
        number: photo.number,
        category,
        description: photo.description || null,
        googleUrl: photo.imageUrl,
        webImagePath: getImagePath(photo.number),
        resolutionStatus: 'web',
        needsHighRes: photo.hasHighRes === true || photo.hasHighRes === 'TBD',
        dateId,
        dateSort: parsedDate.dateSort,
        needsDate: parsedDate.needsDate,
        locationText: photo.location || null,
        sourceText: photo.source || null,
        sourcePageUrl: pageUrl || null,
        hasHighRes: photo.hasHighRes === true,
        isDuplicate,
        notRelevant: isHidden,
        notes: photo.notes || null
      }).onConflictDoNothing()

      totalPhotos++

      if (isDuplicate) skippedDuplicates++
      if (isHidden) skippedHidden++
    }
  }

  console.log(`Seeded ${totalPhotos} photos`)
  console.log(`  - ${skippedDuplicates} marked as duplicates`)
  console.log(`  - ${skippedHidden} marked as hidden/not relevant`)

  // Now seed documents from the documents directory
  await seedDocuments()
}

async function seedDocuments(): Promise<void> {
  const documentsDir = path.join(process.cwd(), 'extraction/data/parsed/documents')

  if (!fs.existsSync(documentsDir)) {
    console.log('No documents directory found, skipping...')
    return
  }

  const files = fs.readdirSync(documentsDir)
    .filter(f => f.endsWith('.json'))

  let totalDocs = 0

  for (const file of files) {
    const filePath = path.join(documentsDir, file)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Handle both single document and array of documents
    const documents = Array.isArray(data) ? data : data.documents || [data]

    for (const doc of documents) {
      if (!doc.number && !doc.id) continue

      const docNumber = doc.number || doc.id
      const parsedDate = parseDate(doc.date)

      let dateId: string | null = null
      if (parsedDate.yearStart || parsedDate.originalText) {
        const [insertedDate] = await db.insert(dateValue).values({
          originalText: parsedDate.originalText,
          yearStart: parsedDate.yearStart,
          yearEnd: parsedDate.yearEnd,
          month: parsedDate.month,
          day: parsedDate.day,
          precision: parsedDate.precision
        }).returning({ id: dateValue.id })
        dateId = insertedDate.id
      }

      await db.insert(media).values({
        number: `DO-${docNumber}`,
        category: 'document',
        title: doc.title || doc.name || null,
        description: doc.description || null,
        googleUrl: doc.imageUrl || null,
        webImagePath: doc.imageUrl ? getImagePath(`DO-${docNumber}`) : null,
        resolutionStatus: 'web',
        dateId,
        dateSort: parsedDate.dateSort,
        needsDate: parsedDate.needsDate,
        sourcePageUrl: data.pageUrl || data.sourceUrl || null,
        notes: doc.notes || null
      }).onConflictDoNothing()

      totalDocs++
    }
  }

  console.log(`Seeded ${totalDocs} documents`)
}
