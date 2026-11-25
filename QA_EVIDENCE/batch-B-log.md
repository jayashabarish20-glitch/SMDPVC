# Batch B Test Log – 2026-11-25 (no secrets)

Environment: Playwright MCP (Chromium 157). Tab 0 = logged-in admin (in-memory token, never reloaded). Public checks in isolated contexts qa-public-2 and qa-public-4 (new). Authenticated API calls ran inside tab 0 via `browser_evaluate`; the token was never printed. A fetch wrapper logged method/url/status/body summary only. DB reads were read-only (`mode=ro`).

## Baseline
- `QA_EVIDENCE/batch-B-baseline.json`: 11 singleton photo slots (all populated), 3 about_sections (all populated), content_records principal.nursery / principal.primary / higher-secondary.course-groups. principal.higherSecondary record absent. Media count 136.

## Chronology (abridged)
1. School Sections Cards, admin read: 3 images, correct keys (each key fetched twice; React StrictMode in `src/main.tsx` causes double effects in dev).
2. Client validation on the Nursery slot. First script: in-script dialog handler conflicted with MCP dialog handling. The "Save this image? fake.jpg (0KB)" confirm was **accepted**, so `PUT /api/media/3a591a6c…` (the real Nursery card image) was sent. Backend returned **422** (file is 20 bytes of text). Verified afterwards: DB row unchanged (file_size 55192, updated_at 2026-11-24 13:01:37), Cloudinary asset still serves 55,192 bytes. No data changed. All later dialogs were dismissed explicitly with `browser_handle_dialog(accept=false)`.
3. Rejected client-side with no request: qa.txt, qa.svg, oversize.jpg. Accepted and prompted to save (dismissed): empty.jpg (0 bytes), qa.jpg (valid).
4. Remove → "Confirm Delete" → Cancel: no request.
5. Public homepage (qa-public-2): 3 cards and 2 hero 3D cards show the correct Cloudinary images and links. 3 broken images found: leadership profiles (Batch C scope).
6. Hero 3D Cards, admin read OK. Outdated "Features not yet implemented: Photo upload and validation" notice.
7. About ×3: admin and public match DB. Empty and whitespace descriptions leave Save enabled. A .txt file is accepted as the pending photo (broken blob preview). Navigating away discarded changes without warning. No writes.
8. About API with QA key `qa-20261125-about`: see report table. 20,000-char PATCH returned 500 `{"error":"The Nursery Academic Calendar request failed."}`, traced to `server.mjs:47` (`express.json({limit:"16kb"})`) and the error handler at `server.mjs:603-607`. Port 5173 is served by `node server.mjs`, not plain Vite.
9. Academic Calendar ×3: admin read OK. Client validation rejects txt, jpg and >5MB PDF; a valid PDF is only staged (Save button). Public: all 3 PDFs return 200 application/pdf. The Nursery Download button opens the correct PDF. All three current files are named `Shabarish_resume*.pdf`.
10. HS Principal: admin GET `/api/admin/content-records/principal.higherSecondary` returned 422 (pattern `^[a-z0-9][a-z0-9._-]{0,159}$`). Save attempt with a QA name gave PUT 422 and UI message "Request failed with status 422". Nothing written.
11. Courses: QA group create / subject add / remove / group delete, all PUT 200. Public new context + reload correct. HTML payload escaped. Final payload byte-identical to original (`B-25-courses-before.json` vs `B-25-courses-after.json`).
12. Content-record API with QA key `qa-20261125-record`: created, updated, deleted. Negative cases recorded.
13. Final DB verification: slots, about_sections, principal/courses payloads identical to baseline. Media 136. 0 QA leftovers.
