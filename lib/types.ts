export type AssetType =
  | 'towel'
  | 'bottle'
  | 'robe'
  | 'box'
  | 'card'
  | 'hanger'
  | 'stationery'
  | 'cup'
  | 'fabric'
  | 'social'
  | 'poster';

export const SYSTEM_ASSET_TYPES: AssetType[] = ['fabric', 'social', 'poster'];

export function isSystemAsset(t: AssetType): boolean {
  return SYSTEM_ASSET_TYPES.includes(t);
}

export interface BrandProfile {
  brandName?: string;
  style: string;
  tone: string;
  environment: string;
  lighting: string;
  materials: string[];
  palette: string[];
  personality: string;
  tagline?: string;
}

export type AssetStatus =
  | 'queued'
  | 'generating'
  | 'captioning'
  | 'done'
  | 'error';

export interface AssetJob {
  type: AssetType;
  status: AssetStatus;
  imageBase64?: string;
  description?: string;
  error?: string;
}

export interface ColorEntry {
  hex: string;
  name: string;
}

export interface StrategicPillar {
  word: string;
  line: string;
}

export interface CopyContent {
  logoObjective: {
    headline: string;
    statement: string;
  };
  strategicIntent: {
    pillars: StrategicPillar[];
  };
  primaryColor: {
    colorName: string;
    line: string;
  };
  palette: {
    colors: ColorEntry[];
  };
  bodyFont: {
    heading: string;
    line: string;
  };
  pattern: {
    line: string;
  };
}
