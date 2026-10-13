import { phoneticNormalize } from './search';
import type { Pandal } from '../types/pandal';

export interface PlaceSuggestion {
  id: string;
  name: string;
  category: 'metro' | 'landmark' | 'railway' | 'pandal' | 'custom';
  area: string;
  lat: number;
  lng: number;
  aliases?: string[];
}

export const KOLKATA_PREDEFINED_PLACES: PlaceSuggestion[] = [
  // --- METRO STATIONS (North-South Blue Line) ---
  {
    id: 'metro-dakshineswar',
    name: 'Dakshineswar Metro Station',
    category: 'metro',
    area: 'North Kolkata / Hooghly',
    lat: 22.6548,
    lng: 88.3582,
    aliases: ['dakshineswar temple', 'dakhineswar', 'dakshineshwar']
  },
  {
    id: 'metro-baranagar',
    name: 'Baranagar Metro Station',
    category: 'metro',
    area: 'North Kolkata',
    lat: 22.6525,
    lng: 88.3745,
    aliases: ['bornogor', 'barानगर', 'dunlop']
  },
  {
    id: 'metro-noapara',
    name: 'Noapara Metro Station',
    category: 'metro',
    area: 'North Kolkata',
    lat: 22.6401,
    lng: 88.3842,
    aliases: ['noapara car shed']
  },
  {
    id: 'metro-dumdum',
    name: 'Dum Dum Metro & Railway Station',
    category: 'metro',
    area: 'North Kolkata / Dum Dum',
    lat: 22.6225,
    lng: 88.3789,
    aliases: ['dumdum', 'dum dum junction', 'dumdum station']
  },
  {
    id: 'metro-belgachia',
    name: 'Belgachia Metro Station',
    category: 'metro',
    area: 'North Kolkata',
    lat: 22.6047,
    lng: 88.3794,
    aliases: ['belgachia', 'rg kar hospital', 'belgachiya']
  },
  {
    id: 'metro-shyambazar',
    name: 'Shyambazar Metro Station',
    category: 'metro',
    area: 'North Kolkata',
    lat: 22.6025,
    lng: 88.3712,
    aliases: ['shyambazar 5 point', 'syambazar', 'shambazar', 'five point crossing']
  },
  {
    id: 'metro-shobhabazar',
    name: 'Shobhabazar Sutanuti Metro Station',
    category: 'metro',
    area: 'North Kolkata',
    lat: 22.5990,
    lng: 88.3664,
    aliases: ['sovabajar', 'sovabajar metro', 'shovabazar', 'sobhabazar', 'sova bazar', 'shobhabazar', 'sutanuti', 'kumartuli']
  },
  {
    id: 'metro-girish-park',
    name: 'Girish Park Metro Station',
    category: 'metro',
    area: 'North Kolkata',
    lat: 22.5866,
    lng: 88.3615,
    aliases: ['girish park', 'maniktala', 'chaltabagan', 'vivekananda road']
  },
  {
    id: 'metro-mg-road',
    name: 'Mahatma Gandhi Road (MG Road) Metro Station',
    category: 'metro',
    area: 'Central Kolkata',
    lat: 22.5807,
    lng: 88.3610,
    aliases: ['mg road', 'burrabazar', 'bada bazar', 'mahatma gandhi road']
  },
  {
    id: 'metro-central',
    name: 'Central Metro Station',
    category: 'metro',
    area: 'Central Kolkata',
    lat: 22.5694,
    lng: 88.3564,
    aliases: ['central', 'bowbazar', 'medical college', 'calcutta medical']
  },
  {
    id: 'metro-chandni',
    name: 'Chandni Chowk Metro Station',
    category: 'metro',
    area: 'Central Kolkata',
    lat: 22.5661,
    lng: 88.3533,
    aliases: ['chandni chowk', 'chandni market', 'e-mall']
  },
  {
    id: 'metro-esplanade',
    name: 'Esplanade Metro Station (Interchange Blue/Green/Purple)',
    category: 'metro',
    area: 'Central Kolkata / Dharmatala',
    lat: 22.5645,
    lng: 88.3524,
    aliases: ['dharmatala', 'esplanade', 'new market', 'curzon park', 'dharamtala']
  },
  {
    id: 'metro-park-street',
    name: 'Park Street Metro Station',
    category: 'metro',
    area: 'Central / South Kolkata',
    lat: 22.5532,
    lng: 88.3518,
    aliases: ['park street', 'flurys', 'indian museum', 'camac street']
  },
  {
    id: 'metro-maidan',
    name: 'Maidan Metro Station',
    category: 'metro',
    area: 'Central / South Kolkata',
    lat: 22.5457,
    lng: 88.3508,
    aliases: ['maidan', 'brigade parade ground', 'race course']
  },
  {
    id: 'metro-rabindra-sadan',
    name: 'Rabindra Sadan Metro Station',
    category: 'metro',
    area: 'South Kolkata',
    lat: 22.5385,
    lng: 88.3496,
    aliases: ['rabindra sadan', 'nandan', 'exide crossing', 'sskm hospital']
  },
  {
    id: 'metro-netaji-bhavan',
    name: 'Netaji Bhavan Metro Station',
    category: 'metro',
    area: 'South Kolkata / Bhawanipore',
    lat: 22.5312,
    lng: 88.3478,
    aliases: ['netaji bhavan', 'bhawanipore', 'bhowanipore', 'ashutosh college']
  },
  {
    id: 'metro-jatin-das-park',
    name: 'Jatin Das Park Metro Station',
    category: 'metro',
    area: 'South Kolkata / Hazra',
    lat: 22.5238,
    lng: 88.3468,
    aliases: ['jatin das park', 'hazra more', 'hazra park', 'hazra crossing']
  },
  {
    id: 'metro-kalighat',
    name: 'Kalighat Metro Station',
    category: 'metro',
    area: 'South Kolkata',
    lat: 22.5181,
    lng: 88.3464,
    aliases: ['kalighat temple', 'rashbehari crossing', 'deshapriya park', 'kalighat']
  },
  {
    id: 'metro-rabindra-sarobar',
    name: 'Rabindra Sarobar Metro Station',
    category: 'metro',
    area: 'South Kolkata',
    lat: 22.5085,
    lng: 88.3460,
    aliases: ['rabindra sarobar', 'dhakuria lake', 'southern avenue', 'mudiali']
  },
  {
    id: 'metro-tollygunge',
    name: 'Mahanayak Uttam Kumar (Tollygunge) Metro',
    category: 'metro',
    area: 'South Kolkata',
    lat: 22.4975,
    lng: 88.3457,
    aliases: ['tollygunge', 'tollygunge tram depot', 'uttam kumar', 'suruchi sangha']
  },
  {
    id: 'metro-netaji',
    name: 'Netaji (Kudghat) Metro Station',
    category: 'metro',
    area: 'South Kolkata',
    lat: 22.4868,
    lng: 88.3456,
    aliases: ['kudghat', 'netaji kudghat', 'tolly club']
  },
  {
    id: 'metro-masterda-surya-sen',
    name: 'Masterda Surya Sen (Bansdroni) Metro',
    category: 'metro',
    area: 'South Kolkata',
    lat: 22.4764,
    lng: 88.3456,
    aliases: ['bansdroni', 'bansdroni more', 'surya sen']
  },
  {
    id: 'metro-gitanjali',
    name: 'Gitanjali (Naktala) Metro Station',
    category: 'metro',
    area: 'South Kolkata',
    lat: 22.4678,
    lng: 88.3456,
    aliases: ['naktala', 'naktala udayan sangha', 'gitanjali']
  },
  {
    id: 'metro-kavi-nazrul',
    name: 'Kavi Nazrul (Garia Bazar) Metro',
    category: 'metro',
    area: 'South Kolkata / Garia',
    lat: 22.4589,
    lng: 88.3456,
    aliases: ['garia bazar', 'garia more', 'kavi nazrul']
  },
  {
    id: 'metro-shahid-khudiram',
    name: 'Shahid Khudiram (Briji) Metro',
    category: 'metro',
    area: 'South Kolkata / Garia',
    lat: 22.4497,
    lng: 88.3756,
    aliases: ['briji', 'shahid khudiram']
  },
  {
    id: 'metro-kavi-subhash',
    name: 'Kavi Subhash (New Garia) Metro & Railway',
    category: 'metro',
    area: 'South Kolkata / New Garia',
    lat: 22.4428,
    lng: 88.3783,
    aliases: ['new garia', 'kavi subhash', 'new garia station']
  },

  // --- EAST-WEST GREEN LINE METRO ---
  {
    id: 'metro-howrah-maidan',
    name: 'Howrah Maidan Metro Station',
    category: 'metro',
    area: 'Howrah',
    lat: 22.5830,
    lng: 88.3280,
    aliases: ['howrah maidan', 'howrah court']
  },
  {
    id: 'metro-howrah-station',
    name: 'Howrah Railway Station & Metro (River Tunnel)',
    category: 'metro',
    area: 'Howrah / Riverbank',
    lat: 22.5837,
    lng: 88.3429,
    aliases: ['howrah junction', 'howrah station', 'howrah', 'haora']
  },
  {
    id: 'metro-sealdah',
    name: 'Sealdah Railway Station & Metro',
    category: 'metro',
    area: 'Central Kolkata',
    lat: 22.5678,
    lng: 88.3713,
    aliases: ['sealdah', 'sealdah station', 'sealdah south', 'sealdah north']
  },
  {
    id: 'metro-phoolbagan',
    name: 'Phoolbagan Metro Station',
    category: 'metro',
    area: 'East Kolkata / Kankurgachi',
    lat: 22.5708,
    lng: 88.3888,
    aliases: ['phoolbagan', 'kankurgachi', 'phulbagan']
  },
  {
    id: 'metro-saltlake-stadium',
    name: 'Salt Lake Stadium Metro Station',
    category: 'metro',
    area: 'East Kolkata / Salt Lake',
    lat: 22.5722,
    lng: 88.4036,
    aliases: ['yuva bharati', 'salt lake stadium', 'kadapara']
  },
  {
    id: 'metro-bengal-chemical',
    name: 'Bengal Chemical Metro Station',
    category: 'metro',
    area: 'Salt Lake Sector III',
    lat: 22.5739,
    lng: 88.4095,
    aliases: ['bengal chemical', 'mani square']
  },
  {
    id: 'metro-city-centre',
    name: 'City Centre 1 Metro Station (Salt Lake)',
    category: 'metro',
    area: 'Salt Lake Sector I / DC Block',
    lat: 22.5866,
    lng: 88.4111,
    aliases: ['city centre salt lake', 'cc1', 'city centre 1']
  },
  {
    id: 'metro-central-park',
    name: 'Central Park Metro Station (Salt Lake)',
    category: 'metro',
    area: 'Salt Lake Sector II',
    lat: 22.5878,
    lng: 88.4158,
    aliases: ['central park salt lake', 'mela ground']
  },
  {
    id: 'metro-karunamoyee',
    name: 'Karunamoyee Metro & Bus Terminus',
    category: 'metro',
    area: 'Salt Lake Central',
    lat: 22.5870,
    lng: 88.4200,
    aliases: ['karunamoyee', 'salt lake bus stand', 'karunamoyi']
  },
  {
    id: 'metro-sector-v',
    name: 'Salt Lake Sector V Metro Station',
    category: 'metro',
    area: 'Salt Lake / IT Hub',
    lat: 22.5807,
    lng: 88.4328,
    aliases: ['sector v', 'sector 5', 'salt lake it park', 'wipro more', 'webel']
  },

  // --- PURPLE LINE METRO (JOKA - MAJERHAT - ESPLANADE) ---
  {
    id: 'metro-taratala',
    name: 'Taratala Metro Station',
    category: 'metro',
    area: 'Behala / Taratala',
    lat: 22.5147,
    lng: 88.3180,
    aliases: ['taratala', 'taratala crossing', 'mint']
  },
  {
    id: 'metro-majerhat',
    name: 'Majerhat Metro & Railway Station',
    category: 'metro',
    area: 'Alipore / Majerhat',
    lat: 22.5208,
    lng: 88.3242,
    aliases: ['majerhat', 'majerhat bridge', 'alipore mint']
  },
  {
    id: 'metro-behala-bazar',
    name: 'Behala Bazar Metro Station',
    category: 'metro',
    area: 'Behala',
    lat: 22.5028,
    lng: 88.3150,
    aliases: ['behala bazar', 'behala tram depot']
  },
  {
    id: 'metro-behala-chowrasta',
    name: 'Behala Chowrasta Metro Station',
    category: 'metro',
    area: 'Behala',
    lat: 22.4940,
    lng: 88.3125,
    aliases: ['behala chowrasta', 'chowrasta', 'diamond harbour road']
  },
  {
    id: 'metro-sakherbazar',
    name: 'Sakherbazar Metro Station',
    category: 'metro',
    area: 'Behala & Barisha',
    lat: 22.4820,
    lng: 88.3105,
    aliases: ['sakherbazar', 'barisha', 'sabarna roy choudhury', 'sakher bazar']
  },
  {
    id: 'metro-thakurpukur',
    name: 'Thakurpukur Metro Station',
    category: 'metro',
    area: 'South West Kolkata',
    lat: 22.4682,
    lng: 88.3075,
    aliases: ['thakurpukur', 'cancer hospital']
  },
  {
    id: 'metro-joka',
    name: 'Joka Metro Station',
    category: 'metro',
    area: 'South West Kolkata',
    lat: 22.4530,
    lng: 88.3032,
    aliases: ['joka', 'iim calcutta']
  },

  // --- MAJOR RAILWAY & TRANSIT TERMINALS ---
  {
    id: 'rail-chitpur',
    name: 'Kolkata Railway Station (Chitpur)',
    category: 'railway',
    area: 'North Kolkata',
    lat: 22.6033,
    lng: 88.3768,
    aliases: ['chitpur station', 'kolkata station']
  },
  {
    id: 'rail-santragachi',
    name: 'Santragachi Junction Station',
    category: 'railway',
    area: 'Howrah',
    lat: 22.5815,
    lng: 88.2818,
    aliases: ['santragachi', 'santragachhi']
  },
  {
    id: 'rail-shalimar',
    name: 'Shalimar Railway Station',
    category: 'railway',
    area: 'Howrah / Riverfront',
    lat: 22.5583,
    lng: 88.3200,
    aliases: ['shalimar station']
  },
  {
    id: 'rail-ballygunge',
    name: 'Ballygunge Junction Station',
    category: 'railway',
    area: 'South Kolkata',
    lat: 22.5278,
    lng: 88.3644,
    aliases: ['ballygunge station', 'ballygunj']
  },
  {
    id: 'rail-jadavpur',
    name: 'Jadavpur 8B Bus Stand & Railway Station',
    category: 'railway',
    area: 'South Kolkata',
    lat: 22.4988,
    lng: 88.3714,
    aliases: ['jadavpur 8b', 'jadavpur university', '8b stand', 'jadavpur']
  },
  {
    id: 'transit-airport',
    name: 'NSCBI Kolkata Airport (Dum Dum)',
    category: 'landmark',
    area: 'North East Kolkata',
    lat: 22.6547,
    lng: 88.4467,
    aliases: ['kolkata airport', 'ccu', 'airport terminal', 'dumdum airport', 'biman bandar']
  },
  {
    id: 'transit-babughat',
    name: 'Babughat Ferry & Bus Terminus',
    category: 'landmark',
    area: 'Central Kolkata / Riverbank',
    lat: 22.5675,
    lng: 88.3420,
    aliases: ['babughat', 'strand road', 'hooghly ghat']
  },

  // --- FAMOUS KOLKATA LANDMARKS & NEIGHBORHOOD HUBS ---
  {
    id: 'hub-victoria',
    name: 'Victoria Memorial',
    category: 'landmark',
    area: 'Central Kolkata',
    lat: 22.5448,
    lng: 88.3426,
    aliases: ['victoria memorial hall', 'queen victoria', 'maidan']
  },
  {
    id: 'hub-college-street',
    name: 'College Street (Boi Para)',
    category: 'landmark',
    area: 'Central Kolkata',
    lat: 22.5744,
    lng: 88.3639,
    aliases: ['college street', 'boi para', 'presidency', 'coffee house']
  },
  {
    id: 'hub-gariahat',
    name: 'Gariahat More (Crossing)',
    category: 'landmark',
    area: 'South Kolkata',
    lat: 22.5185,
    lng: 88.3660,
    aliases: ['gariahat crossing', 'gariahat market', 'gariahat more']
  },
  {
    id: 'hub-golpark',
    name: 'Golpark (Ramakrishna Mission)',
    category: 'landmark',
    area: 'South Kolkata',
    lat: 22.5147,
    lng: 88.3664,
    aliases: ['golpark', 'rkm institute of culture', 'dhakuria lake']
  },
  {
    id: 'hub-south-city',
    name: 'South City Mall',
    category: 'landmark',
    area: 'South Kolkata',
    lat: 22.5022,
    lng: 88.3619,
    aliases: ['south city', 'prince anwar shah road']
  },
  {
    id: 'hub-quest-mall',
    name: 'Quest Mall (Ballygunge / Park Circus)',
    category: 'landmark',
    area: 'Central / South Kolkata',
    lat: 22.5392,
    lng: 88.3653,
    aliases: ['quest mall', 'park circus 7 point', 'syed amir ali avenue']
  },
  {
    id: 'hub-acropolis',
    name: 'Acropolis Mall (Kasba / Rajdanga)',
    category: 'landmark',
    area: 'South East Kolkata',
    lat: 22.5147,
    lng: 88.3931,
    aliases: ['acropolis', 'kasba', 'rajdanga main road']
  },
  {
    id: 'hub-science-city',
    name: 'Science City (EM Bypass)',
    category: 'landmark',
    area: 'East Kolkata',
    lat: 22.5401,
    lng: 88.3958,
    aliases: ['science city', 'em bypass connector', 'milan mela']
  },
  {
    id: 'hub-eco-park',
    name: 'Eco Park (New Town)',
    category: 'landmark',
    area: 'New Town / Rajarhat',
    lat: 22.6074,
    lng: 88.4678,
    aliases: ['eco park new town', 'prakriti tirtha', 'action area 2']
  },
  {
    id: 'hub-biswa-bangla-gate',
    name: 'Biswa Bangla Gate (Kolkata Gate)',
    category: 'landmark',
    area: 'New Town',
    lat: 22.5889,
    lng: 88.4683,
    aliases: ['kolkata gate', 'hanging restaurant', 'new town major arterial']
  },
  {
    id: 'hub-kumartuli',
    name: 'Kumartuli Idol Makers Colony',
    category: 'landmark',
    area: 'North Kolkata',
    lat: 22.5994,
    lng: 88.3655,
    aliases: ['kumartuli', 'kumortuli', 'potters colony', 'kumartuli ghat']
  },
  {
    id: 'hub-hatibagan',
    name: 'Hatibagan Market / Star Theatre',
    category: 'landmark',
    area: 'North Kolkata',
    lat: 22.5936,
    lng: 88.3719,
    aliases: ['hatibagan', 'star theatre', 'bidhan sarani']
  },
  {
    id: 'hub-lake-town',
    name: 'Lake Town Clock Tower (Big Ben)',
    category: 'landmark',
    area: 'North East Kolkata',
    lat: 22.6022,
    lng: 88.4053,
    aliases: ['lake town', 'big ben kolkata', 'sreebhumi crossing']
  },
  {
    id: 'hub-bangur',
    name: 'Bangur Avenue Crossing',
    category: 'landmark',
    area: 'North East Kolkata',
    lat: 22.6078,
    lng: 88.4069,
    aliases: ['bangur', 'bangur avenue']
  },
  {
    id: 'hub-kalyani-iti',
    name: 'Kalyani ITI More',
    category: 'landmark',
    area: 'Kalyani, Nadia',
    lat: 22.9806,
    lng: 88.4389,
    aliases: ['kalyani iti', 'luminous club', 'kalyani puja hub']
  },
  {
    id: 'hub-kalyani-central-park',
    name: 'Kalyani Central Park',
    category: 'landmark',
    area: 'Kalyani, Nadia',
    lat: 22.9750,
    lng: 88.4344,
    aliases: ['kalyani central park', 'kalyani station']
  },
  {
    id: 'hub-belur-math',
    name: 'Belur Math (Ramakrishna Math)',
    category: 'landmark',
    area: 'Howrah / Belur',
    lat: 22.6322,
    lng: 88.3567,
    aliases: ['belur math', 'belur', 'ramakrishna mission']
  }
];

