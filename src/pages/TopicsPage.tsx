import { EntityGallery } from '@/components/entity/EntityGallery'

// Mock data - will be replaced with actual data fetching
const mockTopics = [
  { id: '1', slug: 'fish-traps', name: 'Fish Traps', imageUrl: 'https://picsum.photos/seed/t1/400/300' },
  { id: '2', slug: 'fishing-derbies', name: 'Fishing Derbies', imageUrl: 'https://picsum.photos/seed/t2/400/300' },
  { id: '3', slug: 'ferries', name: 'Ferries', imageUrl: 'https://picsum.photos/seed/t3/400/300' },
  { id: '4', slug: 'the-buckeye-ferry', name: 'The Buckeye Ferry', imageUrl: 'https://picsum.photos/seed/t4/400/300' },
  { id: '5', slug: 'mosquito-fleet', name: 'Mosquito Fleet', imageUrl: 'https://picsum.photos/seed/t5/400/300' },
  { id: '6', slug: 'mailboat-m-v-osage', name: 'Mailboat M.V. Osage', imageUrl: 'https://picsum.photos/seed/t6/400/300' },
  { id: '7', slug: 'early-settlers', name: 'Early Settlers', imageUrl: 'https://picsum.photos/seed/t7/400/300' },
  { id: '8', slug: 'jacobsen-postcards', name: 'Jacobsen Postcards', imageUrl: 'https://picsum.photos/seed/t8/400/300' },
  { id: '9', slug: 'pacific-tel-tel', name: 'Pacific Tel & Tel', imageUrl: 'https://picsum.photos/seed/t9/400/300' },
  { id: '10', slug: 'the-san-juan-islander', name: 'The San Juan Islander', imageUrl: 'https://picsum.photos/seed/t10/400/300' },
]

export function TopicsPage(): React.ReactElement {
  return (
    <div className="container px-4 py-6">
      <h1 className="font-serif text-2xl font-bold mb-6">Topics</h1>
      <EntityGallery
        entities={mockTopics}
        basePath="/topics"
      />
    </div>
  )
}
