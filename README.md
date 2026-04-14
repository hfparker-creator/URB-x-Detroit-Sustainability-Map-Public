
  # Interactive Detroit Sustainability Map

  This is a code bundle for Interactive Detroit Sustainability Map. The original project is available at https://www.figma.com/design/MpikLLiLSA81Rs7l6Ajyhf/Interactive-Detroit-Sustainability-Map.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Business Spreadsheet Sync

  Tier 1 and Tier 2 business rows can be generated from spreadsheet data during `dev` and `build`.

  1. Copy `.env.example` to `.env`
  2. Set:
     - `TIER_1_BUSINESSES_SOURCE`
     - `TIER_2_BUSINESSES_SOURCE`
  3. Use published Google Sheets CSV export links or local CSV file paths
  4. Make sure both business tabs use the header row:

     `name,website,lat,lng,address,neighborhood,description,tags`

  The sync step writes:

  `src/app/data/generatedBusinesses.ts`

  The app then merges generated spreadsheet businesses with the existing curated dataset.

  Spreadsheet schema guidance is in:

  `guidelines/business-sheet-schema.md`
  
