import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-expect-error - Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface Place {
  id: string
  slug: string
  name: string
  imageUrl?: string
  lat: number
  lng: number
}

interface PlacesMapProps {
  places: Place[]
}

// Orcas Island center coordinates
const ORCAS_CENTER: [number, number] = [48.65, -122.82]
const DEFAULT_ZOOM = 11

export function PlacesMap({ places }: PlacesMapProps): React.ReactElement {
  return (
    <div className="h-[600px] rounded-lg overflow-hidden border">
      <MapContainer
        center={ORCAS_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((place) => (
          <Marker key={place.id} position={[place.lat, place.lng]}>
            <Popup>
              <div className="w-48">
                {place.imageUrl && (
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-full h-32 object-cover rounded-t mb-2"
                  />
                )}
                <h3 className="font-semibold text-sm mb-2">{place.name}</h3>
                <Link
                  to={`/places/${place.slug}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
