import React from 'react';
import {
  X,
  MapPin,
  Clock,
  Globe,
  Phone,
  Tag,
  Zap,
  ExternalLink,
  List,
} from 'lucide-react';
import { BUSINESS_TIERS, Resource, CATEGORIES, hasMapCoordinates } from '../data/sustainabilityResources';
import { CATEGORY_ICONS } from '../data/iconData';

interface ResourceSidebarProps {
  resource: Resource | null;
  onClose: () => void;
}

export function ResourceSidebar({ resource, onClose }: ResourceSidebarProps) {
  const category = resource
    ? CATEGORIES.find((c) => c.id === resource.category)
    : null;
  const businessTier = resource?.businessTier
    ? BUSINESS_TIERS.find((tier) => tier.id === resource.businessTier) ?? null
    : null;
  const isListOnly = resource ? !hasMapCoordinates(resource) : false;

  if (!resource || !category) return null;

  const CategoryIcon = CATEGORY_ICONS[resource.category];

  return (
    <div className="absolute top-0 right-0 h-full w-[25rem] max-w-[calc(100vw-1rem)] civic-panel-strong shadow-2xl z-[1000] flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="p-6 flex items-start gap-4 border-b"
        style={{
          background: `linear-gradient(180deg, ${category.bgColor}, rgba(255,255,255,0.7))`,
          borderColor: 'rgba(109, 89, 59, 0.12)',
        }}
      >
        {/* Category Icon Badge */}
        <div
          className="rounded-[18px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
          style={{ width: 42, height: 42, backgroundColor: category.color, transform: 'rotate(45deg)' }}
        >
          <div style={{ transform: 'rotate(-45deg)' }}>
            <CategoryIcon size={18} color="white" strokeWidth={2} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="civic-kicker"
            style={{ color: category.color }}
          >
            {category.label}
          </span>
          <h2
            className="civic-title text-gray-900 mt-1 pr-6"
            style={{ fontSize: '24px', fontWeight: 700, lineHeight: '1.05' }}
          >
            {resource.name}
          </h2>
          <p
            className="text-stone-500 mt-2 flex items-center gap-1"
            style={{ fontSize: '12px' }}
          >
            <MapPin size={11} />
            {resource.neighborhood}
          </p>
          {(businessTier || isListOnly) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {businessTier && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-1"
                  style={{
                    fontSize: '11px',
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
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-white/80 text-gray-600"
                  style={{ fontSize: '11px', fontWeight: 600 }}
                >
                  <List size={11} />
                  List only
                </span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <p
          className="text-stone-700"
          style={{ fontSize: '14px', lineHeight: '1.7' }}
        >
          {resource.description}
        </p>

        {businessTier && (
          <div
            className="p-4 rounded-[18px]"
            style={{ backgroundColor: businessTier.bgColor }}
          >
            <p style={{ fontSize: '12px', color: businessTier.color, fontWeight: 600 }}>
              {businessTier.description}
            </p>
          </div>
        )}

        {isListOnly && (
          <div className="flex items-start gap-2.5 p-4 rounded-[18px] bg-stone-100/90">
            <List size={14} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <p style={{ fontSize: '12px', color: '#4b5563', fontWeight: 600 }}>
              This resource is listed in the directory, but it does not currently have a public map pin or storefront location.
            </p>
          </div>
        )}

        {resource.impact && (
          <div
            className="flex items-start gap-2.5 p-4 rounded-[18px]"
            style={{ backgroundColor: category.bgColor }}
          >
            <Zap
              size={14}
              className="mt-0.5 flex-shrink-0"
              style={{ color: category.color }}
            />
            <p style={{ fontSize: '12px', color: category.color, fontWeight: 600 }}>
              {resource.impact}
            </p>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2.5">
          <p className="civic-kicker">Details</p>
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600" style={{ fontSize: '13px' }}>
              {resource.address}
            </p>
          </div>
          {resource.hours && (
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="text-gray-400 flex-shrink-0" />
              <p className="text-gray-600" style={{ fontSize: '13px' }}>
                {resource.hours}
              </p>
            </div>
          )}
          {resource.phone && (
            <div className="flex items-center gap-2.5">
              <Phone size={14} className="text-gray-400 flex-shrink-0" />
              <a
                href={`tel:${resource.phone}`}
                className="text-blue-600 hover:underline"
                style={{ fontSize: '13px' }}
              >
                {resource.phone}
              </a>
            </div>
          )}
          {resource.website && (
            <div className="flex items-center gap-2.5">
              <Globe size={14} className="text-gray-400 flex-shrink-0" />
              <a
                href={resource.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
                style={{ fontSize: '13px' }}
              >
                Visit Website
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={12} className="text-gray-400" />
              <span className="civic-kicker text-gray-400" style={{ letterSpacing: '0.08em' }}>
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600"
                  style={{ fontSize: '11px' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Directions Button */}
        {hasMapCoordinates(resource) ? (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(resource.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[18px] text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: category.color,
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <MapPin size={14} />
            Get Directions
          </a>
        ) : (
          <div
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[18px] bg-stone-100 text-stone-500"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            <List size={14} />
            Directory Listing
          </div>
        )}
      </div>
    </div>
  );
}
