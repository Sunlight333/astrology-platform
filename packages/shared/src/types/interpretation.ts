export type InterpretationCategory = 'planet_sign' | 'planet_house' | 'aspect' | 'transit';

export interface InterpretiveText {
  id: string;
  category: InterpretationCategory;
  planet: string;
  sign: string | null;
  house: number | null;
  aspectType: string | null;
  transitPlanet: string | null;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}
