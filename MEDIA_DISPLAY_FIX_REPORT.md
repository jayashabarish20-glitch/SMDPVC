# Media Display Fix Report – Academic Information PDF, Sports, Clubs, Sports Achievements

Date: 2026-11-25

## 1. Root cause (one shared cause for all four issues)

`backend/app/schemas/media.py:52` declares

```python
image_url: Annotated[HttpUrl, Field(serialization_alias="imageUrl")]
```

so every API response sends the URL as **`media.imageUrl`**. Live response (GET `/api/public/sports`):

```json
"media": { "id": "1095763a-…", "cloudinary_public_id": "pr3oyfl2ltlvvm8gffp3",
           "imageUrl": "https://res.cloudinary.com/v8lwfibg/image/upload/v1795605963/pr3oyfl2ltlvvm8gffp3.png", … }
```

The 4 public components and the 4 admin managers all read **`media.image_url`**, which is always
`undefined`, so the `<img>` / PDF-link branch never rendered:

| Area | Public component (before) | Admin manager (before) |
|---|---|---|
| Academic Information | `AcademicInformationSection.tsx`: `info.media?.image_url && <a>Download</a>`, so the link was never shown and only the title appeared | `AcademicInformationManager.tsx:285` |
| Sports | `SportsCarousel.tsx:40`, so the empty-icon placeholder was always shown | `SportsManager.tsx:298` |
| Clubs | `ClubsCarousel.tsx:40`, so the empty-icon placeholder was always shown | `ClubsManager.tsx:287` |
| Sports Achievements | `SportsAchievementsGallery.tsx:30`, so the card showed an empty gradient | `SportsAchievementsManager.tsx:271` |

What I ruled out (verified, not assumed):
- **Upload / storage:** all four Cloudinary URLs return HTTP 200 with the correct `Content-Type`
  (`application/pdf`, `image/png`).
- **Database:** each record links to an existing media row (`deletion_pending = 0`), and the stored URL
  matches the API URL exactly.
- **Public API:** it includes the media relationship and the URL; only the field name differs.
- **CSS / layout:** once the URL was read correctly, images render at full size (432×324, 296×296).

## 2. Files changed

Frontend only:
- `src/utils/mediaUrl.ts` (new): `mediaUrl()` reads `imageUrl`, falls back to `image_url`, and returns
  null for missing or non-http URLs. `cloudinaryDownloadUrl()` adds the `fl_attachment` delivery flag.
- `src/components/MediaImage.tsx` (new): an `<img>` that renders the existing fallback when the URL is
  missing or fails to load.
- `src/components/AcademicInformationSection.tsx`: adds a **View PDF** link (new tab) and a **Download**
  link (Cloudinary `fl_attachment`). Both are hidden when there is no URL.
- `src/components/SportsCarousel.tsx`, `src/components/ClubsCarousel.tsx`,
  `src/components/SportsAchievementsGallery.tsx`: use `mediaUrl()` + `MediaImage`. Classes, dimensions and
  the existing fallback are unchanged.
- `src/components/admin/AcademicInformationManager.tsx`, `SportsManager.tsx`, `ClubsManager.tsx`,
  `SportsAchievementsManager.tsx`: list previews read `mediaUrl()` (same bug, same sections).
- `tests/frontend/mediaUrl.test.ts` (new): unit tests.

## 3. Backend/API changes

None. The backend contract (`imageUrl`) was correct and is relied on elsewhere (e.g. `photoKeyApi.ts`).
I changed no schema and created no migration.

## 4. Frontend changes

See section 2. I added no hardcoded or placeholder images, no localStorage workaround, and no layout
changes.

## 5. Database verification (read-only)

| Table | Record | media_id | Media row | public_id | URL = API URL |
|---|---|---|---|---|---|
| academic_information | "mid term" | b64f5447… | exists | hnhdfnz2quecvorw1dtb | yes |
| sports | "football" | 1095763a… | exists | pr3oyfl2ltlvvm8gffp3 | yes |
| clubs | "rsp" | 2719c237… | exists | aoh6cs9hzeunahalyopg | yes |
| sports_achievement_photos | "ashjkll…" | 29486013… | exists | lra0ml5hqd2otsys6cz8 | yes |

