export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

export const PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
] as const;

export type Planet = typeof PLANETS[number];

export const ASPECT_TYPES = [
  'conjunction', 'opposition', 'trine', 'square', 'sextile',
  'quincunx', 'semisextile', 'semisquare', 'sesquiquadrate',
] as const;

export type AspectType = typeof ASPECT_TYPES[number];

export const ASPECT_ANGLES: Record<AspectType, number> = {
  conjunction: 0,
  opposition: 180,
  trine: 120,
  square: 90,
  sextile: 60,
  quincunx: 150,
  semisextile: 30,
  semisquare: 45,
  sesquiquadrate: 135,
};

export const NATAL_ASPECT_ORBS: Record<AspectType, number> = {
  conjunction: 8,
  opposition: 8,
  trine: 8,
  square: 7,
  sextile: 6,
  quincunx: 3,
  semisextile: 2,
  semisquare: 2,
  sesquiquadrate: 2,
};

export type HouseSystem = 'P' | 'K' | 'E' | 'W' | 'R' | 'C' | 'B';
