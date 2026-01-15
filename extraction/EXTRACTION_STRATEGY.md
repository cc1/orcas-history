# Orcas History Extraction Strategy

## Executive Summary

This document outlines the comprehensive extraction strategy for converting the Google Sites family history website into a knowledge graph. The goal is to extract all content with rich metadata that enables cross-linking between people, locations, topics, and media.

---

## Current Extraction Status (Verified 2026-01-14)

### Phase 1: Data Extraction

| Content Type | Total | Extracted | Remaining | Status |
|--------------|-------|-----------|-----------|--------|
| Photo Batches | 36 | 36 | 0 | **COMPLETE** |
| People Pages | 22 | 1 | 21 | In Progress |
| Topic Pages | 19 | 0 | 19 | Not Started |
| News Pages | 5 | 0 | 5 | Not Started |
| Document Pages | 1 | 0 | 1 | Not Started |

### Phase 2: Image Downloads

| Status | Count |
|--------|-------|
| Images Downloaded | 650 |
| Resolution | 1280px (max available) |
| Status | **COMPLETE** |

### Data Quality Issues Found

**Schema Inconsistencies in Photo Batches:**

The 36 photo batch files have inconsistent schemas that need normalization:

| Field | Early Batches | Later Batches | Target Schema |
|-------|--------------|---------------|---------------|
| ID field | `number` | `id` | `id` |
| Wrapper | Flat array | Object with metadata | Object with metadata |
| People | String | Array | Array |
| Date precision | Not captured | `datePrecision` | `datePrecision` |
| hasHighRes | Boolean | String ("Yes"/"No"/"TBD") | String |

---

## Site Structure (Complete Inventory)

### People (22 pages)

```
URL Pattern: https://sites.google.com/view/orcashistoryresearch/people/{slug}

Slugs:
- aiken-agnes
- culver-carroll-nelson ✅ (extracted)
- culver-diana-aiken
- culver-emma-louise
- culver-fred-nelson
- culver-george-nelson
- culver-inez-adel
- culver-jean-roethenhoefer
- culver-ken
- culver-mabel-florian
- culver-mabel-gertrude-smith
- culver-otis-henry-o-h
- hall-mary-culver
- hipkoe-leda-culver
- hipkoe-virginia
- hilbert-tbd
- johanson-helge
- johanson-larry
- smith-dr-charles-carroll
- watson-evelyn-culver
- pt-lawrence-lodge-staff-visitors (collective page)
- pt-lawrence-lodge-visitors (collective page)
```

### Topics (19 pages)

```
URL Pattern: https://sites.google.com/view/orcashistoryresearch/topics/{slug}

Slugs:
- alderbrook-farm
- blakely-mill
- the-buckeye-ferry
- doe-bay
- early-settlers
- ferries
- fish-traps
- fishing-derbies
- jacobsen-postcards
- mailboat-m-v-osage
- mosquito-fleet
- mt-constitution
- olga
- olga-cemetery
- pacific-tel-tel
- pt-lawrence-lodge
- the-san-juan-islander
- sea-acres
- shorewood
```

### News by Year (5 pages)

```
URL Pattern: https://sites.google.com/view/orcashistoryresearch/news-by-year/{decade}

Decades:
- 1890s
- 1900s
- 1910s
- 1920s
- 1930s
```

### Documents & Objects (1 page)

```
URL: https://sites.google.com/view/orcashistoryresearch/documents-objects/documents-0001-0100
Contains: ~22 document/object entries
```

---

## Enhanced JSON Schemas for Knowledge Graph

The following schemas are designed to enable automatic entity linking when building the knowledge graph.

### 1. Photo Schema (Simplified - Raw Text)

During extraction, preserve raw text. Linking happens during database seeding.

```json
{
  "id": "0001",
  "imageUrl": "https://lh3.googleusercontent.com/sitesv/...=w1280",

  "date": "June 1, 1940 (Same day as 0058—note boats on dock)",
  "datePrecision": "exact",

  "location": "Point Lawrence Lodge",
  "people": "Ken Culver, Bruce Culver, TBD",
  "description": "Fishing derby weigh in 1940...",

  "source": "Ken Culver",
  "hasHighRes": true,
  "notes": "TBD",

  "duplicateOf": null
}
```

**Date precision values**: `exact`, `year_month`, `year_only`, `range`, `approximate`, `unknown`

### 2. Person Schema (Raw Text)

```json
{
  "slug": "culver-otis-henry-o-h",
  "displayName": "Otis Henry \"O.H.\" Culver",
  "sourceUrl": "https://sites.google.com/view/orcashistoryresearch/people/culver-otis-henry-o-h",

  "connectionToPtLawrence": "Narrative text describing connection...",

  "family": {
    "parents": "George Nelson Culver and Diana Louise Aikens",
    "spouses": "Mabel Gertrude Smith",
    "children": "Carroll Nelson Culver, Evelyn Louise Culver, Leda Gertrude Culver, Mabel Florian Culver, Mary Luella Culver",
    "siblings": "Fred Nelson Culver, Emma Louise Culver, Inez Adel Culver"
  },

  "keyDates": "1862-1941 (d. Age 79)",

  "timeline": [
    {"year": 1862, "age": 0, "event": "Born in Gaysville, Vermont"},
    {"year": 1870, "age": 7, "event": "Living with parents in Stockbridge, Vermont"},
    {"year": 1890, "age": 28, "event": "Arrived in Tacoma"}
  ],

  "biography": "Extended narrative biography text...",

  "miscellaneous": "Any additional notes...",

  "researchQuestions": [
    "What was his role in establishing the fish trap?",
    "When exactly did he move to Orcas Island?"
  ],

  "extractedAt": "2026-01-14"
}
```

