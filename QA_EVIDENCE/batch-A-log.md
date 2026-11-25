# Batch A test log – Photo Galleries & Heroes (2026-11-25)

Environment: Chrome 157 via Playwright MCP; frontend http://localhost:5173, backend :8000, DB backend/data/smdpvc.db (backup smdpvc_backup_pre_qa_20261125.db). Admin = tab 0 (in-memory token, never reloaded). Public = isolated contexts qa-public-2 / qa-public-3.
Baseline: QA_EVIDENCE/batch-A-baseline-photo_configurations.json (41 photo_configurations rows, 136 media rows).
Upload rules (media_service.py:31-47, config.py:39): JPG/JPEG/PNG/WEBP images, PDF/MP4/MOV/WEBM docs; 5 MB default limit; empty rejected; extension must match content.
Fixtures: QA_EVIDENCE/qa-files/ (Playwright MCP may only read files under the project root).

## Row #1 Home Hero Carousel (campusImages.hero) – HomeHeroManager → PhotoGridManager + UploadPhotoDialog
| ID | Case | Evidence | Result |
|---|---|---|---|
| A-01-01 | Cancel file chooser | no /api/media request issued | PASS |
| A-01-02 | .txt upload | UI: "Invalid file type. Allowed formats: JPG, JPEG, PNG, WebP. Got: text/plain"; no request | PASS |
| A-01-03 | .svg upload | UI: "Invalid file type ... Got: image/svg+xml"; no request | PASS |
| A-01-04 | fake.jpg (text bytes) | FE accepts (broken preview); POST /api/media/upload → 422 {"detail":"The uploaded file is not a valid image"}; no DB row. UI shows NO error (BUG-A-01) | Backend PASS / UI FAIL |
| A-01-05 | empty.jpg (0 B) | FE accepts "empty.jpg (0 Bytes)"; POST → 422 {"detail":"The uploaded file is empty"}; UI shows no error (BUG-A-01) | Backend PASS / UI FAIL |
| A-01-06 | oversize.jpg (5 MB + 1 KB) | FE rejects: "File is too large. Maximum size is 5MB. Your file is 5.00MB." (misleading rounding, BUG-A-04); banner stays after later successful upload (BUG-A-03) | PASS (validation) |
| A-01-07 | Alt text required | Upload button disabled until alt text typed | PASS (observation: alt text mandatory) |
| A-01-08 | Valid JPG | POST /api/media/upload 201 (public_id rnm3wtqwaa5rjnqhlqzb, jpg 640x400) → POST /api/admin/photos/assign 201 {config_key campusImages.hero, display_order 4}; DB media + photo_configurations row OK; Cloudinary 200 image/jpeg; admin render loaded | PASS |
| A-01-09 | Public sync (qa-public-2) | image in `#home` hero, naturalWidth>0, 1 occurrence | PASS |
| A-01-10 | Valid PNG | 201/201, public_id bu9lmvl6y7xmkxn4ei4g, order 5 | PASS |
| A-01-11 | Valid WebP | 201/201, public_id gzag9twiiynh8cvzryfu, order 6 | PASS |
| A-01-12 | Duplicate upload (same file) | 201/201, new asset bcumsmpble39ub9hibac, order 7 — no dedup (observation) | PASS (accepted by design) |
| A-01-13 | Reorder (swap QA-02/QA-03 via HTML5 drag events) | POST /api/admin/photos/reorder-batch 200; DB pre-existing orders 0-3 unchanged; public order in new context qa-public-3 matches DB | PASS |
| A-01-14 | Delete confirm UX | 1st click arms (red + Cancel); Cancel disarms, no request | PASS |
| A-01-15 | Delete | DELETE /api/admin/photos/{id} 204 → DELETE /api/media/{id} 204; media + config rows gone; Cloudinary 404; public API + page no longer contain it | PASS |
| A-01-16 | Cleanup remaining QA-01/02/03 | 3× (204, 204); DB == baseline; Cloudinary 404 ×3; public reload clean | PASS |
| A-01-17 | Replace | No replace control in HomeHeroManager | NOT APPLICABLE |
| A-01-18 | Broken image URL handling | requires tampering existing DB rows | NOT TESTED |
| A-01-19 | Empty state | would require deleting real hero photos | BLOCKED (protects real data) |

