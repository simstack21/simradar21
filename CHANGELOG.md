# Changelog

# [0.9.1-beta]

## New Features
- Display planespotters.net aircraft images for valid registrations
- Display users' hours and ratings at a glance

## Improvements and Fixes
- **Major**: Fix missing pilots after long idle sessions
- **Major**: Fix temporary live feed disconnects (caused by data processing bug)
- **Major**: Fix missing ATC sectors (e.g., NAT_FSS, LECM-R1, LECP)
- Fix cruise altitude rounding to display exact thousands
- Fix replay page layout on mobile devices
- Fix booking page to show correct times
- Fix/stop map interactions when hovering over an overlay
- Fix disappearing airport icons on bookings page
- Fix world-wrapping coordinates for flight tracks and Navigraph routes

- Improve live feed revalidation logic

# [0.9.0-beta]

## Known Issues
- Some pilot markers might not be updated correctly after longer idle sessions. A potential fix has been introduced. If the bug persist, simply reload the page for a temporary fix.

## Improvements and Fixes
- Fix pilot route highlighting
- Potential fix for missing pilot markers after long idle sessions
- Add link to Github milestones