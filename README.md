# dks-staging

Staging copy of the DKS main site (https://driftkingschool.github.io/). Served at
https://driftkingschool.github.io/dks-staging/ with `noindex,nofollow`.

Rules
- `style.css` and `script.js` are byte-identical copies of the live files and are never edited.
- Every upgrade lives in `sections.css` (loaded after style.css) and `upgrade.js` (loaded after script.js).
- No booking system here: every drift CTA links to the LIVE `https://driftkingschool.github.io/book/`.
- Assets are WebP under `assets/`; videos under `assets/video/`; data under `data/`.
- No em-dash / en-dash anywhere ("-" only).

Data files Paul edits
- `data/reels.json`: set `"selected": true` on the reels to show (id = the Instagram reel id).
- `data/reviews.json`: set `"selected": true` on 8-12 five-star reviews.

Placeholders (promotion gate)
- `assets/hero/hero-PLACEHOLDER-photo.webp` and `hero-mobile-PLACEHOLDER-photo.webp`: swap 1:1 for Paul's Porsche photos.
- `assets/video/hero-new-720.mp4`: Paul's new hero video (absent = the cars video plays as fallback).
- `assets/roadmap/road-desktop.webp` / `road-mobile.webp`: absent = CSS road.
- Fleet cards with `data-placeholder="true"`: Porsche, M3, BRZ photos.

Promotion to live (only after Paul's explicit "yes" on the staging URL)
1. `git tag promote-candidate-YYYYMMDD` here.
2. Gates: QA list green; `grep -rn "PLACEHOLDER\|data-placeholder=\"true\"\|(translate)" index.html upgrade.js sections.css` empty;
   real Porsche photos + hero video in place; reels/reviews selections final.
3. In `dks-repo`: `git pull --no-rebase` first.
4. Copy `index.html`, `sections.css`, `upgrade.js`, `assets/`, `data/` into `dks-repo`. Do NOT copy style.css/script.js.
   Leave `book/`, `r/`, `dks-ads-dashboard/` untouched.
5. Edit the copied `index.html`: remove the robots meta; `og:url` -> `https://driftkingschool.github.io/`;
   `og:image` -> absolute live path; hidden `source` value `staging-main` -> `main`.
6. `git add index.html sections.css upgrade.js assets data` (explicit, never `-A`), commit, push.
7. Verify live (200, hard refresh, mobile, links, lead form sentinel + delete).
8. Rollback = `git revert <promotion-commit>` in dks-repo.
