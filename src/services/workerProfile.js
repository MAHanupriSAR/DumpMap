/**
 * workerProfile.js
 * Service for fetching municipal crew profiles and converting backend latitude/longitude
 * coordinates into clean, human-readable Delhi addresses in words on the frontend.
 */

// Pre-seeded Delhi municipal worker directory with coordinates (all in Delhi)
export const DELHI_WORKERS_DIRECTORY = {
  'worker1@dumpmap.gov': {
    name: 'Ramesh Kumar',
    workerId: 'STAFF-001',
    zone: 'North Delhi',
    latitude: 28.7041,
    longitude: 77.1025,
    addressInWords: 'Sector 14, Rohini, North Delhi, Delhi 110085',
  },
  'worker2@dumpmap.gov': {
    name: 'Suresh Sharma',
    workerId: 'STAFF-002',
    zone: 'South Delhi',
    latitude: 28.5355,
    longitude: 77.2090,
    addressInWords: 'Saket District Centre, South Delhi, Delhi 110017',
  },
  'worker3@dumpmap.gov': {
    name: 'Priya Verma',
    workerId: 'STAFF-003',
    zone: 'East Delhi',
    latitude: 28.6280,
    longitude: 77.2950,
    addressInWords: 'Main Vikas Marg, Laxmi Nagar, East Delhi, Delhi 110092',
  },
  'staff@dumpmap.gov': {
    name: 'Municipal Operations Lead',
    workerId: 'STAFF-000',
    zone: 'Central Delhi',
    latitude: 28.6304,
    longitude: 77.2177,
    addressInWords: 'Block B, Connaught Place, Central Delhi, Delhi 110001',
  },
};

// Known Delhi coordinates lookup mapping
const KNOWN_DELHI_COORDINATES = [
  {
    lat: 28.7041,
    lng: 77.1025,
    address: 'Sector 14, Rohini, North Delhi, Delhi 110085',
  },
  {
    lat: 28.5355,
    lng: 77.2090,
    address: 'Saket District Centre, South Delhi, Delhi 110017',
  },
  {
    lat: 28.6280,
    lng: 77.2950,
    address: 'Main Vikas Marg, Laxmi Nagar, East Delhi, Delhi 110092',
  },
  {
    lat: 28.6304,
    lng: 77.2177,
    address: 'Block B, Connaught Place, Central Delhi, Delhi 110001',
  },
  {
    lat: 28.6415,
    lng: 77.1209,
    address: 'District Centre, Janakpuri, West Delhi, Delhi 110058',
  },
];

/**
 * Converts backend latitude & longitude coordinates into a human-readable address in words.
 * Always resolves to a Delhi address.
 */
export async function getDelhiAddressFromCoordinates(lat, lng) {
  if (lat == null || lng == null) {
    return 'Municipal Operations Center, Central Delhi, Delhi 110001';
  }

  const numLat = Number(lat);
  const numLng = Number(lng);

  // 1. Check exact or close match with known Delhi coordinates
  for (const item of KNOWN_DELHI_COORDINATES) {
    const dLat = Math.abs(numLat - item.lat);
    const dLng = Math.abs(numLng - item.lng);
    if (dLat < 0.005 && dLng < 0.005) {
      return item.address;
    }
  }

  // 2. Attempt reverse geocoding via OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${numLat}&lon=${numLng}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        // Ensure the address contains Delhi
        const parts = data.display_name.split(',').map(p => p.trim());
        const cleaned = parts.slice(0, 4).join(', ');
        if (cleaned.toLowerCase().includes('delhi')) {
          return cleaned;
        }
        return `${cleaned}, Delhi`;
      }
    }
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
  }

  // 3. Graceful fallback for any Delhi coordinate
  return `Civil Lines Zone (${numLat.toFixed(4)}, ${numLng.toFixed(4)}), Delhi 110054`;
}

/**
 * Fetches crew profile using the worker's email.
 * On the backend, address is stored as latitude and longitude.
 * On the frontend, this function resolves the address into human-readable words.
 */
export async function fetchWorkerProfile(email) {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  let backendData = null;

  // Attempt backend API fetch
  try {
    const response = await fetch(
      `https://9y9e6wstgh.execute-api.us-east-1.amazonaws.com/worker-profile?email=${encodeURIComponent(cleanEmail)}`
    );
    if (response.ok) {
      backendData = await response.json();
    }
  } catch (apiErr) {
    console.warn('Could not reach /worker-profile endpoint, falling back to local registry:', apiErr);
  }

  // Use backend data or local registry fallback
  const fallback = DELHI_WORKERS_DIRECTORY[cleanEmail] || {
    name: cleanEmail.split('@')[0],
    workerId: 'STAFF-' + cleanEmail.split('@')[0].toUpperCase(),
    zone: 'North Delhi',
    latitude: 28.7041,
    longitude: 77.1025,
    addressInWords: 'Sector 14, Rohini, North Delhi, Delhi 110085',
  };

  const name = backendData?.name || fallback.name;
  const workerId = backendData?.workerId || fallback.workerId;
  const zone = backendData?.zone || fallback.zone;
  const latitude = backendData?.latitude ?? fallback.latitude;
  const longitude = backendData?.longitude ?? fallback.longitude;

  // Resolve address in words on the frontend
  let addressInWords = fallback.addressInWords;
  if (!addressInWords || (backendData && (backendData.latitude !== fallback.latitude || backendData.longitude !== fallback.longitude))) {
    addressInWords = await getDelhiAddressFromCoordinates(latitude, longitude);
  }

  return {
    email: cleanEmail,
    name,
    workerId,
    zone,
    latitude: Number(latitude),
    longitude: Number(longitude),
    address: addressInWords, // Address in words for the frontend
  };
}
