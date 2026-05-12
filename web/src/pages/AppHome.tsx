import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { clearSession, getSession } from '../lib/session'
import { latLng, divIcon, type LatLngTuple } from 'leaflet'
import { MapContainer, Marker, Popup, ScaleControl, TileLayer, useMap } from 'react-leaflet'
import './app-home.css'

type MapStyle = 'colorful' | 'light' | 'dark'

function Recenter({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, map, zoom])
  return null
}

function FitToRadius({ center, radiusMeters, maxZoom }: { center: LatLngTuple; radiusMeters: number; maxZoom: number }) {
  const map = useMap()

  useEffect(() => {
    // Use LatLng#toBounds so we don't depend on map projection internals.
    const bounds = latLng(center[0], center[1]).toBounds(radiusMeters * 2)
    map.fitBounds(bounds, { padding: [56, 56], maxZoom, animate: true })
  }, [center, map, maxZoom, radiusMeters])

  return null
}

function MapButtons({
  onLocate,
  isLocating,
  mapStyle,
  onToggleStyle,
}: {
  onLocate: () => void
  isLocating: boolean
  mapStyle: MapStyle
  onToggleStyle: () => void
}) {
  const map = useMap()

  return (
    <div className="appHome__mapButtons" aria-label="Map controls">
      <button
        type="button"
        className="appHome__mapBtn"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        title="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        className="appHome__mapBtn"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        title="Zoom out"
      >
        –
      </button>
      <div className="appHome__mapBtnSep" aria-hidden />
      <button
        type="button"
        className="appHome__mapBtn appHome__mapBtnLocate"
        onClick={onLocate}
        aria-label="Locate me"
        title="Locate me"
        disabled={isLocating}
      >
        {isLocating ? (
          <svg className="appHome__mapBtnIcon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3a9 9 0 1 0 9 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg className="appHome__mapBtnIcon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2v4M12 18v4M2 12h4M18 12h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="1.3" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className="appHome__mapBtnSep" aria-hidden />
      <button
        type="button"
        className="appHome__mapBtn appHome__mapBtnStyle"
        onClick={onToggleStyle}
        aria-label="Toggle map style"
        title={`Map style: ${mapStyle} (click to change)`}
      >
        <svg className="appHome__mapBtnIcon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3l8 4.5v9L12 21 4 16.5v-9L12 3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 3v18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.45" />
          <path
            d="M4 7.5l8 4.5 8-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            opacity="0.75"
          />
        </svg>
      </button>
    </div>
  )
}

export function AppHome() {
  const { user } = useMemo(() => getSession(), [])
  const [center, setCenter] = useState<LatLngTuple>([19.076, 72.8777])
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'denied' | 'error'>('idle')
  const [locationMsg, setLocationMsg] = useState<string | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyle>(() => {
    const raw = localStorage.getItem('buzzit.mapStyle')
    if (raw === 'light' || raw === 'dark' || raw === 'colorful') return raw
    return 'colorful'
  })

  if (!user) return <Navigate to="/" replace />

  useEffect(() => {
    localStorage.setItem('buzzit.mapStyle', mapStyle)
  }, [mapStyle])

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error')
      setLocationMsg('Location is not supported in this browser.')
      return
    }

    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude])
        setLocationStatus('ready')
        setLocationMsg(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('denied')
          setLocationMsg('Location permission denied. Showing default area.')
          return
        }
        setLocationStatus('error')
        setLocationMsg('Could not get your location. Showing default area.')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10_000 },
    )
  }, [])

  const locateMe = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error')
      setLocationMsg('Location is not supported in this browser.')
      return
    }

    setLocationStatus('loading')
    setLocationMsg(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude])
        setLocationStatus('ready')
        setLocationMsg(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('denied')
          setLocationMsg('Location permission denied.')
          return
        }
        setLocationStatus('error')
        setLocationMsg('Could not get your location.')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  }

  const userPin = useMemo(
    () =>
      divIcon({
        className: 'buzzitMarker',
        html: '<div class="buzzitMarker__dot"></div><div class="buzzitMarker__ring"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [],
  )

  const tile = useMemo(() => {
    switch (mapStyle) {
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      case 'light':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      case 'colorful':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
    }
  }, [mapStyle])

  const toggleMapStyle = () => {
    setMapStyle((s) => (s === 'colorful' ? 'light' : s === 'light' ? 'dark' : 'colorful'))
  }

  return (
    <div className="appHome">
      <div className="appHome__top">
        <div className="appHome__brand">BuzzIT</div>
        <div className="appHome__actions">
          <Link to="/" style={{ color: 'var(--text-secondary)' }}>
            Back to landing
          </Link>
          <button
            type="button"
            className="appHome__signOut"
            onClick={() => {
              clearSession()
              window.location.href = '/'
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="appHome__hero">
        <h1>Welcome{user.name ? `, ${user.name}` : ''}.</h1>
        <p>
          Here’s the app “home” starting point. Next we’ll use this map for nearby parties/events with custom markers and a feed.
        </p>
      </div>

      <section className="appHome__mapCard" aria-label="Map">
        <div className="appHome__mapHeader">
          <h2 className="appHome__mapTitle">Map</h2>
          <p className="appHome__mapHint">
            {locationStatus === 'loading'
              ? 'Finding your location…'
              : locationStatus === 'ready'
                ? 'Centered on your area.'
                : locationStatus === 'denied' || locationStatus === 'error'
                  ? locationMsg ?? 'Showing default area.'
                  : 'Showing default area.'}
          </p>
        </div>
        <div className="appHome__mapWrap">
          <MapContainer className="appHome__map" center={center} zoom={17} scrollWheelZoom zoomControl={false}>
            <TileLayer attribution={tile.attribution} url={tile.url} />
            <ScaleControl position="bottomleft" />
            <MapButtons
              onLocate={locateMe}
              isLocating={locationStatus === 'loading'}
              mapStyle={mapStyle}
              onToggleStyle={toggleMapStyle}
            />
            {locationStatus === 'ready' ? (
              <FitToRadius center={center} radiusMeters={50} maxZoom={19} />
            ) : (
              <Recenter center={center} zoom={17} />
            )}
            <Marker position={center} icon={userPin}>
              <Popup>{locationStatus === 'ready' ? 'You are here.' : 'BuzzIT demo area.'}</Popup>
            </Marker>
          </MapContainer>
        </div>
      </section>
    </div>
  )
}

