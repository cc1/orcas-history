import { EntityGallery } from '@/components/entity/EntityGallery'

// Mock data - will be replaced with actual data fetching
const mockPeople = [
  { id: '1', slug: 'culver-carroll-nelson', name: 'Carroll Nelson Culver', imageUrl: 'https://picsum.photos/seed/p1/400/300' },
  { id: '2', slug: 'culver-ken', name: 'Ken Culver', imageUrl: 'https://picsum.photos/seed/p2/400/300' },
  { id: '3', slug: 'culver-otis-henry-o-h', name: 'Otis Henry "O.H." Culver', imageUrl: 'https://picsum.photos/seed/p3/400/300' },
  { id: '4', slug: 'culver-mabel-gertrude-smith', name: 'Mabel Gertrude Smith Culver', imageUrl: 'https://picsum.photos/seed/p4/400/300' },
  { id: '5', slug: 'culver-jean-roethenhoefer', name: 'Jean Roethenhoefer Culver', imageUrl: 'https://picsum.photos/seed/p5/400/300' },
  { id: '6', slug: 'aiken-agnes', name: 'Agnes Aiken', imageUrl: 'https://picsum.photos/seed/p6/400/300' },
]

export function PeoplePage(): React.ReactElement {
  return (
    <div className="container px-4 py-6">
      <h1 className="font-serif text-2xl font-bold mb-6">People</h1>
      <EntityGallery
        entities={mockPeople}
        basePath="/people"
      />
    </div>
  )
}
