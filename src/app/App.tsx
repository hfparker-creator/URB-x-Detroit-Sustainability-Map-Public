import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Search, X, SlidersHorizontal, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { DetroitMap } from './components/DetroitMap';
import { ResourceSidebar } from './components/ResourceSidebar';
import { MapLegend } from './components/MapLegend';
import { ParkFinderSidebar } from './components/ParkFinderSidebar';
import {
  BUSINESS_TIERS,
  CATEGORIES,
  BusinessTierId,
  CategoryId,
  hasMapCoordinates,
  Resource,
  TRANSPORT_SUBTYPES,
  TransportSubtype,
} from './data/sustainabilityResources';
import { CATEGORY_ICONS } from './data/iconData';
import { useGoogleSheetsResources } from './hooks/useGoogleSheetsResources';

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
  const { resources, loading } = useGoogleSheetsResources();

  const [activeCategories, setActiveCategories] = useState<CategoryId[]>(
    CATEGORIES.map((c) => c.id)
  );
  const [activeTransportSubtypes, setActiveTransportSubtypes] = useState<TransportSubtype[]>(
    TRANSPORT_SUBTYPES.map((s) => s.id)
  );
  const [activeBusinessTiers, setActiveBusinessTiers] = useState<BusinessTierId[]>(
    BUSINESS_TIERS.map((tier) => tier.id)
  );
  const [selectedResource,  setSelectedResource]  = useState<Resource | null>(null);
  const [searchQuery,       setSearchQuery]       = useState('');
  const [showFilters,       setShowFilters]       = useState(false);
  const [showList,          setShowList]          = useState(false);
  const [subtypesExpanded,  setSubtypesExpanded]  = useState(true);
  const [showSuggestions,   setShowSuggestions]   = useState(false);
  const [suggestionIndex,   setSuggestionIndex]   = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  const toggleBusinessTier = (id: BusinessTierId) => {
    setActiveBusinessTiers((prev) =>
      prev.includes(id) ? prev.filter((tier) => tier !== id) : [...prev, id]
    );
  };

  const toggleAllBusinessTiers = () => {
    if (activeBusinessTiers.length === BUSINESS_TIERS.length) {
      setActiveBusinessTiers([]);
    } else {
      setActiveBusinessTiers(BUSINESS_TIERS.map((tier) => tier.id));
    }
  };

  // ── Filtered resources (for the list view + stats bar) ───────────────────
  const filteredResources = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return resources.filter((r) => {
      if (!activeCategories.includes(r.category)) return false;
      if (r.category === 'business' && r.businessTier && !activeBusinessTiers.includes(r.businessTier)) {
        return false;
      }
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
  }, [resources, activeBusinessTiers, activeCategories, activeTransportSubtypes, searchQuery]);

  // ── Search suggestions (top 6, name matches ranked first) ───────────────
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return resources
      .filter((r) => {
        return (
          r.name.toLowerCase().includes(q) ||
          r.neighborhood.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const aName = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bName = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aName - bName;
      })
      .slice(0, 6);
  }, [searchQuery, resources]);

  const handleSelectSuggestion = useCallback((resource: Resource) => {
    setSearchQuery(resource.name);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    setSelectedResource(resource);
    setShowList(false);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && suggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[suggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestionIndex(-1);
    }
  }, [showSuggestions, suggestions, suggestionIndex, handleSelectSuggestion]);

  const showParkFinderSidebar = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery === '') return false;

    return PARK_FINDER_TERMS.some((term) => normalizedQuery.includes(term));
  }, [searchQuery]);

  // ── Counts ────────────────────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
    return counts;
  }, [resources]);

  const subtypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TRANSPORT_SUBTYPES.forEach((st) => {
      counts[st.id] = resources.filter((r) => r.id.startsWith(st.idPrefix)).length;
    });
    return counts;
  }, [resources]);

  const businessTierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BUSINESS_TIERS.forEach((tier) => {
      counts[tier.id] = resources.filter(
        (resource) => resource.category === 'business' && resource.businessTier === tier.id
      ).length;
    });
    return counts;
  }, [resources]);

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
    activeTransportSubtypes.length < TRANSPORT_SUBTYPES.length ||
    activeBusinessTiers.length < BUSINESS_TIERS.length;

  return (
    <div className="fixed inset-0 flex flex-col civic-app-shell text-stone-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="civic-topbar z-[1001] flex-shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 md:px-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0f766e, #164e63)' }}
            >
              <MapPin size={13} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="civic-title" style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937', lineHeight: '1.1' }}>
                Detroit Sustainability Map
              </p>
              <p className="civic-subtitle" style={{ fontSize: '11px', lineHeight: '1.3', maxWidth: 360, marginTop: '4px' }}>
                A curated view of businesses, public resources, transportation, and community infrastructure across Detroit.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div
            className="flex-1 min-w-[260px] max-w-xl relative"
            ref={searchContainerRef}
            onBlur={(e) => {
              // Only hide if focus leaves the whole container (not just the input)
              if (!searchContainerRef.current?.contains(e.relatedTarget as Node)) {
                setShowSuggestions(false);
                setSuggestionIndex(-1);
              }
            }}
          >
            <div className="civic-search rounded-xl px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                <Search size={13} className="text-stone-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="civic-micro-label">Search the directory</p>
                  <input
                    type="text"
                    placeholder="Resources, neighborhoods, food access, transit..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      setSuggestionIndex(-1);
                    }}
                    onFocus={() => {
                      if (searchQuery) setShowSuggestions(true);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    className="w-full bg-transparent outline-none text-stone-800 placeholder:text-stone-400"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                    autoComplete="off"
                  />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                      setSuggestionIndex(-1);
                    }}
                    className="text-stone-400 hover:text-stone-600 flex-shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1.5 z-[1002] overflow-hidden"
                style={{
                  borderRadius: '18px',
                  background: 'rgba(255, 250, 243, 0.98)',
                  border: '1px solid rgba(120, 99, 72, 0.14)',
                  boxShadow: '0 12px 32px rgba(52, 38, 24, 0.16)',
                }}
              >
                {suggestions.map((resource, idx) => {
                  const cat  = CATEGORIES.find((c) => c.id === resource.category)!;
                  const Icon = CATEGORY_ICONS[resource.category];
                  const isHighlighted = idx === suggestionIndex;
                  return (
                    <button
                      key={resource.id}
                      tabIndex={0}
                      onMouseDown={(e) => {
                        // prevent onBlur from firing before onClick
                        e.preventDefault();
                        handleSelectSuggestion(resource);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b last:border-b-0"
                      style={{
                        backgroundColor: isHighlighted ? cat.bgColor : 'transparent',
                        borderColor: 'rgba(120, 99, 72, 0.08)',
                      }}
                    >
                      <div
                        className="flex-shrink-0 rounded-lg flex items-center justify-center"
                        style={{ width: 26, height: 26, backgroundColor: cat.color }}
                      >
                        <Icon size={12} color="white" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                          {resource.name}
                        </p>
                        <p className="truncate" style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {[resource.neighborhood, cat.label].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`civic-toolbar-button flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors ${
              showFilters ? 'text-emerald-800' : 'text-stone-700'
            }`}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              flexShrink: 0,
              borderColor: showFilters ? 'rgba(16, 109, 92, 0.38)' : undefined,
              background: showFilters ? 'rgba(221, 245, 239, 0.92)' : undefined,
            }}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filters</span>
            {filtersActive && (
              <span
                className="rounded-full px-1.5 py-0.5 text-white"
                style={{ fontSize: '10px', backgroundColor: '#0f766e' }}
              >
                {activeCategories.length + activeTransportSubtypes.length}
              </span>
            )}
          </button>

          {/* List Toggle */}
          <button
            onClick={() => setShowList((v) => !v)}
            className={`civic-toolbar-button flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors ${
              showList ? 'text-sky-800' : 'text-stone-700'
            }`}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              flexShrink: 0,
              borderColor: showList ? 'rgba(3, 105, 161, 0.34)' : undefined,
              background: showList ? 'rgba(224, 242, 254, 0.94)' : undefined,
            }}
          >
            <span className="hidden sm:inline">Directory</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${showList ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* ── Filter Panel ──────────────────────────────────────────────── */}
        {showFilters && (
          <div className="px-4 pb-3 pt-1 md:px-5">
            <div className="civic-panel rounded-[20px] px-3 py-3 space-y-3">
            {/* Row 1: Categories */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="civic-kicker">
                  Categories
                </span>
                <button
                  onClick={toggleAll}
                  className="text-emerald-700 hover:text-emerald-800"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                >
                  {activeCategories.length === CATEGORIES.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const Icon     = CATEGORY_ICONS[cat.id];
                  const isActive = activeCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full border transition-all shadow-sm"
                      style={{
                        fontSize: '11px', fontWeight: 500,
                        backgroundColor: isActive ? cat.bgColor : 'rgba(255, 250, 243, 0.88)',
                        borderColor:     isActive ? cat.color  : '#ddd6c7',
                        color:           isActive ? cat.color  : '#7c6f61',
                        opacity: isActive ? 1 : 0.8,
                      }}
                    >
                      <Icon size={11} strokeWidth={2.5} />
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

            {activeCategories.includes('business') && (
              <div
                className="rounded-[16px] border overflow-hidden"
                style={{ backgroundColor: '#f4f7f7', borderColor: '#d6e5e4' }}
              >
                <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#d6e5e4' }}>
                  <span className="civic-kicker" style={{ color: '#0f766e' }}>
                    Business Tiers
                  </span>
                  <button
                    onClick={toggleAllBusinessTiers}
                    className="text-sky-700 hover:text-sky-800"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                  >
                    {activeBusinessTiers.length === BUSINESS_TIERS.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-3 py-2">
                  {BUSINESS_TIERS.map((tier) => {
                    const isActive = activeBusinessTiers.includes(tier.id);
                    return (
                      <button
                        key={tier.id}
                        onClick={() => toggleBusinessTier(tier.id)}
                        className="min-w-[200px] flex-1 text-left px-2.5 py-2 rounded-xl border transition-all shadow-sm"
                        style={{
                          backgroundColor: isActive ? tier.bgColor : '#ffffff',
                          borderColor: isActive ? tier.color : '#d1d5db',
                          color: isActive ? '#111827' : '#6b7280',
                          boxShadow: isActive
                            ? `0 0 0 2px ${tier.color}22`
                            : '0 1px 2px rgba(0, 0, 0, 0.04)',
                        }}
                        title={tier.description}
                        aria-pressed={isActive}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: isActive ? tier.color : '#374151',
                                }}
                              >
                                {tier.label}
                              </span>
                              <span
                                className="rounded-full px-1.5 py-0.5"
                                style={{
                                  backgroundColor: isActive ? tier.color : '#e5e7eb',
                                  color: isActive ? 'white' : '#6b7280',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                }}
                              >
                                {businessTierCounts[tier.id] || 0}
                              </span>
                            </div>
                            <p
                              className="mt-0.5"
                              style={{
                                fontSize: '10px',
                                lineHeight: '1.4',
                                color: isActive ? '#374151' : '#6b7280',
                              }}
                            >
                              {tier.description}
                            </p>
                          </div>
                          <div
                            className="mt-0.5 h-3.5 w-3.5 rounded-full border flex-shrink-0"
                            style={{
                              borderColor: isActive ? tier.color : '#cbd5e1',
                              backgroundColor: isActive ? tier.color : 'transparent',
                              boxShadow: isActive ? 'inset 0 0 0 2px white' : 'none',
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row 2: Transport sub-types (only when Transportation is active) */}
            {activeCategories.includes('transportation') && (
              <div
                className="rounded-[16px] border overflow-hidden"
                style={{ backgroundColor: '#faf6ff', borderColor: '#e7daf8' }}
              >
                {/* Sub-type header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSubtypesExpanded((v) => !v)}
                  onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? setSubtypesExpanded((v) => !v) : undefined}
                  className="w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer"
                  style={{ backgroundColor: 'rgba(255,255,255,0.28)' }}
                >
                  <div className="flex items-center gap-1.5">
                    {subtypesExpanded
                      ? <ChevronDown size={11} className="text-violet-400" />
                      : <ChevronRight size={11} className="text-violet-400" />
                    }
                    <span className="civic-kicker" style={{ color: '#7c3aed' }}>
                      Transportation Sub-types
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '10px', color: '#7c3aed' }}>
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
                  <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                    {TRANSPORT_SUBTYPES.map((st) => {
                      const Icon     = SUBTYPE_ICONS[st.id];
                      const isActive = activeTransportSubtypes.includes(st.id);
                      return (
                        <button
                          key={st.id}
                          onClick={() => toggleSubtype(st.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-full border transition-all"
                          style={{
                            fontSize: '11px', fontWeight: 500,
                            backgroundColor: isActive ? st.bgColor : 'rgba(255, 255, 255, 0.82)',
                            borderColor:     isActive ? st.color  : '#ddd6c7',
                            color:           isActive ? st.color  : '#7c6f61',
                            opacity: isActive ? 1 : 0.82,
                          }}
                        >
                          <Icon size={11} strokeWidth={2.5} />
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
          </div>
        )}

        {/* ── Resource List Dropdown ────────────────────────────────────── */}
        {showList && (
          <div className="px-4 pb-4 md:px-5">
            <div className="civic-panel rounded-[24px] border-t max-h-72 overflow-y-auto">
            {filteredResources.length === 0 ? (
              <p className="text-center text-stone-400 py-6" style={{ fontSize: '13px' }}>
                No resources match your search.
              </p>
            ) : (
              filteredResources.map((resource) => {
                const cat      = CATEGORIES.find((c) => c.id === resource.category)!;
                const Icon     = CATEGORY_ICONS[resource.category];
                const businessTier = resource.businessTier
                  ? BUSINESS_TIERS.find((tier) => tier.id === resource.businessTier) ?? null
                  : null;
                const isListOnly = !hasMapCoordinates(resource);
                const isSelected = selectedResource?.id === resource.id;
                return (
                  <button
                    key={resource.id}
                    onClick={() => handleSelectResource(resource)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors"
                    style={{
                      backgroundColor: isSelected ? cat.bgColor : 'transparent',
                      borderColor: 'rgba(120, 99, 72, 0.08)',
                    }}
                  >
                    <div
                      className="rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ width: 30, height: 30, backgroundColor: cat.color }}
                    >
                      <Icon size={14} color="white" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                        {resource.name}
                      </p>
                      <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                        <p className="text-gray-400 truncate" style={{ fontSize: '11px' }}>
                          {resource.neighborhood} · {cat.label}
                        </p>
                        {businessTier && (
                          <span
                            className="px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: businessTier.color,
                              backgroundColor: businessTier.bgColor,
                            }}
                          >
                            {businessTier.label}
                          </span>
                        )}
                        {isListOnly && (
                          <span
                            className="px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: '#4b5563',
                              backgroundColor: '#f3f4f6',
                            }}
                          >
                            List only
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    )}
                  </button>
                );
              })
            )}
            </div>
          </div>
        )}
      </header>

      {/* ── Map Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <DetroitMap
          resources={resources}
          activeCategories={activeCategories}
          activeTransportSubtypes={activeTransportSubtypes}
          selectedResource={selectedResource}
          onSelectResource={handleSelectResource}
        />

        {/* Loading indicator while fetching from Google Sheets */}
        {loading && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2 rounded-2xl shadow-md"
            style={{ background: 'rgba(255,250,243,0.96)', border: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}
          >
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Loading resources…
          </div>
        )}

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
        <div className="absolute bottom-4 right-4 z-[999]" style={{ maxWidth: 240 }}>
          <MapLegend
            activeCategories={activeCategories}
            onCategoryClick={handleLegendCategoryClick}
          />
        </div>

        {/* Stats Bar — bottom left */}
        <div className="absolute bottom-4 left-4 z-[999]">
          <div className="civic-panel rounded-[22px] px-4 py-3 flex items-center gap-4">
            <div className="text-center">
              <p className="civic-title" style={{ fontSize: '23px', fontWeight: 700, color: '#0f766e', lineHeight: '1' }}>
                {filteredResources.length}
              </p>
              <p className="civic-micro-label">
                Shown
              </p>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <p className="civic-title" style={{ fontSize: '23px', fontWeight: 700, color: '#0f3d56', lineHeight: '1' }}>
                {resources.length}
              </p>
              <p className="civic-micro-label">
                Total
              </p>
            </div>
            <div className="w-px h-8 bg-stone-200" />
            <div className="text-center">
              <p className="civic-title" style={{ fontSize: '23px', fontWeight: 700, color: '#7c3aed', lineHeight: '1' }}>
                {activeCategories.length}
              </p>
              <p className="civic-micro-label">
                Categories
              </p>
            </div>
          </div>
        </div>

        <style>{`
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 12px 28px rgba(52,38,24,0.16) !important;
            border-radius: 16px !important;
            overflow: hidden;
            margin: 16px !important;
          }
          .leaflet-control-zoom a {
            border: none !important;
            color: #4b5563 !important;
            font-size: 16px !important;
            background: rgba(255, 250, 243, 0.96) !important;
          }
          .leaflet-control-zoom a:hover { background-color: #efe6d5 !important; }
          .leaflet-marker-icon { cursor: pointer; }
          .leaflet-container { font-family: inherit; }
          .leaflet-tooltip {
            white-space: pre-line;
            font-size: 12px;
            max-width: 200px;
            border-radius: 12px;
            border: 1px solid rgba(111, 88, 58, 0.16);
            box-shadow: 0 10px 30px rgba(60, 45, 28, 0.14);
          }
        `}</style>
      </div>
    </div>
  );
}
