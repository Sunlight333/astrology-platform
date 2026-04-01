import { AspectType, HouseSystem, Planet, ZodiacSign } from './zodiac';

export interface PlanetaryPosition {
  planet: Planet;
  longitude: number;
  latitude: number;
  distance: number;
  speedInLongitude: number;
  sign: ZodiacSign;
  degree: number;
  minute: number;
  isRetrograde: boolean;
}

export interface HouseCusp {
  house: number;
  sign: ZodiacSign;
  degree: number;
  longitude: number;
}

export interface ChartAngles {
  ascendant: number;
  mc: number;
  armc: number;
  vertex: number;
}

export interface Aspect {
  planetA: Planet;
  planetB: Planet;
  aspectType: AspectType;
  angle: number;
  orb: number;
  isApplying: boolean;
}

export interface NatalChart {
  id: string;
  birthProfileId: string;
  planetaryPositions: PlanetaryPosition[];
  houseCusps: HouseCusp[];
  angles: ChartAngles;
  aspects: Aspect[];
  houseSystem: HouseSystem;
  calculatedAt: string;
  isPaid: boolean;
}

export interface BirthProfile {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthLatitude: number;
  birthLongitude: number;
  timezoneId: string;
  utcDatetime: string;
  julianDay: number;
  createdAt: string;
}
