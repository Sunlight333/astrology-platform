import { AspectType, Planet, ZodiacSign } from './zodiac';

export interface TransitPosition {
  date: string;
  planet: Planet;
  longitude: number;
  latitude: number;
  speedInLongitude: number;
  sign: ZodiacSign;
  degree: number;
  isRetrograde: boolean;
}

export interface TransitAspect {
  transitPlanet: Planet;
  natalPlanet: Planet;
  aspectType: AspectType;
  currentOrb: number;
  isApplying: boolean;
  exactDate: string | null;
  transitLongitude: number;
  natalLongitude: number;
}

export interface TransitReport {
  id: string;
  birthProfileId: string;
  orderId: string;
  transitDate: string;
  activeTransits: TransitAspect[];
  generatedAt: string;
}

export interface TransitEvent {
  date: string;
  transits: TransitAspect[];
}
