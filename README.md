# Pack 6 Photo Trail

A private photo app for Cub Scout Pack 6, Tallahassee, Florida. Families open it with a pack code, snap or upload photos, and set photo permission for each scout. Leaders check every photo against those choices before anyone else sees it.

Built from the photo feature of the Statewide Synergy conference app (shrink on the phone, agree once, send, leader approval), with additions for a youth program.

## What families see

- **Pack code gate.** Nothing loads without the code. The site also asks search engines not to index it.
- **Snap.** Take a photo or pick up to 10. Choose an album and den, tap a caption idea, and optionally tag the scouts in it. Location data (GPS) is stripped from every photo on the phone before it's sent.
- **Gallery.** Filter by album and den, swipe through full screen, save a photo to the phone.
- **Slideshow.** Full-screen, auto-advancing, picks up newly approved photos every two minutes. Made for the projector at the Blue & Gold.
- **Permission.** A parent or guardian lists each scout (first name, last initial, den) and picks one of three choices: *Yes, share it* (gallery and public pages), *Pack families only*, or *No photos, please*. They sign by typing their name and can change it any time.

## Leader tools (`#/leaders`)

- **Review.** Each photo shows a permission check: *Has a No-photos scout* (approve is blocked), *No scouts tagged* (check faces), *Pack families only*, or *Public OK*. Approve, hide, delete, tag scouts, move albums, and mark photos *OK for public* (only allowed when every tagged scout has public permission).
- **Permissions.** Counts by choice, the No-photos list to keep handy at events, and every family's record with contact info and change history.
- **Albums.** Add albums for events (Fall Campout 2026, etc.).
- **Records.** CSV downloads of photo permission and the photo log.

## Settings

Everything editable is in `pack/pack.js`: names, colors, dens, starting albums, caption ideas, sharing rules and the permission wording. Have your Cubmaster and chartered organization review the permission wording before rollout.

Secrets go in Netlify → Site configuration → Environment variables:

| Variable | What it does |
|---|---|
| `PACK_CODE` | The code families type to open the app. Not case-sensitive. Change it each scouting year. |
| `LEADER_PASSCODE` | Opens the leader tools. Share only with leaders. |

Photos and permission records live in Netlify Blobs, in a store named after `pack.id`. No database to set up.

## Run it locally

```
npm install
npm run dev
```

Local pack code: `pack6`. Local leader passcode: `leader`. Data saves to `.data/`.

## Deploy

Deploy from Git or with the Netlify CLI (`netlify deploy --prod`) so the `/api` function deploys with the site. A drag-and-drop deploy won't include it.

The badge in `public/brand/` is an original Pack 6 design, not an official Scouting America mark. To use the pack's own logo, replace `public/brand/badge-512.png` and the icon files (or edit `scripts/badge.svg.html` and run `python3 scripts/make-icons.py`).
