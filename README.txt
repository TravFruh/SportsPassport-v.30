STADIUM PASSPORT v24.2 - ONE-CLICK SCHEDULE UPDATES

New: Update Schedules button and included Netlify schedule service. Supabase is not required for schedule updates. See SCHEDULE-UPDATES.md.

STADIUM PASSPORT v24.1 CLOUD SYNC

See SETUP-CLOUD-SYNC.md for the required one-time cloud setup.

Travis' Stadium Passport v23.19

New in v23.19:
- Neutral-site visits now store a Game League separately from the venue's league.
- A college basketball game at an NBA arena remains CBB instead of being changed to NBA.
- Added a Game League selector to the visit editor for NFL, CFB, MLB, CBB, and NBA.
- Overview cards use the saved game league for sport badges, styling, and team-logo lookup.
- Existing neutral-site visits without a saved game league are inferred from the entered teams when possible.
- Updated the offline cache.

Travis' Stadium Passport v23.18

New in v23.18:
- Neutral-site visits now keep date, both teams, both mascots, both final scores, event name, event type, and actual venue visible in the main editor.
- Added preseason, postseason, playoff-round, bowl, CFP, NCAA Tournament, conference tournament, championship, all-star, exhibition, international, and custom event-type options.
- Overview cards now show the full away/home matchup with mascot names, event type, optional event name, final score, date, and venue.
- Improved the matchup editor for iPhone with stacked mobile fields and a highlighted neutral-site state.
- Updated the offline cache.

Travis' Stadium Passport v23.17

New in v23.17:
- Visit media can now be selected from the iPhone photo library as photos or videos.
- Multiple photos and videos can be added to a single visit.
- Videos play inline with native controls in the visit gallery and Overview cards.
- The Overview cover-photo picker opens the photo library rather than the camera.
- Videos larger than 100 MB are skipped to reduce mobile storage failures.
- Updated the offline cache.

Travis' Stadium Passport v23.16

New in v23.16:
- Added NFL, CFB, MLB, CBB, and NBA selector boxes at the top of the mobile Leagues page.
- Selecting a league loads its conferences, divisions, and teams on the same page.
- Added the same five league selector boxes to Add Visit, with all team lists available.
- Add Visit now has a visible Cancel button, a larger close button, and closes when tapping outside the sheet.
- Updated the offline cache.

Travis' Stadium Passport v23.15

New in v23.15:
- Added a fixed iPhone-style bottom navigation bar with Overview, Leagues, Add Visit, Map, and Passport.
- Added a dedicated Add Visit picker with sport filters and team, stadium, and city search.
- The Leagues button returns to the most recently viewed league.
- Hid the older top tab strip on mobile while preserving it on larger screens.
- Added iPhone safe-area spacing so navigation remains clear of the home indicator.
- Updated the offline cache.

Travis' Stadium Passport v23.14

New in v23.14:
- Replaced the app icon with the supplied TMF sports artwork.
- Added matching 180px, 192px, 512px, and SVG app icons.
- Used the same TMF artwork as the mobile header background.
- Increased the header artwork visibility while preserving title readability.
- Applied the navy-and-cream mobile presentation shown in the approved layout.
- Updated the offline cache.

Travis' Stadium Passport v23.13

New in v23.13:
- Centered the app title vertically and horizontally in the mobile header.
- Added a very faded, full-header app-icon watermark behind the title.
- Displays Passport stamps in two columns on iPhone.
- Displays Personal Records cards in two columns on iPhone.
- Keeps NFL, CFB, MLB, CBB, and NBA scratch-map tabs on one line.
- Updated the offline cache so installed mobile copies receive the layout changes.

Travis' Stadium Passport v23.10

New in v23.10:
- Ticket images now open the iPhone photo picker instead of forcing the camera.
- Visit photos can be selected in bulk from the phone's photo library.
- Saved visit cards on the Overview page remain horizontal on iPhone, with the score and photo side by side and compact details underneath.
- Updated the offline cache so installed apps receive the changes.

Travis' Stadium Passport v23.9

New in v23.9:
- Fixed visit editing inside the mobile detail window.
- Switching between saved visits no longer attempts to reopen an already-open dialog, which could stop the editor controls from being wired on iPhone.
- Save, delete, photo, ticket, neutral-site, and visit-history controls are reattached correctly whenever a visit is selected.
- Updated the offline cache so installed iPhone apps receive the fix.

Travis' Stadium Passport v23.7

New in v23.7:
- Removed the FBS and Division I subdivision rows from the CFB and CBB league pages.
- College teams now appear directly inside their conference section.
- Conference headers can be tapped to collapse or expand their team lists.
- The left conference panel now links directly to each collapsible conference.
- Removed the redundant Division field from college team previews.
- Updated the offline cache version.

Travis' Stadium Passport v23.6

New in v23.6:
- Added neutral-site game support.
- Visits can be assigned to the actual stadium where the game was played.
- Added editable Team You Saw and Event Type fields.
- Neutral-site visits credit the selected venue rather than the team’s home stadium.
- Photos and ticket scans move with a visit when its venue changes.
- Personal Records now tracks Teams Seen and Neutral-Site Games.
- Updated the offline cache.

Travis' Stadium Passport v23.5

New in v23.5:
- Rebuilt the mobile layout for current iPhone screen widths, including compact and Pro Max sizes.
- Added iPhone safe-area support for the notch, Dynamic Island, and home indicator.
- Converted league pages into a single-column mobile flow with swipeable conference and division navigation.
- Resized team rows, logos, controls, and touch targets for reliable one-handed use.
- Made photo tiles responsive so two square photos fit cleanly across an iPhone screen.
- Made detail, backup, and exterior dialogs use the full mobile viewport with independent scrolling.
- Added dedicated 192px, 512px, and Apple touch icons for PWA installation.
- Updated the web app manifest and offline cache.