### 3. Topic Schema (Raw Text)

```json
{
  "slug": "pt-lawrence-lodge",
  "name": "Point Lawrence Lodge",
  "sourceUrl": "https://sites.google.com/view/orcashistoryresearch/topics/pt-lawrence-lodge",

  "sections": [
    {
      "heading": "The Sign",
      "content": "Narrative about the lodge sign..."
    },
    {
      "heading": "The Lodge Building",
      "content": "Description of the building..."
    }
  ],

  "researchQuestions": [
    "When was it put in place?",
    "What years was it active?",
    "When was the overhead walkway built?"
  ],

  "extractedAt": "2026-01-14"
}
```

Note: For collective pages (`pt-lawrence-lodge-staff-visitors`, `pt-lawrence-lodge-visitors`), the `sourceUrl` will be under `/people/` not `/topics/`.

### 4. News Item Schema (Raw Text + Generated ID)

News items get synthetic IDs generated from: `{year}-{month}-{keyword}`

```json
{
  "id": "1901-08-craft-fish-trap",
  "decade": "1900s",
  "year": 1901,
  "month": "August",

  "content": "Mr. and Mrs. Craft, of Whatcom, and Mr. McDonald, state dairy commissioner, of Seattle, visited mr. Craft's fish trap at Point Lawrence, Sunday. The little trap is doing finely.",

  "sourceUrl": "https://sites.google.com/view/orcashistoryresearch/news-by-year/1900s",
  "extractedAt": "2026-01-14"
}
```

**ID generation rules:**
- Format: `{year}-{month_num}-{keyword}` (e.g., `1901-08-craft-fish-trap`)
- Month as 2-digit number (01-12)
- Keyword: 2-4 words from content, kebab-case
- If no month specified, use `00`
- If duplicate ID, append `-2`, `-3`, etc.

### 5. Document/Object Schema (Raw Text)

```json
{
  "id": "DO-0001",
  "imageUrl": "https://...",

  "description": "Painting (oil?) by Diana Aikens.",
  "dimensions": "TBD",
  "source": "Ken Culver",
  "hasHighRes": false,
  "notes": "Need to rephotograph and retouch.",

  "sourceUrl": "https://sites.google.com/view/orcashistoryresearch/documents-objects/documents-0001-0100",
  "extractedAt": "2026-01-14"
}
```

### 6. Research Questions Schema

Research questions are extracted from person and topic pages into a separate consolidated file.

```json
{
  "questions": [
    {
      "id": "rq-001",
      "question": "When was the overhead walkway built?",
      "sourceType": "topic",
      "sourceSlug": "pt-lawrence-lodge",
      "sourceUrl": "https://sites.google.com/view/orcashistoryresearch/topics/pt-lawrence-lodge"
    },
    {
      "id": "rq-002",
      "question": "What was O.H. Culver's role in establishing the fish trap?",
      "sourceType": "person",
      "sourceSlug": "culver-otis-henry-o-h",
      "sourceUrl": "https://sites.google.com/view/orcashistoryresearch/people/culver-otis-henry-o-h"
    }
  ],
  "extractedAt": "2026-01-14"
}
```

**Output**: `extraction/data/parsed/research-questions/all-questions.json`

---

## Key Decisions

These decisions were clarified during planning:

1. **Output structure**: Use subdirectories (`people/`, `topics/`, `news/`, `documents/`)
2. **Collective pages**: `pt-lawrence-lodge-staff-visitors` and `pt-lawrence-lodge-visitors` are extracted as topics, not people
3. **Entity linking**: Preserve raw text only during extraction; linking happens during database seeding
4. **Research questions**: Extract as important standalone entities
5. **News item IDs**: Generate synthetic IDs (e.g., `1901-08-craft-fish-trap`)

---

## Entity Resolution Strategy

### During Extraction: Raw Text Only

Preserve the original text exactly as written. Do NOT attempt to normalize or link during extraction.

**Example - Photo people field:**
```json
// CORRECT - raw text
"people": "Ken Culver, Bruce Culver, and an unknown visitor"

// WRONG - don't normalize during extraction
"people": [{"display": "Ken Culver", "slug": "culver-ken"}, ...]
```

### During Database Seeding: Link Resolution

Entity linking happens later during database seeding:

1. **Parse mentions** from raw text fields
2. **Match to known entities** using fuzzy matching
3. **Generate backlinks** for all confirmed matches
4. **Flag uncertain matches** for manual review

