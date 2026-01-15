# CLAUDE.md - Orcas History Project

Knowledge graph family history site for Orcas Island / Pt. Lawrence area.

## Quick Reference

```bash
npm start             # Start development server (frontend + API on port 3000)
npm run dev           # Frontend only (Vite on port 5173, no API routes)
npm run build         # Production build
npm run extract:sample # Run sample extraction
npm run extract:full   # Run full site extraction
```

## Project Overview

This project recreates and enhances a Google Sites family history website as a modern wiki-style knowledge graph. The site features ~600+ historic photos of Orcas Island history with rich metadata and relationships.

**Source site**: https://sites.google.com/view/orcashistoryresearch

---

## CURRENT STATUS & REMAINING WORK

**Last Updated**: 2026-01-14

### Progress Summary

| Phase | Task | Status | Progress |
|-------|------|--------|----------|
| 1 | Photo batch extraction | ✅ **COMPLETE** | 36/36 batches |
| 1 | Photo schema normalization | **NEEDED** | Inconsistent schemas |
| 1 | People pages extraction | In Progress | 1/20 pages |
| 1 | Topic pages extraction | Not Started | 0/21 pages |
| 1 | News pages extraction | Not Started | 0/5 pages |
| 1 | Documents page extraction | Not Started | 0/1 page |
| 2 | Download web-resolution images | ✅ **COMPLETE** | 650/650 images |
| 2 | Build high-res import tool | Pending | - |
| 3 | Build React + Vite frontend | Pending | - |
| 3 | Database seeding | Pending | - |

### Image Download Status

**COMPLETE**: All 650 images downloaded at 1280px resolution (max available from Google Sites)

**Size distribution**:
- 5-50KB: 63 images (small thumbnails/graphics in original collection)
- 50-200KB: 160 images
- 200KB+: 428 images

**Known issues in source data** (not download failures):
- Photos 0185-0192: Documents, not photos (moved to Documents section on source site)
- Photo 0460: Marked "DELETE THIS IMAGE - NOT PERTINENT" on source site
- Duplicates identified: 0156=0287, 0225=0402, 0452, 0454, 0469, 0475, 0477, 0479

---

## PHASE 1: Data Extraction

### 1A. Photo Batches ✅ COMPLETE (36/36)

**Status**: All 36 batches extracted (photos 0001-0650)
- JSON files in `extraction/data/parsed/photos-XXXX-YYYY.json`
- Notable: 0156 dup of 0287, 0225 dup of 0402, 0185-0192 moved to Documents
- Many duplicates identified in later batches (0452, 0454, 0469, 0475, 0477, 0479, etc.)
- 0460 marked "DELETE THIS IMAGE - NOT PERTINENT"

**Extraction procedure per batch** (for reference):
1. Navigate to `https://sites.google.com/view/orcashistoryresearch/photos-master-list/photos-XXXX-YYYY`
2. Extract image URLs via JS:
   ```javascript
   window.photoUrls = [];
   document.querySelectorAll('img[src*="googleusercontent"]').forEach(img => {
     if (img.src.includes('sitesv/') && !img.src.includes('=w16'))
       window.photoUrls.push(img.src.includes('=w') ? img.src.replace(/=w\d+/, '=w1280') : img.src + '=w1280');
   });
   ```
3. Get each URL: `window.photoUrls[0]` through `window.photoUrls[19]`
4. Read page content for metadata (Date, Location, People, Description, Source, hasHighRes, Notes)
5. Write JSON to `extraction/data/parsed/photos-XXXX-YYYY.json`

### 1B. People Pages (1/20 complete)

**Completed**: Carroll Nelson Culver (`people/culver-carroll-nelson.json`)

**URL pattern**: `https://sites.google.com/view/orcashistoryresearch/people/{slug}`

**Complete list of people pages to extract** (19 remaining):
```
aiken-agnes
culver-diana-aiken
culver-emma-louise
culver-fred-nelson
culver-george-nelson
culver-inez-adel
culver-jean-roethenhoefer
culver-ken
culver-mabel-florian
culver-mabel-gertrude-smith
culver-otis-henry-o-h
hall-mary-culver
hipkoe-leda-culver
hipkoe-virginia
hilbert-tbd
johanson-helge
johanson-larry
smith-dr-charles-carroll
watson-evelyn-culver
```

