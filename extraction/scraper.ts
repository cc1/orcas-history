import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { SiteMap, ExtractionReport } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://sites.google.com/view/orcashistoryresearch';

interface PageInfo {
  url: string;
  title: string;
  type: 'home' | 'photo_batch' | 'person' | 'topic' | 'news' | 'document' | 'other';
}

/**
 * Classify a page URL by type
 */
function classifyPage(url: string, title: string): PageInfo['type'] {
  if (url === BASE_URL || url === `${BASE_URL}/home`) return 'home';
  if (url.includes('/photos-master-list/photos-')) return 'photo_batch';
  if (url.includes('/people/')) return 'person';
  if (url.includes('/news/')) return 'news';
  if (url.includes('/documents/')) return 'document';
  if (url.includes('/topics/') || url.includes('/locations/')) return 'topic';
  return 'other';
}

/**
 * Extract all navigation links from a page
 */
async function extractNavLinks(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const links: string[] = [];
    const anchors = document.querySelectorAll('a[href*="orcashistoryresearch"]');
    anchors.forEach(a => {
      const href = (a as HTMLAnchorElement).href;
      if (href && !href.includes('#') && !links.includes(href)) {
        links.push(href);
      }
    });
    return links;
  });
}

/**
 * Extract photo data from a photo batch page
 */
async function extractPhotoBatch(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    const photos: unknown[] = [];

    // Find all images in the main content
    const mainContent = document.querySelector('main, [role="main"]');
    if (!mainContent) return photos;

    const images = mainContent.querySelectorAll('img');
    const textContent = mainContent.textContent || '';

    // Split content by photo numbers
    const sections = textContent.split(/(?=\b\d{4}\b(?:\s|$))/);

    images.forEach((img, index) => {
      const src = img.src;
      if (!src || !src.includes('googleusercontent.com')) return;

      // Find matching metadata section
      // Photo numbers are 4 digits like 0001, 0002
      const photoNumberMatch = sections.find(s => {
        const match = s.match(/^\s*(\d{4})\s/);
        return match && parseInt(match[1]) === index + 1;
      });

      const photo: Record<string, unknown> = {
        imageUrl: src.replace(/=[wsh]\d*$/, '=s0'),
        index: index,
      };

      if (photoNumberMatch) {
        // Extract number
        const numMatch = photoNumberMatch.match(/^\s*(\d{4})/);
        if (numMatch) photo.number = numMatch[1];

        // Extract metadata fields
        const dateMatch = photoNumberMatch.match(/Date:\s*([^\n]+)/i);
        if (dateMatch) photo.date = dateMatch[1].trim();

        const locationMatch = photoNumberMatch.match(/Location:\s*([^\n]+)/i);
        if (locationMatch) photo.location = locationMatch[1].trim();

        const peopleMatch = photoNumberMatch.match(/People:\s*([^\n]+)/i);
        if (peopleMatch) photo.people = peopleMatch[1].trim();

        const descMatch = photoNumberMatch.match(/Description:\s*([^\n]+)/i);
        if (descMatch) photo.description = descMatch[1].trim();

        const sourceMatch = photoNumberMatch.match(/Source:\s*([^\n]+)/i);
        if (sourceMatch) photo.source = sourceMatch[1].trim();
      }

      photos.push(photo);
    });

    return photos;
  });
}

/**
 * Extract person data from a person page
 */
async function extractPerson(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const mainContent = document.querySelector('main, [role="main"]');
    if (!mainContent) return {};

    const text = mainContent.textContent || '';
    const h1 = document.querySelector('h1');

    const person: Record<string, unknown> = {
      displayName: h1?.textContent?.trim() || '',
      rawText: text,
    };

    // Extract connection to Pt. Lawrence
    const connectionMatch = text.match(/Connection to Pt\. Lawrence\s*\n\s*([^\n]+)/i);
    if (connectionMatch) person.connectionToPtLawrence = connectionMatch[1].trim();

    // Extract key dates
    const keyDatesMatch = text.match(/Key Dates:\s*([^\n]+)/i);
    if (keyDatesMatch) person.keyDates = keyDatesMatch[1].trim();

    // Extract family relationships
    const family: Record<string, string[]> = {};

    const parentMatch = text.match(/(?:Son of|Daughter of|Child of):\s*([^\n]+)/i);
    if (parentMatch) {
      family.parents = parentMatch[1].split(/,\s*and\s*|,\s*/).map(s => s.trim());
    }

    const spouseMatch = text.match(/(?:Husband of|Wife of|Spouse of|Married to):\s*([^\n]+)/i);
    if (spouseMatch) {
      family.spouses = spouseMatch[1].split(/,\s*/).map(s => s.trim());
    }

    const childMatch = text.match(/(?:Father of|Mother of|Parent of):\s*([^\n]+)/i);
    if (childMatch) {
      family.children = childMatch[1].split(/,\s*/).map(s => s.trim());
    }

    const siblingMatch = text.match(/(?:Brother of|Sister of|Sibling of):\s*([^\n]+)/i);
    if (siblingMatch) {
      family.siblings = siblingMatch[1].split(/,\s*and\s*|,\s*/).map(s => s.trim());
    }

    if (Object.keys(family).length > 0) {
      person.family = family;
    }

    // Get header image
    const headerImg = mainContent.querySelector('img');
    if (headerImg) {
      person.headerImageUrl = headerImg.src.replace(/=[wsh]\d*$/, '=s0');
    }

    return person;
  });
}

