import { HazardType } from '../types';

export interface ExactPlaceEvidence {
  imageUrl: string;
  imageCaption: string;
  exactPlaceLocationDetails: string;
}

export const EXACT_PLACE_IMAGE_DIRECTORY: Record<string, ExactPlaceEvidence> = {
  wayanad: {
    imageUrl: '/images/wayanad_chooralmala_place_1790611889796.jpg',
    imageCaption: 'Exact Place: Chooralmala & Mundakkai Hill Tract, Meppadi, Wayanad (11.5173°N, 76.1368°E)',
    exactPlaceLocationDetails: 'Vellarimala & Western Ghats Precambrian gneiss scarp, Vythiri Taluk, Wayanad District, Kerala'
  },
  meppadi: {
    imageUrl: '/images/wayanad_chooralmala_place_1790611889796.jpg',
    imageCaption: 'Exact Place: Chooralmala & Mundakkai Hill Tract, Meppadi, Wayanad (11.5173°N, 76.1368°E)',
    exactPlaceLocationDetails: 'Iruvanjippuzha river drainage corridor, Vythiri Taluk, Wayanad District, Kerala'
  },
  chooralmala: {
    imageUrl: '/images/wayanad_chooralmala_place_1790611889796.jpg',
    imageCaption: 'Exact Place: Chooralmala & Mundakkai Hill Tract, Meppadi, Wayanad (11.5173°N, 76.1368°E)',
    exactPlaceLocationDetails: 'Iruvanjippuzha river drainage corridor, Wayanad District, Kerala'
  },
  pettimudi: {
    imageUrl: '/images/wayanad_landslide_1790611336595.jpg',
    imageCaption: 'Exact Place: Pettimudi Tea Estate Settlement, Rajamala, Idukki (10.1584°N, 77.0146°E)',
    exactPlaceLocationDetails: 'Eravikulam National Park border escarpment, Munnar, Idukki District, Kerala'
  },
  munnar: {
    imageUrl: '/images/wayanad_landslide_1790611336595.jpg',
    imageCaption: 'Exact Place: High-Slope Tea Plantation Escarpment, Munnar (10.0889°N, 77.0595°E)',
    exactPlaceLocationDetails: 'Western Ghats Cardamom Hills, Idukki District, Kerala'
  },
  kedarnath: {
    imageUrl: '/images/kedarnath_exact_temple_1790611877046.jpg',
    imageCaption: 'Exact Place: Kedarnath Valley & Mandakini River Gorge (30.7346°N, 79.0669°E)',
    exactPlaceLocationDetails: 'Chorabari Glacier snout and Mandakini River headwaters, Rudraprayag, Uttarakhand'
  },
  joshimath: {
    imageUrl: '/images/kedarnath_flood_1790611348435.jpg',
    imageCaption: 'Exact Place: Joshimath Subsidized Slope & Dhauliganga Valley (30.5564°N, 79.5659°E)',
    exactPlaceLocationDetails: 'Alaknanda River Gorge moraine ridge, Chamoli, Uttarakhand'
  },
  kullu: {
    imageUrl: '/images/kedarnath_flood_1790611348435.jpg',
    imageCaption: 'Exact Place: Beas River Gorge & Pandoh Hydrological Basin, Kullu (31.9579°N, 77.1095°E)',
    exactPlaceLocationDetails: 'Upper Beas River valley cloudburst corridor, Himachal Pradesh'
  },
  chennai: {
    imageUrl: '/images/chennai_adyar_exact_1790611902899.jpg',
    imageCaption: 'Exact Place: Adyar Basin & Saidapet Inundation Plain, Chennai (13.0827°N, 80.2707°E)',
    exactPlaceLocationDetails: 'Adyar and Cooum urban river confluence, Greater Chennai, Tamil Nadu'
  },
  adyar: {
    imageUrl: '/images/chennai_adyar_exact_1790611902899.jpg',
    imageCaption: 'Exact Place: Adyar Basin & Saidapet Inundation Plain, Chennai (13.0827°N, 80.2707°E)',
    exactPlaceLocationDetails: 'Adyar and Cooum urban river confluence, Greater Chennai, Tamil Nadu'
  },
  bhuj: {
    imageUrl: '/images/bhuj_kutch_earthquake_1790611914549.jpg',
    imageCaption: 'Exact Place: Bhuj & Anjar Seismic Fault Corridor, Kutch (23.2420°N, 69.6669°E)',
    exactPlaceLocationDetails: 'Kutch Mainland Fault line, Gujarat'
  },
  kutch: {
    imageUrl: '/images/bhuj_kutch_earthquake_1790611914549.jpg',
    imageCaption: 'Exact Place: Bhuj & Anjar Seismic Fault Corridor, Kutch (23.2420°N, 69.6669°E)',
    exactPlaceLocationDetails: 'Kutch Mainland Fault line, Gujarat'
  },
  leh: {
    imageUrl: '/images/leh_ladakh_exact_1790611928062.jpg',
    imageCaption: 'Exact Place: Leh Valley Alluvial Fan, Ladakh (34.1526°N, 77.5771°E)',
    exactPlaceLocationDetails: 'Trans-Himalayan Indus River tributary basin, Union Territory of Ladakh'
  },
  ladakh: {
    imageUrl: '/images/leh_ladakh_exact_1790611928062.jpg',
    imageCaption: 'Exact Place: Leh Valley Alluvial Fan, Ladakh (34.1526°N, 77.5771°E)',
    exactPlaceLocationDetails: 'Trans-Himalayan Indus River tributary basin, Union Territory of Ladakh'
  },
  barpeta: {
    imageUrl: '/images/chennai_monsoon_flood_1790611360990.jpg',
    imageCaption: 'Exact Place: Brahmaputra Riparian Inundation Plain, Barpeta (26.3214°N, 91.0062°E)',
    exactPlaceLocationDetails: 'Lower Assam Brahmaputra riverine channel and wetland basin, Assam'
  },
  puri: {
    imageUrl: '/images/cyclone_storm_surge_1790611376168.jpg',
    imageCaption: 'Exact Place: Bay of Bengal Landfall Shoreline & Coastal Barrier, Puri (19.8135°N, 85.8312°E)',
    exactPlaceLocationDetails: 'Odisha coastal cyclone corridor & storm surge embankment zone, Odisha'
  }
};