/**
 * Searches across all predefined Kolkata transit hubs, metro stations, landmarks,
 * and pandals using substring, prefix, word boundary, and phonetic algorithms.
 */
export function searchKolkataPlaces(
  query: string,
  pandals: Pandal[] = []
): PlaceSuggestion[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const phoneticQ = phoneticNormalize(cleanQ);
  const results: { place: PlaceSuggestion; score: number }[] = [];

  // 1. Search Predefined Places (Metros, Train Stations, Landmarks)
  KOLKATA_PREDEFINED_PLACES.forEach((place) => {
    const nameLower = place.name.toLowerCase();
    const areaLower = place.area.toLowerCase();
    const namePhonetic = phoneticNormalize(place.name);
    let score = 0;

    // Exact or prefix match
    if (nameLower.startsWith(cleanQ)) {
      score += 2000;
    } else if (nameLower.includes(` ${cleanQ}`) || nameLower.includes(`-${cleanQ}`)) {
      score += 1500;
    } else if (nameLower.includes(cleanQ)) {
      score += 1000;
    }

    // Phonetic match (handles "sovabajar" -> "Shobhabazar", "dakhineswar", etc.)
    if (namePhonetic.startsWith(phoneticQ)) {
      score += 1800;
    } else if (namePhonetic.includes(phoneticQ)) {
      score += 1200;
    }

    // Check aliases
    if (place.aliases) {
      for (const alias of place.aliases) {
        const aliasLower = alias.toLowerCase();
        const aliasPhonetic = phoneticNormalize(alias);
        if (aliasLower.startsWith(cleanQ)) {
          score += 1600;
          break;
        } else if (aliasLower.includes(cleanQ)) {
          score += 1100;
          break;
        } else if (aliasPhonetic.includes(phoneticQ)) {
          score += 1300;
          break;
        }
      }
    }

    // Area match
    if (areaLower.includes(cleanQ)) {
      score += 300;
    }

    if (score > 0) {
      results.push({ place, score });
    }
  });

  // 2. Search Pandals
  pandals.forEach((p) => {
    if (p.latitude != null && p.longitude != null) {
      const nameLower = p.name.toLowerCase();
      const divLower = p.area_division.toLowerCase();
      const metroLower = (p.nearest_metro || '').toLowerCase();
      const namePhonetic = phoneticNormalize(p.name);
      let score = 0;

      if (nameLower.startsWith(cleanQ)) {
        score += 1800;
      } else if (nameLower.includes(` ${cleanQ}`)) {
        score += 1400;
      } else if (nameLower.includes(cleanQ)) {
        score += 900;
      }

      if (namePhonetic.startsWith(phoneticQ)) {
        score += 1600;
      } else if (namePhonetic.includes(phoneticQ)) {
        score += 1100;
      }

      if (metroLower.includes(cleanQ)) {
        score += 600;
      }
      if (divLower.includes(cleanQ)) {
        score += 200;
      }

      if (score > 0) {
        results.push({
          place: {
            id: `pandal-${p.id}`,
            name: p.name,
            category: 'pandal',
            area: `${p.area_division} • 🚇 ${p.nearest_metro}`,
            lat: p.latitude,
            lng: p.longitude
          },
          score
        });
      }
    }
  });

  // Sort descending by relevance score
  results.sort((a, b) => b.score - a.score);

  // Return top 8 matches
  return results.slice(0, 8).map((r) => r.place);
}

/**
 * Live geocodes any arbitrary address in or near Kolkata using OpenStreetMap Nominatim
 */
export async function geocodeKolkataPlaceLive(
  query: string
): Promise<PlaceSuggestion[]> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  try {
    const isKalyaniOrNadia = /kalyani|nadia/i.test(cleanQ);
    const searchQuery = isKalyaniOrNadia
      ? `${cleanQ}, West Bengal`
      : cleanQ.toLowerCase().includes('kolkata')
      ? `${cleanQ}, West Bengal`
      : `${cleanQ}, Kolkata, West Bengal`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}&countrycodes=in&viewbox=88.0,23.2,88.7,22.2&bounded=0&limit=5`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.map((item: any) => ({
        id: `osm-${item.place_id}`,
        name: item.display_name.split(',')[0],
        category: 'custom',
        area: item.display_name.split(',').slice(1, 4).join(',').trim() || 'Kolkata Region',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    }
  } catch {
    // Network or timeout fallback
  }

  return [];
}
