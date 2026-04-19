import { useState, useEffect } from 'react';
import {
  Resource,
  CategoryId,
  BusinessTierId,
  STATIC_RESOURCES,
  TRANSPORT_SUBTYPES,
} from '../data/sustainabilityResources';

// The published Google Apps Script web app URL
const SHEETS_API_URL =
  'https://script.google.com/macros/s/AKfycbzYska1ZS-BQR9ED0Vuwv4XuHog0iVQDk0eA7W853OIZuPoxzj8lysbbO2BHOoTqphUXg/exec';

interface RawRow {
  name: string;
  website?: string;
  lat: unknown;
  lng: unknown;
  address?: string;
  neighborhood?: string;
  description?: string;
  tags?: string;
  category: CategoryId;
  businessTier?: BusinessTierId;
}

// Handle three malformed coordinate patterns produced by the sheet:
//   1. Clean:            lat=42.36,      lng=-83.07
//   2. Both in lat:      lat="42.36, -83.07", lng=""
//   3. Comma prefix lng: lat=42.33,      lng=", -83.04"
function parseCoordinates(rawLat: unknown, rawLng: unknown): { lat?: number; lng?: number } {
  const latStr = String(rawLat ?? '').trim();
  const lngStr = String(rawLng ?? '').trim();

  if (latStr.includes(',') && !lngStr) {
    const [a, b] = latStr.split(',');
    const lat = parseFloat(a);
    const lng = parseFloat(b);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr.replace(/^,\s*/, ''));

  if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  if (!isNaN(lat)) return { lat };
  return {};
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Map transportation entry names to the id-prefix conventions the filter logic expects
function inferTransportId(name: string, tags: string): string {
  const haystack = `${name} ${tags}`.toLowerCase();
  for (const st of TRANSPORT_SUBTYPES) {
    const keywords: Record<string, string[]> = {
      'qline':        ['qline'],
      'people-mover': ['people mover', 'peoplemover'],
      'mogo':         ['mogo', 'bike share', 'bikeshare'],
      'ev-charging':  ['ev charging', 'electric vehicle', 'charging station', 'ev station'],
      'transit-hub':  [],
    };
    if (keywords[st.id]?.some((kw) => haystack.includes(kw))) {
      return `${st.idPrefix}${slugify(name)}`;
    }
  }
  return `tr-center-${slugify(name)}`;
}

function generateId(row: RawRow): string {
  const slug = slugify(row.name);
  switch (row.category) {
    case 'transportation': return inferTransportId(row.name, row.tags ?? '');
    case 'business':       return `biz-${slug}`;
    case 'community':      return `comm-${slug}`;
    default:               return `pr-${slug}`;
  }
}

function transformRow(row: RawRow): Resource {
  const { lat, lng } = parseCoordinates(row.lat, row.lng);
  const tags = row.tags
    ? row.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const resource: Resource = {
    id:           generateId(row),
    name:         row.name.trim(),
    category:     row.category,
    address:      row.address?.trim() ?? '',
    neighborhood: row.neighborhood?.trim() ?? '',
    description:  row.description?.trim() ?? '',
    tags,
    website:      row.website?.trim() || undefined,
  };

  if (lat !== undefined) resource.lat = lat;
  if (lng !== undefined) resource.lng = lng;
  if (row.businessTier)  resource.businessTier = row.businessTier;

  return resource;
}

export interface ResourcesState {
  resources: Resource[];
  loading: boolean;
  error: string | null;
}

export function useGoogleSheetsResources(): ResourcesState {
  const [state, setState] = useState<ResourcesState>({
    resources: STATIC_RESOURCES,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(SHEETS_API_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<RawRow[]>;
      })
      .then((rows) => {
        const resources = rows
          .filter((r) => r.name?.trim() && r.category)
          .map(transformRow);
        setState({ resources, loading: false, error: null });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('[useGoogleSheetsResources] Falling back to static data:', err.message);
        setState({ resources: STATIC_RESOURCES, loading: false, error: err.message });
      });

    return () => controller.abort();
  }, []);

  return state;
}
