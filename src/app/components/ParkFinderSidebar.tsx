import React from 'react';
import { Trees, ExternalLink, MapPin, Route, X } from 'lucide-react';

interface ParkFinderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PARK_FINDER_URL = 'https://detroitmi.gov/ParkFinder';

export function ParkFinderSidebar({ isOpen, onClose }: ParkFinderSidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="absolute top-0 right-0 h-full w-[25rem] max-w-[calc(100vw-1rem)] civic-panel-strong shadow-2xl z-[1000] flex flex-col overflow-hidden">
      <div
        className="p-6 flex items-start gap-4 border-b"
        style={{
          background: 'linear-gradient(180deg, rgba(220, 252, 231, 0.9), rgba(255,255,255,0.72))',
          borderColor: 'rgba(109, 89, 59, 0.12)',
        }}
      >
        <div
          className="rounded-[18px] flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-600 shadow-sm"
          style={{ width: 42, height: 42, transform: 'rotate(45deg)' }}
        >
          <div style={{ transform: 'rotate(-45deg)' }}>
            <Trees size={18} color="white" strokeWidth={2} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span className="civic-kicker text-emerald-700">
            Parks & Pathways
          </span>
          <h2
            className="civic-title text-gray-900 mt-1 pr-6"
            style={{ fontSize: '24px', fontWeight: 700, lineHeight: '1.05' }}
          >
            Find Detroit park spaces in Park Finder
          </h2>
          <p className="text-stone-500 mt-2" style={{ fontSize: '12px' }}>
            Detroit manages park and pathway information through its official Park Finder tool.
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close Park Finder panel"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <p className="text-stone-700" style={{ fontSize: '14px', lineHeight: '1.7' }}>
          If you are looking for parks, recreation spaces, trails, or pathways, the most current
          Detroit data lives on the City of Detroit website.
        </p>

        <div className="space-y-2.5 civic-section-card p-4">
          <p className="civic-kicker" style={{ color: '#0f766e' }}>Why redirect?</p>
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-stone-700" style={{ fontSize: '13px' }}>
              Browse official park locations and recreation facilities.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Route size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-stone-700" style={{ fontSize: '13px' }}>
              Explore pathways and other park-related amenities from the City&apos;s maintained tool.
            </p>
          </div>
        </div>

        <a
          href={PARK_FINDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[18px] text-white transition-opacity hover:opacity-90 bg-emerald-600 shadow-sm"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          Open Detroit Park Finder
          <ExternalLink size={14} />
        </a>

        <p className="text-stone-400" style={{ fontSize: '11px', lineHeight: '1.5' }}>
          You&apos;ll open Detroit&apos;s official Park Finder in a new tab so you can return to this
          sustainability map anytime.
        </p>
      </div>
    </aside>
  );
}
