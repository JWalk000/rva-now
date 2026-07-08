'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  CITY_ZOOM,
  RVA_CENTER,
  USER_LOCATION_ZOOM,
  type UserLocation,
} from '@/lib/location';

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
  /** Full marker set for optional "Show all RVA" fitBounds — never used automatically. */
  allMarkers?: MapMarker[];
  selected: { type: 'event' | 'place'; id: string } | null;
  onSelect: (marker: MapMarker) => void;
  userLocation?: UserLocation | null;
  /** True while geolocation is still resolving — hold downtown center. */
  locationPending?: boolean;
  searchRadiusMiles?: number;
  recenterToken?: number;
  /** Increment to explicitly fit all RVA markers (user tap only). */
  showAllRvaToken?: number;
};

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
  allMarkers,
  userLocation,
  locationPending,
  recenterToken,
  showAllRvaToken,
}: {
  allMarkers: MapMarker[];
  userLocation?: UserLocation | null;
  locationPending?: boolean;
  recenterToken?: number;
  showAllRvaToken?: number;
}) {
  const map = useMap();
  const userCenteredRef = useRef(false);
  const lastRecenterTokenRef = useRef(0);
  const lastShowAllTokenRef = useRef(0);

  // Default: downtown Richmond at city zoom — never auto-fit markers.
  useEffect(() => {
    if (userLocation || userCenteredRef.current) return;
    map.setView(RVA_CENTER, CITY_ZOOM, { animate: false });
  }, [map, userLocation, locationPending]);

  // Center on user at first fix and on explicit recenter only (not radius/filter changes).
  useEffect(() => {
    if (!userLocation) return;

    const isRecenter = (recenterToken ?? 0) > lastRecenterTokenRef.current;
    const isFirstFix = !userCenteredRef.current;

    if (!isFirstFix && !isRecenter) return;

    if (isRecenter) lastRecenterTokenRef.current = recenterToken ?? 0;

    map.flyTo([userLocation.lat, userLocation.lng], USER_LOCATION_ZOOM, {
      animate: isRecenter,
      duration: isRecenter ? 0.8 : 0,
    });
    userCenteredRef.current = true;
  }, [map, userLocation?.lat, userLocation?.lng, recenterToken]);

  // Explicit "Show all RVA" — only path that calls fitBounds.
  useEffect(() => {
    const token = showAllRvaToken ?? 0;
    if (token === 0 || token === lastShowAllTokenRef.current) return;
    lastShowAllTokenRef.current = token;

    const valid = allMarkers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (!valid.length) {
      map.setView(RVA_CENTER, CITY_ZOOM);
      return;
    }
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], CITY_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(valid.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.08), { animate: true, maxZoom: CITY_ZOOM });
  }, [map, allMarkers, showAllRvaToken]);

  return null;
}

export default function MapView({
  markers,
  allMarkers,
  selected,
  onSelect,
  userLocation,
  locationPending = false,
  searchRadiusMiles = 5,
  recenterToken = 0,
  showAllRvaToken = 0,
}: Props) {
  const icons = useMemo(() => {
    return {
      event: makeIcon('event', false),
      place: makeIcon('place', false),
      eventActive: makeIcon('event', true),
      placeActive: makeIcon('place', true),
    };
  }, []);

  const boundsMarkers = allMarkers ?? markers;
  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : RVA_CENTER;
  const initialZoom = userLocation ? USER_LOCATION_ZOOM : CITY_ZOOM;
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
        allMarkers={boundsMarkers}
        userLocation={userLocation}
        locationPending={locationPending}
        recenterToken={recenterToken}
        showAllRvaToken={showAllRvaToken}
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
