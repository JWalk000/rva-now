export const neighborhoods = [
  "Downtown",
  "The Fan",
  "Scott's Addition",
  "Church Hill",
  "Manchester",
  "Carytown"
];

export const vibes = [
  "Live Music",
  "Food & Drink",
  "Family",
  "Markets",
  "Nightlife",
  "Fitness",
  "Free",
  "Networking"
];

export const events = [
  {
    id: "rva-001",
    title: "Sunset on Brown's Island",
    neighborhood: "Downtown",
    vibe: ["Live Music", "Free"],
    day: "Friday",
    time: "7:00 PM",
    venue: "Brown's Island",
    price: "Free",
    featured: true,
    hiddenGem: false,
    lat: 37.533,
    lng: -77.441,
    source: "Community",
    description: "Riverfront concert energy with food trucks and downtown views."
  },
  {
    id: "rva-002",
    title: "Carytown Dessert Crawl",
    neighborhood: "Carytown",
    vibe: ["Food & Drink", "Date Night"],
    day: "Saturday",
    time: "2:00 PM",
    venue: "Carytown Mile",
    price: "$15+",
    featured: true,
    hiddenGem: true,
    lat: 37.553,
    lng: -77.484,
    source: "Local Business",
    description: "Self-guided dessert stops, small-shop promos, and shareable finds."
  },
  {
    id: "rva-003",
    title: "Church Hill Makers Market",
    neighborhood: "Church Hill",
    vibe: ["Markets", "Family"],
    day: "Sunday",
    time: "11:00 AM",
    venue: "Jefferson Park",
    price: "Free",
    featured: false,
    hiddenGem: true,
    lat: 37.531,
    lng: -77.421,
    source: "Organizer Submission",
    description: "Handmade goods, local coffee, and neighborhood vendors."
  },
  {
    id: "rva-004",
    title: "Scott's Addition Rooftop Mixer",
    neighborhood: "Scott's Addition",
    vibe: ["Networking", "Nightlife"],
    day: "Thursday",
    time: "6:30 PM",
    venue: "Rooftop Lounge",
    price: "$25",
    featured: true,
    hiddenGem: false,
    lat: 37.568,
    lng: -77.469,
    source: "Partner Venue",
    description: "Post-work networking with founders, creatives, and operators."
  },
  {
    id: "rva-005",
    title: "Fan District Porch Sessions",
    neighborhood: "The Fan",
    vibe: ["Live Music", "Free"],
    day: "Saturday",
    time: "5:00 PM",
    venue: "Hanover Ave",
    price: "Free",
    featured: false,
    hiddenGem: true,
    lat: 37.555,
    lng: -77.463,
    source: "Community",
    description: "Acoustic sets and neighborhood foot traffic in a walkable pocket."
  },
  {
    id: "rva-006",
    title: "Manchester Morning Run Club",
    neighborhood: "Manchester",
    vibe: ["Fitness", "Free"],
    day: "Wednesday",
    time: "6:30 AM",
    venue: "Floodwall Parking Lot",
    price: "Free",
    featured: false,
    hiddenGem: false,
    lat: 37.522,
    lng: -77.449,
    source: "Community",
    description: "Low-pressure social run with coffee stop after the route."
  }
];

export const lists = [
  {
    title: "Perfect Date Night in RVA",
    by: "RVA Now",
    items: ["Carytown Dessert Crawl", "Scott's Addition Rooftop Mixer"]
  },
  {
    title: "Free This Weekend",
    by: "RVA Now",
    items: ["Sunset on Brown's Island", "Church Hill Makers Market", "Fan District Porch Sessions"]
  },
  {
    title: "Hidden Local Gems",
    by: "Neighborhood Curators",
    items: ["Carytown Dessert Crawl", "Church Hill Makers Market", "Fan District Porch Sessions"]
  }
];
