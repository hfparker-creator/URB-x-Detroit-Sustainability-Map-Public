# Project Guidelines

Internal notes and conventions for developers maintaining this project.

## Data source

All map resource data is managed through the Google Spreadsheet connected via the Apps Script API. See `spreadsheet-schema.md` for full documentation on the spreadsheet structure and how to update it.

## Code conventions

- The project uses React with TypeScript and Vite
- Styling is handled with Tailwind CSS
- Map rendering uses Leaflet
- UI components are from shadcn/ui

## Key files

| File | Purpose |
|---|---|
| `src/app/hooks/useGoogleSheetsResources.ts` | Fetches and transforms live data from Google Sheets |
| `src/app/data/sustainabilityResources.ts` | TypeScript types and static fallback dataset |
| `src/app/components/DetroitMap.tsx` | Leaflet map component |
| `src/app/components/ResourceSidebar.tsx` | Resource detail panel |
| `src/app/App.tsx` | Root application component |
