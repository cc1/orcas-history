import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum, jsonb, decimal, type AnyPgColumn } from 'drizzle-orm/pg-core';

// Enums
export const mediaCategoryEnum = pgEnum('media_category', ['photo', 'document', 'object']);
export const resolutionStatusEnum = pgEnum('resolution_status', ['original', 'high', 'web', 'pending']);
export const datePrecisionEnum = pgEnum('date_precision', ['exact', 'year_month', 'year_only', 'range', 'approximate', 'unknown']);
export const relationshipTypeEnum = pgEnum('relationship_type', ['parent', 'child', 'spouse', 'sibling']);
export const confidenceEnum = pgEnum('confidence', ['confirmed', 'likely', 'uncertain']);

// Site configuration (flexible key-value for branding, settings)
export const siteConfig = pgTable('site_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Date values with precision tracking
export const dateValue = pgTable('date_value', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalText: varchar('original_text', { length: 200 }).notNull(),
  yearStart: integer('year_start'),
  yearEnd: integer('year_end'),
  month: integer('month'),
  day: integer('day'),
  precision: datePrecisionEnum('precision').notNull().default('unknown'),
});

// Media (photos, documents, objects)
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 10 }).notNull().unique(), // "0001", "0002"
  category: mediaCategoryEnum('category').notNull().default('photo'),
  title: varchar('title', { length: 500 }),
  description: text('description'),

  // Image storage
  googleUrl: text('google_url'), // Original Google Sites URL
  webImagePath: varchar('web_image_path', { length: 500 }), // Downloaded 1280px version
  originalImagePath: varchar('original_image_path', { length: 500 }), // High-res from cousin

  resolutionStatus: resolutionStatusEnum('resolution_status').notNull().default('pending'),
  needsHighRes: boolean('needs_high_res').default(false),

  // Metadata
  dateId: uuid('date_id').references(() => dateValue.id),
  dateSort: integer('date_sort'), // YYYYMMDD for sorting (19400601)
  needsDate: boolean('needs_date').default(false), // Flag for photos needing date info
  locationText: text('location_text'), // Raw location text from source
  sourceText: text('source_text'), // Source/contributor text from extraction
  sourcePageUrl: text('source_page_url'),
  externalUrl: text('external_url'), // e.g., Washington Rural Heritage link
  hasHighRes: boolean('has_high_res').default(false), // Noted in source data

  // Duplicate tracking
  isDuplicate: boolean('is_duplicate').default(false),
  duplicateOfId: uuid('duplicate_of_id').references((): AnyPgColumn => media.id),
  duplicateNote: text('duplicate_note'),

  notRelevant: boolean('not_relevant').default(false),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// People
