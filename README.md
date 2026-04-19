# Detroit Sustainability Map

An interactive map of sustainability-focused businesses, public resources, transportation, and community infrastructure across Detroit.

---

## Running the project

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

---

## How the map is populated

**All resource data comes from a single Google Spreadsheet.** When someone opens the map, it fetches the latest data from that spreadsheet automatically — no rebuild or redeploy required. Updating the spreadsheet is all it takes to add, edit, or remove a resource on the live map.

If the spreadsheet is temporarily unreachable, the map falls back to the last known static dataset so it never shows blank.

---

## Updating the spreadsheet

The spreadsheet has five tabs. Each tab corresponds to one category shown on the map:

| Tab name | Map category |
|---|---|
| Public Resources | Public Resources (blue) |
| Transportation | Transportation (gold) |
| Community | Community (teal) |
| Tier 1 Businesses | Businesses — Tier 1 (small/independent) |
| Tier 2 Businesses | Businesses — Tier 2 (larger/public-facing) |

**To add a new resource**, add a row to the appropriate tab. The map will reflect it the next time a visitor loads the page.

**To remove a resource**, delete its row.

**To edit a resource**, update the relevant cells.

See [`guidelines/spreadsheet-schema.md`](guidelines/spreadsheet-schema.md) for a full description of every column and tips on filling them in correctly.

---

## Spreadsheet column reference (quick version)

Every tab uses the same eight columns:

| Column | Required? | Notes |
|---|---|---|
| `name` | Yes | The display name shown on the map and in the list |
| `website` | No | Full URL including `https://` |
| `lat` | No | Latitude — needed to show a pin on the map |
| `lng` | No | Longitude — needed to show a pin on the map |
| `address` | No | Street address shown in the resource detail panel |
| `neighborhood` | No | Detroit neighborhood name |
| `description` | No | One or two sentences describing the resource |
| `tags` | No | Comma-separated keywords (e.g. `recycling, drop-off`) |

Resources without coordinates will still appear in the searchable directory list — they just won't have a map pin.

---

## For developers

### How the live data connection works

The map fetches data from a Google Apps Script web app at startup. The script reads all five tabs of the spreadsheet and returns them as a single JSON response. The frontend maps each tab to its category, parses coordinates, and renders everything.

The relevant pieces of code:

- **Hook:** `src/app/hooks/useGoogleSheetsResources.ts` — fetches, transforms, and provides the resource data to the app
- **Data types:** `src/app/data/sustainabilityResources.ts` — TypeScript interfaces and static fallback data
- **Map component:** `src/app/components/DetroitMap.tsx`

### Updating the Apps Script

If the spreadsheet structure ever changes (e.g. a tab is renamed), the Google Apps Script will need to be updated to match. The script lives at **Extensions → Apps Script** inside the Google Sheet. The full script source is documented in `guidelines/spreadsheet-schema.md`.
