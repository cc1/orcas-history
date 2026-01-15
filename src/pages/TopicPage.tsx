import { useParams } from 'react-router-dom'
import { BacklinksSidebar } from '@/components/layout/BacklinksSidebar'

// Mock data - will be replaced with actual data fetching
const mockTopic = {
  slug: 'fish-traps',
  name: 'Fish Traps',
  imageUrl: 'https://picsum.photos/seed/topic1/800/600',
  sections: [
    {
      heading: 'Overview',
      content: 'Fish traps were an important part of the early fishing industry in the San Juan Islands. These structures were used to catch salmon and other fish as they migrated through the waters around Orcas Island.',
    },
    {
      heading: 'The Culver Family Connection',
      content: 'O.H. Culver was involved in fish trap operations near Point Lawrence. The family maintained several traps in the waters around the eastern end of Orcas Island.',
    },
    {
      heading: 'Decline',
      content: 'Fish traps were eventually outlawed in Washington State as concerns grew about their impact on salmon populations. The last traps in the San Juan Islands were removed in the mid-20th century.',
    },
  ],
  researchQuestions: [
    'How many fish traps did the Culver family operate?',
    'What type of fish were primarily caught in the traps?',
    'When were fish traps banned in Washington State?',
  ],
}

export function TopicPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>()

  // In production, fetch topic data based on slug
  const topic = mockTopic

  return (
    <div className="container px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Image */}
          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
            <img
              src={topic.imageUrl}
              alt={topic.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">{topic.name}</h1>
          </div>

          {/* Content Sections */}
          {topic.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-xl font-semibold mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            </section>
          ))}

          {/* Research Questions */}
          {topic.researchQuestions.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-semibold mb-3">Research Questions</h2>
              <ul className="space-y-2">
                {topic.researchQuestions.map((question, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">?</span>
                    <span className="text-muted-foreground">{question}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <BacklinksSidebar entityType="topic" entityId={slug || ''} />
        </div>
      </div>
    </div>
  )
}