Note: `pt-lawrence-lodge-staff-visitors` and `pt-lawrence-lodge-visitors` are collective pages - extract as topics instead.

**Standard sections on each person page**:
- Image(s) with Captions and Image Numbers
- Connection to Pt. Lawrence (narrative)
- Immediate Family (Son of, Husband of, Father of, Brother of)
- Key Dates (birth-death range)
- About (biography)
- Miscellaneous
- Questions to Answer & Content Needed

**See**: `extraction/EXTRACTION_STRATEGY.md` for detailed JSON schema

**Output**: `extraction/data/parsed/people/{slug}.json`

### 1C. Topic Pages (0/21 complete)

**URL pattern**: `https://sites.google.com/view/orcashistoryresearch/topics/{slug}`

**Complete list of topics to extract** (21 total):
```
# From /topics/ section (19)
alderbrook-farm
blakely-mill
the-buckeye-ferry
doe-bay
early-settlers
ferries
fish-traps
fishing-derbies
jacobsen-postcards
mailboat-m-v-osage
mosquito-fleet
mt-constitution
olga
olga-cemetery
pacific-tel-tel
pt-lawrence-lodge
the-san-juan-islander
sea-acres
shorewood

# From /people/ section - collective pages (2)
pt-lawrence-lodge-staff-visitors  (URL: /people/pt-lawrence-lodge-staff-visitors)
pt-lawrence-lodge-visitors        (URL: /people/pt-lawrence-lodge-visitors)
```

**See**: `extraction/EXTRACTION_STRATEGY.md` for detailed JSON schema

**Output**: `extraction/data/parsed/topics/{slug}.json`

### 1D. News Pages (0/5 complete)

**URL pattern**: `https://sites.google.com/view/orcashistoryresearch/news-by-year/{decade}`

**Decades to extract**: `1890s`, `1900s`, `1910s`, `1920s`, `1930s`

**Structure**: Year headings → Month subheadings → Individual news items
News items contain historical newspaper clippings with entity mentions (people, places, topics)

**Output**: `extraction/data/parsed/news/{decade}.json`

### 1E. Documents Page (0/1 complete)

**URL**: `https://sites.google.com/view/orcashistoryresearch/documents-objects/documents-0001-0100`

**Contains**: ~22 document/object entries (paintings, artifacts, etc.)
**Fields**: D&O number, description, dimensions, high-res status, source, notes

**Output**: `extraction/data/parsed/documents/documents-0001-0100.json`

### 1F. Photo Schema Normalization (NEEDED)

**Issue**: The 36 photo batch files have inconsistent schemas:
- Early batches use `number`, later use `id`
- Early batches have flat arrays, later have wrapper objects
- `people` field is string in some, array in others
- `datePrecision` field missing in early batches

**Action needed**: Run normalization script to standardize all files to v2 schema.
**See**: `extraction/EXTRACTION_STRATEGY.md` for target schema

---

## PHASE 2: Image Management

### 2A. Download Web-Resolution Images

After all JSON extraction complete:

1. **Compile image list** from all photo JSON files
2. **Download each image** using the `imageUrl` field (already has `=w1280`)
3. **Save to** `extraction/data/images/XXXX.jpg` (using photo number)
4. **Verify** all ~612 images downloaded successfully

**Script approach**:
```typescript
// Read all photos-*.json files
// For each photo, fetch imageUrl and save to images/NUMBER.jpg
// Track failures for retry
```

### 2B. High-Res Import Tool

Cousin will provide folder of original high-res scans.

**Tool requirements**:
1. Scan input folder for image files
2. Match to existing photos by:
   - Filename pattern (e.g., `0001.jpg`, `photo_0001.tif`)
   - Or manual mapping file
3. Upload matched originals to Vercel Blob
4. Update database `resolutionStatus` field
5. Generate report of unmatched files

**Database fields for tracking**:
- `resolutionStatus`: 'original' | 'high' | 'web' | 'pending'
- `needsHighRes`: boolean
- `originalPath`: string (Blob URL when available)

