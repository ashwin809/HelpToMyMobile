export interface LocationResult {
  city: string;
  state: string;
  country: string;
  postcode: string;
  displayName: string;
}

// Built-in worldwide locations with accurate default postal codes/pincodes for instant autocompletion
const WORLD_LOCATIONS_DATABASE: LocationResult[] = [
  // India (Major Hubs & Student Cities)
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', postcode: '600001', displayName: 'Chennai, Tamil Nadu, India' },
  { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', postcode: '641001', displayName: 'Coimbatore, Tamil Nadu, India' },
  { city: 'Madurai', state: 'Tamil Nadu', country: 'India', postcode: '625001', displayName: 'Madurai, Tamil Nadu, India' },
  { city: 'Tiruchirappalli (Trichy)', state: 'Tamil Nadu', country: 'India', postcode: '620001', displayName: 'Tiruchirappalli, Tamil Nadu, India' },
  { city: 'Salem', state: 'Tamil Nadu', country: 'India', postcode: '636001', displayName: 'Salem, Tamil Nadu, India' },
  { city: 'Tirunelveli', state: 'Tamil Nadu', country: 'India', postcode: '627001', displayName: 'Tirunelveli, Tamil Nadu, India' },
  { city: 'Vellore', state: 'Tamil Nadu', country: 'India', postcode: '632001', displayName: 'Vellore, Tamil Nadu, India' },
  { city: 'Bengaluru (Bangalore)', state: 'Karnataka', country: 'India', postcode: '560001', displayName: 'Bengaluru, Karnataka, India' },
  { city: 'Mysuru', state: 'Karnataka', country: 'India', postcode: '570001', displayName: 'Mysuru, Karnataka, India' },
  { city: 'Mangaluru', state: 'Karnataka', country: 'India', postcode: '575001', displayName: 'Mangaluru, Karnataka, India' },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', postcode: '500001', displayName: 'Hyderabad, Telangana, India' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', postcode: '530001', displayName: 'Visakhapatnam, Andhra Pradesh, India' },
  { city: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', postcode: '520001', displayName: 'Vijayawada, Andhra Pradesh, India' },
  { city: 'Thiruvananthapuram', state: 'Kerala', country: 'India', postcode: '695001', displayName: 'Thiruvananthapuram, Kerala, India' },
  { city: 'Kochi (Cochin)', state: 'Kerala', country: 'India', postcode: '682001', displayName: 'Kochi, Kerala, India' },
  { city: 'Kozhikode', state: 'Kerala', country: 'India', postcode: '673001', displayName: 'Kozhikode, Kerala, India' },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', postcode: '400001', displayName: 'Mumbai, Maharashtra, India' },
  { city: 'Pune', state: 'Maharashtra', country: 'India', postcode: '411001', displayName: 'Pune, Maharashtra, India' },
  { city: 'Nagpur', state: 'Maharashtra', country: 'India', postcode: '440001', displayName: 'Nagpur, Maharashtra, India' },
  { city: 'New Delhi', state: 'Delhi', country: 'India', postcode: '110001', displayName: 'New Delhi, Delhi, India' },
  { city: 'Noida', state: 'Uttar Pradesh', country: 'India', postcode: '201301', displayName: 'Noida, Uttar Pradesh, India' },
  { city: 'Gurugram (Gurgaon)', state: 'Haryana', country: 'India', postcode: '122001', displayName: 'Gurugram, Haryana, India' },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', postcode: '700001', displayName: 'Kolkata, West Bengal, India' },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', postcode: '380001', displayName: 'Ahmedabad, Gujarat, India' },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', postcode: '302001', displayName: 'Jaipur, Rajasthan, India' },
  { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India', postcode: '226001', displayName: 'Lucknow, Uttar Pradesh, India' },
  { city: 'Chandigarh', state: 'Chandigarh', country: 'India', postcode: '160001', displayName: 'Chandigarh, India' },
  { city: 'Bhopal', state: 'Madhya Pradesh', country: 'India', postcode: '462001', displayName: 'Bhopal, Madhya Pradesh, India' },
  { city: 'Indore', state: 'Madhya Pradesh', country: 'India', postcode: '452001', displayName: 'Indore, Madhya Pradesh, India' },
  { city: 'Bhubaneswar', state: 'Odisha', country: 'India', postcode: '751001', displayName: 'Bhubaneswar, Odisha, India' },
  { city: 'Patna', state: 'Bihar', country: 'India', postcode: '800001', displayName: 'Patna, Bihar, India' },
  { city: 'Guwahati', state: 'Assam', country: 'India', postcode: '781001', displayName: 'Guwahati, Assam, India' },

  // United States
  { city: 'New York', state: 'New York', country: 'United States', postcode: '10001', displayName: 'New York, NY, United States' },
  { city: 'San Francisco', state: 'California', country: 'United States', postcode: '94102', displayName: 'San Francisco, CA, United States' },
  { city: 'San Jose', state: 'California', country: 'United States', postcode: '95113', displayName: 'San Jose (Silicon Valley), CA, United States' },
  { city: 'Los Angeles', state: 'California', country: 'United States', postcode: '90001', displayName: 'Los Angeles, CA, United States' },
  { city: 'San Diego', state: 'California', country: 'United States', postcode: '92101', displayName: 'San Diego, CA, United States' },
  { city: 'Seattle', state: 'Washington', country: 'United States', postcode: '98101', displayName: 'Seattle, WA, United States' },
  { city: 'Boston', state: 'Massachusetts', country: 'United States', postcode: '02108', displayName: 'Boston, MA, United States' },
  { city: 'Cambridge', state: 'Massachusetts', country: 'United States', postcode: '02138', displayName: 'Cambridge, MA, United States' },
  { city: 'Chicago', state: 'Illinois', country: 'United States', postcode: '60601', displayName: 'Chicago, IL, United States' },
  { city: 'Austin', state: 'Texas', country: 'United States', postcode: '78701', displayName: 'Austin, TX, United States' },
  { city: 'Dallas', state: 'Texas', country: 'United States', postcode: '75201', displayName: 'Dallas, TX, United States' },
  { city: 'Houston', state: 'Texas', country: 'United States', postcode: '77001', displayName: 'Houston, TX, United States' },
  { city: 'Atlanta', state: 'Georgia', country: 'United States', postcode: '30301', displayName: 'Atlanta, GA, United States' },
  { city: 'Philadelphia', state: 'Pennsylvania', country: 'United States', postcode: '19102', displayName: 'Philadelphia, PA, United States' },
  { city: 'Washington', state: 'District of Columbia', country: 'United States', postcode: '20001', displayName: 'Washington, DC, United States' },

  // United Kingdom
  { city: 'London', state: 'Greater London', country: 'United Kingdom', postcode: 'SW1A 1AA', displayName: 'London, Greater London, United Kingdom' },
  { city: 'Manchester', state: 'Greater Manchester', country: 'United Kingdom', postcode: 'M1 1AD', displayName: 'Manchester, United Kingdom' },
  { city: 'Birmingham', state: 'West Midlands', country: 'United Kingdom', postcode: 'B1 1AA', displayName: 'Birmingham, United Kingdom' },
  { city: 'Oxford', state: 'Oxfordshire', country: 'United Kingdom', postcode: 'OX1 2JD', displayName: 'Oxford, United Kingdom' },
  { city: 'Cambridge', state: 'Cambridgeshire', country: 'United Kingdom', postcode: 'CB2 1TN', displayName: 'Cambridge, United Kingdom' },
  { city: 'Edinburgh', state: 'Scotland', country: 'United Kingdom', postcode: 'EH1 1YZ', displayName: 'Edinburgh, Scotland, United Kingdom' },
  { city: 'Glasgow', state: 'Scotland', country: 'United Kingdom', postcode: 'G1 1XQ', displayName: 'Glasgow, Scotland, United Kingdom' },

  // Canada
  { city: 'Toronto', state: 'Ontario', country: 'Canada', postcode: 'M5H 2N2', displayName: 'Toronto, Ontario, Canada' },
  { city: 'Vancouver', state: 'British Columbia', country: 'Canada', postcode: 'V6B 1A1', displayName: 'Vancouver, BC, Canada' },
  { city: 'Montreal', state: 'Quebec', country: 'Canada', postcode: 'H2Y 1C6', displayName: 'Montreal, Quebec, Canada' },
  { city: 'Waterloo', state: 'Ontario', country: 'Canada', postcode: 'N2L 3G1', displayName: 'Waterloo, Ontario, Canada' },
  { city: 'Ottawa', state: 'Ontario', country: 'Canada', postcode: 'K1P 1J1', displayName: 'Ottawa, Ontario, Canada' },

  // Australia & New Zealand
  { city: 'Sydney', state: 'New South Wales', country: 'Australia', postcode: '2000', displayName: 'Sydney, NSW, Australia' },
  { city: 'Melbourne', state: 'Victoria', country: 'Australia', postcode: '3000', displayName: 'Melbourne, VIC, Australia' },
  { city: 'Brisbane', state: 'Queensland', country: 'Australia', postcode: '4000', displayName: 'Brisbane, QLD, Australia' },
  { city: 'Perth', state: 'Western Australia', country: 'Australia', postcode: '6000', displayName: 'Perth, WA, Australia' },
  { city: 'Auckland', state: 'Auckland', country: 'New Zealand', postcode: '1010', displayName: 'Auckland, New Zealand' },

  // Asia & Middle East
  { city: 'Singapore', state: 'Central', country: 'Singapore', postcode: '018989', displayName: 'Singapore, Central Singapore' },
  { city: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', postcode: '00000', displayName: 'Dubai, United Arab Emirates' },
  { city: 'Abu Dhabi', state: 'Abu Dhabi', country: 'United Arab Emirates', postcode: '00000', displayName: 'Abu Dhabi, United Arab Emirates' },
  { city: 'Tokyo', state: 'Tokyo', country: 'Japan', postcode: '100-0001', displayName: 'Tokyo, Japan' },
  { city: 'Seoul', state: 'Seoul', country: 'South Korea', postcode: '03000', displayName: 'Seoul, South Korea' },
  { city: 'Hong Kong', state: 'Hong Kong Island', country: 'Hong Kong', postcode: '999077', displayName: 'Hong Kong' },
  { city: 'Kuala Lumpur', state: 'Federal Territory', country: 'Malaysia', postcode: '50000', displayName: 'Kuala Lumpur, Malaysia' },
  { city: 'Bangkok', state: 'Bangkok', country: 'Thailand', postcode: '10100', displayName: 'Bangkok, Thailand' },

  // Europe
  { city: 'Berlin', state: 'Berlin', country: 'Germany', postcode: '10115', displayName: 'Berlin, Germany' },
  { city: 'Munich', state: 'Bavaria', country: 'Germany', postcode: '80331', displayName: 'Munich, Bavaria, Germany' },
  { city: 'Frankfurt', state: 'Hesse', country: 'Germany', postcode: '60311', displayName: 'Frankfurt, Germany' },
  { city: 'Paris', state: 'Île-de-France', country: 'France', postcode: '75001', displayName: 'Paris, France' },
  { city: 'Amsterdam', state: 'North Holland', country: 'Netherlands', postcode: '1012', displayName: 'Amsterdam, Netherlands' },
  { city: 'Zurich', state: 'Zurich', country: 'Switzerland', postcode: '8001', displayName: 'Zurich, Switzerland' },
  { city: 'Stockholm', state: 'Stockholm', country: 'Sweden', postcode: '111 20', displayName: 'Stockholm, Sweden' },
  { city: 'Dublin', state: 'Leinster', country: 'Ireland', postcode: 'D01', displayName: 'Dublin, Ireland' },
];

export async function searchWorldwideLocations(query: string): Promise<LocationResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return WORLD_LOCATIONS_DATABASE.slice(0, 12);
  }

  const qLower = trimmed.toLowerCase();

  // 1. Instant local matches
  const localMatches = WORLD_LOCATIONS_DATABASE.filter(
    (item) =>
      item.city.toLowerCase().includes(qLower) ||
      item.state.toLowerCase().includes(qLower) ||
      item.country.toLowerCase().includes(qLower) ||
      item.postcode.toLowerCase().includes(qLower) ||
      item.displayName.toLowerCase().includes(qLower)
  );

  // 2. Fetch from OpenStreetMap Nominatim Geocoding API for any place on Earth!
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&addressdetails=1&limit=10`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HelpToYou-Education-App/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const liveResults: LocationResult[] = data.map((item: any) => {
          const addr = item.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.suburb ||
            addr.county ||
            trimmed;
          const state = addr.state || addr.province || addr.region || '';
          const country = addr.country || '';
          const postcode = addr.postcode || '';

          return {
            city,
            state,
            country,
            postcode,
            displayName: item.display_name || `${city}, ${state}, ${country}`,
          };
        });

        // Merge results: keep live results and append unique local matches
        const combined = [...liveResults];
        for (const loc of localMatches) {
          if (
            !combined.some(
              (c) =>
                c.city.toLowerCase() === loc.city.toLowerCase() &&
                c.country.toLowerCase() === loc.country.toLowerCase()
            )
          ) {
            combined.push(loc);
          }
        }
        return combined.slice(0, 20);
      }
    }
  } catch {
    // If network fails or timeouts, fallback gracefully to local database
  }

  return localMatches;
}

export function findKnownPincode(cityName: string, countryName?: string): string | null {
  const cLower = cityName.trim().toLowerCase();
  const match = WORLD_LOCATIONS_DATABASE.find((item) => {
    const cityMatch = item.city.toLowerCase().includes(cLower) || cLower.includes(item.city.toLowerCase());
    if (!cityMatch) return false;
    if (countryName) {
      return item.country.toLowerCase().includes(countryName.trim().toLowerCase());
    }
    return true;
  });

  return match?.postcode || null;
}