Findings noted: "Add Photo" makes user pick file twice (PhotoGridManager.tsx:80 → HomeHeroManager.tsx:97) – BUG-A-02; admin img alt = filename, public hero img alt="" despite saved alt text – BUG-A-05; delete button opacity-0 until hover, no accessible name – BUG-A-06.
Security note: a Playwright `browser_network_request` full-detail call echoed the request Authorization header into the agent tool output (not saved to any file). Recommend logging out / letting token expire after QA.

## Rows #4/#11/#18 School page heroes (schoolPageHeroes.*) – SchoolPageHeroManager (maxPhotos=3)
- All three already hold 3 real photos → "Add Photo" disabled ("3 / 3 photos"): UI create BLOCKED.
- API create (in-page authenticated fetch): upload 201 + assign 201 for each key (media 145d4025…/nursery, 809253d3…/primary, ac18a80c…/higherSecondary), order 3 → backend has no cap (BUG-A-07); admin then shows "4 / 3 photos".
- Public (qa-public-3): each QA image appears only on its own page (/nursery, /primary, /higher-secondary), not on / or other pages; loaded (primary slide lazy-loads).
- Admin UI delete: 204/204 ×3; DB == baseline; Cloudinary 404 ×3; public API clean.
- Outdated "Features not yet implemented" notice (BUG-A-08).

## Row #19 HS Classes Gallery – KeyedGalleryManager (full suite)
- Negative: txt/svg/oversize rejected by FE; fake.jpg → 422 "not a valid image" SHOWN; empty.jpg → 422 "empty" SHOWN. Cancel chooser: no request.
- JPG/PNG/WebP/dup: 201/201 ×4, key higher-secondary.classes.gallery, orders 2-5; admin render loaded.
- Public: 6 carousel dots; order == DB; screenshot A-19-public-hs-classes-QA-slide3.png. Transient browser DNS failure showed broken image with no fallback (BUG-A-09, A-19-public-hs-classes-QA-slide6.png).
- Reorder 200, real orders 0/1 unchanged; persisted after section switch; delete ×4 (204/204); DB == baseline; Cloudinary 404 ×4; public back to 2 dots.
- Description "priya" same in admin and public (read PASS); update BLOCKED (real record).

## Rows #5,6,7,12,13,14,20,21 – one QA JPG each
- 201/201 ×8; sent config_key == expected ×8; admin render ×8.
- Public (qa-public-3): stepped through all 9 gallery carousels; each QA image found exactly once in its expected section id, loaded.
- Admin UI delete ×8 (204/204); DB == baseline; Cloudinary 404 ×8; public API clean.

## Row #33 Infrastructure – InfrastructureGalleryManager
- Empty: public section absent (no fallback) but header + footer "Infrastructure" links dead (BUG-A-10); admin shows "No photos yet".
- Negative cases same as #19 (all PASS, messages shown).
- JPG/PNG/WebP/dup 201/201 (orders 0-3, alt_text empty).
- Admin cards show placeholder icon; public shows "NO IMAGE" ×4 → BUG-A-11 (infrastructureContentApi.ts:90 reads media.image_url; API returns media.imageUrl).
- Replace fake.jpg → PUT 422 shown, original kept; replace valid → PUT 200, same media id/link, new public_id zgzv0fjer0z8qo9qokx6, old asset 404.
- Reorder 200; persisted; delete ×4 (204/204); 0 links; Cloudinary 404 ×4; public section hidden again; description record unchanged (updated_at 2026-11-20 17:47:46).

## Security (found incidentally)
- Vite dev server (vite.config.ts:10-11 host 0.0.0.0) serves /backend/data/smdpvc.db (200, 446464 B), the QA backup, and /backend/app/config.py; .env → 403. SEC-A-01.

## Final state
- DB photo_configurations == baseline; media_total 136; no QA media rows; all QA Cloudinary assets 404.
- Leftover files: QA_EVIDENCE/qa-files/ (local fixtures only), scratchpad copies. No QA records remain in DB or Cloudinary.
- Admin session (tab 0) still alive.
