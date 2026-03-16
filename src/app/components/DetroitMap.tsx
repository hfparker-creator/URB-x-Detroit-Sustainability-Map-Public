import React, { useEffect, useRef, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  RESOURCES,
  CATEGORIES,
  Resource,
  CategoryId,
  TransportSubtype,
  TRANSPORT_SUBTYPES,
} from '../data/sustainabilityResources';
import { buildSvgString } from '../data/iconData';

// ── Constants ──────────────────────────────────────────────────────────────
const CLUSTER_ZOOM_THRESHOLD = 13; // show clusters at zoom < 13
const CLUSTER_PIXEL_RADIUS   = 48; // px radius to group into a cluster

// ── Icon helpers ───────────────────────────────────────────────────────────
function createMarkerIcon(color: string, svgContent: string, isSelected: boolean) {
  const size     = isSelected ? 42 : 32;
  const iconSize = isSelected ? 20 : 15;
  const shadow   = isSelected
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${color},0 4px 14px rgba(0,0,0,0.35);`
    : `box-shadow:0 2px 7px rgba(0,0,0,0.28);`;
  const html = `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};${shadow}
    display:flex;align-items:center;justify-content:center;cursor:pointer;
  "><svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}"
    fill="none" stroke="white" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" style="display:block;"
  >${svgContent}</svg></div>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function createClusterIcon(color: string, count: number) {
  const size     = count < 10 ? 38 : count < 100 ? 44 : 52;
  const fontSize = count < 10 ? 14 : count < 100 ? 12 : 10;
  const html = `<div style="
    width:${size}px;height:${size}px;border-radius:50%;
    background:${color};
    box-shadow:0 0 0 4px ${color}44,0 3px 10px rgba(0,0,0,0.22);
    display:flex;align-items:center;justify-content:center;
    color:white;font-size:${fontSize}px;font-weight:700;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    cursor:pointer;
  ">${count}</div>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

// ── Clustering algorithm ───────────────────────────────────────────────────
interface ClusterGroup {
  resources: Resource[];
  lat: number;
  lng: number;
  category: CategoryId;
}

function computeClusters(
  map: L.Map,
  visibleResources: Resource[],
  pixelRadius: number,
): ClusterGroup[] {
  const assigned = new Set<string>();
  const clusters: ClusterGroup[] = [];

  // Separate by category so clusters never mix categories
  const byCat = new Map<CategoryId, Resource[]>();
  for (const r of visibleResources) {
    if (!byCat.has(r.category)) byCat.set(r.category, []);
    byCat.get(r.category)!.push(r);
  }

  byCat.forEach((catResources, category) => {
    for (const r of catResources) {
      if (assigned.has(r.id)) continue;
      const pt    = map.latLngToContainerPoint([r.lat, r.lng]);
      const group: Resource[] = [r];
      assigned.add(r.id);

      for (const other of catResources) {
        if (assigned.has(other.id)) continue;
        const op = map.latLngToContainerPoint([other.lat, other.lng]);
        if (pt.distanceTo(op) <= pixelRadius) {
          group.push(other);
          assigned.add(other.id);
        }
      }

      const lat = group.reduce((s, x) => s + x.lat, 0) / group.length;
      const lng = group.reduce((s, x) => s + x.lng, 0) / group.length;
      clusters.push({ resources: group, lat, lng, category });
    }
  });

  return clusters;
}

// ── Component ──────────────────────────────────────────────────────────────
export interface DetroitMapProps {
  activeCategories: CategoryId[];
  activeTransportSubtypes: TransportSubtype[];
  selectedResource: Resource | null;
  onSelectResource: (resource: Resource) => void;
}

export function DetroitMap({
  activeCategories,
  activeTransportSubtypes,
  selectedResource,
  onSelectResource,
}: DetroitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  // Permanent per-resource markers (never added directly to map; managed by display logic)
  const markersRef   = useRef<Map<string, L.Marker>>(new Map());
  // Active cluster divIcon markers on map
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  // Individual marker layer group (only used at zoom >= threshold)
  const markerLayerRef  = useRef<L.LayerGroup | null>(null);

  const onSelectRef            = useRef(onSelectResource);
  onSelectRef.current          = onSelectResource;
  const activeCatsRef          = useRef(activeCategories);
  activeCatsRef.current        = activeCategories;
  const activeSubtypesRef      = useRef(activeTransportSubtypes);
  activeSubtypesRef.current    = activeTransportSubtypes;
  const selectedResourceRef    = useRef(selectedResource);
  selectedResourceRef.current  = selectedResource;

  // Derive which resources are currently visible
  const getVisibleResources = useCallback((): Resource[] => {
    const cats     = activeCatsRef.current;
    const subtypes = activeSubtypesRef.current;
    return RESOURCES.filter((r) => {
      if (!cats.includes(r.category)) return false;
      if (r.category === 'transportation') {
        // Check sub-type filter
        const matched = TRANSPORT_SUBTYPES.some(
          (st) => subtypes.includes(st.id) && r.id.startsWith(st.idPrefix)
        );
        if (!matched) return false;
      }
      return true;
    });
  }, []);

  // Main display refresh: clusters vs individual markers
  const refreshDisplay = useCallback(() => {
    const map = mapRef.current;
    if (!map || !clusterLayerRef.current || !markerLayerRef.current) return;

    const zoom    = map.getZoom();
    const visible = getVisibleResources();
    const selectedId = selectedResourceRef.current?.id ?? null;

    if (zoom >= CLUSTER_ZOOM_THRESHOLD) {
      // ── Individual markers mode ──────────────────────────────────────────
      clusterLayerRef.current.clearLayers();

      const visibleIds = new Set(visible.map((r) => r.id));
      markersRef.current.forEach((marker, id) => {
        const resource = RESOURCES.find((r) => r.id === id)!;
        const cat = CATEGORIES.find((c) => c.id === resource.category)!;
        const svg = buildSvgString(resource.category);
        const isSelected = id === selectedId;
        marker.setIcon(createMarkerIcon(cat.color, svg, isSelected));
        marker.setZIndexOffset(isSelected ? 1000 : 0);

        if (visibleIds.has(id)) {
          if (!markerLayerRef.current!.hasLayer(marker)) {
            markerLayerRef.current!.addLayer(marker);
          }
        } else {
          markerLayerRef.current!.removeLayer(marker);
        }
      });
    } else {
      // ── Cluster mode ─────────────────────────────────────────────────────
      markerLayerRef.current.clearLayers();
      clusterLayerRef.current.clearLayers();

      const clusters = computeClusters(map, visible, CLUSTER_PIXEL_RADIUS);
      clusters.forEach((cluster) => {
        const cat = CATEGORIES.find((c) => c.id === cluster.category)!;

        if (cluster.resources.length === 1) {
          // Single marker — still show as pin, not a cluster bubble
          const r   = cluster.resources[0];
          const svg = buildSvgString(r.category);
          const isSelected = r.id === selectedId;
          const icon = createMarkerIcon(cat.color, svg, isSelected);
          const marker = L.marker([r.lat, r.lng], { icon })
            .on('click', () => onSelectRef.current(r));
          clusterLayerRef.current!.addLayer(marker);
        } else {
          // Cluster bubble
          const icon = createClusterIcon(cat.color, cluster.resources.length);
          const marker = L.marker([cluster.lat, cluster.lng], { icon })
            .on('click', () => {
              // Zoom in to fit all cluster members
              const bounds = L.latLngBounds(
                cluster.resources.map((r) => [r.lat, r.lng] as [number, number])
              );
              map.flyToBounds(bounds, { padding: [60, 60], maxZoom: CLUSTER_ZOOM_THRESHOLD + 1, duration: 0.6 });
            });
          // Tooltip showing all names
          const names = cluster.resources.slice(0, 5).map((r) => r.name).join('\n');
          const extra = cluster.resources.length > 5 ? `\n+${cluster.resources.length - 5} more` : '';
          marker.bindTooltip(`${cat.label} (${cluster.resources.length})\n${names}${extra}`, {
            direction: 'top', offset: [0, -20], opacity: 0.92,
          });
          clusterLayerRef.current!.addLayer(marker);
        }
      });
    }
  }, [getVisibleResources]);

  // ── Initialization ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [42.38, -83.10],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
          '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }
    ).addTo(map);

    const markerLayer  = L.layerGroup().addTo(map);
    const clusterLayer = L.layerGroup().addTo(map);
    markerLayerRef.current  = markerLayer;
    clusterLayerRef.current = clusterLayer;

    // Build all markers (not yet on map)
    RESOURCES.forEach((resource) => {
      const cat = CATEGORIES.find((c) => c.id === resource.category)!;
      const svg = buildSvgString(resource.category);
      const icon = createMarkerIcon(cat.color, svg, false);
      const marker = L.marker([resource.lat, resource.lng], { icon })
        .on('click', () => onSelectRef.current(resource));
      markersRef.current.set(resource.id, marker);
    });

    mapRef.current = map;

    // Initial render after a short settle
    setTimeout(() => refreshDisplay(), 50);

    // Re-cluster on zoom
    map.on('zoomend', () => refreshDisplay());
    // Also re-cluster on moveend in case container point positions changed
    map.on('moveend', () => {
      if (map.getZoom() < CLUSTER_ZOOM_THRESHOLD) refreshDisplay();
    });

    return () => {
      map.remove();
      mapRef.current       = null;
      markerLayerRef.current  = null;
      clusterLayerRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── React to filter changes ────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    refreshDisplay();
  }, [activeCategories, activeTransportSubtypes, refreshDisplay]);

  // ── React to selected resource changes ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    refreshDisplay();
    if (selectedResource) {
      mapRef.current.flyTo([selectedResource.lat, selectedResource.lng], 15, { duration: 0.7 });
    }
  }, [selectedResource, refreshDisplay]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}