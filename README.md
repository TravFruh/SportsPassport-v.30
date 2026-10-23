# Travis' Stadium Passport

A personal stadium-visit tracker that runs as an iPhone home-screen web app. It is hosted on
GitHub Pages from this repository: every push to `main` is published automatically.

## What it does

- **Leagues tracked:** NFL, college football (CFB), MLB, and college basketball (CBB).
  NBA arenas remain in the venue list so college games played there can be logged as neutral-site games.
- **Visits:** date, teams, score, event type, neutral site, section/row/seat, favorite memory, notes,
  photos, videos, and a ticket scan.
- **Visit page:** a saved visit opens as a finished page on the team's color: cover photos,
  away @ home score box with seats, photo & video gallery, memory, notes, ticket, and passport stamp.
  **Edit** opens the form; **+ Add another visit** logs a new game at the same stadium.
- **Overview:** all visits by year, with a rotating banner of team logos.
- **Also:** checklist, scratch map, passport stamps, personal records, achievements, team edits,
  and schedule lookups from ESPN.

## Where data is stored

Everything is stored **on the device** (browser storage + IndexedDB). Nothing is sent to a server.
Use **Backup → Export backup** regularly and save the file to iCloud Drive. The app reminds you when a
backup is due. **Import backup** adds any missing visits and never removes or changes what is already on the device.

Optional cloud sync (Supabase) is included but not configured — see `SETUP-CLOUD-SYNC.md`.

## Files

| File | Purpose |
| --- | --- |
| `index.html`, `styles.css` | Page and styles |
| `app.js` | Main app |
| `app-visit-view-2026-10.js` | Published visit page and team colors |
| `app-logo-show-2026-10.js` | Overview logo slideshow |
| `app-fixes-2026-08.js` | Opening cover, photo viewer, iPhone layout fixes |
| `app-photo-gallery-2026-08.js` | Gallery placement in the visit editor |
| `app-venue-attribution-2026-08.js` | Moving a visit to a different venue |
| `cloud-sync.js`, `sync-config.js`, `dashboard.html`, `supabase-schema.sql` | Optional cloud sync |
| `data.js`, `college-logos.js` | Teams, venues, and logo links |
| `sw.js`, `manifest.webmanifest`, icons | Offline support and home-screen install |

## Updating on the phone

After a change is pushed, fully close and reopen the app. **Backup** shows the current app version.
