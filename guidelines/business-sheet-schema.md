# Business Sheet Schema

Use Google Sheets as the source of truth for `Tier 1 Businesses` and `Tier 2 Businesses`.

## Recommended columns

Each tier tab should use this header row:

`name,website,lat,lng,address,neighborhood,description,tags`

Notes:

- `name` is required.
- `website` is optional.
- `lat` and `lng` are optional.
- `address` is optional.
- `neighborhood` is optional.
- `description` is optional.
- `tags` should be a comma-separated or slash-separated list.

## Example row

`Goodpluck,https://example.com,,,,Detroit service area,Sustainable food delivery business,food delivery / service area`

## Client workflow

1. Share the Google Sheet with the client.
2. Let them edit only the `Tier 1 Businesses` and `Tier 2 Businesses` tabs.
3. Publish those tabs as CSV or use export links.
4. Set `TIER_1_BUSINESSES_SOURCE` and `TIER_2_BUSINESSES_SOURCE` in the environment.
5. On build or dev start, the repo generates `src/app/data/generatedBusinesses.ts`.

## Important cleanup suggestions

- Keep one business per row.
- Remove trailing spaces from names.
- Avoid merged cells or decorative rows.
- Use blank `lat` and `lng` for list-only businesses.
- Put location notes in `description`, not in the coordinate columns.
- Use `tags` for short labels only, not full sentence descriptions.
