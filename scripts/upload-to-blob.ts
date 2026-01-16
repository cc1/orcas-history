/**
 * Upload all photos from local filesystem to Vercel Blob storage
 *
 * Run with: npx tsx scripts/upload-to-blob.ts
 *
 * Requires BLOB_READ_WRITE_TOKEN in .env.local
 */
import { put, list } from '@vercel/blob'
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const IMAGES_DIR = './extraction/data/images'
const OUTPUT_FILE = './extraction/data/blob-urls.json'

interface UploadResult {
  photoNumber: string
  blobUrl: string
  size: number
}

interface UploadSummary {
  uploadedAt: string
  totalCount: number
  totalSizeBytes: number
  photos: Record<string, string> // photoNumber -> blobUrl
}

async function getExistingBlobs(): Promise<Set<string>> {
  console.log('Checking for existing uploads...')
  const existing = new Set<string>()

  try {
    let cursor: string | undefined
    do {
      const response = await list({ cursor, limit: 1000 })
      for (const blob of response.blobs) {
        // Extract photo number from blob pathname (e.g., "photos/0001.jpg" -> "0001")
        const match = blob.pathname.match(/photos\/(\d{4})\.jpg/)
        if (match) {
          existing.add(match[1])
        }
      }
      cursor = response.cursor
    } while (cursor)

    console.log(`Found ${existing.size} existing uploads`)
  } catch (error) {
    console.log('No existing blobs found or error listing:', error)
  }

  return existing
}

async function uploadImage(filepath: string, photoNumber: string): Promise<UploadResult> {
  const fileContent = await readFile(filepath)

  const blob = await put(`photos/${photoNumber}.jpg`, fileContent, {
    access: 'public',
    contentType: 'image/jpeg',
  })

  return {
    photoNumber,
    blobUrl: blob.url,
    size: fileContent.length
  }
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('Error: BLOB_READ_WRITE_TOKEN not set in .env.local')
    console.log('\nTo get a token:')
    console.log('1. Go to Vercel Dashboard → Your Project → Storage')
    console.log('2. Create a Blob Store (or use existing)')
    console.log('3. Copy the read/write token to .env.local')
    process.exit(1)
  }

  // Get list of local images
  const files = await readdir(IMAGES_DIR)
  const imageFiles = files
    .filter(f => f.match(/^\d{4}\.jpg$/))
    .sort()

  console.log(`Found ${imageFiles.length} local images`)

  // Check existing uploads to avoid re-uploading
  const existing = await getExistingBlobs()
  const toUpload = imageFiles.filter(f => !existing.has(f.replace('.jpg', '')))

  if (toUpload.length === 0) {
    console.log('All images already uploaded!')
    return
  }

  console.log(`Uploading ${toUpload.length} new images...`)

  const results: UploadResult[] = []
  let uploaded = 0
  let failed = 0

  for (const filename of toUpload) {
    const photoNumber = filename.replace('.jpg', '')
    const filepath = join(IMAGES_DIR, filename)

    try {
      const result = await uploadImage(filepath, photoNumber)
      results.push(result)
      uploaded++

      // Progress indicator every 10 images
      if (uploaded % 10 === 0) {
        console.log(`Uploaded ${uploaded}/${toUpload.length} (${photoNumber})`)
      }
    } catch (error) {
      console.error(`Failed to upload ${filename}:`, error)
      failed++
    }
  }

  // Create summary
  const summary: UploadSummary = {
    uploadedAt: new Date().toISOString(),
    totalCount: results.length,
    totalSizeBytes: results.reduce((sum, r) => sum + r.size, 0),
    photos: {}
  }

  for (const result of results) {
    summary.photos[result.photoNumber] = result.blobUrl
  }

  // Save URL mapping
  await writeFile(OUTPUT_FILE, JSON.stringify(summary, null, 2))

  console.log('\n=== Upload Complete ===')
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Failed: ${failed}`)
  console.log(`Total size: ${(summary.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`)
  console.log(`URL mapping saved to: ${OUTPUT_FILE}`)
}

main().catch(console.error)
