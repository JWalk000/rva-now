'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { zoomForRadiusMiles, type UserLocation } from '@/lib/location';

export type MapMarker = {
  type: 'event' | 'place';
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  href: string | null;
  category?: string;
  distanceMiles?: number;
};

type Props = {
  markers: MapMarker[];
  selected: { type: 'event' | 'place'; id: string } | null;
  onSelect: (marker: MapMarker) => void;
  userLocation?: UserLocation | null;
  /** True while geolocation is still resolving — skip fitBounds on markers. */
  locationPending?: boolean;
  searchRadiusMiles?: number;
  recenterToken?: number;
};

const RVA_CENTER: [number, number] = [37.5407, -77.436];
const DEFAULT_ZOOM = 13;

function makeIcon(type: 'event' | 'place', active: boolean) {
  const color = active ? '#C44B2F' : type === 'event' ? '#D4922A' : '#2F6B52';
  const glyph = type === 'event' ? '★' : '●';
  return L.divIcon({
    className: 'citipilot-marker',
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${active ? 36 : 28}px;height:${active ? 36 : 28}px;
      border-radius:9999px;background:${color};color:#fff;
      font-size:${active ? 14 : 12}px;font-weight:800;
      box-shadow:0 8px 20px rgba(0,0,0,.45);
      border:2px solid rgba(255,255,255,.85);
      transform:translate(-50%,-50%);
    ">${glyph}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function MapCamera({
  markers,
  userLocation,
  locationPending,
  searchRadiusMiles = 5,
  recenterToken,
}: {
  markers: MapMarker[];
  userLocation?: UserLocation | null;
  locationPending?: boolean;
  searchRadiusMiles?: number;
  recenterToken?: number;
}) {
  const map = useMap();
  const userCenteredRef = useRef(false);

  // Center on user whenever we have a location (initial fix, recenter, radius change).
  useEffect(() => {
    if (!userLocation) return;
    const zoom = zoomForRadiusMiles(searchRadiusMiles);
    map.setView([userLocation.lat, userLocation.lng], zoom, { animate: userCenteredRef.current });
    userCenteredRef.current = true;
  }, [map, userLocation?.lat, userLocation?.lng, searchRadiusMiles]);

  // Explicit recenter button — always animate.
  useEffect(() => {
    if (!userLocation || (recenterToken ?? 0) === 0) return;
    const zoom = zoomForRadiusMiles(searchRadiusMiles);
    map.setView([userLocation.lat, userLocation.lng], zoom, { animate: true });
    userCenteredRef.current = true;
  }, [map, userLocation, recenterToken, searchRadiusMiles]);

  // Without user location: wait for geolocation before fitting markers (prevents Ashland jump).
  useEffect(() => {
    if (userLocation || userCenteredRef.current) return;
    if (locationPending) {
      map.setView(RVA_CENTER, DEFAULT_ZOOM, { animate: false });
      return;
    }

    const valid = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (!valid.length) {
      map.setView(RVA_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(valid.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.12), { animate: false, maxZoom: 13 });
  }, [map, markers, userLocation, locationPending]);

  return null;
}

export default function MapView({
  markers,
  selected,
  onSelect,
  userLocation,
  locationPending = false,
  searchRadiusMiles = 5,
  recenterToken = 0,
}: Props) {
  const icons = useMemo(() => {
    return {
      event: makeIcon('event', false),
      place: makeIcon('place', false),
      eventActive: makeIcon('event', true),
      placeActive: makeIcon('place', true),
    };
  }, []);

  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : RVA_CENTER;
  const initialZoom = userLocation ? zoomForRadiusMiles(searchRadiusMiles) : DEFAULT_ZOOM;
  const radiusMeters = searchRadiusMiles * 1609.34;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className="h-full w-full"
      scrollWheelZoom
      style={{ background: '#0B0A10' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapCamera
        markers={markers}
        userLocation={userLocation}
        locationPending={locationPending}
        searchRadiusMiles={searchRadiusMiles}
        recenterToken={recenterToken}
      />
      {userLocation ? (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radiusMeters}
            pathOptions={{
              color: '#3B82F6',
              weight: 2,
              fillColor: '#3B82F6',
              fillOpacity: 0.08,
              dashArray: '6 4',
            }}
          />
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={10}
            pathOptions={{
              color: '#fff',
              weight: 3,
              fillColor: '#3B82F6',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="min-w-[120px] text-[#14121A]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#3B82F6]">You</p>
                <p className="mt-0.5 text-sm font-extrabold">Your location</p>
              </div>
            </Popup>
          </CircleMarker>
        </>
      ) : null}
      {markers.map((marker) => {
        if (!Number.isFinite(marker.lat) || !Number.isFinite(marker.lng)) return null;
        const active = selected?.id === marker.id && selected?.type === marker.type;
        const icon =
          marker.type === 'event'
            ? active
              ? icons.eventActive
              : icons.event
            : active
              ? icons.placeActive
              : icons.place;

        return (
          <Marker
            key={`${marker.type}-${marker.id}`}
            position={[marker.lat, marker.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(marker),
            }}
          >
            <Popup>
              <div className="min-w-[160px] text-[#14121A]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#C44B2F]">
                  {marker.type === 'event' ? 'Event' : 'Place'}
                </p>
                <p className="mt-0.5 text-sm font-extrabold leading-snug">{marker.title}</p>
                <p className="mt-0.5 text-xs text-[#5A5560]">{marker.subtitle}</p>
                {typeof marker.distanceMiles === 'number' ? (
                  <p className="mt-1 text-xs font-bold text-[#C44B2F]">
                    {marker.distanceMiles < 0.1
                      ? '<0.1 mi away'
                      : marker.distanceMiles < 10
                        ? `${marker.distanceMiles.toFixed(1)} mi away`
                        : `${Math.round(marker.distanceMiles)} mi away`}
                  </p>
                ) : null}
                {marker.href ? (
                  <Link href={marker.href} className="mt-2 inline-block text-xs font-bold text-[#C44B2F]">
                    View details →
                  </Link>
                ) : null}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