### Linking Confidence Levels (for seeding phase)

- `confirmed`: Exact match to known entity
- `likely`: Fuzzy match with high confidence
- `uncertain`: Possible match, needs review
- `unknown`: No match found (e.g., "TBD", "unknown visitor")

---

## Extraction Procedures

### People Page Extraction

1. Navigate to person page URL
2. Extract via JavaScript:
   ```javascript
   // Extract structured sections
   const sections = {};
   document.querySelectorAll('h2, h3').forEach(h => {
     const heading = h.textContent.trim();
     const content = [];
     let sibling = h.nextElementSibling;
     while (sibling && !['H2', 'H3'].includes(sibling.tagName)) {
       if (sibling.textContent.trim()) {
         content.push(sibling.textContent.trim());
       }
       sibling = sibling.nextElementSibling;
     }
     sections[heading] = content;
   });
   ```
3. Parse "Immediate Family" section for relationship structure
4. Parse "Key Dates" section for timeline
5. Extract any embedded photo numbers
6. Save to `extraction/data/parsed/people/{slug}.json`

### Topic Page Extraction

1. Navigate to topic page URL
2. Extract all headings and their content
3. Extract research questions (often in question format)
4. Identify any photo references in text
5. Save to `extraction/data/parsed/topics/{slug}.json`

### News Page Extraction

1. Navigate to news decade page
2. Extract year headings
3. Under each year, extract month subheadings
4. Extract individual news items as separate records
5. Parse for people/place/topic mentions
6. Save to `extraction/data/parsed/news/{decade}.json`

### Document Page Extraction

1. Navigate to documents page
2. Extract D&O number, description, dimensions, source
3. Extract image URLs
4. Save to `extraction/data/parsed/documents/documents-0001-0100.json`

---

## Post-Extraction Processing

### 1. Photo Schema Normalization

Run a normalization script to convert all 36 photo batch files to v2 schema:

```typescript
// pseudo-code
for each batchFile in photoBatches:
  photos = loadBatch(batchFile)
  normalizedPhotos = photos.map(photo => ({
    id: photo.number || photo.id,
    people: Array.isArray(photo.people) ? photo.people : parsePeopleString(photo.people),
    date: parseDate(photo.date),
    // ... normalize all fields
  }))
  saveBatch(batchFile, normalizedPhotos)
```

### 2. Entity Mention Extraction

After all content is extracted, run NLP-style extraction to find mentions:

1. Scan all photo descriptions for person names → link to person slugs
2. Scan all photo descriptions for location names → link to topic/location slugs
3. Scan all person timelines for location mentions
4. Scan all news items for entity mentions

### 3. Backlink Generation

Generate backlink indexes:

```json
// people-backlinks.json
{
  "culver-ken": {
    "photos": ["0351", "0358", "0359", "0360", "0361"],
    "newsItems": ["1901-08-craft"],
    "topics": ["pt-lawrence-lodge"]
  }
}
```

### 4. Duplicate Resolution

Known duplicates to handle:
- 0003 = 0414 (framed version)
- 0007 = 0258 (framed version)
- 0030 = 0002
- 0156 = 0287
- 0225 = 0402
- 0353 = 0213
- 0355 = 0314
- 0635 = 0065

Strategy: Keep canonical version, mark duplicates with `duplicateOf` field.

---

## File Organization

```
extraction/
├── data/
│   ├── parsed/
│   │   ├── photos-XXXX-YYYY.json  # 36 batch files (flat, needs normalization)
│   │   ├── people/
│   │   │   ├── culver-carroll-nelson.json ✅
│   │   │   └── ... (19 remaining)
│   │   ├── topics/
│   │   │   └── ... (21 files, includes 2 collective pages from /people/)
│   │   ├── news/
│   │   │   └── ... (5 files)
│   │   ├── documents/
│   │   │   └── documents-0001-0100.json
│   │   ├── research-questions/
│   │   │   └── all-questions.json
│   │   └── sitemap.json
│   └── images/
│       └── ... (650 files)
├── scripts/
│   ├── normalize-photos.ts
│   └── generate-backlinks.ts
└── EXTRACTION_STRATEGY.md
```

---

## Extraction Priority Order

1. **Normalize existing photo data** - Fix schema inconsistencies
2. **People pages (21)** - Core family connections
3. **Topics pages (19)** - Historical context
4. **News pages (5)** - Primary source material
5. **Documents page (1)** - Supplementary material
6. **Generate backlinks** - Cross-referencing
7. **Review/validate** - Quality assurance

---

## Estimated Effort

| Task | Pages/Items | Est. Time per | Total |
|------|-------------|---------------|-------|
| People extraction | 21 | 5-10 min | 2-3 hrs |
| Topics extraction | 19 | 5-10 min | 2-3 hrs |
| News extraction | 5 | 15-20 min | 1-2 hrs |
| Documents extraction | 1 | 10 min | 10 min |
| Photo normalization | 36 files | Script | 30 min |
| Backlink generation | - | Script | 30 min |
| **Total** | | | **6-9 hrs** |