export const person = pgTable('person', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  displayName: varchar('display_name', { length: 300 }).notNull(),
  biography: text('biography'),
  connectionToPtLawrence: text('connection_to_pt_lawrence'),
  miscellaneous: text('miscellaneous'),
  keyDatesText: varchar('key_dates_text', { length: 100 }), // "1904-1995 (d. Age 91)"

  birthYear: integer('birth_year'),
  deathYear: integer('death_year'),
  birthDateId: uuid('birth_date_id').references(() => dateValue.id),
  deathDateId: uuid('death_date_id').references(() => dateValue.id),

  // Structured data as JSONB
  familyData: jsonb('family_data'), // { parents: [], spouses: [], children: [], siblings: [] }
  timeline: jsonb('timeline'), // [{ year, age, event }]
  relatedPages: jsonb('related_pages'), // [{ type: 'person'|'place'|'topic', slug, name }]

  headerImageId: uuid('header_image_id').references(() => media.id),
  imageUrl: text('image_url'), // Representative image URL
  sourcePageUrl: text('source_page_url'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Person relationships (family connections)
export const personRelationship = pgTable('person_relationship', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull().references(() => person.id),
  relatedPersonId: uuid('related_person_id').notNull().references(() => person.id),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Places (geographic locations with coordinates)
export const place = pgTable('place', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: varchar('name', { length: 300 }).notNull(),
  description: text('description'),

  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  // Structured content as JSONB
  contentSections: jsonb('content_sections'), // [{ heading, content }]
  researchQuestions: jsonb('research_questions'), // ["question1", "question2"]
  relatedPages: jsonb('related_pages'), // [{ type: 'person'|'place'|'topic', slug, name }]

  imageUrl: text('image_url'), // Representative image URL
  sourcePageUrl: text('source_page_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Topics (non-geographic subjects)
export const topic = pgTable('topic', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  name: varchar('name', { length: 300 }).notNull(),
  description: text('description'),

  // Structured content as JSONB
  contentSections: jsonb('content_sections'), // [{ heading, content }]
  researchQuestions: jsonb('research_questions'), // ["question1", "question2"]
  relatedPages: jsonb('related_pages'), // [{ type: 'person'|'place'|'topic', slug, name }]

  imageUrl: text('image_url'), // Representative image URL
  sourcePageUrl: text('source_page_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contributors (photo sources)
export const contributor = pgTable('contributor', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 300 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// News Items (individual parsed clippings from newspaper archives)
export const newsItem = pgTable('news_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: varchar('item_id', { length: 100 }).notNull().unique(), // "1901-08-craft-fish-trap"
  decade: varchar('decade', { length: 10 }).notNull(), // "1900s"
  year: integer('year').notNull(),
  month: varchar('month', { length: 20 }), // "August" or null
  monthSort: integer('month_sort'), // 1-12 for sorting

  content: text('content').notNull(),

  sourceUrl: text('source_url'),
  sourcePageUrl: text('source_page_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Research questions
export const researchQuestion = pgTable('research_question', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionText: text('question_text').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('open'), // open, answered, partially_answered
  answer: text('answer'),
  topicId: uuid('topic_id').references(() => topic.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// === Junction Tables (Many-to-Many) ===

// Media ↔ People
export const mediaPerson = pgTable('media_person', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').notNull().references(() => media.id),
  personId: uuid('person_id').notNull().references(() => person.id),
  confidence: confidenceEnum('confidence').default('confirmed'),
  notes: text('notes'),
});

// Media ↔ Places
export const mediaPlace = pgTable('media_place', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').notNull().references(() => media.id),
  placeId: uuid('place_id').notNull().references(() => place.id),
  confidence: confidenceEnum('confidence').default('confirmed'),
});

// Media ↔ Topics
export const mediaTopic = pgTable('media_topic', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').notNull().references(() => media.id),
  topicId: uuid('topic_id').notNull().references(() => topic.id),
  confidence: confidenceEnum('confidence').default('confirmed'),
});

// Media ↔ Contributors
export const mediaContributor = pgTable('media_contributor', {
  id: uuid('id').primaryKey().defaultRandom(),
  mediaId: uuid('media_id').notNull().references(() => media.id),
  contributorId: uuid('contributor_id').notNull().references(() => contributor.id),
});

// News ↔ People
export const newsPerson = pgTable('news_person', {
  id: uuid('id').primaryKey().defaultRandom(),
  newsItemId: uuid('news_item_id').notNull().references(() => newsItem.id),
  personId: uuid('person_id').notNull().references(() => person.id),
});

// News ↔ Places
export const newsPlace = pgTable('news_place', {
  id: uuid('id').primaryKey().defaultRandom(),
  newsItemId: uuid('news_item_id').notNull().references(() => newsItem.id),
  placeId: uuid('place_id').notNull().references(() => place.id),
});

// News ↔ Topics
export const newsTopic = pgTable('news_topic', {
  id: uuid('id').primaryKey().defaultRandom(),
  newsItemId: uuid('news_item_id').notNull().references(() => newsItem.id),
  topicId: uuid('topic_id').notNull().references(() => topic.id),
});

// Generic entity mention (for backlinks)
export const entityMention = pgTable('entity_mention', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // media, person, location, topic, event
  sourceId: uuid('source_id').notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: uuid('target_id').notNull(),
  context: text('context'), // Snippet showing mention
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
