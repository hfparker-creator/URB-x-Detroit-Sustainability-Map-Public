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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ minWidth: '208px' }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <Map size={13} className="text-gray-500" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Legend
          </span>
        </div>
        {collapsed
          ? <ChevronDown size={13} className="text-gray-400" />
          : <ChevronUp   size={13} className="text-gray-400" />
        }
      </button>

      {!collapsed && (
        <div className="p-2 space-y-0.5">
          {/* Main categories */}
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const isActive = activeCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryClick(cat.id)}
                className="w-full flex items-center gap-2.5 px-1 py-1.5 rounded-lg transition-all hover:bg-gray-50 cursor-pointer"
                style={{ opacity: isActive ? 1 : 0.35 }}
                title={isActive ? `Hide ${cat.label}` : `Show only ${cat.label}`}
              >
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 26, height: 26, backgroundColor: cat.color }}
                >
                  <Icon size={13} color="white" strokeWidth={2} />
                </div>
                <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                  {cat.label}
                </span>
              </button>
            );
          })}

          {/* Cluster indicator */}
          <div className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg mt-0.5 border-t border-gray-100 pt-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 26, height: 26, backgroundColor: '#6b7280', color: 'white', fontSize: '10px', fontWeight: 700 }}
            >
              N
            </div>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              Cluster (zoom in)
            </span>
          </div>

          {/* Transport sub-types expandable */}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => setShowSubtypes((v) => !v)}
              className="w-full flex items-center justify-between px-1 py-1 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Transit Types
              </span>
              {showSubtypes
                ? <ChevronDown  size={11} className="text-violet-400" />
                : <ChevronRight size={11} className="text-violet-400" />
              }
            </button>

            {showSubtypes && (
              <div className="mt-1 space-y-0.5">
                {TRANSPORT_SUBTYPES.map((st) => {
                  const Icon = SUBTYPE_ICONS[st.id];
                  return (
                    <div key={st.id} className="flex items-center gap-2 px-1 py-1 rounded-lg">
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
