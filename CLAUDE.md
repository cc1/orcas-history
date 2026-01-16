# CLAUDE.md - Orcas History Project

Knowledge graph family history site for Orcas Island / Pt. Lawrence area.

## Quick Reference

```bash
npm start             # Start development server (frontend + API on port 3000)
npm run dev           # Frontend only (Vite on port 5173, no API routes)
npm run build         # Production build
```

## Project Overview

This project recreates and enhances a Google Sites family history website as a modern wiki-style knowledge graph. The site features ~650 historic photos of Orcas Island history with rich metadata and relationships.

**Source site**: https://sites.google.com/view/orcashistoryresearch

---

## Architecture

### Tech Stack
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Frontend**: React + Vite + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Hosting**: Vercel (frontend + serverless API)
- **Auth**: Session-based edit password

### Directory Structure
```
orcas-history/
├── api/                  # Vercel serverless functions
│   ├── _lib/            # Shared utilities (underscore excludes from function count)
│   │   ├── db.ts        # Database connection
│   │   ├── date-parser.ts # Date parsing with precision detection
│   │   ├── image-utils.ts # Image URL helpers
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
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn components
│   │   ├── forms/       # Form components (EditableField, UnifiedAutocomplete)
│   │   ├── media/       # PhotoModal, PhotoCarousel
│   │   ├── entity/      # Entity-specific components (InTheNews)
│   │   └── layout/      # Header, Layout, PageStates, navigation
│   ├── hooks/           # Shared React hooks
│   │   ├── useAutocomplete.ts    # Autocomplete state/keyboard handling
│   │   ├── useData.ts            # Data fetching hooks
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

---

## Entity Model

### Core Types
- **Media**: Photos, documents, objects (unified type)
- **Person**: Family members with relationships
- **Place**: Locations mentioned in photos/content
- **Topic**: Historical subjects (fish traps, ferries, etc.)
- **Event**: News items with dates

### Key Relationships
- Photos link to People, Places, Topics via junction tables
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

---

## Frontend Architecture

### Shared Components

**PageStates** (`src/components/layout/PageStates.tsx`) provides consistent loading/error/not-found handling:

```typescript
// Usage in any entity page:
const pageState = handlePageState({ loading, error, data: person, entityType: 'person' })
if (pageState) return pageState
// ... render page content
```

Used by: `PersonPage`, `TopicPage`, `PlacePage`, `PhotoPage`

### Shared Hooks

| Hook | Purpose | Used By |
|------|---------|---------|
| `useAutocomplete` | Autocomplete state, filtering, keyboard nav | UnifiedAutocomplete |
| `useData` | Entity data fetching (person, topic, place, media) | All entity pages |
| `useMediaLinks` | Photo entity link management (people, places) | PhotoModal, PhotoPage |
| `useModalKeyboard` | Escape/arrow key handling for modals | PhotoModal |
| `usePersonForm` | Person page field save handlers | PersonPage |

### API Client Pattern

The API layer uses a factory pattern (`src/lib/api.ts`):

```typescript
const peopleApi = createEntityApi<Person>('people')
await peopleApi.getAll()
await peopleApi.getBySlug('culver-ken')
await peopleApi.updateField('culver-ken', 'biography', 'New bio text')
```

### Two Linking Systems

#### 1. Explicit Links (Junction Tables)
- **Used for**: Photo-to-entity relationships (people, places in photos)
- **Storage**: `media_person`, `media_place` junction tables
- **Created via**: UI autocomplete fields when editing photo metadata
- **Display**: Photo carousels on entity pages show ONLY explicitly linked photos

#### 2. Related Pages (Text-Based Bidirectional Linking)
- **Used for**: "Related Pages" sidebar on Person, Place, and Topic pages
- **Logic**: Scans ALL entity text (biography, description, contentSections) for mentions
- **Bidirectional**: If Page A mentions Page B OR Page B mentions Page A, they're related
- **Fuzzy matching**: Handles nicknames (Ken↔Kenneth, O.H.↔Otis Henry)
- **API**: `api/backlinks.ts`

### Session-Based Edit Authentication

Edit mode requires the edit password, but only once per browser session:

1. First edit click → Password modal appears
2. Password validated → Stored in `sessionStorage` as `orcas-edit-auth`
3. Subsequent edits → No password prompt
4. Browser tab closed → Must re-authenticate

---

## Development Conventions

### Code Style
- TypeScript strict mode
- Explicit return types on functions
- Use `unknown` instead of `any`
- Functional React components with hooks

### UI/UX
- Wiki-style navigation with click-through links
- Obsidian-style backlinks sidebar
- B&W/sepia theme - photos are the star
- Full CRUD admin via browser

---

## Environment Variables

```
DATABASE_URL=           # Neon connection string
SITE_PASSWORD=          # Site access password
EDIT_PASSWORD=          # Edit mode password
BLOB_READ_WRITE_TOKEN=  # Vercel Blob token (if using blob storage)
```

**Note**: Use `npm start` for full development (frontend + API on port 3000). Use `npm run dev` for frontend-only work (no API routes).
