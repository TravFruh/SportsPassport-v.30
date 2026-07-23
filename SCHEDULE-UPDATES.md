# One-click schedule updates

This version does not require Supabase. Deploy the entire folder to Netlify, including the `netlify` folder and `netlify.toml`.

1. Drag this entire folder into Netlify Drop or deploy it to your existing Netlify site.
2. Open Stadium Passport.
3. Tap **Update Schedules**.
4. Choose a league and season.
5. Tap **Update selected league**.

The app downloads schedules through the included Netlify schedule service and stores them on the device. Personal visits, photos, notes, and scores are not overwritten.

The service currently retrieves schedule information from ESPN's publicly reachable schedule endpoints. Those endpoints are not an officially supported ESPN developer API and could change. The included service isolates that dependency so the app itself can later be switched to another provider without changing personal data.
