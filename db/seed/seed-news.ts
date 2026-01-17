/**
 * Seed news items from extracted JSON files
 * Parses raw content into individual news items
 */
import fs from 'fs'
import path from 'path'
import { db } from '../index'
import { newsItem, newsPerson, newsPlace, newsTopic } from '../schema'
import { slugify } from './utils'

interface ExtractedNews {
  slug: string
  name: string
  decade?: string
  sourceUrl?: string
  yearsIncluded?: string[]
  rawContent?: string
  // Pre-parsed news items (alternative to rawContent)
  newsItems?: Array<{
    year: number
    month?: string
    content: string
    linkedPeople?: string[]
    linkedPlaces?: string[]
    linkedTopics?: string[]
  }>
  notes?: string
  extractedAt?: string
}

interface ParsedNewsItem {
  year: number
  month: string | null
  monthSort: number | null
  content: string
}

const MONTH_TO_SORT: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4,
  may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12
}

/**
 * Parse raw news content into individual items
 */
function parseNewsContent(rawContent: string): ParsedNewsItem[] {
  const items: ParsedNewsItem[] = []
  const lines = rawContent.split('\n')

  let currentYear: number | null = null
  let currentMonth: string | null = null
  let currentContent: string[] = []

  const flushItem = () => {
    if (currentYear && currentContent.length > 0) {
      const content = currentContent.join(' ').trim()
      if (content.length > 0) {
        items.push({
          year: currentYear,
          month: currentMonth,
          monthSort: currentMonth ? MONTH_TO_SORT[currentMonth.toLowerCase()] || null : null,
          content
        })
      }
    }
    currentContent = []
  }

  for (const line of lines) {
    const trimmedLine = line.trim()

    if (!trimmedLine) {
      // Empty line might indicate end of an item
      flushItem()
      continue
    }

    // Check if this is a year header (just a 4-digit year)
    const yearMatch = trimmedLine.match(/^(\d{4})$/)
    if (yearMatch) {
      flushItem()
      currentYear = parseInt(yearMatch[1])
      currentMonth = null
      continue
    }

    // Check if this is a month header
    const monthMatch = trimmedLine.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)$/i)
    if (monthMatch) {
      flushItem()
      currentMonth = monthMatch[1]
      continue
    }

    // This is content - add to current item
    currentContent.push(trimmedLine)
  }

  // Flush any remaining item
  flushItem()

  return items
}

/**
 * Generate a unique item ID from content
 */
function generateItemId(decade: string, year: number, month: string | null, content: string, index: number): string {
  // Create a short slug from first few words of content
  const words = content.split(/\s+/).slice(0, 4).join('-')
  const slug = slugify(words).substring(0, 30)
  const monthPart = month ? `-${String(MONTH_TO_SORT[month.toLowerCase()] || 0).padStart(2, '0')}` : ''
  return `${year}${monthPart}-${slug}-${index}`
}

export async function seedNews(): Promise<void> {
  console.log('Seeding news items...')

  // Clear ALL existing news items first to remove any old/corrupted data
  // This is necessary because itemIds may have changed between extractions
  // Must delete junction tables first due to foreign key constraints
  console.log('Clearing existing news items and links...')
  await db.delete(newsPerson)
  await db.delete(newsPlace)
  await db.delete(newsTopic)
  await db.delete(newsItem)
  console.log('Done.')

  const newsDir = path.join(process.cwd(), 'extraction/data/parsed/news')

  if (!fs.existsSync(newsDir)) {
    console.log('No news directory found, skipping...')
    return
  }

  const files = fs.readdirSync(newsDir)
    .filter(f => f.endsWith('.json'))
    .sort()

  let totalItems = 0
  let itemsByDecade: Record<string, number> = {}

  for (const file of files) {
    const filePath = path.join(newsDir, file)
    const data: ExtractedNews = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Get decade from filename or data
    const decade = data.decade || file.replace('.json', '')

    // Get parsed items - either pre-parsed or parse from rawContent
    let parsedItems: ParsedNewsItem[]
    if (data.newsItems && data.newsItems.length > 0) {
      // Use pre-parsed items
      parsedItems = data.newsItems.map(item => ({
        year: item.year,
        month: item.month || null,
        monthSort: item.month ? MONTH_TO_SORT[item.month.toLowerCase()] || null : null,
        content: item.content
      }))
    } else if (data.rawContent) {
      // Parse raw content
      parsedItems = parseNewsContent(data.rawContent)
    } else {
      console.log(`  Skipping ${file} - no content`)
      continue
    }

    itemsByDecade[decade] = 0

    // Insert each parsed item
    for (let i = 0; i < parsedItems.length; i++) {
      const item = parsedItems[i]
      const itemId = generateItemId(decade, item.year, item.month, item.content, i)

      await db.insert(newsItem).values({
        itemId,
        decade,
        year: item.year,
        month: item.month,
        monthSort: item.monthSort,
        content: item.content,
        sourcePageUrl: data.sourceUrl
      }).onConflictDoUpdate({
        target: newsItem.itemId,
        set: {
          decade,
          year: item.year,
          month: item.month,
          monthSort: item.monthSort,
          content: item.content,
          sourcePageUrl: data.sourceUrl,
          updatedAt: new Date()
        }
      })

      totalItems++
      itemsByDecade[decade]++
    }
  }

  console.log(`Seeded ${totalItems} news items:`)
  for (const [decade, count] of Object.entries(itemsByDecade)) {
    console.log(`  ${decade}: ${count} items`)
  }
}
