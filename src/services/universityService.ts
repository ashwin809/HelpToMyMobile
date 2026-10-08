export interface UniversityItem {
  name: string;
  country: string;
  stateProvince?: string;
  domains?: string[];
  webPages?: string[];
}

// Built-in worldwide database of leading universities and colleges for instantaneous suggestions & offline resilience
const POPULAR_WORLD_UNIVERSITIES: UniversityItem[] = [
  // India
  { name: 'Anna University, Chennai', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'Indian Institute of Technology Madras (IIT Madras)', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'Indian Institute of Technology Bombay (IIT Bombay)', country: 'India', stateProvince: 'Maharashtra' },
  { name: 'Indian Institute of Technology Delhi (IIT Delhi)', country: 'India', stateProvince: 'Delhi' },
  { name: 'Indian Institute of Technology Kharagpur (IIT KGP)', country: 'India', stateProvince: 'West Bengal' },
  { name: 'Indian Institute of Technology Kanpur (IIT Kanpur)', country: 'India', stateProvince: 'Uttar Pradesh' },
  { name: 'Indian Institute of Science (IISc), Bangalore', country: 'India', stateProvince: 'Karnataka' },
  { name: 'National Institute of Technology Trichy (NIT Trichy)', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'BITS Pilani', country: 'India', stateProvince: 'Rajasthan' },
  { name: 'Delhi University (DU)', country: 'India', stateProvince: 'Delhi' },
  { name: 'Vellore Institute of Technology (VIT)', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'SRM Institute of Science and Technology', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'College of Engineering, Guindy (CEG Anna University)', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'Madras Institute of Technology (MIT Chromepet)', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'PSG College of Technology, Coimbatore', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'Amrita Vishwa Vidyapeetham', country: 'India', stateProvince: 'Tamil Nadu' },
  { name: 'Jawaharlal Nehru University (JNU)', country: 'India', stateProvince: 'Delhi' },
  { name: 'Banaras Hindu University (BHU)', country: 'India', stateProvince: 'Uttar Pradesh' },
  { name: 'Jadavpur University, Kolkata', country: 'India', stateProvince: 'West Bengal' },
  { name: 'Manipal Academy of Higher Education', country: 'India', stateProvince: 'Karnataka' },

  // USA
  { name: 'Harvard University', country: 'United States', stateProvince: 'Massachusetts' },
  { name: 'Stanford University', country: 'United States', stateProvince: 'California' },
  { name: 'Massachusetts Institute of Technology (MIT)', country: 'United States', stateProvince: 'Massachusetts' },
  { name: 'University of California, Berkeley (UC Berkeley)', country: 'United States', stateProvince: 'California' },
  { name: 'Princeton University', country: 'United States', stateProvince: 'New Jersey' },
  { name: 'Columbia University', country: 'United States', stateProvince: 'New York' },
  { name: 'Yale University', country: 'United States', stateProvince: 'Connecticut' },
  { name: 'California Institute of Technology (Caltech)', country: 'United States', stateProvince: 'California' },
  { name: 'University of California, Los Angeles (UCLA)', country: 'United States', stateProvince: 'California' },
  { name: 'Carnegie Mellon University (CMU)', country: 'United States', stateProvince: 'Pennsylvania' },
  { name: 'New York University (NYU)', country: 'United States', stateProvince: 'New York' },
  { name: 'University of Washington', country: 'United States', stateProvince: 'Washington' },
  { name: 'University of Texas at Austin', country: 'United States', stateProvince: 'Texas' },
  { name: 'Georgia Institute of Technology (Georgia Tech)', country: 'United States', stateProvince: 'Georgia' },
  { name: 'University of Michigan, Ann Arbor', country: 'United States', stateProvince: 'Michigan' },
  { name: 'Cornell University', country: 'United States', stateProvince: 'New York' },
  { name: 'University of Pennsylvania (UPenn)', country: 'United States', stateProvince: 'Pennsylvania' },

  // United Kingdom
  { name: 'University of Oxford', country: 'United Kingdom', stateProvince: 'Oxfordshire' },
  { name: 'University of Cambridge', country: 'United Kingdom', stateProvince: 'Cambridgeshire' },
  { name: 'Imperial College London', country: 'United Kingdom', stateProvince: 'London' },
  { name: 'University College London (UCL)', country: 'United Kingdom', stateProvince: 'London' },
  { name: 'London School of Economics (LSE)', country: 'United Kingdom', stateProvince: 'London' },
  { name: 'University of Edinburgh', country: 'United Kingdom', stateProvince: 'Scotland' },
  { name: 'King’s College London (KCL)', country: 'United Kingdom', stateProvince: 'London' },
  { name: 'University of Manchester', country: 'United Kingdom', stateProvince: 'Greater Manchester' },
  { name: 'University of Warwick', country: 'United Kingdom', stateProvince: 'West Midlands' },

  // Canada
  { name: 'University of Toronto', country: 'Canada', stateProvince: 'Ontario' },
  { name: 'University of British Columbia (UBC)', country: 'Canada', stateProvince: 'British Columbia' },
  { name: 'McGill University', country: 'Canada', stateProvince: 'Quebec' },
  { name: 'University of Waterloo', country: 'Canada', stateProvince: 'Ontario' },
  { name: 'University of Alberta', country: 'Canada', stateProvince: 'Alberta' },

  // Australia & New Zealand
  { name: 'The University of Melbourne', country: 'Australia', stateProvince: 'Victoria' },
  { name: 'The University of Sydney', country: 'Australia', stateProvince: 'New South Wales' },
  { name: 'Australian National University (ANU)', country: 'Australia', stateProvince: 'ACT' },
  { name: 'University of New South Wales (UNSW Sydney)', country: 'Australia', stateProvince: 'New South Wales' },
  { name: 'Monash University', country: 'Australia', stateProvince: 'Victoria' },
  { name: 'University of Auckland', country: 'New Zealand', stateProvince: 'Auckland' },

  // Singapore & Asia
  { name: 'National University of Singapore (NUS)', country: 'Singapore' },
  { name: 'Nanyang Technological University (NTU)', country: 'Singapore' },
  { name: 'The University of Tokyo', country: 'Japan' },
  { name: 'Kyoto University', country: 'Japan' },
  { name: 'Tsinghua University', country: 'China' },
  { name: 'Peking University', country: 'China' },
  { name: 'University of Hong Kong (HKU)', country: 'Hong Kong' },
  { name: 'Seoul National University (SNU)', country: 'South Korea' },

  // Europe
  { name: 'ETH Zurich (Swiss Federal Institute of Technology)', country: 'Switzerland' },
  { name: 'Technical University of Munich (TUM)', country: 'Germany' },
  { name: 'Ludwig Maximilian University of Munich', country: 'Germany' },
  { name: 'Sorbonne University', country: 'France' },
  { name: 'Ecole Polytechnique (Institut Polytechnique de Paris)', country: 'France' },
  { name: 'Delft University of Technology (TU Delft)', country: 'Netherlands' },
  { name: 'University of Amsterdam', country: 'Netherlands' },
  { name: 'Karolinska Institute', country: 'Sweden' },
  { name: 'Politecnico di Milano', country: 'Italy' },
];