---

## PHASE 3: Frontend & Database

### 3A. Database Seeding

After extraction complete:

1. **Run migrations** to create tables in Neon PostgreSQL
2. **Import photos** from JSON files
3. **Import people** from JSON files
4. **Import topics** from JSON files
5. **Auto-infer relationships**:
   - Parse `people` field in photos to link to Person entities
   - Parse `location` field to link to Location entities
   - Create backlinks for all entity mentions
6. **Generate review queue** for uncertain/TBD data

### 3B. React + Vite Frontend

**Setup**:
```bash
npm create vite@latest . -- --template react-ts
npm install @tanstack/react-query drizzle-orm @neondatabase/serverless
npx shadcn@latest init
```

**Core pages to build**:
| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Welcome + featured photos |
| Gallery | `/photos` | Masonry grid, filterable |
| Photo Detail | `/photos/:id` | Large image + metadata + backlinks |
| Person | `/people/:slug` | Bio + timeline + related photos |
| Topic | `/topics/:slug` | Overview + research questions + photos |
| Search | `/search` | Full-text search with filters |
| Timeline | `/timeline` | Chronological view |

**Key components**:
- `UnifiedAutocomplete` - Configurable autocomplete for entity selection
- `EditableField` - Inline editable text/textarea with save handling
- `EditableSection` - Groups editable fields with edit mode toggle
- `PhotoCarousel` - Entity page photo gallery with navigation
- `RelatedPagesSidebar` - Obsidian-style "Linked mentions"

**Visual theme**:
- B&W/sepia palette
- Photos are the star - minimal chrome
- Clean typography, readable metadata

---

## Architecture

### Tech Stack
- **Database**: Neon PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Hosting**: Vercel (frontend + Blob storage)
- **Auth**: Clerk (2 admin users) + optional site password

### Directory Structure
```
orcas-history/
├── api/                  # Vercel serverless functions
│   ├── lib/
│   │   ├── db.ts        # Database connection
│   │   ├── date-parser.ts # Date parsing with precision detection
│   │   └── patch-handler.ts # Generic PATCH handler factory
│   ├── auth/            # Login/edit authentication
│   ├── media/           # Photo CRUD endpoints
│   ├── people/          # Person CRUD endpoints
│   ├── places/          # Place CRUD endpoints
│   ├── topics/          # Topic CRUD endpoints
│   └── backlinks.ts     # Related pages API
├── db/
│   ├── schema.ts        # Drizzle ORM schema
│   └── migrations/
├── extraction/           # Site scraping tools
│   └── data/
│       ├── parsed/      # JSON data
│       └── images/      # Downloaded images
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn components
│   │   ├── forms/       # Form components (EditableField, UnifiedAutocomplete)
│   │   ├── media/       # PhotoModal, PhotoCarousel
│   │   └── layout/      # Header, Layout, navigation
│   ├── hooks/           # Shared React hooks
│   │   ├── useAutocomplete.ts    # Autocomplete state/keyboard handling
│   │   ├── useMediaLinks.ts      # Photo entity link management
│   │   ├── useModalKeyboard.ts   # Modal keyboard navigation
│   │   └── usePersonForm.ts      # Person page form handling
│   ├── pages/
│   └── lib/
│       ├── api.ts       # API client with factory pattern
│       ├── auth-context.tsx # Authentication state
│       ├── types.ts     # Centralized type definitions
│       └── timeline.ts  # Timeline markdown utilities
└── public/
```

## Entity Model

### Core Types
- **Media**: Photos, documents, objects (unified type)
- **Person**: Family members with relationships
- **Location**: Places mentioned in photos/content
- **Topic**: Historical subjects (fish traps, ferries, etc.)
- **Event**: News items with dates
- **Contributor**: Photo sources
- **ResearchQuestion**: Open questions linked to topics

### Key Relationships
- Photos link to People, Locations, Topics, Contributors
- People have family relationships (parent, spouse, sibling, child)
- All entities have backlinks (wiki-style)

