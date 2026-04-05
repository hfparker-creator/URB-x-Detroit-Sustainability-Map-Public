import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Map } from 'lucide-react';
import { CATEGORIES, TRANSPORT_SUBTYPES } from '../data/sustainabilityResources';
import { CATEGORY_ICONS } from '../data/iconData';
import { TramFront, TrainFront, Bike, Zap, Bus } from 'lucide-react';
import type { CategoryId, TransportSubtype } from '../data/sustainabilityResources';

const SUBTYPE_ICONS: Record<TransportSubtype, React.ElementType> = {
  'qline':        TramFront,
  'people-mover': TrainFront,
  'mogo':         Bike,
  'ev-charging':  Zap,
  'transit-hub':  Bus,
};

export interface MapLegendProps {
  activeCategories: CategoryId[];
  onCategoryClick: (id: CategoryId) => void;
}

export function MapLegend({ activeCategories, onCategoryClick }: MapLegendProps) {
  const [collapsed,     setCollapsed]     = useState(false);
  const [showSubtypes,  setShowSubtypes]  = useState(false);

  return (
    <div className="civic-panel rounded-[22px] overflow-hidden" style={{ minWidth: '220px' }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors border-b"
        style={{ backgroundColor: 'rgba(112, 86, 53, 0.06)', borderColor: 'rgba(112, 86, 53, 0.12)' }}
      >
        <div className="flex items-center gap-2">
          <Map size={13} className="text-stone-500" />
          <span className="civic-kicker" style={{ color: '#5f4a30' }}>
            Legend
          </span>
        </div>
        {collapsed
          ? <ChevronDown size={13} className="text-stone-400" />
          : <ChevronUp   size={13} className="text-stone-400" />
        }
      </button>

      {!collapsed && (
        <div className="p-3 space-y-1">
          {/* Main categories */}
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const isActive = activeCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl transition-all cursor-pointer"
                style={{
                  opacity: isActive ? 1 : 0.55,
                  backgroundColor: isActive ? `${cat.bgColor}` : 'rgba(255, 251, 245, 0.55)',
                }}
                title={isActive ? `Hide ${cat.label}` : `Show only ${cat.label}`}
              >
                <div
                  className="flex items-center justify-center rounded-[12px] flex-shrink-0 shadow-sm"
                  style={{ width: 28, height: 28, backgroundColor: cat.color, transform: 'rotate(45deg)' }}
                >
                  <div style={{ transform: 'rotate(-45deg)' }}>
                    <Icon size={13} color="white" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600 }}>
                    {cat.label}
                  </span>
                </div>
                <div
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: isActive ? cat.color : '#d6d3d1' }}
                />
              </button>
            );
          })}

          {/* Cluster indicator */}
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mt-1 border-t pt-3" style={{ borderColor: 'rgba(112, 86, 53, 0.12)' }}>
            <div
              className="flex items-center justify-center rounded-[12px] flex-shrink-0"
              style={{ width: 28, height: 28, backgroundColor: '#78624b', color: 'white', fontSize: '10px', fontWeight: 700, transform: 'rotate(45deg)' }}
            >
              <span style={{ transform: 'rotate(-45deg)' }}>N</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              Cluster (zoom in)
            </span>
          </div>

          {/* Transport sub-types expandable */}
          <div className="border-t mt-1 pt-2" style={{ borderColor: 'rgba(112, 86, 53, 0.12)' }}>
            <button
              onClick={() => setShowSubtypes((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-2 rounded-xl transition-colors"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.05)' }}
            >
              <span className="civic-kicker" style={{ color: '#7c3aed' }}>
                Transit Types
              </span>
              {showSubtypes
                ? <ChevronDown  size={11} className="text-violet-400" />
                : <ChevronRight size={11} className="text-violet-400" />
              }
            </button>

            {showSubtypes && (
              <div className="mt-2 space-y-1">
                {TRANSPORT_SUBTYPES.map((st) => {
                  const Icon = SUBTYPE_ICONS[st.id];
                  return (
                    <div key={st.id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/55">
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ width: 20, height: 20, backgroundColor: st.color }}
                      >
                        <Icon size={10} color="white" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#374151' }}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
