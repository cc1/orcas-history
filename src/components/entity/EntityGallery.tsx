import { Link } from 'react-router-dom'

interface Entity {
  id: string
  slug: string
  name: string
  imageUrl?: string
}

interface EntityGalleryProps {
  entities: Entity[]
  basePath: string
}

export function EntityGallery({ entities, basePath }: EntityGalleryProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {entities.map((entity) => (
        <Link
          key={entity.id}
          to={`${basePath}/${entity.slug}`}
          className="entity-card group"
        >
          {entity.imageUrl ? (
            <img
              src={entity.imageUrl}
              alt={entity.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-4xl text-muted-foreground">
                {entity.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="name-overlay">
            <h3>{entity.name}</h3>
          </div>
        </Link>
      ))}
    </div>
  )
}