### Date Handling
Dates are stored with precision flags:
- `exact`: "June 1, 1940"
- `year_month`: "June 1940"
- `year_only`: "1940"
- `range`: "1948-1949"
- `approximate`: "c. 1940"
- `unknown`: "TBD"

## Technical Notes

### Image Download Guide (CRITICAL - READ CAREFULLY)

This section documents hard-won knowledge about downloading images from Google Sites. **Future agents MUST follow this procedure exactly.**

#### URL Characteristics & Ephemerality

**CRITICAL**: Google Sites image URLs are **referrer-locked and session-bound**:

1. **Referrer Requirement**: URLs only work when the HTTP request includes the Google Sites page as the referrer. Direct browser navigation to the URL returns 403 Forbidden.

2. **Session Cookies**: The URLs require valid Google Sites session cookies. External tools like `curl` or `wget` will fail with 403 errors even with fresh URLs.

3. **Context Requirement**: The ONLY reliable way to fetch images is using JavaScript `fetch()` executed **within the Google Sites page context** (browser console or automation).

4. **Tested and Failed**:
   - `curl` with URLs → 403 Forbidden
   - Direct browser navigation to image URL → 403 Forbidden
   - `curl` with cookies extracted from browser → Still fails (referrer missing)
   - Browser fetch() from different domain → Fails

#### Maximum Image Resolution

**Confirmed maximum: 1280px width** (`=w1280` parameter)

Tested parameters (all failed except =w1280):
- `=w1920` → Error
- `=w2560` → Error
- `=w9999` → Error
- `=s0` (original) → Error
- `=w0` → Error
- `=h1280` → Error
- No parameter → Error
- `=d` (download) → Error (tested, does not work)

