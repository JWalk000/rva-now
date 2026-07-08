// Richmond, VA neighborhood centroids for ingest geo-inference
const RVA_NEIGHBORHOODS: { name: string; lat: number; lng: number }[] = [
  { name: 'Downtown', lat: 37.538, lng: -77.434 },
  { name: 'The Fan', lat: 37.555, lng: -77.463 },
  { name: "Scott's Addition", lat: 37.566, lng: -77.472 },
  { name: 'Church Hill', lat: 37.530, lng: -77.419 },
  { name: 'Manchester', lat: 37.522, lng: -77.446 },
  { name: 'Carytown', lat: 37.554, lng: -77.486 },
];

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function inferNeighborhoodFromCoords(lat: number, lng: number) {
  let best = RVA_NEIGHBORHOODS[0];
  let bestDist = Infinity;
  for (const n of RVA_NEIGHBORHOODS) {
    const d = distanceKm(lat, lng, n.lat, n.lng);
    if (d < bestDist) {
      bestDist = d;
      best = n;
    }
  }
  return best.name;
}

export function inferNeighborhoodFromVenue(venue: string, city?: string) {
  const text = `${venue} ${city ?? ''}`.toLowerCase();
  if (text.includes('carytown')) return 'Carytown';
  if (text.includes('church hill')) return 'Church Hill';
  if (text.includes("scott")) return "Scott's Addition";
  if (text.includes('manchester')) return 'Manchester';
  if (text.includes('fan')) return 'The Fan';
  if (text.includes('richmond') || text.includes('downtown') || text.includes('broad')) return 'Downtown';
  return 'Downtown';
}
