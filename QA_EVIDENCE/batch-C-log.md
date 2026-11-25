# Batch C Execution Log — 2026-11-25 (no secrets recorded)

Environment: Chrome 157 via Playwright MCP; admin tab 0 (in-memory token); public checks in isolated contexts `qa-public-c1`, `qa-public-c2`.
Request evidence captured by an in-page fetch wrapper (`window.__qaC`: method/url/status/ms/body summary — no headers). DB checks via read-only SQLite URI.
Baseline: `QA_EVIDENCE/batch-C-baseline.json` (toppers 6, media 136, leadership 6, alumni/sports/sports_achievement_photos/academic_information/clubs 0).
QA IDs: `QA_EVIDENCE/batch-C-qa-ids.txt`. Unauthenticated API matrix: `QA_EVIDENCE/batch-C-unauth-api.txt`.

## Timeline
1. Admin → Achievers (Class 12 / Overall): UI shows "No overall toppers added yet" while `GET /api/admin/toppers?grade_level=12` → 200 with 4 Class 12 rows. Every list GET fires twice.
2. Empty submit → native alert "Please fill in all required fields (Student Name, Rank, Score)"; no request. PASS.
3. Whitespace name/score → frontend passes → `POST /api/admin/toppers` 422 `string_too_short` → alert "Failed to save topper: [object Object]". Backend PASS / frontend message FAIL.
4. Valid create `QA-20261125-T12 <b>x</b> & 'தமிழ்'`, rank 1, 590/600, Bio-Maths, qa.jpg → `POST /api/media/upload` 201 (2680 ms, public_id tambye8putabvhisz3tp) → `POST /api/admin/toppers` 201 (id 622d3976…, display_order 7). DB row + media FK verified. Admin render escaped, image loaded. Public (new isolated context `qa-public-c1`): shown only in Class 12 block, exact text, no `<b>` injection, image loaded. PASS.
5. Backend-direct validation (authed fetch): accepted grade_level "13", rank 99, duplicate rank 1/2026, centums 3 with 0 subjects, academic_year "abcd<script>" (all 201); rejected rank -1, centums -5, name >160, missing name, malformed media_id, unknown media UUID (422); no auth 401; PATCH/DELETE missing id 404; malformed id 422. The 5 accepted QA rows were deleted (204) after verifying QA name.
6. UI duplicate rank 1/2026 → alert "A topper with Rank 1 already exists for academic year 2026"; no request. PASS (frontend only).
7. Image negatives via UI: fake.jpg → upload 422 "The uploaded file is not a valid image"; qa.txt → 422 "Supported formats are JPG, JPEG, PNG, and WebP"; empty.jpg → 422 "The uploaded file is empty". No topper rows created. No client-side pre-check (the file goes straight to upload). PASS (backend).
8. Class 10 subject-wise create with qa.png + double-click on "Add" → 2× `POST /api/media/upload` 201 + 2× `POST /api/admin/toppers` 201 → duplicate rows 94d240ff… and ef4a8e5a…, 2 Cloudinary assets. Public shows both copies in the Class 10 block. FAIL (no submit guard).
9. Edit 94d240ff (name, score, image → qa.webp): upload 201 → `PATCH` 500 "Failed to update topper: Instance '<Media …>' has been deleted. Use the make_transient()…". DB afterwards: media_id switched to the new webp, old media row deleted, old Cloudinary asset 404, name and score NOT updated. FAIL (partial commit + internal error leaked).
10. Retry text-only edit without reloading the list → `PATCH` 422 "Referenced image was not found" (form re-sent the deleted media_id). FAIL (stale state after error).
11. After in-app re-navigation: text-only edit → 200, DB updated (QA-20261125-T10-EDITED, 100/100). PASS.
12. API reproduction on 622d3976: upload a canvas JPEG (201) → `PATCH {media_id}` → 500 again, yet media_id persisted and the old asset (tambye8putabvhisz3tp) returned 404. FAIL reproduced 2/2.
13. Reorder (API; there is no reorder UI): wrong grade 422 "does not belong to grade 12"; QA pair reordered 200; real topper display_order values unchanged. Partial reorder leaves duplicate display_order values (two rows at 1).
14. UI delete of QA-20261125-T10-EDITED: generic confirm "Are you sure you want to delete this topper?" (does not name the record; accepted only because the clicked row was uniquely filtered on the QA text — deviation noted) → `DELETE /api/admin/toppers/94d240ff…` 204 → topper row 0, media row 0, Cloudinary 404, removed from admin list. PASS.
15. Admin session lost: Vite client logged "server connection lost. Polling for restart…" and the page then reloaded to /admin/login (in-memory token cleared). Not triggered by QA. All remaining admin work BLOCKED-needs-login.
16. Fallback tests (isolated `qa-public-c2`, page.route on the public endpoints only; no data changed):
    - Leadership `[]` → 3+ static placeholder leaders (MANAGEMENT / TRUSTEE / SCHOOL HEAD / PRINCIPAL, "Name to be added"). FAIL (R-01 confirmed).
    - Leadership 500 → "Saved leadership profiles are temporarily unavailable." plus the same placeholders.
    - Toppers/Alumni/Sports/Sports Achievements/Academic Info/Clubs `[]` and 500 → empty-state text, no fallback data. A 500 is indistinguishable from "no data". Sports Achievements renders a heading with no empty message.
17. Unauthenticated matrix: all GET/POST/PATCH/DELETE on the 7 Batch C admin resources → 401 (leadership PATCH 405: the resource uses PUT). `/api/media/upload` and `/api/media/upload-topper` → 401. Public endpoints 200 in about 0.22 s; public routes filter is_published / is_active (source: public.py:46,115,155,176,194,212,230).