The 1280px limit is a Google Sites platform restriction. Real high-resolution images must come from the original source files (cousin's archive).

#### Image Download Procedure (Step-by-Step)

**Prerequisites**: Browser automation tool (mcp__claude-in-chrome or similar) with JavaScript execution capability.

**Step 1: Navigate to Photo Batch Page**
```
Navigate to: https://sites.google.com/view/orcashistoryresearch/photos-master-list/photos-XXXX-YYYY
```

**Step 2: Extract Image URLs** (execute in browser console)
```javascript
window.photoUrls = [];
document.querySelectorAll('img[src*="googleusercontent"]').forEach(img => {
  if (img.src.includes('sitesv/') && !img.src.includes('=w16'))
    window.photoUrls.push(img.src.includes('=w') ? img.src.replace(/=w\d+/, '=w1280') : img.src + '=w1280');
});
console.log(`Found ${window.photoUrls.length} images`);
```

**Step 3: Start HTTPS Receiver Server** (in terminal)
```bash
# Create and run the HTTPS image receiver
cat > /tmp/https_image_receiver.py << 'PYEOF'
#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import ssl, json, base64, os, subprocess

IMAGES_DIR = "/Users/cc7/Coding/Orcas History/orcas-history/extraction/data/images"
cert_file, key_file = '/tmp/server.pem', '/tmp/server.key'

if not os.path.exists(cert_file):
    subprocess.run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048',
        '-keyout', key_file, '-out', cert_file, '-days', '1', '-nodes',
        '-subj', '/CN=localhost'], capture_output=True)

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        img_data = base64.b64decode(data['base64'])
        with open(f"{IMAGES_DIR}/{data['photoId']}.jpg", 'wb') as f:
            f.write(img_data)
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True, 'size': len(img_data)}).encode())
        print(f"✓ {data['photoId']}.jpg ({len(img_data):,} bytes)")

    def log_message(self, *args): pass

server = HTTPServer(('127.0.0.1', 8766), Handler)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(cert_file, key_file)
server.socket = ctx.wrap_socket(server.socket, server_side=True)
print("HTTPS receiver on https://127.0.0.1:8766")
server.serve_forever()
PYEOF
python3 /tmp/https_image_receiver.py
```

**Step 4: Accept Self-Signed Certificate**
Navigate to `https://127.0.0.1:8766` in browser and accept the security warning (one-time per session).

**Step 5: Download Images via Browser** (execute in browser console)
```javascript
// Batch download function
window.downloadBatch = async (startNum) => {
  const results = [];
  for (let i = 0; i < window.photoUrls.length; i++) {
    const photoId = String(startNum + i).padStart(4, '0');
    try {
      const response = await fetch(window.photoUrls[i]);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise(r => {
        reader.onloadend = () => r(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
      const serverRes = await fetch('https://127.0.0.1:8766', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, base64 })
      });
      const result = await serverRes.json();
      results.push({ photoId, size: result.size, status: 'ok' });
      console.log(`✓ ${photoId}: ${result.size} bytes`);
    } catch (e) {
      results.push({ photoId, status: 'error', error: e.message });
      console.error(`✗ ${photoId}: ${e.message}`);
    }
  }
  return results;
};

// Execute: downloadBatch(271) for photos 0271-0290
```

**Step 6: Verify Downloads**
```bash
# Check for placeholder files (< 10KB indicates failed download)
find extraction/data/images -name "*.jpg" -size -10k
# Real images are typically 100KB-500KB+
```

#### Validation: Real vs Placeholder Images

- **Real images**: 100KB - 800KB, JPEG header starts with `FFD8FF`
- **Placeholder/Failed**: ~2.3KB, contains HTML "403 Forbidden" error page

```bash
# Quick validation script
for f in extraction/data/images/*.jpg; do
  size=$(stat -f%z "$f")
  if [ $size -lt 10000 ]; then
    echo "PLACEHOLDER: $f ($size bytes)"
  fi
done
```

#### Current Image Download Progress

**Status as of 2026-01-14**: ✅ ALL 650 IMAGES COMPLETE

All images have been downloaded at 1280px resolution (the maximum available from Google Sites).

**Known Issues in Source Data** (not download failures):
- Photos 0185-0192 moved to Documents section (not in main photo batches)
- Photo 0460 marked "DELETE THIS IMAGE - NOT PERTINENT"
- Known duplicates: 0003=0414, 0007=0258, 0030=0002, 0156=0287, 0225=0402, 0353=0213, 0355=0314, 0635=0065

#### Download Method Challenges (Important!)

**What DOESN'T work:**
1. **curl/wget** - Returns 403 Forbidden (missing referrer + session)
2. **Direct browser navigation to image URL** - Returns 403 Forbidden
3. **Canvas export** - "Tainted canvas" error (cross-origin images)
4. **HTTP localhost server** - Mixed content blocked (HTTPS page → HTTP server)
5. **HTTPS localhost with self-signed cert** - Certificate error blocks browser connection

**What DOES work:**
1. **JavaScript fetch() from within Google Sites page** - Successfully retrieves images with proper referrer
2. **Browser built-in download** (limited automation) - Manual right-click save works

**Recommended approach for remaining images:**
The HTTPS server method documented above should work IF the user manually accepts the self-signed certificate by:
1. Starting the HTTPS server: `python3 /tmp/https_image_receiver.py`
2. Opening `https://127.0.0.1:8766` in browser
3. Clicking through the certificate warning to accept
4. Then running the batch download JavaScript from the Google Sites page

Alternative: Use browser developer tools to manually trigger downloads or explore Playwright/Puppeteer with proper cookie/referrer handling.

### Image Resolution (Legacy Note)
Google Sites limits public image access to **1280px width maximum**. Larger sizes return 403 Forbidden. The =w1280 parameter gives the highest available quality.

### Person Page Structure (on source site)
- Connection to Pt. Lawrence (narrative)
- Immediate Family (structured: Son of, Husband of, Father of, Brother of)
- Key Dates (birth-death range)
- Timeline (chronological events with ages)

## Site Configuration

Branding is configurable via database (site_config table):
- `site_name`: Default "The Pt. Lawrence Project"
- `site_tagline`: "Orcas Island History & Family Archive"

This allows the site to evolve to broader "Orcas History" branding later.

## Development Conventions

### Code Style
- TypeScript strict mode
- Explicit return types on functions
- Use `unknown` instead of `any`
- Functional React components with hooks

### Data Handling
- Preserve uncertainty explicitly (TBD → "Unknown Person" entity)
- Auto-infer relationships from metadata, allow manual review
- Store original text alongside parsed/normalized values

### UI/UX
- Wiki-style navigation with click-through links
- Obsidian-style backlinks sidebar
- B&W/sepia theme - photos are the star
- Full CRUD admin via browser

---

## Frontend Architecture

### Shared Hooks Pattern

The codebase uses custom hooks to share logic across components:

| Hook | Purpose | Used By |
|------|---------|---------|
| `useAutocomplete` | Autocomplete state, filtering, keyboard nav | UnifiedAutocomplete |
| `useMediaLinks` | Photo entity link management (people, places) | PhotoModal, PhotoPage |
| `useModalKeyboard` | Escape/arrow key handling for modals | PhotoModal |
| `usePersonForm` | Person page field save handlers | PersonPage |

**UnifiedAutocomplete** consolidates three previously duplicate components:
- `AutocompleteField` - Single/multi entity selection
- `FamilyLinksField` - Family relationship editing
- `RelatedPagesField` - Cross-entity page links

### API Client Pattern

The API layer uses a factory pattern (`src/lib/api.ts`):

```typescript
// Creates typed API client for any entity type
const peopleApi = createEntityApi<Person>('people')
await peopleApi.getAll()
await peopleApi.getBySlug('culver-ken')
await peopleApi.updateField('culver-ken', 'biography', 'New bio text')
```

### Two Linking Systems

The site uses two distinct systems for connecting content:

#### 1. Explicit Links (Junction Tables)
- **Used for**: Photo-to-entity relationships (people, places, topics in photos)
- **Storage**: `media_person`, `media_place`, `media_topic` junction tables
- **Created via**: UI autocomplete fields when editing photo metadata
- **Display**: Photo carousels on entity pages show ONLY explicitly linked photos
- **Important**: Seeder does NOT auto-populate these tables. All links are created manually via the edit UI.

#### 2. Related Pages (Text-Based Bidirectional Linking)
- **Used for**: "Related Pages" sidebar on Person, Place, and Topic pages
- **Logic**: Scans ALL entity text (biography, description, contentSections) for mentions
- **Bidirectional**: If Page A mentions Page B OR Page B mentions Page A, they're related
- **Fuzzy matching**: Handles nicknames (Ken↔Kenneth, O.H.↔Otis Henry) and parenthetical forms
- **API**: `api/backlinks.ts` with `useRelatedPages()` hook
- **Does NOT include**: Photos (photos are only shown via explicit links)

```typescript
// Nickname expansion for fuzzy matching
const NICKNAMES: Record<string, string[]> = {
  kenneth: ['ken', 'kenny'],
  otis: ['o.h.', 'oh'],
  diana: ['di'],
  // etc.
}
```

### Session-Based Edit Authentication

Edit mode requires the edit password, but only once per browser session:

1. First edit click → Password modal appears
2. Password validated → Stored in `sessionStorage` as `orcas-edit-auth`
3. Subsequent edits → No password prompt (session-authenticated)
4. Browser tab closed → Must re-authenticate

**Implementation**:
- `src/lib/auth-context.tsx`: `isEditAuthenticated` state + `sessionStorage`
- `src/components/forms/EditableSection.tsx`: Checks `isEditAuthenticated` before showing modal

### Photos as Pages

Photos open as full pages, not modals:
- **Route**: `/photos/:number` → `PhotoPage.tsx`
- **Navigation**: Clicking photo in gallery or carousel navigates to page
- **Benefits**: Shareable URLs, browser back button works naturally, better SEO

**Key components**:
- `src/pages/PhotoPage.tsx` - Individual photo page with metadata editing
- `src/pages/PhotosPage.tsx` - Gallery grid (navigates to PhotoPage on click)
- `src/components/media/PhotoCarousel.tsx` - Entity page carousel (navigates to PhotoPage on click)

## Environment Variables

```
# Database
DATABASE_URL=           # Neon connection string

# Authentication
SITE_PASSWORD=          # Site access password
EDIT_PASSWORD=          # Edit mode password

# Storage
BLOB_READ_WRITE_TOKEN=  # Vercel Blob token
```

**Note**: Use `npm start` for full development (frontend + API on port 3000). Use `npm run dev` for frontend-only work (no API routes).
