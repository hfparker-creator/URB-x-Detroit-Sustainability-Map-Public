import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('src/app/data/generatedBusinesses.ts');
const DEFAULT_OUTPUT = `export const GENERATED_BUSINESSES = [];\n`;

async function loadDotEnv() {
  const envPath = path.resolve('.env');
  try {
    const contents = await fs.readFile(envPath, 'utf8');
    contents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const SOURCES = [
  { tier: 'tier-1', source: process.env.TIER_1_BUSINESSES_SOURCE },
  { tier: 'tier-2', source: process.env.TIER_2_BUSINESSES_SOURCE },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/\(a\.k\.a\..*?\)/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanText(value) {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function parseCoordinate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = cleanText(value);
  if (!text) return undefined;

  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;

  const number = Number(match[0]);
  return Number.isFinite(number) ? number : undefined;
}

function parseTags(value, fallbackTag) {
  const text = cleanText(value);
  if (!text) return [fallbackTag, 'spreadsheet import'];

  const tags = text
    .split(/[\/,;|]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  return Array.from(new Set([...tags, 'spreadsheet import']));
}

function parseCsv(text) {
  const rows = [];
  let cell = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((entry) => entry.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((entry) => entry.trim() !== '')) rows.push(row);
  return rows;
}

function normalizeHeaders(headerRow) {
  return headerRow.map((header) =>
    String(header || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  );
}

function looksLikeHeader(row) {
  const joined = row.join(' ').toLowerCase();
  return joined.includes('resource') || joined.includes('title') || joined.includes('name');
}

function validateHeaders(headers) {
  const requiredHeaders = ['name', 'website', 'lat', 'lng', 'address', 'neighborhood', 'description', 'tags'];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(
      `Business sheet is missing required headers: ${missing.join(', ')}. ` +
      `Expected header row: ${requiredHeaders.join(', ')}`
    );
  }
}

function getField(rowObject, candidates) {
  for (const key of candidates) {
    const value = rowObject[key];
    if (cleanText(value)) return cleanText(value);
  }
  return undefined;
}

function mapRowFromSchema(rowObject, tier) {
  const name = getField(rowObject, ['name', 'resource_title', 'title', 'business_name']);
  if (!name) return null;

  const website = getField(rowObject, ['website', 'source', 'source_info', 'link', 'url']);
  const lat = parseCoordinate(
    getField(rowObject, ['lat', 'latitude', 'x_coordinate', 'x', 'coordinate_x'])
  );
  const lng = parseCoordinate(
    getField(rowObject, ['lng', 'longitude', 'y_coordinate', 'y', 'coordinate_y'])
  );
  const description = getField(rowObject, ['description', 'notes', 'summary', 'category_notes', 'tags']);
  const address = getField(rowObject, ['address']);
  const neighborhood = getField(rowObject, ['neighborhood']);
  const tags = parseTags(
    getField(rowObject, ['tags', 'tag', 'category', 'description', 'notes']),
    tier === 'tier-1' ? 'tier 1' : 'tier 2'
  );

  return {
    id: `biz-sheet-${slugify(name)}`,
    name,
    category: 'business',
    businessTier: tier,
    website,
    lat,
    lng,
    address: address ?? 'Address to be confirmed from source sheet',
    neighborhood: neighborhood ?? 'Detroit area',
    description:
      description ??
      'Imported from the client-maintained business spreadsheet.',
    tags,
  };
}

function dedupeRows(rows) {
  const byKey = new Map();

  rows.forEach((row) => {
    const key = `${row.businessTier}:${slugify(row.name)}:${row.lat ?? 'none'}:${row.lng ?? 'none'}`;
    byKey.set(key, row);
  });

  return [...byKey.values()];
}

async function loadSource(source) {
  if (!source) return [];
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }
    return parseCsv(await response.text());
  }

  const raw = await fs.readFile(path.resolve(source), 'utf8');
  return parseCsv(raw);
}

async function sync() {
  await loadDotEnv();

  const availableSources = SOURCES.filter((entry) => entry.source);
  if (availableSources.length === 0) {
    await fs.writeFile(OUTPUT_PATH, DEFAULT_OUTPUT);
    console.log('sync-businesses: no business sheet sources configured; wrote empty generatedBusinesses.ts');
    return;
  }

  const importedRows = [];

  for (const { tier, source } of availableSources) {
    const rows = await loadSource(source);
    if (rows.length === 0) continue;

    const [firstRow, ...restRows] = rows;
    if (!looksLikeHeader(firstRow)) {
      throw new Error(
        `Business sheet source for ${tier} must include a header row. ` +
        `See guidelines/business-sheet-schema.md for the required schema.`
      );
    }

    const headers = normalizeHeaders(firstRow);
    validateHeaders(headers);
    restRows.forEach((row) => {
      const rowObject = Object.fromEntries(headers.map((header, index) => [header, row[index]]));
      const mapped = mapRowFromSchema(rowObject, tier);
      if (mapped) importedRows.push(mapped);
    });
  }

  const normalizedRows = dedupeRows(importedRows);
  const fileContents =
    `export const GENERATED_BUSINESSES = ${JSON.stringify(normalizedRows, null, 2)};\n`;

  await fs.writeFile(OUTPUT_PATH, fileContents);
  console.log(`sync-businesses: wrote ${normalizedRows.length} generated businesses`);
}

sync().catch(async (error) => {
  console.error('sync-businesses:', error.message);
  await fs.writeFile(OUTPUT_PATH, DEFAULT_OUTPUT);
  process.exitCode = 1;
});