/**
 * Save HTML snapshot of a page
 */
async function saveHtmlSnapshot(page: Page, url: string, rawDir: string): Promise<string> {
  const html = await page.content();
  const slug = url.split('/').pop() || 'index';
  const filename = `${slug}.html`;
  const filepath = path.join(rawDir, filename);
  fs.writeFileSync(filepath, html);
  return filepath;
}

/**
 * Main scraper function
 */
async function scrape(options: { sample?: boolean; full?: boolean }): Promise<void> {
  const dataDir = path.join(__dirname, 'data');
  const rawDir = path.join(dataDir, 'raw');
  const parsedDir = path.join(dataDir, 'parsed');
  const reportsDir = path.join(__dirname, 'reports');

  // Ensure directories exist
  [rawDir, parsedDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const report: ExtractionReport = {
    startedAt: new Date().toISOString(),
    completedAt: '',
    pagesProcessed: 0,
    mediaExtracted: 0,
    peopleExtracted: 0,
    topicsExtracted: 0,
    eventsExtracted: 0,
    errors: [],
    warnings: [],
  };

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  const visitedUrls = new Set<string>();
  const pagesToVisit: string[] = [BASE_URL];
  const siteMap: SiteMap = {
    pages: [],
    extractedAt: new Date().toISOString(),
  };

  console.log('Starting extraction...');
  console.log(`Mode: ${options.sample ? 'SAMPLE' : 'FULL'}`);

  // Crawl pages
  while (pagesToVisit.length > 0) {
    const url = pagesToVisit.shift()!;

    if (visitedUrls.has(url)) continue;
    visitedUrls.add(url);

    // Sample mode: limit to specific pages
    if (options.sample) {
      const isPhotoBatch = url.includes('/photos-0001-0010') || url.includes('/photos-0011-0020');
      const isPerson = url.includes('/people/');
      const isTopic = url.includes('/topics/') || url.includes('/locations/');
      const isHome = url === BASE_URL || url.includes('/home');

      if (!isPhotoBatch && !isPerson && !isTopic && !isHome) {
        continue;
      }

      // Limit people and topics in sample mode
      if (isPerson && siteMap.pages.filter(p => p.type === 'person').length >= 2) continue;
      if (isTopic && siteMap.pages.filter(p => p.type === 'topic').length >= 1) continue;
    }

    try {
      console.log(`\nProcessing: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Get page title
      const title = await page.title();
      const pageType = classifyPage(url, title);

      // Save HTML snapshot
      await saveHtmlSnapshot(page, url, rawDir);

      // Add to sitemap
      siteMap.pages.push({ url, title, type: pageType });
      report.pagesProcessed++;

      console.log(`  Type: ${pageType}`);
      console.log(`  Title: ${title}`);

      // Extract data based on page type
      if (pageType === 'photo_batch') {
        const photos = await extractPhotoBatch(page);
        const slug = url.split('/').pop() || 'photos';
        const outputPath = path.join(parsedDir, `${slug}.json`);
        fs.writeFileSync(outputPath, JSON.stringify({
          pageUrl: url,
          extractedAt: new Date().toISOString(),
          photos,
        }, null, 2));
        report.mediaExtracted += photos.length;
        console.log(`  Extracted ${photos.length} photos`);
      }

      if (pageType === 'person') {
        const person = await extractPerson(page);
        const slug = url.split('/').pop() || 'person';
        person.slug = slug;
        person.pageUrl = url;
        const outputPath = path.join(parsedDir, `person-${slug}.json`);
        fs.writeFileSync(outputPath, JSON.stringify({
          pageUrl: url,
          extractedAt: new Date().toISOString(),
          person,
        }, null, 2));
        report.peopleExtracted++;
        console.log(`  Extracted person: ${person.displayName}`);
      }

      // Discover new links
      const links = await extractNavLinks(page);
      for (const link of links) {
        if (!visitedUrls.has(link) && !pagesToVisit.includes(link)) {
          pagesToVisit.push(link);
        }
      }

      console.log(`  Found ${links.length} links`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      report.errors.push({ url, error: message });
      console.error(`  ERROR: ${message}`);
    }

    // Small delay between pages
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await browser.close();

  // Save sitemap
  const sitemapPath = path.join(parsedDir, 'sitemap.json');
  fs.writeFileSync(sitemapPath, JSON.stringify(siteMap, null, 2));

  // Save report
  report.completedAt = new Date().toISOString();
  const reportPath = path.join(reportsDir, `extraction-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n========================================');
  console.log('Extraction Complete!');
  console.log('========================================');
  console.log(`Pages processed: ${report.pagesProcessed}`);
  console.log(`Media extracted: ${report.mediaExtracted}`);
  console.log(`People extracted: ${report.peopleExtracted}`);
  console.log(`Topics extracted: ${report.topicsExtracted}`);
  console.log(`Events extracted: ${report.eventsExtracted}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(`Sitemap saved: ${sitemapPath}`);
  console.log(`Report saved: ${reportPath}`);
}

// Parse command line args
const args = process.argv.slice(2);
const options = {
  sample: args.includes('--sample'),
  full: args.includes('--full'),
};

if (!options.sample && !options.full) {
  options.sample = true; // Default to sample mode
}

scrape(options).catch(console.error);
