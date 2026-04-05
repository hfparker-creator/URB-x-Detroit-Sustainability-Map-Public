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
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-[1000] flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-start gap-3"
        style={{ backgroundColor: category.bgColor }}
      >
        {/* Category Icon Badge */}
        <div
          className="rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ width: 36, height: 36, backgroundColor: category.color }}
        >
          <CategoryIcon size={18} color="white" strokeWidth={2} />
        </div>

        <div className="flex-1 min-w-0">
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: category.color }}
          >
            {category.label}
          </span>
          <h2
            className="text-gray-900 mt-0.5 pr-6"
            style={{ fontSize: '15px', fontWeight: 700, lineHeight: '1.3' }}
          >
            {resource.name}
          </h2>
          <p
            className="text-gray-500 mt-1 flex items-center gap-1"
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
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <X size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p
          className="text-gray-600"
          style={{ fontSize: '13px', lineHeight: '1.6' }}
        >
          {resource.description}
        </p>

        {businessTier && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: businessTier.bgColor }}
          >
            <p style={{ fontSize: '12px', color: businessTier.color, fontWeight: 600 }}>
              {businessTier.description}
            </p>
          </div>
        )}

        {isListOnly && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
            <List size={14} className="mt-0.5 flex-shrink-0 text-gray-500" />
            <p style={{ fontSize: '12px', color: '#4b5563', fontWeight: 600 }}>
              This resource is listed in the directory, but it does not currently have a public map pin or storefront location.
            </p>
          </div>
        )}

        {resource.impact && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
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
              <span
                className="text-gray-400"
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
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
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white transition-opacity hover:opacity-90"
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
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gray-100 text-gray-500"
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
