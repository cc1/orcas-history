import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'
import { handlePageState } from '@/components/layout/PageStates'
import { PhotoCarousel } from '@/components/media/PhotoCarousel'
import { InTheNews } from '@/components/entity/InTheNews'
import { useTopicBySlug } from '@/hooks/useData'
import { updateTopicField } from '@/lib/api'
import type { RelatedPage } from '@/lib/api'

export function TopicPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()
  const { data: topic, loading, error } = useTopicBySlug(slug || null)

  // Handle loading/error/not-found states
  const pageState = handlePageState({ loading, error, data: topic, entityType: 'topic' })
  if (pageState) return pageState

  const sections = (topic.contentSections || []) as Array<{ heading: string; content: string }>
  const researchQuestions = (topic.researchQuestions || []) as string[]
  const linkedPhotos = topic.linkedPhotos || []
  const relatedPages = (topic.relatedPages || []) as RelatedPage[]

  const handleSaveRelatedPages = async (pages: RelatedPage[]) => {
    if (!slug) return
    try {
      await updateTopicField(slug, 'relatedPages', pages)
    } catch (error) {
      console.error('Failed to save related pages:', error)
    }
  }

  return (
    <div className="container px-4 py-6">
      {/* Photo Carousel - First thing on the page */}
      {linkedPhotos.length > 0 && (
        <PhotoCarousel photos={linkedPhotos} title="Photos" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image (only show if no carousel) */}
          {linkedPhotos.length === 0 && topic.imageUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={topic.imageUrl}
                alt={topic.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">{topic.name}</h1>
          </div>

          {/* Description */}
          {topic.description && (
            <section>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{topic.description}</p>
            </section>
          )}

          {/* Content Sections */}
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl font-semibold mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </section>
          ))}

          {/* Research Questions */}
          {researchQuestions.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Research Questions</h2>
              <ul className="space-y-2">
                {researchQuestions.map((question, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">?</span>
                    <span className="text-muted-foreground">{question}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* In the News */}
          <InTheNews entityType="topic" slug={slug || ''} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BacklinksSidebar
            entityType="topic"
            entityId={slug || ''}
            relatedPages={relatedPages}
            onSaveRelatedPages={handleSaveRelatedPages}
          />
        </div>
      </div>
    </div>
  )
}
