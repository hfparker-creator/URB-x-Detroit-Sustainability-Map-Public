import { Store, Landmark, TrainFront, Users, LucideIcon } from 'lucide-react';
import { CategoryId } from './sustainabilityResources';

// Lucide React components for use in React UI
export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  'business': Store,
  'public-resource': Landmark,
  'transportation': TrainFront,
  'community': Users,
};

// SVG node arrays extracted from lucide for use in Leaflet divIcon (no React rendering)
type IconNode = [string, Record<string, string>][];

const ICON_NODES: Record<CategoryId, IconNode> = {
  'business': [
    ["path", { d: "m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" }],
    ["path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" }],
    ["path", { d: "M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" }],
    ["path", { d: "M2 7h20" }],
    ["path", { d: "M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" }],
  ],
  'public-resource': [
    ["line", { x1: "3", x2: "21", y1: "22", y2: "22" }],
    ["line", { x1: "6", x2: "6", y1: "18", y2: "11" }],
    ["line", { x1: "10", x2: "10", y1: "18", y2: "11" }],
    ["line", { x1: "14", x2: "14", y1: "18", y2: "11" }],
    ["line", { x1: "18", x2: "18", y1: "18", y2: "11" }],
    ["polygon", { points: "12 2 20 7 4 7" }],
  ],
  'transportation': [
    ["path", { d: "M8 3.1V7a4 4 0 0 0 8 0V3.1" }],
    ["path", { d: "m9 15-1-1" }],
    ["path", { d: "m15 15 1-1" }],
    ["path", { d: "M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z" }],
    ["path", { d: "m8 19-2 3" }],
    ["path", { d: "m16 19 2 3" }],
  ],
  'community': [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: "9", cy: "7", r: "4" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }],
  ],
};

export function buildSvgString(categoryId: CategoryId): string {
  const nodes = ICON_NODES[categoryId];
  return nodes
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${attrStr}/>`;
    })
    .join('');
}
