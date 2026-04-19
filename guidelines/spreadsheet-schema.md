# Spreadsheet Schema Guide

This document describes how to fill in the Detroit Sustainability Map spreadsheet so that resources appear correctly on the map.

---

## Overview

The spreadsheet has **five tabs**. Each tab feeds one category on the map. You can add, edit, or delete rows in any tab at any time — changes will appear on the live map the next time someone loads the page.

| Tab | What belongs here |
|---|---|
| **Public Resources** | Government offices, recycling centers, utilities, public facilities |
| **Transportation** | QLINE stops, People Mover stations, MoGo bike share, EV charging, transit hubs |
| **Community** | Recreation centers, community gardens, food banks, libraries, community spaces |
| **Tier 1 Businesses** | Small, independent businesses with a commitment to sustainability |
| **Tier 2 Businesses** | Larger businesses with public sustainability messaging or certification |

---

## Column descriptions

Every tab uses the same eight columns. The header row must stay exactly as-is — do not rename or reorder the columns.

### `name` — Required
The name of the resource as it will appear on the map and in the search results.

- Keep it short and clear
- Use the official name where possible
- Example: `Recycle Here! Drop-Off Recycling Center`

### `website` — Optional
The full web address for the resource's official page.

- Must start with `https://` or `http://`
- Leave blank if there is no website
- Example: `https://detroitmi.gov/departments/...`

### `lat` and `lng` — Optional (but needed for a map pin)
The GPS coordinates of the location.

- `lat` is the latitude (a number like `42.3314`)
- `lng` is the longitude (a number like `-83.0458`)
- Both are needed to place a pin on the map — if either is missing, the resource will appear in the list only
- You can find coordinates by searching the address in Google Maps, right-clicking the location, and copying the numbers shown
- Example: `lat = 42.36151`, `lng = -83.07478`

### `address` — Optional
The street address.

- Example: `5926 Lincoln St, Detroit, MI 48208`

### `neighborhood` — Optional
The Detroit neighborhood this resource is located in.

- Example: `Corktown`, `Midtown`, `New Center`

### `description` — Optional
A brief description of the resource — one or two sentences shown in the detail panel when a user clicks on it.

- Keep it factual and concise
- Example: `Drop-off location for household recyclables, open to all Detroit residents.`

### `tags` — Optional
Short keywords that help users find this resource when searching. Separate multiple tags with commas.

- Use short labels, not full sentences
- Example: `recycling, drop-off, waste management`

---

## Tips for keeping data clean

- **One resource per row.** Never merge two resources into one row.
- **No decorative rows.** Don't add blank rows, section headers, or color-coded dividers inside the data — they can confuse the import. The Transportation tab is the exception; any row with a blank `name` is automatically skipped.
- **No merged cells.** Keep every cell separate.
- **Trailing spaces cause problems.** Make sure there are no extra spaces at the start or end of names.
- **Leave cells blank, not zero.** If a coordinate or field is unknown, leave the cell empty rather than entering `0` or `N/A`.

---

## Transportation sub-types

The Transportation tab feeds five sub-categories that users can filter independently on the map:

| Sub-type | How it's detected |
|---|---|
| QLINE | Name or tags contain "qline" |
| People Mover | Name or tags contain "people mover" |
| MoGo Bike Share | Name or tags contain "mogo" or "bike share" |
| EV Charging | Name or tags contain "ev charging" or "charging station" |
| Transit Hubs | Everything else in the Transportation tab |

To ensure a transportation resource filters correctly, include the appropriate keyword in either the `name` or `tags` column.

---

## Apps Script (for developers)

The data connection between the spreadsheet and the live map is handled by a Google Apps Script web app. The script lives inside the spreadsheet at **Extensions → Apps Script**.

If the spreadsheet is ever moved or the tab names change, the script will need to be updated to match. The current script source:

```javascript
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetConfig = [
    { name: 'Public Resources',   category: 'public-resource' },
    { name: 'Transportation',     category: 'transportation'  },
    { name: 'Community',          category: 'community'       },
    { name: 'Tier 1 Businesses',  category: 'business', businessTier: 'tier-1' },
    { name: 'Tier 2 Businesses',  category: 'business', businessTier: 'tier-2' },
  ];

  const allResources = [];

  for (const config of sheetConfig) {
    const sheet = ss.getSheetByName(config.name);
    if (!sheet) continue;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;

    const headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const obj = {};
      headers.forEach(function(h, j) { obj[h] = row[j] !== undefined ? row[j] : ''; });

      if (!obj['name'] || String(obj['name']).trim() === '') continue;

      const resource = {
        name:         String(obj['name']         || '').trim(),
        website:      String(obj['website']       || '').trim(),
        lat:          obj['lat'],
        lng:          obj['lng'],
        address:      String(obj['address']       || '').trim(),
        neighborhood: String(obj['neighborhood']  || '').trim(),
        description:  String(obj['description']   || '').trim(),
        tags:         String(obj['tags']          || '').trim(),
        category:     config.category,
      };

      if (config.businessTier) {
        resource['businessTier'] = config.businessTier;
      }

      allResources.push(resource);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify(allResources))
    .setMimeType(ContentService.MimeType.JSON);
}
```