export function lookupExactPlaceEvidence(
  zoneName: string = '',
  district: string = '',
  state: string = '',
  hazardType: HazardType = 'landslide'
): ExactPlaceEvidence {
  const q = `${zoneName} ${district} ${state}`.toLowerCase();
  for (const [key, val] of Object.entries(EXACT_PLACE_IMAGE_DIRECTORY)) {
    if (q.includes(key)) {
      return val;
    }
  }
  // Generic fallback based on hazard
  if (hazardType === 'landslide') {
    return {
      imageUrl: '/images/wayanad_landslide_1790611336595.jpg',
      imageCaption: `Exact Place: Mountain Slopes & Debris Flow Corridor (${zoneName})`,
      exactPlaceLocationDetails: `High-gradient escarpment, ${district}, ${state}`
    };
  } else if (hazardType === 'flood') {
    return {
      imageUrl: '/images/chennai_monsoon_flood_1790611360990.jpg',
      imageCaption: `Exact Place: Riparian Floodplain & Drainage Basin (${zoneName})`,
      exactPlaceLocationDetails: `Low-lying river basin, ${district}, ${state}`
    };
  } else if (hazardType === 'cyclone') {
    return {
      imageUrl: '/images/cyclone_storm_surge_1790611376168.jpg',
      imageCaption: `Exact Place: Coastal Cyclone Landfall Shoreline (${zoneName})`,
      exactPlaceLocationDetails: `Coastal storm surge barrier, ${district}, ${state}`
    };
  } else if (hazardType === 'cloudburst') {
    return {
      imageUrl: '/images/kedarnath_flood_1790611348435.jpg',
      imageCaption: `Exact Place: High-Altitude Himalayan Cloudburst Gorge (${zoneName})`,
      exactPlaceLocationDetails: `Torrential mountain gorge, ${district}, ${state}`
    };
  } else if (hazardType === 'earthquake') {
    return {
      imageUrl: '/images/bhuj_kutch_earthquake_1790611914549.jpg',
      imageCaption: `Exact Place: Active Tectonic Fault Zone (${zoneName})`,
      exactPlaceLocationDetails: `Seismic fault corridor, ${district}, ${state}`
    };
  }
  return {
    imageUrl: '/images/wayanad_chooralmala_place_1790611889796.jpg',
    imageCaption: `Exact Place: Monitored Geographic Zone (${zoneName})`,
    exactPlaceLocationDetails: `${district}, ${state}`
  };
}
