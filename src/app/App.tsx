import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { DetroitMap } from './components/DetroitMap';
import { ResourceSidebar } from './components/ResourceSidebar';
import { MapLegend } from './components/MapLegend';
import { ParkFinderSidebar } from './components/ParkFinderSidebar';
import {
  CATEGORIES,
  RESOURCES,
  CategoryId,
  Resource,
  TRANSPORT_SUBTYPES,
  TransportSubtype,
} from './data/sustainabilityResources';
import { CATEGORY_ICONS } from './data/iconData';

// Icons for each transport sub-type
import { TramFront, TrainFront, Bike, Zap, Bus } from 'lucide-react';

const SUBTYPE_ICONS: Record<TransportSubtype, React.ElementType> = {
  'qline':        TramFront,
  'people-mover': TrainFront,
  'mogo':         Bike,
  'ev-charging':  Zap,
  'transit-hub':  Bus,
};

const PARK_FINDER_TERMS = [
  'park',
  'parks',
  'park space',
  'parkspace',
  'playground',
  'playgrounds',
  'greenway',
  'greenways',
  'trail',
  'trails',
  'pathway',
  'pathways',
  'recreation',
  'rec center',
  'recreation center',
  'recreation centres',
  'recreation centre',
];

export default function App() {
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [activeTransportSubtypes, setActiveTransportSubtypes] = useState<TransportSubtype[]>(
    TRANSPORT_SUBTYPES.map((s) => s.id)
  );
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [showFilters,      setShowFilters]      = useState(false);
  const [showList,         setShowList]         = useState(false);
  const [subtypesExpanded, setSubtypesExpanded] = useState(true);

  // ── Category toggles ─────────────────────────────────────────────────────
  const toggleCategory = (id: CategoryId) => {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (activeCategories.length === CATEGORIES.length) {
      setActiveCategories([]);
    } else {
      setActiveCategories(CATEGORIES.map((c) => c.id));
    }
  };

  // ── Transport sub-type toggles ────────────────────────────────────────────
  const toggleSubtype = (id: TransportSubtype) => {
    setActiveTransportSubtypes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAllSubtypes = () => {
    if (activeTransportSubtypes.length === TRANSPORT_SUBTYPES.length) {
      setActiveTransportSubtypes([]);
    } else {
      setActiveTransportSubtypes(TRANSPORT_SUBTYPES.map((s) => s.id));
    }
  };

  // ── Filtered resources (for the list view + stats bar) ───────────────────
  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return RESOURCES.filter((r) => {
      if (!activeCategories.includes(r.category)) return false;
      // Transport sub-type filter
      if (r.category === 'transportation') {
        const matched = TRANSPORT_SUBTYPES.some(
          (st) => activeTransportSubtypes.includes(st.id) && r.id.startsWith(st.idPrefix)
        );
        if (!matched) return false;
      }
      // Search filter
      if (q !== '') {
        const hit =
          r.name.toLowerCase().includes(q) ||
          r.neighborhood.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [activeCategories, activeTransportSubtypes, searchQuery]);

  const showParkFinderSidebar = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery === '') return false;

    return PARK_FINDER_TERMS.some((term) => normalizedQuery.includes(term));
  }, [searchQuery]);

  // ── Counts ────────────────────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    RESOURCES.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return counts;
  }, []);

  const subtypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TRANSPORT_SUBTYPES.forEach((st) => {
      counts[st.id] = RESOURCES.filter((r) => r.id.startsWith(st.idPrefix)).length;
    });
    return counts;
  }, []);

  const handleSelectResource = (resource: Resource) => {
    setSelectedResource(resource);
    setShowList(false);
  };

  const handleCloseParkFinderSidebar = () => {
    setSearchQuery('');
  };

  // ── Legend solo-select ───────────────────────────────────────────────────
  // Click a category in the legend: if it's the only active one, reset to all;
  // otherwise filter to show only that category.
  const handleLegendCategoryClick = (id: CategoryId) => {
    const isSoloActive = activeCategories.length === 1 && activeCategories[0] === id;
    if (isSoloActive) {
      setActiveCategories(CATEGORIES.map((c) => c.id));
      setActiveTransportSubtypes(TRANSPORT_SUBTYPES.map((s) => s.id));
    } else {
      setActiveCategories([id]);
      if (id === 'transportation') {
        setActiveTransportSubtypes(TRANSPORT_SUBTYPES.map((s) => s.id));
      }
    }
  };

  // Does the current filter deviate from "all on"?
  const filtersActive =
    activeCategories.length < CATEGORIES.length ||
    activeTransportSubtypes.length < TRANSPORT_SUBTYPES.length;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 z-[1001] flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', lineHeight: '1.2' }}>
                Detroit Sustainability Map
              </p>
              <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.2' }}>
                {RESOURCES.length} resources · Businesses, Public, Transit & Community
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources, neighborhoods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-500 focus:bg-white transition-colors"
              style={{ fontSize: '13px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={{ fontSize: '13px', fontWeight: 500, flexShrink: 0 }}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {filtersActive && (
              <span
                className="bg-green-600 text-white rounded-full px-1.5 py-0.5"
                style={{ fontSize: '10px' }}
              >
                {activeCategories.length + activeTransportSubtypes.length}
              </span>
            )}
          </button>

          {/* List Toggle */}
          <button
            onClick={() => setShowList((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-colors ${
              showList
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={{ fontSize: '13px', fontWeight: 500, flexShrink: 0 }}
          >
            <span className="hidden sm:inline">List</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showList ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* ── Filter Panel ──────────────────────────────────────────────── */}
        {showFilters && (
          <div className="px-4 pb-3 border-t border-gray-100 pt-3 space-y-3">
            {/* Row 1: Categories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-gray-500"
                  style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Categories
                </span>
                <button
                  onClick={toggleAll}
                  className="text-green-600 hover:text-green-700"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                >
                  {activeCategories.length === CATEGORIES.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon     = CATEGORY_ICONS[cat.id];
                  const isActive = activeCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all"
                      style={{
                        fontSize: '12px', fontWeight: 500,
                        backgroundColor: isActive ? cat.bgColor : '#f9fafb',
                        borderColor:     isActive ? cat.color  : '#e5e7eb',
                        color:           isActive ? cat.color  : '#9ca3af',
                        opacity: isActive ? 1 : 0.65,
                      }}
                    >
                      <Icon size={12} strokeWidth={2.5} />
                      <span>{cat.label}</span>
                      <span
                        className="rounded-full px-1"
                        style={{
                          backgroundColor: isActive ? cat.color : '#e5e7eb',
                          color: isActive ? 'white' : '#6b7280',
                          fontSize: '10px',
                        }}
                      >
                        {categoryCounts[cat.id] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Transport sub-types (only when Transportation is active) */}
            {activeCategories.includes('transportation') && (
              <div
                className="rounded-xl border border-violet-100 overflow-hidden"
                style={{ backgroundColor: '#faf5ff' }}
              >
                {/* Sub-type header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSubtypesExpanded((v) => !v)}
                  onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? setSubtypesExpanded((v) => !v) : undefined}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-violet-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {subtypesExpanded
                      ? <ChevronDown size={12} className="text-violet-400" />
                      : <ChevronRight size={12} className="text-violet-400" />
                    }
                    <span
                      style={{
                        fontSize: '11px', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: '#7c3aed',
                      }}
                    >
                      Transportation Sub-types
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '11px', color: '#7c3aed' }}>
                      {activeTransportSubtypes.length}/{TRANSPORT_SUBTYPES.length} active
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAllSubtypes(); }}
                      className="text-violet-600 hover:text-violet-700"
                      style={{ fontSize: '11px', fontWeight: 500 }}
                    >
                      {activeTransportSubtypes.length === TRANSPORT_SUBTYPES.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                </div>

                {/* Sub-type chips */}
                {subtypesExpanded && (
                  <div className="flex flex-wrap gap-2 px-3 pb-3">
                    {TRANSPORT_SUBTYPES.map((st) => {
                      const Icon     = SUBTYPE_ICONS[st.id];
                      const isActive = activeTransportSubtypes.includes(st.id);
                      return (
                        <button
                          key={st.id}
                          onClick={() => toggleSubtype(st.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all"
                          style={{
                            fontSize: '12px', fontWeight: 500,
                            backgroundColor: isActive ? st.bgColor : '#f9fafb',
                            borderColor:     isActive ? st.color  : '#e5e7eb',
                            color:           isActive ? st.color  : '#9ca3af',
                            opacity: isActive ? 1 : 0.6,
                          }}
                        >
                          <Icon size={12} strokeWidth={2.5} />
                          <span>{st.label}</span>
                          <span
                            className="rounded-full px-1"
                            style={{
                              backgroundColor: isActive ? st.color : '#e5e7eb',
                              color: isActive ? 'white' : '#6b7280',
                              fontSize: '10px',
                            }}
                          >
                            {subtypeCounts[st.id] || 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Resource List Dropdown ────────────────────────────────────── */}
        {showList && (
          <div className="border-t border-gray-100 max-h-72 overflow-y-auto">
            {filteredResources.length === 0 ? (
              <p className="text-center text-gray-400 py-6" style={{ fontSize: '13px' }}>
                No resources match your search.
              </p>
            ) : (
              filteredResources.map((resource) => {
                const cat      = CATEGORIES.find((c) => c.id === resource.category)!;
                const Icon     = CATEGORY_ICONS[resource.category];
                const isSelected = selectedResource?.id === resource.id;
                return (
                  <button
                    key={resource.id}
                    onClick={() => handleSelectResource(resource)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 text-left transition-colors"
                    style={{ backgroundColor: isSelected ? cat.bgColor : undefined }}
                  >
                    <div
                      className="rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ width: 30, height: 30, backgroundColor: cat.color }}
                    >
                      <Icon size={14} color="white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                        {resource.name}
                      </p>
                      <p className="text-gray-400 truncate" style={{ fontSize: '11px' }}>
                        {resource.neighborhood} · {cat.label}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </header>

      {/* ── Map Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <DetroitMap
          activeCategories={activeCategories}
          activeTransportSubtypes={activeTransportSubtypes}
          selectedResource={selectedResource}
          onSelectResource={handleSelectResource}
        />

        {/* Resource Sidebar */}
        {!showParkFinderSidebar && (
          <ResourceSidebar
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
          />
        )}

        <ParkFinderSidebar
          isOpen={showParkFinderSidebar}
          onClose={handleCloseParkFinderSidebar}
        />

        {/* Map Legend — bottom right */}
        <div className="absolute bottom-4 right-4 z-[999]" style={{ maxWidth: 220 }}>
          <MapLegend
            activeCategories={activeCategories}
            onCategoryClick={handleLegendCategoryClick}
          />
        </div>

        {/* Stats Bar — bottom left */}
        <div className="absolute bottom-4 left-4 z-[999]">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-4">
            <div className="text-center">
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', lineHeight: '1' }}>
                {filteredResources.length}
              </p>
              <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Shown
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb', lineHeight: '1' }}>
                {RESOURCES.length}
              </p>
              <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Total
              </p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#7c3aed', lineHeight: '1' }}>
                {activeCategories.length}
              </p>
              <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Categories
              </p>
            </div>
          </div>
        </div>

        <style>{`
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            border-radius: 8px !important;
            overflow: hidden;
            margin: 16px !important;
          }
          .leaflet-control-zoom a {
            border: none !important;
            color: #374151 !important;
            font-size: 16px !important;
          }
          .leaflet-control-zoom a:hover { background-color: #f3f4f6 !important; }
          .leaflet-marker-icon { cursor: pointer; }
          .leaflet-container { font-family: inherit; }
          .leaflet-tooltip {
            white-space: pre-line;
            font-size: 12px;
            max-width: 200px;
          }
        `}</style>
      </div>
    </div>
  );
}
