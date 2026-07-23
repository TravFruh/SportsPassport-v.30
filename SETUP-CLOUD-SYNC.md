# Stadium Passport v24.1 Cloud Sync Setup

This build contains the phone PWA and `dashboard.html`. They share a private Supabase database. No GitHub schedule maintenance is required.

## One-time setup

1. Create a free project at Supabase.
2. Open **SQL Editor**, paste `supabase-schema.sql`, and run it once.
3. In **Project Settings > API**, copy the Project URL and anon/public key.
4. Paste those values into `sync-config.js`. Do not use the service-role key.
5. Upload this entire folder to one HTTPS host. The phone app and dashboard can use the same folder.
6. Open `index.html`, install it to the iPhone Home Screen, choose **Cloud Sync**, and create/sign into your account.
7. Open `dashboard.html` in a browser and sign in with the same account.

## What syncs

- visits, scores, notes, seats, records, and scratch-map progress
- pictures, ticket scans, and videos stored by the current app
- schedule-refresh commands sent from the dashboard

## Important media limitation

This starter stores the complete snapshot as JSON. Large videos can exceed browser or database request limits. Use compressed photos and short videos. For unlimited media, move media files to a Supabase Storage bucket in a future release.

## Conflict behavior

The newest device timestamp wins during normal sync. Before replacing a device manually, export a backup. The **Upload this device** and **Download cloud copy** buttons are explicit overrides.

## Schedule refresh behavior

The dashboard's button sends a refresh command. The phone clears its cached schedules and requests the latest schedule from the app's existing online provider when the relevant team/season is opened. It does not create unpublished future schedules.