I modified, created and deleted no records and no Cloudinary assets.

## 6. Cloudinary verification

- All 4 delivery URLs return HTTP 200 with the correct content type.
- The `fl_attachment` URL for the PDF returns `Content-Disposition: attachment; filename="Shabarish_resume (1).pdf"`.
- Note: the PDF is stored as `resource_type = "image"` (URL `/image/upload/…pdf`). It is publicly
  delivered and works. The existing backend tests `test_pdf_upload_is_stored_as_raw_resource` and
  `test_delete_uses_stored_resource_type` expect `raw` and currently fail. That is a separate,
  already-present upload-service issue, outside this scope, and I left it unchanged.

## 7–10. Results

| Check | Result |
|---|---|
| Academic Info: public panel shows title + View PDF + Download | **PASS** (Playwright) |
| Academic Info: click View PDF opens actual PDF in new tab | **PASS**: popup URL = stored Cloudinary URL, HTTP 200, body starts `%PDF-` |
| Academic Info: after refresh | **PASS** |
| Academic Info: separate isolated browser context (empty localStorage) | **PASS** |
| Sports image displayed and matched to its record (alt = "football") | **PASS**: naturalWidth 1280, refresh + isolated context |
| Clubs image displayed and matched to its record (alt = "rsp") | **PASS**: refresh + isolated context |
| Sports Achievements image displayed and matched to its record | **PASS**: refresh + isolated context |
| Negative: broken image URL (Cloudinary 404 via route interception) | **PASS**: fallback shown, no broken `<img>`, text kept |
| Negative: missing media relationship (`media: null`) / missing URL (`imageUrl: ""`) | **PASS**: no img, no PDF links rendered |
| Negative: public API 500 | **PASS**: no broken links; Sports shows "No sports information available yet." |
| Admin upload → save → public display with a NEW dedicated test record (all 4 areas) | **BLOCKED**: no admin credentials and no separate test environment; it would write to the live DB and Cloudinary |
| Negative: failed upload (admin) | **BLOCKED**: same reason |
| Admin list previews (thumbnails / PDF link) | **NOT TESTED** in browser (requires login); covered by build + shared helper unit tests |
| Admin edit/delete regression | **NOT TESTED** in browser (requires login); I did not change that code |

## 11. Playwright evidence

- Screenshots (isolated context): `QA_EVIDENCE/media-fix-academic-pdf.png`, `QA_EVIDENCE/media-fix-sports.png`,
  `QA_EVIDENCE/media-fix-clubs.png`, `QA_EVIDENCE/media-fix-sports-achievements.png`
- Console: 0 errors in the isolated context. The only error in the default context was an unrelated
  `/favicon.ico` 404.

## 12. Build and test results

- `npm run build`: **PASS**
- `node --test tests/frontend/mediaUrl.test.ts tests/frontend/singlePhotoSlot.test.ts`: **14/14 PASS**
- `pytest` (full backend): 86 passed, 8 failed. I changed no backend files in this task. Failing tests:
  `test_admin_bootstrap` ×3, `test_content_records_and_media_types` ×2 (PDF `resource_type`),
  `test_media_router_security::test_media_write_router_is_mounted_on_application`,
  `test_migrations::test_migration_chain_matches_models_and_downgrades_cleanly`,
  `test_sqlite_database::test_default_database_url_uses_persistent_backend_directory`.

## 13. Remaining bugs / blockers

1. The full admin-upload E2E with dedicated test records is BLOCKED. It needs admin credentials and
   either a test environment or explicit approval to create and then remove test records in the live
   DB and Cloudinary.
2. PDFs are uploaded as Cloudinary `image` instead of `raw` (see section 6). This doesn't affect viewing
   today. It would matter if the Cloudinary account ever disables PDF delivery for image resources.
3. 8 pre-existing backend test failures, listed in section 12, are unrelated to this change.