export async function searchWorldwideUniversities(query: string): Promise<UniversityItem[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return POPULAR_WORLD_UNIVERSITIES.slice(0, 15);
  }

  // 1. Filter local popular list immediately
  const qLower = trimmed.toLowerCase();
  const localMatches = POPULAR_WORLD_UNIVERSITIES.filter(
    (u) =>
      u.name.toLowerCase().includes(qLower) ||
      u.country.toLowerCase().includes(qLower) ||
      (u.stateProvince && u.stateProvince.toLowerCase().includes(qLower))
  );

  // 2. Query Hipolabs Global Universities API (Free public API containing 10,000+ worldwide universities)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://universities.hipolabs.com/search?name=${encodeURIComponent(trimmed)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const apiResults: UniversityItem[] = data.slice(0, 25).map((item: any) => ({
          name: item.name,
          country: item.country,
          stateProvince: item['state-province'] || undefined,
          domains: item.domains,
          webPages: item.web_pages,
        }));

        // Merge and deduplicate by name
        const combined = [...localMatches];
        for (const item of apiResults) {
          if (!combined.some((c) => c.name.toLowerCase() === item.name.toLowerCase())) {
            combined.push(item);
          }
        }
        return combined.slice(0, 30);
      }
    }
  } catch {
    // If network fails or timeouts, fallback gracefully to local matches
  }

  return localMatches;
}

export function getPopularUniversities(): UniversityItem[] {
  return POPULAR_WORLD_UNIVERSITIES;
}