Travis' Stadium Passport v23.4

New in v23.4:
- Replaced the blurry MAC favicon with a high-resolution bundled conference logo.
- Replaced the blurry Summit League favicon with a high-resolution bundled conference logo.
- Added both logo assets to the offline cache.

Travis' Stadium Passport v23.3

New in v23.3:
- The conference panel on the left can now scroll independently.
- The middle teams panel retains its own independent scrolling.
- The right details panel can scroll independently when its content is taller than the viewport.
- All three desktop panels use matching heights for cleaner alignment.
- Mobile layouts continue to use normal page scrolling.
- Updated the offline cache version.

Travis' Stadium Passport v23.2

New in v23.2:
- Removed logos from division headings and division navigation rows.
- Removed Capacity and Opened from the team preview panel.
- Removed initials-based fallbacks above team names in league panels.
- Rebuilt conference sections so divisions appear as equal side-by-side columns.
- Standardized team-row heights so teams align directly from left to right.
- Updated the offline cache version.

Travis' Stadium Passport v23.1

New in v23.1:
- Fixed the league-page rendering error that prevented teams from appearing.
- Added a desktop league browser with conference navigation, division sections, full team lists, and a team detail preview.
- Preserved mobile responsiveness, saved visits, photos, notes, and stadium IDs.
- Updated the offline cache.

Travis' Stadium Passport v23.0

New in v23.0:
- Replaced conference and division initial badges with image-based league and conference logos.
- Each division now displays its parent conference or league logo because divisions do not have separate official marks.
- Added logo support for every NFL, MLB, NBA, college football, and college basketball conference represented in the app.
- Updated the offline cache version.

Travis' Stadium Passport v22.9

New in v22.9:
- Added a distinct visual badge beside every conference heading.
- Added a distinct visual badge beside every division heading.
- Badges are generated locally for every sport and conference/division, so they also work offline.
- Updated the offline cache version.

Travis' Stadium Passport v22.8 (corrected)

New in corrected v22.8:
- Added exact logo-name mappings for Cal State Fullerton and Cal State Northridge.
- Included the service worker under the required sw.js filename.
- Updated the offline cache so installed copies load the corrected logo file.

Travis' Stadium Passport v22.7

New in v22.7:
- Removed Idaho from the Sun Belt college football list.
- Renamed the SEC college football entry from Mississippi to Ole Miss.
- Confirmed Ole Miss uses the ESPN Ole Miss Rebels logo (team ID 145).
- Preserved the existing Ole Miss stadium ID and venue details so saved visits remain connected.
- Updated the offline cache version so installed copies receive the changes.

Travis' Stadium Passport v22.6

New in v22.6:
- Removed the CAA from the college football list.
- Updated Conference USA for the 2026 football season.
- Added Delaware, Jacksonville State, Kennesaw State, Liberty, Missouri State, and Sam Houston to Conference USA.
- Moved Louisiana Tech to the Sun Belt.
- Kept UTEP in the Mountain West.
- Updated the offline cache version so installed copies receive the new data.
- Existing stadium IDs were preserved whenever possible so saved visits, photos, notes, and passport entries remain connected.

New in v22.5:
- Removed the following conferences from the college football list: SWAC, Southland, Southern, Pioneer, Patriot, Ohio Valley, Northeast, Missouri Valley, MEAC, Ivy, Big South, and Big Sky.
- Kept all other CFB conferences and teams unchanged, including the CAA and Independent teams.
- Preserved existing stadium IDs so saved visits, photos, notes, tickets, and passport entries remain connected.
- Updated the offline cache version so installed copies receive the revised CFB list.

Travis' Stadium Passport v22.4

New in v22.4:
- Updated college football conference assignments for the 2026 season.
- ACC now includes California, Stanford, and SMU.
- Big Ten now includes Oregon, UCLA, USC, and Washington.
- Big 12 now includes Arizona, Arizona State, BYU, Cincinnati, Colorado, Houston, UCF, and Utah.
- SEC now includes Oklahoma and Texas.
- Rebuilt the Pac-12 football group with Boise State, Colorado State, Fresno State, Oregon State, San Diego State, Texas State, Utah State, and Washington State.
- Updated affected American, Mountain West, MAC, Sun Belt, C-USA, and Independent assignments represented in the app.
- Updated numerous college football stadium names and several replacement-venue map locations.
- Updated the offline cache version so installed copies receive the changes.
- Preserves existing visits, photos, tickets, notes, passport stamps, and backups because school IDs were not changed.

Previously in v22.3:
- Added North Carolina, NC State, Idaho State, Mercyhurst, New Haven, and West Florida to college basketball.
- College basketball includes 367 schools.

Schedule reliability from v22.2 remains included.


v23.8 iPhone readiness update
- Hardened all layouts against horizontal overflow down to 320px-wide screens.
- Ensured team, venue, conference, checklist, event, and photo boxes shrink within the available iPhone width.
- Preserved two-column square photo tiles on small screens while keeping controls full-width.
- Added stronger safe-area, Dynamic Island, notch, home-indicator, landscape, and full-screen dialog handling.
- Standardized 44px+ touch targets and 16px form controls to avoid unwanted iOS zoom.
- Updated the service-worker cache so installed copies receive the mobile-ready files.


v23.11 Overview score update
- Displays the visiting/away team first and the home team last on overview cards.
- Keeps each score aligned with the correct team.
- Highlights the winning score and team when a complete score is entered.
- Shows a Neutral Site badge for neutral-site visits.
- Shows “Score not entered” when either score is missing.
- Uses the saved team name on neutral-site visits instead of the venue's usual tenant.
- Updated the service-worker cache so installed copies receive the fix.
