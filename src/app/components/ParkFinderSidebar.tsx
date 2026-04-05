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
    <aside className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-[1000] flex flex-col overflow-hidden">
      <div className="p-4 flex items-start gap-3 bg-emerald-50">
        <div
          className="rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-600"
          style={{ width: 36, height: 36 }}
        >
          <Trees size={18} color="white" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="text-xs font-semibold uppercase tracking-wide text-emerald-700"
          >
            Parks & Pathways
          </span>
          <h2
            className="text-gray-900 mt-0.5 pr-6"
            style={{ fontSize: '15px', fontWeight: 700, lineHeight: '1.3' }}
          >
            Find Detroit park spaces in Park Finder
          </h2>
          <p className="text-gray-500 mt-1" style={{ fontSize: '12px' }}>
            Detroit manages park and pathway information through its official Park Finder tool.
          </p>
        </div>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close Park Finder panel"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-gray-600" style={{ fontSize: '13px', lineHeight: '1.6' }}>
          If you are looking for parks, recreation spaces, trails, or pathways, the most current
          Detroit data lives on the City of Detroit website.
        </p>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600" style={{ fontSize: '13px' }}>
              Browse official park locations and recreation facilities.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <Route size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600" style={{ fontSize: '13px' }}>
              Explore pathways and other park-related amenities from the City&apos;s maintained tool.
            </p>
          </div>
        </div>

        <a
          href={PARK_FINDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white transition-opacity hover:opacity-90 bg-emerald-600"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          Open Detroit Park Finder
          <ExternalLink size={14} />
        </a>

        <p className="text-gray-400" style={{ fontSize: '11px', lineHeight: '1.5' }}>
          You&apos;ll open Detroit&apos;s official Park Finder in a new tab so you can return to this
          sustainability map anytime.
        </p>
      </div>
    </aside>
  );
}
