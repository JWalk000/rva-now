'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { UserLocation } from '@/lib/location';

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
  /** When true, center on user and zoom nearby instead of fitting all markers. */
  focusNearby?: boolean;
  recenterToken?: number;
};

const RVA_CENTER: [number, number] = [37.5407, -77.436];
const NEARBY_ZOOM = 13;

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
  focusNearby,
  recenterToken,
}: {
  markers: MapMarker[];
  userLocation?: UserLocation | null;
  focusNearby?: boolean;
  recenterToken?: number;
}) {
  const map = useMap();

  // Recenter button / fresh location request.
  useEffect(() => {
    if (!userLocation || (recenterToken ?? 0) === 0) return;
    map.setView([userLocation.lat, userLocation.lng], NEARBY_ZOOM, { animate: true });
  }, [map, userLocation, recenterToken]);

  // Nearby mode toggled on — center on user.
  useEffect(() => {
    if (!userLocation || !focusNearby) return;
    map.setView([userLocation.lat, userLocation.lng], NEARBY_ZOOM, { animate: true });
  }, [map, userLocation, focusNearby]);

  // First time we get a user location, center on them.
  useEffect(() => {
    if (!userLocation) return;
    map.setView([userLocation.lat, userLocation.lng], NEARBY_ZOOM, { animate: true });
    // Only run when userLocation identity/coords change, not on marker/filter updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, userLocation?.lat, userLocation?.lng]);

  // Without user location, fit visible markers or fall back to Richmond.
  useEffect(() => {
    if (userLocation) return;

    const valid = markers.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
    if (!valid.length) {
      map.setView(RVA_CENTER, 12);
      return;
    }
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(valid.map((m) => [m.lat, m.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.18), { animate: false });
  }, [map, markers, userLocation]);

  return null;
}

export default function MapView({
  markers,
  selected,
  onSelect,
  userLocation,
  focusNearby,
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

  return (
    <MapContainer
      center={RVA_CENTER}
      zoom={12}
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
        focusNearby={focusNearby}
        recenterToken={recenterToken}
      />
      {userLocation ? (
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
