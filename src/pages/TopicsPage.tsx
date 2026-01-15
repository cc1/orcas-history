import { useMemo } from 'react'
import { EntityGallery } from '@/components/entity/EntityGallery'
import { useTopics } from '@/hooks/useData'

export function TopicsPage(): React.ReactElement {
  const { data: topics, loading, error } = useTopics()

  // Transform API data to match EntityGallery expectations
  const transformedTopics = useMemo(() => {
    if (!topics) return []

    return topics.map(topic => ({
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      imageUrl: topic.imageUrl || undefined, // No placeholder - show initial instead
    }))
  }, [topics])

  return (
    <div className="container px-4 py-6">
      <h1 className="font-serif text-2xl font-bold mb-6">Topics</h1>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading topics...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error loading topics: {error.message}</div>
        </div>
      )}

      {!loading && !error && transformedTopics.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No topics found</div>
        </div>
      )}

      {!loading && !error && transformedTopics.length > 0 && (
        <EntityGallery
          entities={transformedTopics}
          basePath="/topics"
        />
      )}
    </div>
  )
}
