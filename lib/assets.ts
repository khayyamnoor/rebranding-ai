import type { AssetType } from './types';

export interface AssetMeta {
  type: AssetType;
  label: string;
  aspectRatio: '4:3' | '3:4' | '16:9' | '1:1';
  zone: { x: number; y: number; w: number; h: number };
}

export const ASSETS: AssetMeta[] = [
  { type: 'towel',      label: 'Hotel Towel',          aspectRatio: '4:3', zone: { x: 0.38, y: 0.62, w: 0.24, h: 0.10 } },
  { type: 'bottle',     label: 'Shampoo Bottle',       aspectRatio: '3:4', zone: { x: 0.40, y: 0.52, w: 0.20, h: 0.12 } },
  { type: 'robe',       label: 'Hotel Robe',           aspectRatio: '3:4', zone: { x: 0.42, y: 0.32, w: 0.16, h: 0.12 } },
  { type: 'box',        label: 'Gift Box',             aspectRatio: '4:3', zone: { x: 0.37, y: 0.58, w: 0.26, h: 0.12 } },
  { type: 'card',       label: 'Key Card',             aspectRatio: '16:9', zone: { x: 0.38, y: 0.38, w: 0.24, h: 0.14 } },
  { type: 'hanger',     label: 'Door Hanger',          aspectRatio: '3:4', zone: { x: 0.38, y: 0.35, w: 0.24, h: 0.10 } },
  { type: 'stationery', label: 'Stationery Set',       aspectRatio: '4:3', zone: { x: 0.15, y: 0.10, w: 0.25, h: 0.10 } },
  { type: 'cup',        label: 'Coffee Cup',           aspectRatio: '3:4', zone: { x: 0.40, y: 0.50, w: 0.20, h: 0.12 } },
  { type: 'fabric',     label: 'Pattern Application',  aspectRatio: '4:3', zone: { x: 0, y: 0, w: 0, h: 0 } },
  { type: 'social',     label: 'Social Media Assets',  aspectRatio: '4:3', zone: { x: 0, y: 0, w: 0, h: 0 } },
  { type: 'poster',     label: 'Print Materials',      aspectRatio: '4:3', zone: { x: 0, y: 0, w: 0, h: 0 } },
];

export const ASSETS_BY_TYPE: Record<AssetType, AssetMeta> = ASSETS.reduce(
  (acc, a) => {
    acc[a.type] = a;
    return acc;
  },
  {} as Record<AssetType, AssetMeta>,
);

export function getAsset(type: AssetType): AssetMeta {
  return ASSETS_BY_TYPE[type];
}
