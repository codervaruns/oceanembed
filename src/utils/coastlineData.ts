// High-Resolution North Indian Ocean Coastlines, Island Geometry & Bathymetric Contours
// Problem Statement ID: SIH26066 | Smart India Hackathon 2026

export interface CoastlinePolygon {
  name: string;
  points: [number, number][]; // [lon, lat]
  type: 'mainland' | 'island';
}

/**
 * Detailed vectorized coastlines for the North Indian Ocean basin (4°N to 26°N, 54°E to 96°E).
 * Includes Indian Subcontinent peninsular coastline, Saurashtra/Kutch, Sri Lanka,
 * Arabian Peninsula, Pakistan, Bangladesh delta, Myanmar, Andaman & Nicobar Islands, and Lakshadweep.
 */
export const NIO_COASTLINES: CoastlinePolygon[] = [
  // Indian Subcontinent (Peninsular Coastline, Gujarat, Bengal Delta)
  {
    name: 'Indian Subcontinent',
    type: 'mainland',
    points: [
      [68.1, 23.8], [68.8, 23.2], [70.1, 22.9], [69.0, 22.4], [69.1, 21.6],
      [70.3, 20.9], [72.1, 20.8], [72.8, 21.7], [72.6, 20.5], [72.8, 19.0],
      [73.1, 18.2], [73.5, 16.5], [73.8, 15.4], [74.5, 14.2], [75.0, 13.0],
      [75.8, 11.5], [76.2, 10.0], [76.9, 8.8], [77.5, 8.08], // Kanyakumari
      [78.2, 8.8], [79.2, 9.3], [79.3, 10.3], [79.8, 10.8], [79.9, 11.9],
      [80.3, 13.1], [80.3, 14.5], [81.5, 15.8], [82.2, 16.8], [83.3, 17.7],
      [84.5, 18.8], [85.5, 19.8], [86.8, 20.5], [87.5, 21.6], [88.5, 21.7],
      [89.2, 22.0], [90.5, 22.2], [91.8, 22.3], // Bengal / Sundarbans
      [92.5, 21.2], [92.3, 20.2], // Cox's Bazar / Myanmar border
      // In-land boundary loop to close polygon
      [96.0, 26.0], [54.0, 26.0], [68.1, 23.8]
    ]
  },
  // Sri Lanka
  {
    name: 'Sri Lanka',
    type: 'island',
    points: [
      [79.8, 9.8], [80.5, 9.6], [81.3, 8.6], [81.8, 7.5], [81.7, 6.6],
      [80.6, 5.9], [80.2, 6.1], [79.8, 6.9], [79.7, 8.0], [79.8, 9.0], [79.8, 9.8]
    ]
  },
  // Arabian Peninsula & Persian Gulf / Gulf of Oman
  {
    name: 'Arabian Peninsula & Oman',
    type: 'mainland',
    points: [
      [54.0, 12.0], [53.5, 14.5], [54.5, 16.5], [56.2, 18.0], [58.3, 20.5],
      [59.8, 22.5], [58.5, 23.7], [56.5, 24.5], [56.2, 26.0], [54.0, 26.0], [54.0, 12.0]
    ]
  },
  // Pakistan / Makran Coast
  {
    name: 'Pakistan Makran Coast',
    type: 'mainland',
    points: [
      [61.5, 25.2], [63.5, 25.1], [65.5, 25.3], [66.8, 24.8], [67.8, 24.2],
      [68.1, 23.8], [68.1, 26.0], [61.5, 26.0], [61.5, 25.2]
    ]
  },
  // Myanmar & Andaman Sea Coast
  {
    name: 'Myanmar & Malay Peninsula',
    type: 'mainland',
    points: [
      [92.5, 20.8], [93.5, 19.5], [94.2, 17.8], [94.5, 16.0], [95.2, 15.8],
      [96.0, 16.5], [96.0, 4.0], [98.5, 4.0], [98.5, 26.0], [92.5, 26.0], [92.5, 20.8]
    ]
  },
  // Andaman & Nicobar Islands Archipelago
  {
    name: 'North & South Andaman',
    type: 'island',
    points: [
      [92.8, 13.6], [93.0, 13.2], [92.8, 12.0], [92.6, 11.5], [92.7, 12.8], [92.8, 13.6]
    ]
  },
  {
    name: 'Little Andaman & Nicobar',
    type: 'island',
    points: [
      [92.5, 10.7], [92.6, 10.5], [92.4, 10.6], [92.5, 10.7]
    ]
  },
  {
    name: 'Great Nicobar',
    type: 'island',
    points: [
      [93.8, 7.2], [94.0, 6.8], [93.7, 6.7], [93.8, 7.2]
    ]
  },
  // Lakshadweep Archipelago (Kavaratti, Agatti, Minicoy)
  {
    name: 'Lakshadweep (Minicoy)',
    type: 'island',
    points: [
      [73.0, 8.3], [73.1, 8.2], [72.9, 8.2], [73.0, 8.3]
    ]
  },
  {
    name: 'Lakshadweep (Kavaratti/Agatti)',
    type: 'island',
    points: [
      [72.6, 10.6], [72.7, 10.5], [72.5, 10.5], [72.6, 10.6]
    ]
  },
  // Maldives Northern Atolls
  {
    name: 'Maldives Northern Atolls',
    type: 'island',
    points: [
      [73.1, 6.8], [73.2, 6.6], [73.0, 6.6], [73.1, 6.8]
    ]
  }
];

/**
 * Major Bathymetric Features of the North Indian Ocean for overlay annotation
 */
export interface BathymetricFeature {
  name: string;
  type: 'ridge' | 'trench' | 'basin' | 'shelf';
  lat: number;
  lon: number;
  depthRange: string;
}

export const NIO_BATHYMETRIC_FEATURES: BathymetricFeature[] = [
  { name: 'Arabian Basin', type: 'basin', lat: 14.5, lon: 65.0, depthRange: '3,800–4,400m' },
  { name: 'Bay of Bengal Basin', type: 'basin', lat: 14.0, lon: 87.5, depthRange: '3,200–3,900m' },
  { name: 'Central Indian Ridge', type: 'ridge', lat: 5.5, lon: 68.0, depthRange: '2,200–2,800m' },
  { name: 'Ninety East Ridge', type: 'ridge', lat: 6.0, lon: 90.0, depthRange: '1,800–2,400m' },
  { name: 'Chagos-Laccadive Ridge', type: 'ridge', lat: 9.5, lon: 72.8, depthRange: '1,200–1,800m' },
  { name: 'Java / Sunda Trench', type: 'trench', lat: 5.0, lon: 94.8, depthRange: '5,000–6,200m' },
  { name: 'Bombay High Shelf', type: 'shelf', lat: 19.5, lon: 71.5, depthRange: '60–120m' },
  { name: 'Ganga-Brahmaputra Fan', type: 'shelf', lat: 20.5, lon: 89.0, depthRange: '40–200m' }
];
