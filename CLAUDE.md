# PawFile: instructions for Claude Code

An installable web app (PWA) for recording everything a carer needs to know about someone's pets. The long-term aim is the Google Play Store, by wrapping the web app.

The owner has **no programming experience**. Explain decisions and manual steps in plain language.

## Decisions made (Nov 2026)

- Plain HTML, CSS and JavaScript (ES modules). No framework, no build step, no npm packages unless the owner approves.
- Data is stored **on the device only** (IndexedDB, `db.js`). No accounts, servers or cloud yet. Sharing happens through the emergency card (share as text or print) and backup files.
- Photos are shrunk to a maximum of 800 px (JPEG) and stored inside the pet record.

## Structure

- `pet.js`: the data model and rules, with no screen code (`PROFILE_FIELDS`, `CARE_FIELDS`, `SECTIONS`, `normalisePet`, `emergencyText`). To add a new list to every pet, add an entry to `SECTIONS`; forms, the profile card and backups follow automatically. Also update the emergency card in `app.js` and `emergencyText` if it matters in an emergency.
- `app.js`: hash-based pages (`#/`, `#/new`, `#/pet/<id>`, `#/pet/<id>/edit`, `#/pet/<id>/emergency`, `#/backup`). Always escape user text with `esc()`.
- `db.js`: storage. Backups go through `normalisePet()` before saving.

## Running and checking

- `node serve.js` → http://localhost:5173
- The built-in preview browser refuses to register service workers ("unknown error when fetching the script"). That is the preview, not the app.
- Never commit to Git automatically. The owner commits.
