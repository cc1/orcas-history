# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Pt. Lawrence Project** - A knowledge graph family history site for Orcas Island. Features historical photos, people, places, topics, and newspaper clippings from the Point Lawrence area.

## Commands

```bash
# Development
npm run dev          # Vite dev server
npm run start        # Vercel dev (includes API routes)
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check

# Database (Drizzle + Neon PostgreSQL)
npm run db:generate  # Generate migrations from schema
npm run db:push      # Push schema changes directly
npm run db:migrate   # Run migrations
npm run db:studio    # Drizzle Studio GUI
npm run db:seed      # Run all seeders
npm run db:seed -- media   # Run specific seeder (media, people, places, topics, news, links)

# Utilities
npm run blob:upload  # Upload images to Vercel Blob Storage
```

## Architecture

### Stack
- **Frontend**: Vite + React 19 + React Router 7 + Tailwind CSS 4
- **Backend**: Vercel Serverless Functions (TypeScript)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Auth**: Neon Auth (@neondatabase/neon-js)
- **Storage**: Vercel Blob (images), Google Sites URLs (legacy)

### Directory Structure

```
api/                    # Vercel serverless functions
├── _lib/               # Shared utilities (db, patch-handler, image-utils)
├── media.ts            # GET /api/media (paginated list)
├── media/[number].ts   # GET/PATCH/POST /api/media/:number
├── people.ts           # GET /api/people
├── people/[slug].ts    # GET/PATCH /api/people/:slug
├── places.ts           # GET /api/places
├── places/[slug].ts    # GET/PATCH /api/places/:slug
├── topics.ts           # GET /api/topics
├── topics/[slug].ts    # GET/PATCH /api/topics/:slug
├── news.ts             # GET /api/news
└── backlinks.ts        # GET /api/backlinks (entity relationships)

db/
├── schema.ts           # Drizzle schema (entities, junctions, enums)
├── seed.ts             # Main seeder orchestrator
├── seed/               # Individual seeders (seed-media.ts, seed-people.ts, etc.)
└── migrations/

src/
├── lib/
│   ├── api.ts          # API client with factory pattern
│   ├── types.ts        # Shared TypeScript types
│   ├── auth-context.tsx
│   └── neon-auth.ts
├── hooks/
│   ├── useData.ts      # Generic data fetching hooks
│   ├── usePersonForm.ts
│   └── useAutocomplete.ts
├── pages/              # Route pages (PhotosPage, PersonPage, etc.)
└── components/
    ├── layout/         # Layout, Header, TabNav, PageStates, BacklinksSidebar
    ├── forms/          # EditableField, MarkdownField, AutocompleteField
    ├── media/          # PhotoCarousel, MasonryGrid, FilterBar
    └── entity/         # EntityGallery, InTheNews
```

### Key Patterns

**Entity Types**: Three main entity types (person, place, topic) share common patterns:
- Slug-based routing (`/people/:slug`, `/places/:slug`, `/topics/:slug`)
- Same API structure (GET all, GET by slug, PATCH fields)
- Junction tables for media links (mediaPerson, mediaPlace, mediaTopic)
- JSONB fields for flexible data (relatedPages, contentSections, familyData)

**Two Linking Systems** (important!):
1. **Explicit Links** - Junction tables (`media_person`, `media_place`) for photo-to-entity relationships. Created via UI autocomplete. Photo carousels show ONLY explicitly linked photos.
2. **Related Pages** - Text-based bidirectional linking for sidebar. Scans entity text for mentions with fuzzy nickname matching (Ken↔Kenneth). API: `api/backlinks.ts`

**Edit Authentication**: Session-based password stored in `sessionStorage` as `orcas-edit-auth`. First edit prompts for password, subsequent edits in same session don't.

**Shared Utilities**:
- `src/lib/api.ts` - Factory pattern: `createEntityApi<T>()` for typed entity APIs
- `api/_lib/patch-handler.ts` - Shared PATCH route handler with field mapping
- `src/hooks/useData.ts` - Generic hooks: `useEntityBySlug<T>()`, `useInfiniteMedia()`
- `src/components/layout/PageStates.tsx` - `handlePageState()` for loading/error/not-found

### Database Schema

Core entities: `media`, `person`, `place`, `topic`, `newsItem`
Supporting: `dateValue` (structured dates), `contributor`, `researchQuestion`
Junctions: `mediaPerson`, `mediaPlace`, `mediaTopic`, `newsPerson`, `newsPlace`, `newsTopic`
Enums: `mediaCategoryEnum`, `datePrecisionEnum`, `relationshipTypeEnum`, `confidenceEnum`

### Environment Variables

```bash
DATABASE_URL=          # Neon PostgreSQL connection string
BLOB_READ_WRITE_TOKEN= # Vercel Blob storage token
```

## Code Conventions

- TypeScript strict mode, explicit return types
- Use `unknown` instead of `any`
- Functional React components with hooks
- Use Set/Map for O(1) lookups in hot paths (see `useAutocomplete.ts`)
- Parallelize independent DB queries with `Promise.all` (see `api/media/[number].ts`)
- Batch inserts instead of loops with individual awaits

## Known Issues

- **PhotoModal** (`src/components/media/PhotoModal.tsx`) has `console.log` placeholder save handlers - not fully implemented
- **Bundle size** exceeds 500KB warning - consider code-splitting if adding features

## Data Sources

The `extraction/` directory contains data from the original Google Sites page:
- `extraction/plp/` - Downloaded HTML files
- `extraction/data/images/` - Photo files (650 images at 1280px)
- `extraction/data/blob-urls.json` - Vercel Blob URL mappings
