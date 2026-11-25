# SMDPVC – Full Application QA Audit Report

| Item | Value |
|---|---|
| Report date | 2026-11-25 |
| Phase status | **Phase 1 (structure discovery + inventory) COMPLETE.** Phases 2–15 NOT STARTED. |
| Method used in Phase 1 | Reading source code, querying the running backend's `/openapi.json`, and running read-only SQLite queries (`mode=ro`). **No browser tests have been run yet.** |
| Code/DB changes made by Phase 1 | None. Phase 1 created only this file and the empty `QA_EVIDENCE/` folder. |

> Every finding in this section comes from **SOURCE INSPECTION** or a **read-only DB query**. None of it is confirmed by a test yet. Later phases must reproduce these findings before they count as bugs.

---

## A. Application Inventory

### A.1 Verified architecture

| Layer | Finding (verified) |
|---|---|
| Frontend | React + Vite + TypeScript. Routing is custom (`src/App.tsx`, `window.location` + `pushState`), not react-router. |
| Dev proxy | `vite.config.ts:15` proxies **only `/api`** to `http://127.0.0.1:8000` (or `SMDPVC_API_PROXY_TARGET`). `/uploads` is **not** proxied. |
| Backend | FastAPI, `backend/app/main.py`. 16 routers, **85 endpoints** (taken from live `/openapi.json`). |
| Database | SQLite. `DATABASE_URL=sqlite+aiosqlite:///./data/smdpvc.db`, resolved relative to `backend/`, so the active file is `backend/data/smdpvc.db`. `backend/smdpvc.db` and `backend/backend/data/smdpvc.db` are stray files with no `content_records` table. |
| Media | Cloudinary (`app/services/cloudinary_service.py`), plus a **temporary** local-disk store `LocalImageStorage` used by `POST /api/media/upload-topper`, served from `/uploads` (`main.py:103-107`). |
| Auth | Bearer JWT, `require_admin` in `app/dependencies.py`. The frontend keeps the token **in memory only** (`src/utils/storage.ts:9`). It is not persisted to localStorage, so a page reload loses the session (Phase 8 to verify). |
| `.env` variable names (values not read) | SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, DATABASE_URL, CORS_ORIGINS, ADMIN_EMAIL, ADMIN_PASSWORD, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET |
| Alembic | 11 migration files (`0001` … `0011`). The DB `alembic_version` is **`20261121_0010`**, but the `toppers` table **already has `class_name` and `section`**, the columns that `0011_add_class_section_to_toppers` adds. See risk R-12. |
| Servers at time of inventory | Backend :8000 up (`/api/health` 200, about 0.23 s). Vite :5173 up (200). |

### A.2 Public routes (from `src/App.tsx`, `src/schoolPageData.ts`, `src/homepageContent.ts`)

| Route | Renders | Notes |
|---|---|---|
| `/` | Header, Hero, About, Leadership, SchoolSections, Infrastructure, Contact, Footer | Homepage |
| `/nursery` | `SchoolPage` (schoolPages.nursery) | |
| `/primary` | `SchoolPage` (schoolPages.primary) | |
| `/higher-secondary` | `SchoolPage` (schoolPages["higher-secondary"]) | |
| `/admin/login` | `AdminLogin` | |
| `/admin/photos` | `AdminPanel` (redirects to `/admin/login` if not authenticated) | The only admin URL. Admin sections are in-memory state, not URLs. |
| any other path | Falls back to the **homepage** (no 404 page) | `App.tsx:33` `schoolPages[path.slice(1)]` is undefined, so the homepage renders |

### A.3 Admin Panel → Backend → DB → Public mapping (all 35 nav entries from `src/pages/AdminPanel.tsx:84-147`)

Legend: C=create/upload, R=read, U=update/replace, D=delete, Img=image/file upload, Ord=reorder.
"Photo-key APIs" means: `POST /api/media/upload` → `POST /api/admin/photos/assign`; `GET /api/admin/photos?config_key=`; `PUT /api/media/{id}` (replace); `DELETE /api/admin/photos/{config_id}` + `DELETE /api/media/{id}`; `POST /api/admin/photos/reorder-batch`. Public side reads `GET /api/public/photos` and filters by `config_key`.
"Record APIs" means: `GET/PUT /api/admin/content-records/{key}`, public `GET /api/public/content-records/{key}`.

| # | Admin Section | Subsection (nav id / section / label) | Manager component | Operations | Backend API(s) | DB table / record key / photo config_key | Public section (route + component) |
|---|---|---|---|---|---|---|---|
| 1 | Home Page | 1 / home-hero / Home Page Hero Carousel | HomeHeroManager | C R U D Img Ord | Photo-key APIs | photo_configurations `campusImages.hero` (4 rows) | `/` Hero.tsx |
| 2 | Home Page | 3 / school-sections / School Sections Cards | SchoolSectionsManager (useSingleSlot) | C R U D Img | Photo-key APIs | `schoolSectionPhotos.{nursery,primary,higherSecondary}` (1 each) | `/` SchoolSections.tsx (card text is static `homepageContent.schoolSectionCards`) |
| 3 | Home Page | 4 / hero-3d / Hero 3D Cards | Hero3DCardsManager (useSingleSlot) | C R U D Img | Photo-key APIs | `campusImages.sports`, `campusImages.principal` (1 each) | `/` Hero.tsx 3D cards |
| 4 | Nursery | 5 / nursery-hero / Nursery Page Hero | SchoolPageHeroManager(pageKey=nursery) | C R U D Img Ord | Photo-key APIs | `schoolPageHeroes.nursery` (3) | `/nursery` Hero.tsx |
| 5 | Nursery | 5a / content-nursery-classes / Classes Gallery | NurseryClassesGalleryManager → KeyedGalleryManager | C R U D Img Ord + description | Photo-key APIs + Record APIs | photos + record `nursery.classes.gallery` | `/nursery` section `nursery-classes` (useKeyedGallery) |
| 6 | Nursery | 5b / content-nursery-learning / Learning Activities Gallery | NurseryLearningActivitiesGalleryManager → KeyedGalleryManager | same as #5 | same | `nursery.learning.gallery` | `/nursery` `nursery-learning` |
| 7 | Nursery | 5c / content-nursery-extracurricular / Extracurricular Gallery | NurseryExtracurricularGalleryManager → KeyedGalleryManager | same as #5 | same | `nursery.extracurricular.gallery` | `/nursery` `nursery-extracurricular` |
| 8 | Nursery | 5d / nursery-about / About | NurseryAboutManager → AboutSectionManager | C R U D Img | `GET/POST /api/admin/about-sections`, `GET/PATCH/DELETE /api/admin/about-sections/{key}`, `POST /api/media/upload`; public `GET /api/public/about-sections/{key}` | about_sections `section_key=nursery` | `/nursery` `nursery-about` (usePublicAboutSection) |
| 9 | Nursery | 5e / nursery-principal / Principal | NurseryPrincipalManager → PrincipalManager | R U Img D (name/message + photo; newest photo wins) | Record APIs + Photo-key APIs | record `principal.nursery` + photo key `principal.nursery` | `/nursery` `nursery-principal` (usePublicPrincipal) |
| 10 | Nursery | 5f / nursery-academic-calendar / Academic Calendar | NurseryAcademicCalendarManager (lazy) → AcademicCalendarManager | C R D (PDF; newest wins) | Photo-key APIs (PDF via `/api/media/upload`) | `academic-calendar.nursery` (1) | `/nursery` `nursery-calendar` (NurseryCalendarDownloadBlock) |
| 11 | Primary | 6 / primary-hero / Primary Page Hero | SchoolPageHeroManager(pageKey=primary) | C R U D Img Ord | Photo-key APIs | `schoolPageHeroes.primary` (3) | `/primary` Hero.tsx |
| 12 | Primary | 6a / content-primary-classes / Classes Gallery | PrimaryClassesGalleryManager → KeyedGalleryManager | as #5 | as #5 | `primary.classes.gallery` | `/primary` `primary-classes` |
| 13 | Primary | 6b / content-primary-learning / Learning Activities Gallery | PrimaryLearningActivitiesGalleryManager | as #5 | as #5 | `primary.learning.gallery` | `/primary` `primary-learning` |
| 14 | Primary | 6c / content-primary-extracurricular / Extracurricular Gallery | PrimaryExtracurricularGalleryManager | as #5 | as #5 | `primary.extracurricular.gallery` | `/primary` `primary-extracurricular` |
| 15 | Primary | 6d / primary-about / About | PrimaryAboutManager → AboutSectionManager | as #8 | as #8 | about_sections `primary` | `/primary` `primary-about` |
| 16 | Primary | 6e / primary-principal / Principal | PrimaryPrincipalManager → PrincipalManager | as #9 | as #9 | `principal.primary` | `/primary` `primary-principal` |
| 17 | Primary | 6f / primary-academic-calendar / Academic Calendar | PrimaryAcademicCalendarManager → AcademicCalendarManager | as #10 | as #10 | `academic-calendar.primary` (1) | `/primary` `primary-calendar` |
| 18 | Higher Secondary | 7 / hs-hero / Higher Secondary Hero | SchoolPageHeroManager(pageKey=higherSecondary) | C R U D Img Ord | Photo-key APIs | `schoolPageHeroes.higherSecondary` (3) | `/higher-secondary` Hero.tsx |
| 19 | Higher Secondary | 7a / content-hs-classes / Classes Gallery | HigherSecondaryClassesGalleryManager | as #5 | as #5 | `higher-secondary.classes.gallery` | `/higher-secondary` `higher-classes` |
| 20 | Higher Secondary | 7b / content-hs-learning / Learning Activities Gallery | HigherSecondaryLearningActivitiesGalleryManager | as #5 | as #5 | `higher-secondary.learning.gallery` | `/higher-secondary` `higher-learning` |
| 21 | Higher Secondary | 7c / content-hs-extracurricular / Extracurricular Gallery | HigherSecondaryExtracurricularGalleryManager | as #5 | as #5 | `higher-secondary.extracurricular.gallery` | `/higher-secondary` `higher-extracurricular` |
| 22 | Higher Secondary | 7d / hs-about / About | HigherSecondaryAboutManager → AboutSectionManager | as #8 | as #8 | about_sections `higher-secondary` | `/higher-secondary` `higher-about` |
| 23 | Higher Secondary | 7e / hs-principal / Principal | HigherSecondaryPrincipalManager → PrincipalManager | as #9 | as #9 | `principal.higherSecondary` (photo exists, **no content record**) | `/higher-secondary` `higher-principal` |
| 24 | Higher Secondary | 7f / hs-academic-calendar / Academic Calendar | HigherSecondaryAcademicCalendarManager | as #10 | as #10 | `academic-calendar.higher-secondary` (1) | `/higher-secondary` `higher-calendar` |
| 25 | Higher Secondary | 7g / hs-courses / Courses Offered (Class XI) | CoursesOfferedManager | C R U D (groups and subjects in one JSON blob) | Record APIs | record `higher-secondary.course-groups` | `/higher-secondary` `higher-courses` (CoursesOfferedSection via usePublicCourseGroups) |
| 26 | Higher Secondary | 7h / hs-achievers / Achievers | AchieversManager → ToppersManager (Grade 10 / 12 tabs) | C R U D Img Ord | `GET/POST /api/admin/toppers`, `PATCH/DELETE /api/admin/toppers/{id}`, `POST /api/admin/toppers/reorder`, `POST /api/media/upload`; public `GET /api/public/toppers` | toppers (6 rows) | `/higher-secondary` `higher-achievers` (AchieversSection ×2 grades) |
| 27 | Higher Secondary | 7i / hs-alumni / Alumni | AlumniManager | C R U(PATCH) D Img | `GET/POST /api/admin/alumni`, `PATCH/DELETE /api/admin/alumni/{id}`, `POST /api/media/upload`; public `GET /api/public/alumni` | alumni (0) | `/higher-secondary` `higher-alumni` (AlumniSection) |
| 28 | Higher Secondary | 7j / hs-sports / Sports Categories | SportsManager | C R U(PATCH) D Img | `/api/admin/sports[/{id}]`; public `GET /api/public/sports` | sports (0) | `/higher-secondary` `higher-sports` (SportsCarousel) |
| 29 | Higher Secondary | 7k / hs-sports-achievements / Sports Achievements | SportsAchievementsManager | C R D Img (**no edit in UI**; backend has PATCH) | `/api/admin/sports-achievements[/{id}]`; public `GET /api/public/sports-achievements` | sports_achievement_photos (0) | `/higher-secondary` `higher-sports-achievements` (SportsAchievementsGallery) |
| 30 | Higher Secondary | 7l / hs-academic-information / Academic Information | AcademicInformationManager | C R D + PDF upload (**no edit in UI**; backend has PATCH) | `/api/admin/academic-information[/{id}]`; public `GET /api/public/academic-information` | academic_information (0) | `/higher-secondary` `higher-academic-information` (AcademicInformationSection) |
| 31 | Higher Secondary | 7m / hs-clubs / Clubs | ClubsManager | C R U(PATCH) D Img | `/api/admin/clubs[/{id}]`; public `GET /api/public/clubs` | clubs (0) | `/higher-secondary` `higher-clubs` (ClubsCarousel) |
| 32 | Common | 2 / leadership / Leadership Profiles | LeadershipPhotosManager | C R U D Img Ord | `GET/POST /api/admin/leadership-profiles`, `PUT/DELETE /api/admin/leadership-profiles/{key}`, `POST …/reorder`, media upload (photoAdminApi) ; public `GET /api/public/leadership-profiles` | leadership_profiles (6; 4 with photo) | `/` Leadership.tsx |
| 33 | Common | 3a / content-infrastructure / Group of Schools – Infrastructure | InfrastructureGalleryManager | C R U D Img Ord + description; one-time legacy localStorage import | Photo-key APIs + Record APIs (`infrastructureContentApi.ts`) | photo key `infrastructure.gallery` (**0 photos**) + record `infrastructure.gallery` | `/` Infrastructure.tsx (renders placeholder when 0 photos, `Infrastructure.tsx:11`) |
| 34 | Common | 8 / excellence / Excellence & Toppers | ExcellenceManager → **AchieversManager (same as #26)** | same as #26 | same as #26 | toppers | Same public section as #26. The public `Excellence.tsx` component is **not rendered anywhere**. |
| 35 | Common | 9 / campus-life / Campus Life & Alumni | CampusLifeManager → **AlumniManager (same as #27)** | same as #27 | same as #27 | alumni | Same public section as #27 |

**Inventory observations (source inspection):**
- #34 and #35 duplicate #26 and #27: two nav entries edit the same data.
- `src/components/admin/ContentItemsManager.tsx` exists but is **not mounted** in AdminPanel. The public `SchoolPage` still reads `GET /api/public/content-items` (`SchoolPage.tsx:27-45`), so content items have no admin UI (table `content_items` has 0 rows).
- These backend endpoints are not called by any mounted frontend UI: `/api/admin/achievements/*`, `/api/public/achievements` (only called by the unrendered `Excellence.tsx` via `useAchievements`), `/api/admin/photos/{id}/reorder`, `/api/media/upload-topper`, `DELETE /api/admin/content-records/{key}`, `GET /api/admin/*/{id}` single-item getters.
- These tables have no router or UI: announcements, gallery_collections, gallery_images, school_sections, website_settings, roles, permissions, admin_user_roles.

### A.4 Endpoint table (85 endpoints, from live `/openapi.json`; auth checked in router source)

Auth column: **Admin** means the route has a `require_admin` (Bearer JWT) dependency. An AST scan of `app/routers/*.py` found **only `POST /api/auth/login` without `require_admin` outside `public.py`/`health.py`**. OpenAPI itself declares no security schemes.

| Method | Path | Auth | Purpose | Used by frontend file |
|---|---|---|---|---|
| GET | /api/health | Public | Health | – |
| POST | /api/auth/login | Public | Login | services/adminApi.ts |
| GET | /api/auth/me | Admin | Current user | services/adminApi.ts |
| POST | /api/auth/logout | Admin | Logout | services/adminApi.ts |
| GET | /api/admin/leadership-profiles | Admin | List | services/leadershipApi.ts |
| POST | /api/admin/leadership-profiles | Admin | Create | services/leadershipApi.ts |
| PUT | /api/admin/leadership-profiles/{profile_key} | Admin | Save | services/leadershipApi.ts |
| DELETE | /api/admin/leadership-profiles/{profile_key} | Admin | Delete | services/leadershipApi.ts |
| POST | /api/admin/leadership-profiles/reorder | Admin | Reorder | services/leadershipApi.ts |
| GET | /api/admin/content-items | Admin | List | services/contentItemsApi.ts (unmounted UI) |
| POST | /api/admin/content-items | Admin | Create | contentItemsApi.ts (unmounted) |
| POST | /api/admin/content-items/reorder | Admin | Reorder | contentItemsApi.ts (unmounted) |
| PATCH | /api/admin/content-items/{item_id} | Admin | Update | contentItemsApi.ts (unmounted) |
| DELETE | /api/admin/content-items/{item_id} | Admin | Delete | contentItemsApi.ts (unmounted) |
| GET | /api/admin/about-sections | Admin | List | services/aboutSectionsApi.ts |
| POST | /api/admin/about-sections | Admin | Create | aboutSectionsApi.ts |
| GET | /api/admin/about-sections/{section_key} | Admin | Get | aboutSectionsApi.ts |
| PATCH | /api/admin/about-sections/{section_key} | Admin | Update | aboutSectionsApi.ts |
| DELETE | /api/admin/about-sections/{section_key} | Admin | Delete | aboutSectionsApi.ts |
| GET | /api/admin/toppers | Admin | List | services/toppersApi.ts |
| POST | /api/admin/toppers | Admin | Create | toppersApi.ts |
| POST | /api/admin/toppers/reorder | Admin | Reorder | toppersApi.ts |
| PATCH | /api/admin/toppers/{topper_id} | Admin | Update | toppersApi.ts |
| DELETE | /api/admin/toppers/{topper_id} | Admin | Delete | toppersApi.ts |
| GET | /api/admin/achievements | Admin | List | – (unused) |
| POST | /api/admin/achievements | Admin | Create | – |
| GET | /api/admin/achievements/{achievement_id} | Admin | Get | – |
| PATCH | /api/admin/achievements/{achievement_id} | Admin | Update | – |
| DELETE | /api/admin/achievements/{achievement_id} | Admin | Delete | – |
| POST | /api/admin/achievements/reorder | Admin | Reorder | – |
| GET | /api/admin/alumni | Admin | List | components/admin/AlumniManager.tsx |
| POST | /api/admin/alumni | Admin | Create | AlumniManager.tsx |
| GET | /api/admin/alumni/{alumni_id} | Admin | Get | – |
| PATCH | /api/admin/alumni/{alumni_id} | Admin | Update | AlumniManager.tsx:206 |
| DELETE | /api/admin/alumni/{alumni_id} | Admin | Delete | AlumniManager.tsx:241 |
| POST | /api/admin/alumni/reorder | Admin | Reorder | – |
| GET | /api/admin/sports | Admin | List | components/admin/SportsManager.tsx |
| POST | /api/admin/sports | Admin | Create | SportsManager.tsx |
| GET | /api/admin/sports/{sport_id} | Admin | Get | – |
| PATCH | /api/admin/sports/{sport_id} | Admin | Update | SportsManager.tsx:118 |
| DELETE | /api/admin/sports/{sport_id} | Admin | Delete | SportsManager.tsx:152 |
| POST | /api/admin/sports/reorder | Admin | Reorder | – |
| GET | /api/admin/sports-achievements | Admin | List | components/admin/SportsAchievementsManager.tsx |
| POST | /api/admin/sports-achievements | Admin | Create | SportsAchievementsManager.tsx |
| GET | /api/admin/sports-achievements/{achievement_id} | Admin | Get | – |
| PATCH | /api/admin/sports-achievements/{achievement_id} | Admin | Update | – (no edit UI) |
| DELETE | /api/admin/sports-achievements/{achievement_id} | Admin | Delete | SportsAchievementsManager.tsx:144 |
| POST | /api/admin/sports-achievements/reorder | Admin | Reorder | – |
| GET | /api/admin/academic-information | Admin | List | components/admin/AcademicInformationManager.tsx |
| POST | /api/admin/academic-information | Admin | Create | AcademicInformationManager.tsx |
| GET | /api/admin/academic-information/{info_id} | Admin | Get | – |
| PATCH | /api/admin/academic-information/{info_id} | Admin | Update | – (no edit UI) |
| DELETE | /api/admin/academic-information/{info_id} | Admin | Delete | AcademicInformationManager.tsx:152 |
| POST | /api/admin/academic-information/reorder | Admin | Reorder | – |
| GET | /api/admin/clubs | Admin | List | components/admin/ClubsManager.tsx |
| POST | /api/admin/clubs | Admin | Create | ClubsManager.tsx |
| GET | /api/admin/clubs/{club_id} | Admin | Get | – |
| PATCH | /api/admin/clubs/{club_id} | Admin | Update | ClubsManager.tsx:118 |
| DELETE | /api/admin/clubs/{club_id} | Admin | Delete | ClubsManager.tsx:152 |
| POST | /api/admin/clubs/reorder | Admin | Reorder | – |
| GET | /api/admin/content-records/{record_key} | Admin | Get | services/photoKeyApi.ts, infrastructureContentApi.ts |
| PUT | /api/admin/content-records/{record_key} | Admin | Upsert | photoKeyApi.ts, infrastructureContentApi.ts |
| DELETE | /api/admin/content-records/{record_key} | Admin | Delete | – |
| POST | /api/admin/photos/assign | Admin | Link media→config_key | photoKeyApi.ts, photoAdminApi.ts, infrastructureContentApi.ts |
| PUT | /api/admin/photos/{config_id}/reorder | Admin | Reorder single | – |
| DELETE | /api/admin/photos/{config_id} | Admin | Unlink | photoKeyApi.ts, photoAdminApi.ts, infrastructureContentApi.ts |
| GET | /api/admin/photos | Admin | List (opt. config_key) | photoKeyApi.ts, photoAdminApi.ts, infrastructureContentApi.ts |
| POST | /api/admin/photos/reorder-batch | Admin | Reorder batch | photoKeyApi.ts, photoAdminApi.ts, infrastructureContentApi.ts |
| POST | /api/media/upload | Admin | Upload to Cloudinary | photoKeyApi.ts, photoAdminApi.ts, mediaUploadApi.ts, infrastructureContentApi.ts, Alumni/Clubs/Sports/SportsAchievements/AcademicInformation managers |
| PUT | /api/media/{media_id} | Admin | Replace file | photoKeyApi.ts, photoAdminApi.ts, infrastructureContentApi.ts |
| DELETE | /api/media/{media_id} | Admin | Delete media + Cloudinary asset | photoKeyApi.ts, photoAdminApi.ts, infrastructureContentApi.ts |
| POST | /api/media/upload-topper | Admin | **TEMPORARY** local-disk upload | – (unused) |
| GET | /api/public/photos | Public | All photo configs | photoKeyApi.ts, infrastructureContentApi.ts, hooks/usePublicPhotos.ts |
| GET | /api/public/leadership-profiles | Public | List | leadershipApi.ts |
| GET | /api/public/content-items | Public | List | contentItemsApi.ts (SchoolPage) |
| GET | /api/public/about-sections | Public | List | aboutSectionsApi.ts |
| GET | /api/public/about-sections/{section_key} | Public | Get | aboutSectionsApi.ts |
| GET | /api/public/content-records/{record_key} | Public | Get | photoKeyApi.ts, infrastructureContentApi.ts |
| GET | /api/public/toppers | Public | List | toppersApi.ts |
| GET | /api/public/achievements | Public | List | hooks/useAchievements.ts (only in unrendered Excellence.tsx) |
| GET | /api/public/alumni | Public | List | hooks/useAlumni.ts |
| GET | /api/public/sports | Public | List | components/SportsCarousel.tsx |
| GET | /api/public/sports-achievements | Public | List | components/SportsAchievementsGallery.tsx |
| GET | /api/public/academic-information | Public | List | components/AcademicInformationSection.tsx |
| GET | /api/public/clubs | Public | List | components/ClubsCarousel.tsx |

Also mounted: static `/uploads` (local topper images), but only if `backend/uploads` exists (`main.py:105-107`).

### A.5 Database schema summary (`backend/data/smdpvc.db`, read-only)

| Table | Rows | PK | Foreign keys (on delete) |
|---|---:|---|---|
| about_sections | 3 | id | media_id→media (SET NULL) |
| academic_information | 0 | id | media_id→media (SET NULL) |
| achievements | 0 | id | – |
| admin_users | 6 (all active) | id | – |
| admin_user_roles | 0 | (admin_user_id, role_id) | admin_users, roles (CASCADE) |
| alembic_version | 1 (`20261121_0010`) | version_num | – |
| alumni | 0 | id | media_id→media (SET NULL) |
| announcements | 0 | id | – |
| cloudinary_cleanup | 0 | id | – |
| clubs | 0 | id | media_id→media (SET NULL) |
| content_items | 0 | id | media_id→media (SET NULL) |
| content_record_media | 0 | id | record_id→content_records (CASCADE), media_id→media (RESTRICT) |
| content_records | 13 | id (unique record_key) | – |
| gallery_collections | 0 | id | – |
| gallery_images | 0 | id | collection_id (CASCADE), media_id (RESTRICT) |
| leadership_profiles | 6 | id | media_id→media (SET NULL) |
| media | 136 (9 `deletion_pending=1`) | id | – |
| permissions / roles / role_permissions | 0 / 0 / 0 | – | – |
| photo_configurations | 41 | id | media_id→media (RESTRICT) |
| school_sections | 0 | id | card_media_id→media (SET NULL) |
| sports | 0 | id | media_id→media (SET NULL) |
| sports_achievement_photos | 0 | id | media_id→media (SET NULL) |
| toppers | 6 (4 Class 12, 2 Class 10; 4 with photo) | id | media_id→media (SET NULL) |
| website_settings | 0 | id | – |

**content_records keys (13):** 9 gallery-description records (`{nursery,primary,higher-secondary}.{classes,learning,extracurricular}.gallery`), `infrastructure.gallery`, `higher-secondary.course-groups` (updated 2026-11-24 18:41, so it is no longer the empty list seen earlier), `principal.nursery`, `principal.primary`. There is **no `principal.higherSecondary` record**. Most gallery and about descriptions are 5–6 characters long, which looks like placeholder/test text (contents not dumped).

**photo_configurations by key:** academic-calendar.* 1 each; campusImages.hero 4; campusImages.principal 1; campusImages.sports 1; every school gallery 2, except nursery.extracurricular 1; principal.* 1 each; schoolPageHeroes.* 3 each; schoolSectionPhotos.* 1 each; **infrastructure.gallery 0**.

**Integrity findings:**

| Check | Result |
|---|---|
| `PRAGMA foreign_key_check` | clean |
| Orphan media (not referenced by any of the 13 media-FK columns/link tables) | **85 of 136** (44 jpeg, 8 jpg, 28 png, 5 webp) |
| Media with non-Cloudinary URLs | **53**. Most are `http://127.0.0.1:8000/uploads/toppers/...` (host hard-coded), 3 are relative `/uploads/toppers/...`. None is referenced by a current topper; all 4 topper photos are Cloudinary. |
| `deletion_pending=1` media | 9 |
| Duplicate cloudinary_public_id | none |
| Duplicate (config_key, media_id) / (config_key, display_order) | none |
| Dangling photo_configurations.media_id | none |
| Duplicate record_key / leadership display_order | none |

### A.6 Static/fallback data risk (SOURCE-INSPECTION findings, not test-confirmed)

| ID | file:line | Dataset | Condition under which it overrides backend data |
|---|---|---|---|
| R-01 | src/components/Leadership.tsx:11-25 | `leadershipProfiles` (homepageContent.ts:53) | If the public API returns **0 profiles** (all deleted/inactive) **or the request errors**, static placeholder leaders are shown. This is the same pattern as the Courses bug. |
| R-02 | src/hooks/usePublicCourseGroups.ts:18-19 | `DEFAULT_COURSE_GROUPS` (CoursesOfferedManager.tsx:13) | Now only when **no record exists**. Saved empty lists are respected after the 2026-11-25 fix; regression test needed. |
| R-03 | src/components/admin/CoursesOfferedManager.tsx:57-67 | `DEFAULT_COURSE_GROUPS` | Admin shows the defaults when the record is missing or fails to load. A later admin action then **saves the defaults back over real data** if the load failed transiently. |
| R-04 | src/components/SchoolPage.tsx:249-372, 437-440 | `section.description` from schoolPageData.ts | If an About or Principal record is null/deleted, the static description text renders in its place. |
| R-05 | src/components/SchoolPage.tsx:444-466 | `section.subsections` (static) | Static cards always render, including the literal text "Add verified school data here." for the Achievements section. |
| R-06 | src/components/Hero.tsx:55 | `heroSlides` (data.ts) | Hero slide text/captions are static. Only images come from the backend. |
| R-07 | src/components/SchoolSections.tsx:2,23-24 | `schoolSectionCards` | Card text is static. A card has no image if its backend photo is missing. |
| R-08 | src/components/Excellence.tsx:27 | static `sportsAchievements` | Falls back to static data when the API is empty. The component is **not rendered** (dead code). |
| R-09 | src/data/photoService.ts:289-401, hooks/usePhotoConfig.ts | localStorage `photoConfig` incl. `courseGroups` | Legacy localStorage store. Not used by mounted public sections (only usePhotoConfig, which only photoService imports). Comment in CoursesOfferedSection.tsx:9 is stale. |
| R-10 | src/hooks/usePublicPrincipal.ts:31,43 | – | Principal shows the photo only when the record is missing (HS has no `principal.higherSecondary` record). |
| R-11 | backend/app/services/media_service.py:42 | `DOCUMENT_VIDEO_TYPES["pdf"] = ("image","pdf")` | PDFs are stored as Cloudinary resource_type `image`. `tests/test_content_records_and_media_types.py` expects `raw` (2 tests currently fail). |
| R-12 | backend alembic | version `0010` vs schema with `0011` columns | `alembic upgrade head` would likely fail (duplicate column). Migration state is out of sync with the schema. |
| R-13 | backend/app/routers/media.py:107-140 | `/api/media/upload-topper` | A temporary local-disk upload endpoint is still live. It stores absolute `request.base_url` URLs, so the 127.0.0.1 hosts are baked into the DB. `/uploads` is not proxied by Vite. |

### A.7 localStorage / sessionStorage usage

| File:line | Key / purpose | R/W | Notes |
|---|---|---|---|
| src/data/photoService.ts:322,360,401 | photo config `STORAGE_KEY` (legacy, includes courseGroups) | R/W/remove | Legacy; not used by mounted UI (see R-09) |
| src/services/legacyPhotoImport.ts:38,108,118 | `LEGACY_CONFIG_KEY` (read), `IMPORT_RECORD_KEY` (R/W) | R/W | One-time import of legacy browser photos into the backend |
| src/components/admin/InfrastructureGalleryManager.tsx:42,52 | `LEGACY_IMPORT_KEY` | R/W | Tracks imported legacy infrastructure photos |
| src/utils/storage.ts:9 | auth token | memory only | Not localStorage/sessionStorage, so it does **not** survive a reload |
| sessionStorage | – | – | No usage found |

### A.8 Upload validation rules

| Layer | Rule | Source |
|---|---|---|
| Frontend (photos) | MIME image/jpeg, image/png, image/webp; ext jpg/jpeg/png/webp; ≤ 5 MB; alt ≤ 500 chars | src/utils/photoValidation.ts:7-10, src/utils/imageUpload.ts:6-8 |
| Backend images | JPEG (jpg/jpeg), PNG, WEBP. Pillow decodes the content and the **extension must match the decoded format**. Empty file rejected. Size > `MAX_UPLOAD_SIZE_BYTES` (default 5 MB) returns 413. | media_service.py:31-40, 281-320; config.py:39-43 |
| Backend documents/video | pdf (Cloudinary `image`), mp4/mov/webm (`video`). Content must match the extension. Same size limit. | media_service.py:42-47, 345-380 |
| Backend alt_text | Form `max_length=500` | routers/media.py:39,61,119 |
| Error mapping | 413 too large, 422 invalid, 500 persistence, 502 Cloudinary failure | routers/media.py |
| Cloudinary | Credentials via settings. No duplicate-public-id rows in the DB. A `cloudinary_cleanup` queue table exists (0 rows). | cloudinary_service.py, media_service.py |

### A.9 Blockers for later phases (known now)

| Blocker | Impact |
|---|---|
| Playwright MCP: the previous session reported "Browser is already in use for …\ms-playwright-mcp\mcp-chrome-3558f62". | Phases 2–5 and 10–14 need the browser lock released (close the other Playwright session, or run MCP with `--isolated`). |
| Admin credentials | Not read from `.env` by design. The user must log in manually in the Playwright browser. Because the token is in memory only, a page reload logs the admin out, which forces a re-login at each refresh test. |
| Cloudinary | Real uploads create real assets. Phase 4 needs user authorization and must clean up only QA-created assets. |
| DB writes | A backup of `backend/data/smdpvc.db` is required before Phase 3 writes. |

---

## B–F. Test summary, section results, bugs, evidence, final assessment

IN PROGRESS. Filled in batch by batch. Evidence lives in `QA_EVIDENCE/`.

---

## Batch A Results – Photo Galleries & Heroes

**Scope:** inventory rows #1 (Home Hero), #4/#11/#18 (Nursery/Primary/HS page heroes), #5–7, #12–14, #19–21 (Keyed galleries), #33 (Infrastructure).
**Executed:** 2026-11-25, real browser (Chrome 157 via Playwright MCP). Admin was tab 0 (logged in by the user; the in-memory token was never reloaded). Public checks ran in isolated contexts `qa-public-2` and `qa-public-3`.
**API/DB evidence:** browser network capture, in-page authenticated `fetch` (token never printed or saved), read-only SQLite (`backend/data/smdpvc.db`), and `curl` against Cloudinary URLs.
**Test data:** every file is named or alt-tagged `QA-20261125-*`. Fixtures are in `QA_EVIDENCE/qa-files/`. The baseline is `QA_EVIDENCE/batch-A-baseline-photo_configurations.json` (41 links, 136 media rows).
**Detailed log:** `QA_EVIDENCE/batch-A-log.md`.

### A-R.1 Summary (Batch A)

| Metric | Count |
|---|---:|
| Total test cases | 115 |
| Passed | 88 |
| Failed | 8 |
| Blocked | 15 |
| Not Tested | 2 |
| Not Applicable | 2 |
| Bugs discovered | 12 (1 High functional, 1 High security, 2 Medium, 8 Low) |

**Cleanup:** all 33 QA media uploaded in this batch were deleted through the Admin UI. Each delete was verified as follows:
- the DB `photo_configurations` table exactly matches the baseline (no rows missing or changed);
- no QA media rows remain (`media_total` 136, the same as the baseline);
- every QA Cloudinary URL returns 404;
- the public API and pages no longer contain the QA images.

The real gallery description records were not modified. `infrastructure.gallery` is unchanged (`updated_at 2026-11-20 17:47:46`).

### A-R.2 Section-wise results

| Row | Section | Create | Read | Update | Delete | Image | API | DB | Public Sync | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Home Hero Carousel (`campusImages.hero`) | PASS | PASS | PASS (reorder) | PASS | FAIL (errors not shown, BUG-A-01) | PASS | PASS | PASS | FAIL (UI error handling) |
| 4 | Nursery Page Hero (`schoolPageHeroes.nursery`) | BLOCKED in UI (3/3 cap, real photos); PASS via API | PASS | BLOCKED (reorder would move only real photos) | PASS | PASS | PASS | PASS | PASS (only on /nursery) | PASS with blocks |
| 11 | Primary Page Hero (`schoolPageHeroes.primary`) | BLOCKED in UI; PASS via API | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (only on /primary) | PASS with blocks |
| 18 | HS Page Hero (`schoolPageHeroes.higherSecondary`) | BLOCKED in UI; PASS via API | PASS | BLOCKED | PASS | NOT TESTED (error path unreachable at cap) | FAIL (cap not enforced, BUG-A-07) | PASS | PASS (only on /higher-secondary) | FAIL (Low) |
| 5 | Nursery Classes Gallery | PASS | PASS | BLOCKED (description is real data) | PASS | PASS | PASS | PASS | PASS (`#nursery-classes` only) | PASS |
| 6 | Nursery Learning Gallery | PASS | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (`#nursery-learning`) | PASS |
| 7 | Nursery Extracurricular Gallery | PASS | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (`#nursery-extracurricular`) | PASS |
| 12 | Primary Classes Gallery | PASS | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (`#primary-classes`) | PASS |
| 13 | Primary Learning Gallery | PASS | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (`#primary-learning`) | PASS |
| 14 | Primary Extracurricular Gallery | PASS | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (`#primary-extracurricular`) | PASS |
| 19 | HS Classes Gallery (full suite) | PASS | PASS | PASS (reorder); description BLOCKED | PASS | PASS (all negative cases) | PASS | PASS | PASS (order = DB order) | PASS (Low BUG-A-09) |
| 20 | HS Learning Gallery | PASS | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (`#higher-learning`) | PASS |
| 21 | HS Extracurricular Gallery | PASS | PASS | BLOCKED | PASS | PASS | PASS | PASS | PASS (`#higher-extracurricular`) | PASS |
| 33 | Infrastructure gallery (`infrastructure.gallery`) | PASS (API/DB) | **FAIL** (no image rendered) | PASS (replace, reorder); description BLOCKED | PASS | **FAIL** (BUG-A-11) | PASS | PASS | **FAIL** (public shows "NO IMAGE") | **FAIL (High)** |

### A-R.3 Test cases

| ID | Section | Case | Steps summary | Expected | Actual | Evidence | Result |
|---|---|---|---|---|---|---|---|
| A-01-01 | #1 | Cancel chooser | Add Photo → cancel | No request | No `/api/media` request | network log | PASS |
| A-01-02 | #1 | .txt | Choose qa.txt in dialog | Rejected | "Invalid file type… Got: text/plain", no request | batch-A-log | PASS |
| A-01-03 | #1 | .svg | Choose qa.svg | Rejected | "Invalid file type… Got: image/svg+xml" | batch-A-log | PASS |
| A-01-04 | #1 | Fake .jpg (text bytes) | Choose fake.jpg, alt, Upload | Backend error shown to user | POST /api/media/upload → 422 "The uploaded file is not a valid image"; no DB row; **dialog resets with no message** | A-01-fake-jpg-422-no-ui-error.png | FAIL (BUG-A-01) |
| A-01-05 | #1 | Empty file | empty.jpg (0 B) | Error shown | 422 "The uploaded file is empty"; no UI message | batch-A-log | FAIL (BUG-A-01) |
| A-01-06 | #1 | Oversize (5 MB + 1 KB) | oversize.jpg | Rejected | FE "File is too large… Your file is 5.00MB." (BUG-A-04) | A-01-neg-after-fake.png | PASS |
| A-01-07 | #1 | Required alt text | Upload without alt | Blocked | Upload button disabled until alt typed | snapshot | PASS |
| A-01-08 | #1 | Valid JPG | Upload QA-20261125-01.jpg | 201 + link + render | upload 201 (public_id `rnm3wtqwaa5rjnqhlqzb`), assign 201 `{config_key: campusImages.hero, display_order: 4}`; DB media + link rows; Cloudinary 200 | batch-A-log | PASS |
| A-01-09 | #1 | Public sync | qa-public-2 `/` | Image in hero | Present once in `#home`, loaded | batch-A-log | PASS |
| A-01-10 | #1 | Valid PNG | QA-20261125-02.png | 201 | 201/201, order 5 | batch-A-log | PASS |
| A-01-11 | #1 | Valid WebP | QA-20261125-03.webp | 201 | 201/201, order 6 | batch-A-log | PASS |
| A-01-12 | #1 | Duplicate upload | Same JPG again | Defined behaviour | Accepted as a new asset (no dedup) | batch-A-log | PASS (observation) |
| A-01-13 | #1 | Reorder | Swap two QA cards | 200; real photos unchanged; public order matches | reorder-batch 200; DB orders 0–3 unchanged; qa-public-3 order = DB | A-01-admin-hero-with-QA-photos.png | PASS |
| A-01-14 | #1 | Delete confirm / cancel | 1st click arms, Cancel | No request | Armed state shown; Cancel disarms; no request | batch-A-log | PASS |
| A-01-15 | #1 | Delete | Confirm delete | Unlink + media delete; gone everywhere | DELETE /api/admin/photos/{id} 204 → DELETE /api/media/{id} 204; rows gone; Cloudinary 404; public clean | batch-A-log | PASS |
| A-01-16 | #1 | Cleanup | Delete remaining 3 | Back to baseline | 3×(204, 204); DB == baseline | qa_db_check | PASS |
| A-01-17 | #1 | Replace | — | — | No replace control | — | N/A |
| A-01-18 | #1 | Broken URL handling | — | — | Needs tampering with real rows | — | NOT TESTED |
| A-01-19 | #1 | Empty state | — | — | Needs deleting real photos | — | BLOCKED |
| A-HERO-01/02/03 | #4/#11/#18 | UI create | Open manager | Add enabled | "Add Photo" disabled at 3/3 (real photos); UI create cannot run | snapshot | BLOCKED ×3 |
| A-HERO-04 | #4/#11/#18 | Backend cap | POST a 4th photo via API | 4xx if a cap exists | 201 for all 3 keys; admin shows "4 / 3 photos" | batch-A-log | FAIL (BUG-A-07) |
| A-HERO-05/06/07 | #4/#11/#18 | Create via API, key mapping | upload + assign per key | Correct key | 201/201; key and order 3 correct | batch-A-log | PASS ×3 |
| A-HERO-08/09/10 | #4/#11/#18 | Public sync isolation | qa-public-3 on `/`, `/nursery`, `/primary`, `/higher-secondary` | Only on own page | Each QA image only on its own page; loaded (lazy) | batch-A-log | PASS ×3 |
| A-HERO-11/12/13 | #4/#11/#18 | Admin UI delete | Delete QA card | Gone everywhere | 204/204 ×3; DB == baseline; Cloudinary 404 ×3; public API clean | qa_db_check | PASS ×3 |
| A-HERO-14 | #4/#11/#18 | Admin notice accuracy | View page | Accurate | "Features not yet implemented: Photo upload…, Drag-to-reorder…, Save to persistent storage" shown for working features | snapshot | FAIL (BUG-A-08) |
| A-HERO-15 | #18 | Error surfacing | — | — | Upload path disabled at cap; same code pattern as BUG-A-01 | source | NOT TESTED |
| A-HERO-16 | #4/#11/#18 | Reorder | — | — | Only real photos present | — | BLOCKED |
| A-19-01..05 | #19 | .txt / .svg / fake / empty / oversize | setInputFiles on the gallery input | Rejected with message | FE rejects txt/svg/oversize; backend 422 messages **are shown** for fake/empty | batch-A-log | PASS ×5 |
| A-19-06 | #19 | Cancel chooser | Add Photo → cancel | No request | No request | network | PASS |
| A-19-07..10 | #19 | JPG / PNG / WebP / duplicate | Upload 4 | 201 + correct key | 201/201 ×4, key `higher-secondary.classes.gallery`, orders 2–5 | batch-A-log | PASS ×4 |
| A-19-11 | #19 | Admin render | — | Visible | 6 cards, all loaded | batch-A-log | PASS |
| A-19-12 | #19 | Public order | Step through carousel dots | Order = DB | 6 dots; QA images at positions 3–6 in DB order | A-19-public-hs-classes-QA-slide3.png | PASS |
| A-19-13 | #19 | Image load failure | (transient browser DNS failure) | Graceful fallback | Broken-image icon + alt over gradient; no retry/fallback | A-19-public-hs-classes-QA-slide6.png | FAIL (BUG-A-09) |
| A-19-14 | #19 | Reorder | Move QA webp before QA jpg | 200; real photos fixed | 200; DB orders 0,1 unchanged | qa_db_check | PASS |
| A-19-15 | #19 | Persistence | Switch section and back | Same order | Same | batch-A-log | PASS |
| A-19-16 | #19 | Delete ×4 + cleanup | Admin UI | Gone everywhere | 4×(204, 204); DB == baseline; Cloudinary 404 ×4; public shows 2 dots (qa-public-3) | qa_db_check | PASS |
| A-19-17 | #19 | Description read | Admin vs public | Same text | "priya" in both | screenshots | PASS |
| A-19-18 | #19 | Description update | — | — | Real record exists | — | BLOCKED |
| A-19-19 | #19 | Replace | — | — | No replace control in KeyedGalleryManager | — | N/A |
| A-GAL-01..08 | #5,6,7,12,13,14,20,21 | Create + key | Upload 1 QA JPG each | 201 + correct key | 201/201 ×8, sent key == expected key ×8 | batch-A-log | PASS ×8 |
| A-GAL-09..16 | same | Admin render | — | Visible | Loaded in admin ×8 | batch-A-log | PASS ×8 |
| A-GAL-17..24 | same | Public sync isolation | qa-public-3: step through all 9 gallery carousels | Only in own section | Each QA image found exactly once, in its expected section, loaded | batch-A-log | PASS ×8 |
| A-GAL-25..32 | same | Delete + cleanup | Admin UI | Gone everywhere | 8×(204, 204); DB == baseline; Cloudinary 404 ×8; public API clean | qa_db_check | PASS ×8 |
| A-GAL-33..40 | same | Description update | — | — | All description records exist (real data) | — | BLOCKED ×8 |
| A-33-01 | #33 | Public empty state | `/` with 0 photos | Graceful | Section not rendered (returns null; no static fallback) | A-33-public-infrastructure-link-dead-empty.png | PASS |
| A-33-02 | #33 | Nav links when empty | Click header "Infrastructure" | Scrolls to section | URL becomes `/#infrastructure`, no scroll; target missing (header and footer links) | same | FAIL (BUG-A-10) |
| A-33-03 | #33 | Admin empty state | Open manager | Empty message | "No photos yet. Click to add the first one." | snapshot | PASS |
| A-33-04..08 | #33 | Negative cases | txt / svg / fake / empty / oversize | Rejected with message | Same as A-19-01..05 | batch-A-log | PASS ×5 |
| A-33-09..12 | #33 | JPG / PNG / WebP / duplicate | Upload 4 | 201 + link | 201/201 ×4, key `infrastructure.gallery`, orders 0–3; alt_text saved empty | batch-A-log | PASS ×4 |
| A-33-13 | #33 | Admin render | — | Thumbnails | **Placeholder icons only**, 0 `<img>` | A-33-admin-infra-after-upload.png | FAIL (BUG-A-11) |
| A-33-14 | #33 | Public render | qa-public-3 `/` | Photos shown | Section shows "NO IMAGE", "1 / 4", description | A-33-public-infra-no-image-BUG.png | FAIL (BUG-A-11) |
| A-33-15 | #33 | Replace with invalid file | Replace → fake.jpg | Rejected, original kept | PUT /api/media/{id} 422; message shown; card unchanged | batch-A-log | PASS |
| A-33-16 | #33 | Replace with valid file | Replace → QA-20261125-04-replace.jpg | Same media id, new asset | PUT 200; same media id and link (order 0); new public_id `zgzv0fjer0z8qo9qokx6`; old asset 404 | batch-A-log | PASS |
| A-33-17 | #33 | Reorder | Drag last to first | 200 | reorder-batch 200 | batch-A-log | PASS |
| A-33-18 | #33 | Persistence | Switch section and back | Same order | Same | batch-A-log | PASS |
| A-33-19 | #33 | Delete ×4 + cleanup | Admin UI | Gone | 4×(204, 204); 0 links; Cloudinary 404 ×4 | qa_db_check | PASS |
| A-33-20 | #33 | Public after delete | qa-public-2 `/` | Hidden again | `#infrastructure` absent | batch-A-log | PASS |
| A-33-21 | #33 | Description read | public | Saved text | "DAJYTGLIYGI" shown with photos present | A-33-public-infra-no-image-BUG.png | PASS |
| A-33-22 | #33 | Description update | — | — | Real record exists | — | BLOCKED |

### A-R.4 Bug reports (Batch A)

**BUG-A-11 – Infrastructure photos never display (Admin and Public)**
- Severity: High. Priority: P1. Section: #33 Group of Schools – Infrastructure.
- Steps: Admin → Common Sections → Group of Schools – Infrastructure → upload a valid JPG → open `/` and scroll to Infrastructure.
- Expected: the uploaded photo is visible in the admin card and the public slider.
- Actual: the admin card shows a placeholder icon; the public slider shows "NO IMAGE" for every slide (count "1 / 4" is correct).
- Evidence: `A-33-admin-infra-after-upload.png`, `A-33-public-infra-no-image-BUG.png`.
- API: `GET /api/admin/photos?config_key=infrastructure.gallery` and `GET /api/public/photos` both return 200, with `media` keys `[id, …, cloudinary_public_id, imageUrl, …]`. There is no `image_url` key.
- DB: media rows have a valid `image_url` column; Cloudinary URL returns 200.
- Root cause (confirmed): `src/services/infrastructureContentApi.ts:90` maps `imageUrl: item.media.image_url`, a field the API does not return (it returns `imageUrl`). `photoKeyApi.ts:76` handles both names.
- Suggested correction: map `item.media.imageUrl || item.media.image_url`, and fix the `PhotoConfigBody` type at line 36.

**SEC-A-01 – Dev server exposes the SQLite database, backups and backend source to the network**
- Severity: High (development environment). Priority: P1 before any shared or LAN use. Found during Batch A (scope: security phase).
- Steps: `curl http://<host>:5173/backend/data/smdpvc.db`.
- Expected: 403/404.
- Actual: 200, 446,464 bytes (the full database, including admin credential hashes). `/backend/data/smdpvc_backup_pre_qa_20261125.db` → 200; `/backend/app/config.py` → 200. `.env` files return 403.
- Root cause (confirmed): `vite.config.ts:10-11` sets `server.host: "0.0.0.0"`, and Vite serves files under the project root. Only `.env*`/certificates are on the default deny list.
- Suggested correction: add `server.fs.deny` for `backend/**`, `**/*.db`, `QA_EVIDENCE/**`; bind to `localhost` unless LAN access is required; keep DB backups outside the web root.

**BUG-A-01 – Home/School-page hero upload and delete failures are never shown to the admin**
- Severity: Medium. Priority: P2. Sections: #1 (confirmed in browser); #4/#11/#18 (same code, not reachable at 3/3).
- Steps: Home Page Hero Carousel → Add Photo → choose `fake.jpg` (or a 0-byte `.jpg`) → alt text → Upload Photo.
- Expected: "The uploaded file is not a valid image" / "The uploaded file is empty" shown in the dialog.
- Actual: the backend returns 422 with that detail. The dialog resets, and no message (or an unrelated stale one) is shown.
- Evidence: `A-01-fake-jpg-422-no-ui-error.png`, network #415/#417.
- Root cause (confirmed): `HomeHeroManager.tsx:36-48` and `SchoolPageHeroManager.tsx:45-55` call `setError(message)` in `catch`, then `await reload()` in `finally`. `usePhotoKey.ts:14` does `setError(null)` on every successful reload, wiping the message.
- Suggested correction: keep action errors in separate state, or don't clear `error` in `reload()`.

**BUG-A-10 – Header/footer "Infrastructure" links do nothing when the gallery is empty**
- Severity: Medium. Priority: P3. Section: #33 / homepage navigation.
- Steps: with 0 infrastructure photos, open `/` → click header "Infrastructure".
- Expected: scroll to the section (or the link is hidden).
- Actual: the URL changes to `/#infrastructure` and the page does not move; `#infrastructure` doesn't exist.
- Evidence: `A-33-public-infrastructure-link-dead-empty.png`.
- Root cause (confirmed): `src/components/Infrastructure.tsx:11-13` returns `null` when `photos.length === 0`, so the saved description is hidden too.
- Suggested correction: render the section with the description/empty message, or hide the nav links when it's empty.

**BUG-A-02 – Home Hero "Add Photo" makes the admin choose the file twice**
- Severity: Low (UX). Priority: P3. Section: #1.
- Steps: click "Add Photo" → a file picker opens → choose a file → the Upload dialog opens empty → choose the file again.
- Root cause (confirmed): `PhotoGridManager.tsx:80-81` opens its own hidden input. `HomeHeroManager.tsx:97-99` `onAddPhoto` discards the chosen file and only opens `UploadPhotoDialog`. The discarded first pick is still validated and can raise errors (see BUG-A-03).
- Suggested correction: have the Add Photo button open the dialog directly, or pre-fill it with the chosen file.

**BUG-A-03 – Stale validation banner persists after a later successful upload**
- Severity: Low. Section: #1.
- Actual: "File is too large…" from the discarded first pick stayed visible after a later successful upload. `PhotoGridManager` `uploadError` is never cleared by the dialog flow.

**BUG-A-04 – Oversize message is misleading**
- Severity: Low. Sections: all photo uploads.
- Actual: a 5,243,904-byte file shows "Maximum size is 5MB. Your file is 5.00MB."
- Suggested correction: show bytes, or 2-decimal MB with ceiling rounding.

**BUG-A-05 – Saved alt text is not used / not saved**
- Severity: Low (accessibility).
- Admin hero card `img alt` = filename; public hero `<img alt="">` although `alt_text` "QA-20261125-01 home hero jpg" was saved.
- KeyedGallery photos all get the fixed alt ("Higher Secondary Classes").
- Infrastructure uploads save `alt_text` = "".

**BUG-A-06 – Photo delete buttons have no accessible name and are invisible until hover**
- Severity: Low (accessibility). Sections: #1, #4/#11/#18 (`PhotoGridManager.tsx:198-211`), #33 delete button.
- Actual: the icon-only `<button>` has no `aria-label`; it uses `opacity-0 group-hover:opacity-100`, so it isn't visible on keyboard focus.

**BUG-A-07 – 3-photo limit for school-page heroes is frontend-only**
- Severity: Low. Sections: #4/#11/#18.
- Actual: `POST /api/admin/photos/assign` accepted a 4th photo for every key (201), and the admin then showed "4 / 3 photos". `maxPhotos={3}` is only in `SchoolPageHeroManager.tsx`.
- Suggested correction: enforce it in the backend, or document it as advisory.

**BUG-A-08 – Outdated "Features not yet implemented" notice on school-page hero managers**
- Severity: Low. Sections: #4/#11/#18.
- Actual: the notice lists photo upload, drag-to-reorder, and "Save to persistent storage" as not implemented. All three work (verified above).

**BUG-A-09 – Public gallery has no fallback when an image fails to load**
- Severity: Low. Sections: keyed galleries.
- Actual: during a transient browser DNS failure for `res.cloudinary.com`, the slide showed the browser's broken-image icon and alt text over the gradient, with no retry or placeholder.
- Evidence: `A-19-public-hs-classes-QA-slide6.png`, console `net::ERR_NAME_NOT_RESOLVED`. Image loads succeeded on retry, so the network failure itself was environmental.

**Observations (not bugs):**
- Duplicate uploads are not deduplicated (a new asset is created each time).
- Alt text is mandatory in the Home Hero dialog only.
- Primary hero QA image loads lazily (`loading="lazy"`) until its slide is shown.
- Process note: one Playwright `browser_network_request` full-detail call echoed the request `Authorization` header into the QA agent's tool output. It was not saved to any file. Recommend logging out after QA so the token can't be reused.


---

## Batch B Results – Singleton Sections, About, Principal, Calendar, Courses

Scope: inventory rows #2, #3, #8, #15, #22, #9, #16, #23, #10, #17, #24, #25. Executed 2026-11-25 with Playwright MCP (Chromium 157).
- **Browser-tested** means run in the real browser: the admin tab, plus public pages in isolated contexts `qa-public-2` and the new `qa-public-4`.
- **API-only** means an authenticated `fetch` run inside the logged-in admin tab, recorded with method, URL, status and body summary. The token was never printed or saved.
- DB checks were read-only. Detailed log: `QA_EVIDENCE/batch-B-log.md`. Baseline: `QA_EVIDENCE/batch-B-baseline.json`.

**Data-protection rule:** every image and PDF slot in this batch (11 of 11) and all 3 About records already hold real content. Upload, replace or delete on these slots is irreversible:
- `useSingleSlot.ts:40` overwrites the Cloudinary asset in place.
- `PrincipalManager.tsx:136-147` and `AcademicCalendarManager.tsx:72-74` delete the old asset.

So Create, Update, Delete and Image were **BLOCKED** for those slots. Only Read, non-saving UI validation, and API tests on dedicated `qa-20261125-*` keys were run. Full lifecycles were possible only for the missing `principal.higherSecondary` record and for a QA group inside Courses.

### B-R.1 Summary (Batch B)

| Metric | Count |
|---|---:|
| Total test cases | 93 |
| Passed | 68 |
| Failed | 17 |
| Blocked | 6 (rows; each covers several sections' C/U/D/Image) |
| Not Tested | 2 |
| Bugs discovered | 13 (2 High, 4 Medium, 7 Low), plus 1 security observation (SEC-B-01) and 1 data/privacy finding (DATA-B-01) |

**Cleanup:**
- The QA About record `qa-20261125-about` and QA content record `qa-20261125-record` were deleted (204, then GET returns `null`).
- The QA Courses group was deleted. The final `higher-secondary.course-groups` payload is **byte-identical** to the original (`B-25-courses-before.json` vs `B-25-courses-after.json`). Only `updated_at` changed (18:41:00 → 19:45:31).
- Final DB check: all 11 singleton photo slots, all 3 about_sections, and the principal and courses payloads are identical to the baseline. Media count is 136 (baseline 136). 0 QA rows remain. No Cloudinary assets were created in this batch.

**QA-run incident (disclosed):** the first client-validation script used an in-script dialog handler that conflicted with Playwright MCP's own dialog handling.
- The confirm "Save this image? File: fake.jpg (0KB)" was **accepted** instead of dismissed.
- This sent `PUT /api/media/3a591a6c…`, a replace request against the **real** Nursery School-Section image. The file was 20 bytes of text, and the backend rejected it with **422**.
- Verified afterwards: the DB media row is unchanged (`file_size` 55192, `updated_at 2026-11-24 13:01:37`) and the Cloudinary asset still serves 55,192 bytes. **No data was changed.**
- All later dialogs were dismissed explicitly with `browser_handle_dialog(accept=false)`. The episode also proves BUG-B-06: a valid-looking `.jpg` with real image content would have overwritten the real asset.

### B-R.2 Section-wise results

| Row | Section | Create | Read | Update | Delete | Image | API | DB | Public Sync | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 2 | School Sections Cards (`schoolSectionPhotos.*`) | BLOCKED (slot full, real) | PASS | BLOCKED | BLOCKED (confirm/cancel PASS) | FAIL (client accepts fake/empty .jpg, BUG-B-06) | PASS | PASS | PASS (correct key → correct card/link) | FAIL (Low-Med) |
| 3 | Hero 3D Cards (`campusImages.sports/principal`) | BLOCKED | PASS | BLOCKED | BLOCKED | NOT TESTED (same component as #2) | PASS | PASS | PASS | PASS with blocks (stale notice BUG-B-13) |
| 8 | Nursery About | BLOCKED (real record) | PASS | BLOCKED | BLOCKED | FAIL (no client file validation, BUG-B-05) | FAIL (BUG-B-02/03/07, shared API) | PASS | PASS | FAIL (Medium) |
| 15 | Primary About | BLOCKED | PASS | BLOCKED | BLOCKED | FAIL (same component) | as #8 | PASS | PASS | FAIL (Medium) |
| 22 | HS About (validation suite) | BLOCKED | PASS | BLOCKED | BLOCKED | FAIL (BUG-B-05) | as #8 | PASS | PASS | FAIL (Medium) |
| 9 | Nursery Principal | BLOCKED (real) | PASS | BLOCKED | BLOCKED | FAIL by code (BUG-B-08, not executed) | PASS | PASS | PASS | FAIL (High risk) |
| 16 | Primary Principal | BLOCKED (real) | PASS | BLOCKED | BLOCKED | FAIL by code (BUG-B-08) | PASS | PASS | PASS | FAIL (High risk) |
| 23 | HS Principal | **FAIL** (PUT 422, BUG-B-01) | PARTIAL (photo PASS; text GET 422) | BLOCKED by BUG-B-01 | BLOCKED by BUG-B-01 | BLOCKED (real photo) | **FAIL** | PASS (nothing written) | PASS (no static fallback shown) | **FAIL (High)** |
| 10 | Nursery Academic Calendar | BLOCKED (real PDF) | PASS | BLOCKED | BLOCKED | PASS (client validation) | PASS | PASS | PASS (Download opens correct PDF) | PASS with blocks; DATA-B-01 |
| 17 | Primary Academic Calendar | BLOCKED | PASS | BLOCKED | BLOCKED | NOT TESTED (same component as #10) | PASS | PASS | PASS (link 200 application/pdf) | PASS with blocks; BUG-B-10 |
| 24 | HS Academic Calendar | BLOCKED | PASS | BLOCKED | BLOCKED | NOT TESTED (same component) | PASS | PASS | PASS | PASS with blocks; DATA-B-01 |
| 25 | Courses Offered (Class XI) | PASS | PASS | PASS (add/remove subject) | PASS (cancel + confirm) | N/A | PASS | PASS (restored byte-identical) | PASS (isolated context + reload; HTML escaped) | PASS (R-03 NOT TESTED) |

### B-R.3 Test cases

| ID | Section | Case | Steps summary | Expected | Actual | Evidence | Mode | Result |
|---|---|---|---|---|---|---|---|---|
| B-02-01 | #2 | Admin read | Open School Sections Cards | 3 real images, correct per key | 3 images load; URLs match DB `schoolSectionPhotos.{nursery,primary,higherSecondary}` | batch-B-log | Browser | PASS |
| B-02-02 | #2 | Public read | `/` in qa-public-2, scroll | Each card shows its key's image + correct link | nursery→/nursery, primary→/primary, HS→/higher-secondary, all loaded | B-2-public-school-section-cards.png | Browser | PASS |
| B-02-03 | #2 | .txt | setInputFiles qa.txt | Rejected, no request | "Invalid file type… Got: text/plain", 0 writes | batch-B-log | Browser | PASS |
| B-02-04 | #2 | .svg | qa.svg | Rejected | "Invalid file type… Got: image/svg+xml", 0 writes | batch-B-log | Browser | PASS |
| B-02-05 | #2 | Oversize | oversize.jpg (5 MB+1 KB) | Rejected | "File is too large… Your file is 5.00MB." (wording = BUG-A-04) | B-2-client-error-oversize.png | Browser | PASS |
| B-02-06 | #2 | Fake .jpg (text bytes) | fake.jpg | Rejected client-side | Accepted; prompt "Save this image? (0KB)"; on accept, replace PUT sent, backend 422 | batch-B-log (incident) | Browser | FAIL (BUG-B-06) |
| B-02-07 | #2 | Empty file | empty.jpg (0 B) | Rejected client-side | Accepted; save prompt shown (dismissed) | batch-B-log | Browser | FAIL (BUG-B-06) |
| B-02-08 | #2 | Cancel save prompt | qa.jpg → dismiss confirm | Original image kept, no request | Original Cloudinary image shown, 0 writes | B-2-unsaved-preview-after-cancel.png | Browser | PASS |
| B-02-09 | #2 | Remove confirm/cancel | Remove → "Confirm Delete" → Cancel | 2-step, no request | 2-step confirm shown; cancel → 0 writes | batch-B-log | Browser | PASS |
| B-02-10 | #2 | Create/Replace/Delete lifecycle | – | – | Not run: slot holds a real asset, replace is in-place | – | – | BLOCKED |
| B-02-11 | #2 | Fetch efficiency | Network log on open | 1 GET per key | 2 GETs per key (React StrictMode, dev only) | batch-B-log | Browser | PASS (observation) |
| B-03-01 | #3 | Admin read | Open Hero 3D Cards | 2 real images | Both load, keys correct | B-3-admin-hero-3d-cards.png | Browser | PASS |
| B-03-02 | #3 | Public read | `/` hero | sports + principal images | Both loaded with alt text | B-3-public-hero-3d-cards.png | Browser | PASS |
| B-03-03 | #3 | Stale notice | Inspect page | No misleading text | "Features not yet implemented: • Photo upload and validation" although upload works | B-3-admin-hero-3d-cards.png | Browser | FAIL (BUG-B-13) |
| B-03-04 | #3 | C/U/D lifecycle | – | – | Real assets | – | – | BLOCKED |
| B-AB-01 | #8 | Admin read | Nursery → About | DB desc + image | "PRIYA" + image fzoqo7… loaded | B-about-nursery-admin.png | Browser | PASS |
| B-AB-02 | #15 | Admin read | Primary → About | DB desc + image | "priya" + zpscpj3… | B-about-primary-admin.png | Browser | PASS |
| B-AB-03 | #22 | Admin read | HS → About | DB desc + image | "priya" + mtlzyyr… | B-about-higher-secondary-admin.png | Browser | PASS |
| B-AB-04 | #8/15/22 | Public read | /nursery, /primary, /higher-secondary in qa-public-2 | Same text + image | All three match DB, images load, 0 failed requests | batch-B-log | Browser | PASS |
| B-AB-05 | #22 | Empty description | Clear textarea | Validation or Save disabled | Save enabled, no message | B-22-about-validation-unsaved.png | Browser | FAIL (BUG-B-04) |
| B-AB-06 | #22 | Whitespace description | "    " | Validation | Save enabled, no message | same | Browser | FAIL (BUG-B-04) |
| B-AB-07 | #22 | Invalid photo file | qa.txt into photo input | Client rejection | Accepted as pending photo; broken blob preview; Save enabled | B-22-about-txt-accepted-as-photo.png | Browser | FAIL (BUG-B-05) |
| B-AB-08 | #22 | Remove Photo confirm/cancel | Remove Photo → Confirm Remove → Cancel | No request | Confirm step shown; cancel → 0 writes | batch-B-log | Browser | PASS |
| B-AB-09 | #22 | Unsaved changes on navigate | Edit, then click another nav item | Warn or keep | Changes silently discarded (0 writes) | batch-B-log | Browser | FAIL (BUG-B-11, Low) |
| B-AB-10 | #8/15/22 | Update/Delete on real records | – | – | Real content | – | – | BLOCKED |
| B-AB-11 | API | Unauthorized POST | no token | 401 | 401 "Missing authorization header" | batch-B-log | API-only | PASS |
| B-AB-12 | API | POST valid (unicode, HTML, emoji) | key `qa-20261125-about` | 201, stored verbatim | 201; GET admin/public return the exact string | batch-B-log | API-only | PASS |
| B-AB-13 | API | GET public QA key | `/api/public/about-sections/qa-20261125-about` | 200 | 200 same id | batch-B-log | API-only | PASS |
| B-AB-14 | API | POST duplicate key | same key again | 409 or upsert | 201 upsert (same id); UI relies on POST-as-upsert | batch-B-log | API-only | PASS (note) |
| B-AB-15 | API | Long description 20,000 chars | PATCH via :5173 | 200, or 413/422 with clear message | **500** `{"error":"The Nursery Academic Calendar request failed."}`; never reaches FastAPI | batch-B-log | API-only | FAIL (BUG-B-02) |
| B-AB-16 | API | Whitespace PATCH | "   " | Trim or 422 | 200, stored "" (trimmed) | batch-B-log | API-only | PASS |
| B-AB-17 | API | Empty section_key | "" | 422 | 422 string_too_short | batch-B-log | API-only | PASS |
| B-AB-18 | API | 81-char key | – | 422 | 422 string_too_long | batch-B-log | API-only | PASS |
| B-AB-19 | API | Missing section_key | – | 422 | 422 missing | batch-B-log | API-only | PASS |
| B-AB-20 | API | Nonexistent media_id | random UUID | 404/422 | **500** with raw SQL `FOREIGN KEY constraint failed [SQL: UPDATE about_sections …]` | batch-B-log | API-only | FAIL (BUG-B-03) |
| B-AB-21 | API | Invalid UUID media_id | "not-a-uuid" | 422 | 422 uuid_parsing | batch-B-log | API-only | PASS |
| B-AB-22 | API | PATCH missing key | – | 404 | 404 | batch-B-log | API-only | PASS |
| B-AB-23 | API | DELETE missing key | – | 404 | **500** "Failed to delete about section: … not found" | batch-B-log | API-only | FAIL (BUG-B-07) |
| B-AB-24 | API | DELETE QA key | – | 204, then GET null | 204; GET → null; DB row gone | batch-B-log | API-only | PASS |
| B-PR-01 | #9 | Admin read | Nursery → Principal | name/message/photo from DB | "raji" / "nothing" / photo cap6rylnp… | batch-B-log | Browser | PASS |
| B-PR-02 | #16 | Admin read | Primary → Principal | from DB | "sailaja" / "nothing" / photo vv7fipk… | B-16-principal-primary-admin.png | Browser | PASS |
| B-PR-03 | #9/16/23 | Public read | 3 school pages | Same as admin | Nursery & Primary name/message/photo match; HS photo only | batch-B-log | Browser | PASS |
| B-PR-04 | #23 | Admin load text | Open HS → Principal | GET 200 | `GET /api/admin/content-records/principal.higherSecondary` → **422** string_pattern_mismatch; UI silently falls back to public GET | batch-B-log | Browser | FAIL (BUG-B-01) |
| B-PR-05 | #23 | Empty/whitespace name | Message only, name "   ", Save | Blocked with message | "Please enter the Principal's name.", 0 writes | B-23-principal-empty-name-validation.png | Browser | PASS |
| B-PR-06 | #23 | Create name/message (unicode + HTML) | Fill QA name/message → Save | 200, visible on public | **PUT 422**; UI "Request failed with status 422"; DB: no record | B-23-principal-save-attempt.png | Browser | FAIL (BUG-B-01) |
| B-PR-07 | #23 | Edit / Delete QA record | – | – | Impossible: create fails | – | – | BLOCKED (by BUG-B-01) |
| B-PR-08 | #23 | R-04 static fallback when record missing | Public /higher-secondary | No fake text | Heading + photo only, no static name/message (R-04 refuted for Principal) | batch-B-log | Browser | PASS |
| B-PR-09 | #9/16/23 | Photo replace ordering | Code `PrincipalManager.tsx:136-145` | Upload new, then remove old | Old photo **deleted first**; if upload fails the photo is lost | source | Code | FAIL (BUG-B-08, not executed) |
| B-PR-10 | #9/16 | C/U/D on real records/photos | – | – | Real data | – | – | BLOCKED |
| B-CA-01 | #10/17/24 | Admin read | 3 calendar managers | Current PDF shown | Filename + upload date shown for all three | batch-B-log | Browser | PASS |
| B-CA-02 | #10 | Non-PDF (.txt) | setInputFiles | Rejected | "Please select a PDF file only." | B-10-calendar-validation-unsaved.png | Browser | PASS |
| B-CA-03 | #10 | Image as calendar (.jpg) | – | Rejected | "Please select a PDF file only." | same | Browser | PASS |
| B-CA-04 | #10 | Oversize PDF (5 MB + 1 KB) | big.pdf | Rejected | "The PDF must be 5 MB or smaller." | same | Browser | PASS |
| B-CA-05 | #10 | Valid PDF staged, not saved | qa.pdf → navigate away | Save button only, no auto-upload | "Save" appeared; navigate away → 0 writes | batch-B-log | Browser | PASS |
| B-CA-06 | #10/17/24 | Public PDFs reachable | curl -I each Cloudinary URL | 200 application/pdf | All three 200 application/pdf | batch-B-log | API-only | PASS |
| B-CA-07 | #10 | Public Download | Click "Download Academic Calendar" on /nursery | Opens current PDF | Popup opens rlyynef7….pdf (matches DB) | B-10-public-nursery-calendar.png | Browser | PASS |
| B-CA-08 | #17/24 | Public consistency | /primary, /higher-secondary | Same block as Nursery | Link only, no filename/date (Nursery shows both) | batch-B-log | Browser | FAIL (BUG-B-10) |
| B-CA-09 | #10/17/24 | Upload/Replace/Delete | – | – | Replace deletes the real PDF | – | – | BLOCKED |
| B-CA-10 | #10/17/24 | Content of published files | Admin/public filename | Academic calendar | All three are named `Shabarish_resume*.pdf` | batch-B-log | Browser | FAIL (DATA-B-01) |
| B-CO-01 | #25 | Admin read | HS → Courses | DB groups | "bio maths" + 6 subjects | B-25-courses-admin-before.png | Browser | PASS |
| B-CO-02 | #25 | Empty group name | Create "" | Error, no request | "Group name cannot be empty.", 0 writes | batch-B-log | Browser | PASS |
| B-CO-03 | #25 | Whitespace group name | "   " | Error | Same message, 0 writes | batch-B-log | Browser | PASS |
| B-CO-04 | #25 | Duplicate group (case-insensitive) | "BIO MATHS" | Error | "A group named "BIO MATHS" already exists." | batch-B-log | Browser | PASS |
| B-CO-05 | #25 | Create QA group | "QA-20261125-GRP" | PUT 200, both groups kept | PUT 200 (119 ms); request has original group unchanged + QA group | B-25-courses-qa-group-created.png | Browser | PASS |
| B-CO-06 | #25 | Empty / whitespace subject | – | Error, no request | "Subject name cannot be empty.", 0 writes | batch-B-log | Browser | PASS |
| B-CO-07 | #25 | Special chars subject | "C++ & AI" | Saved | PUT 200, badge shown | B-25-courses-qa-subjects.png | Browser | PASS |
| B-CO-08 | #25 | Unicode subject (Enter key) | "தமிழ்" | Saved | PUT 200 | same | Browser | PASS |
| B-CO-09 | #25 | Duplicate subject (case-insensitive) | "c++ & ai" | Error | ""c++ & ai" already exists in this group." | same | Browser | PASS |
| B-CO-10 | #25 | HTML/XSS subject | `<img src=x onerror=alert(1)>` | Rendered as text | Text in admin and public; no `<img>` element, no dialog | B-25-courses-public-new-context.png | Browser | PASS |
| B-CO-11 | #25 | DB + public API after edits | sqlite + GET public | Matches | updated_at 19:44:44; groups [bio maths, QA-20261125-GRP] | batch-B-log | API-only | PASS |
| B-CO-12 | #25 | Public sync, new isolated context | qa-public-4 /higher-secondary | QA group visible | Visible with exact subjects | B-25-courses-public-new-context.png | Browser | PASS |
| B-CO-13 | #25 | Public reload persistence | reload qa-public-4 | Same | Same | batch-B-log | Browser | PASS |
| B-CO-14 | #25 | Remove subject | Remove "C++ & AI" | PUT 200, badge gone | PUT 200; badge removed | batch-B-log | Browser | PASS |
| B-CO-15 | #25 | Delete group, cancel | Delete → dismiss confirm | Kept, no request | Kept, 0 writes | batch-B-log | Browser | PASS |
| B-CO-16 | #25 | Delete group, confirm | Delete → accept | PUT 200 with original only | PUT 200; body = original group only | batch-B-log | Browser | PASS |
| B-CO-17 | #25 | Public after delete | reload qa-public-4 | QA group gone | Only "BIO MATHS" | B-25-courses-public-after-delete.png | Browser | PASS |
| B-CO-18 | #25 | Payload restored | Compare before/after JSON | Identical | Byte-identical payload | B-25-courses-before.json / -after.json | DB | PASS |
| B-CO-19 | #25 | Rename group/subject | Look for edit control | Edit option | Not available (add/remove only) | snapshot | Browser | PASS (feature gap noted) |
| B-CO-20 | #25 | R-03: admin load failure → defaults → next save overwrites real data | Code `CoursesOfferedManager.tsx:51-67` | – | Can't be forced safely without a live failing save; code shows `catch → setGroups(DEFAULT_COURSE_GROUPS)` | source | Code | NOT TESTED |
| B-CO-21 | #25 | Empty-state public display (earlier fix) | – | – | Needs all real groups deleted; earlier API evidence: `{"groups":[]}` handled by fixed hook | – | – | NOT TESTED |
| B-CR-01 | API | Unauthorized PUT content-record | no token | 401 | 401 | batch-B-log | API-only | PASS |
| B-CR-02 | API | Uppercase key | `QA-Upper` | 422 | 422 pattern mismatch | batch-B-log | API-only | PASS |
| B-CR-03 | API | Create QA record | PUT `qa-20261125-record` | 200 | 200 | batch-B-log | API-only | PASS |
| B-CR-04 | API | Public GET QA record | – | 200 same payload | 200 | batch-B-log | API-only | PASS |
| B-CR-05 | API | Update | PUT v2 | 200 | 200 | batch-B-log | API-only | PASS |
| B-CR-06 | API | Payload not an object | `payload:"str"` | 422 | 422 dict_type | batch-B-log | API-only | PASS |
| B-CR-07 | API | Missing payload | `{media:[]}` | 422 or keep | 200; payload silently replaced with `{}` | batch-B-log | API-only | FAIL (BUG-B-12) |
| B-CR-08 | API | Nonexistent media | random UUID | 422/404 | 422 "One or more media items do not exist" | batch-B-log | API-only | PASS |
| B-CR-09 | API | Public GET missing key | – | 404 or null | 200 `null` | batch-B-log | API-only | PASS |
| B-CR-10 | API | DELETE QA record | – | 204, GET null | 204; GET null | batch-B-log | API-only | PASS |
| B-CR-11 | API | DELETE missing | – | 404 | 404 | batch-B-log | API-only | PASS |
| B-X-01 | Cross | Homepage broken images | `/` in qa-public-2 | All images load | 3 broken: 1 leadership photo whose Cloudinary asset is 404 (`u68udd…png`); 2 leadership profiles using a **raw PDF** media (`80810 - 4 (1).pdf`) as photo | batch-B-log | Browser | FAIL (handed to Batch C) |
| B-X-02 | Cross | Admin session survives batch | `hasToken()` at end | true | true | – | Browser | PASS |

Mode counts: 56 browser-tested, 27 API-only (in-browser authenticated fetch / curl), 1 DB comparison, 2 code-inspection, 7 not executed (BLOCKED / NOT TESTED).

### B-R.4 Bug reports (Batch B)

**BUG-B-01 – Higher Secondary Principal name/message can never be saved or loaded by Admin**
- Severity: High. Priority: P1. Section: #23 HS Principal.
- Steps: Admin → Higher Secondary → Principal → enter a name and message → Save.
- Expected: record saved, shown on `/higher-secondary`.
- Actual: `PUT /api/admin/content-records/principal.higherSecondary` → **422** `string_pattern_mismatch`. The UI shows only "Request failed with status 422". The admin GET for the same key also returns 422, which the UI hides by falling back to the public endpoint.
- Evidence: `B-23-principal-save-attempt.png`. The DB has no `principal.higherSecondary` record, which explains the inventory observation "HS Principal has a photo but no name/message record".
- Root cause (confirmed):
  - `src/components/admin/PrincipalManager.tsx:34` builds `principal.${sectionKey}` with `sectionKey="higherSecondary"`.
  - `backend/app/schemas/content_record.py:10` `RECORD_KEY_PATTERN = ^[a-z0-9][a-z0-9._-]{0,159}$` allows lowercase only.
  - The public endpoint applies no pattern, so reads "succeed" with `null`.
- Extra risk: if a new photo is pending, the photo is replaced first (old one deleted) and *then* the text save fails, leaving a partial save.
- Suggested correction: use a lowercase record key for HS (e.g. `principal.higher-secondary`, matching other keys). Keep the photo key unchanged, or migrate it consistently. Surface the API `detail` in the UI.

**BUG-B-08 – Principal photo replacement deletes the old photo before uploading the new one (data-loss risk)**
- Severity: High. Priority: P1. Sections: #9, #16, #23.
- Evidence: `src/components/admin/PrincipalManager.tsx:136-145`. `removeKeyedPhoto(old)` runs before `addKeyedPhoto(new)`, and cleanup errors are swallowed.
- Scenario: a backend 422 (corrupt or fake image, see BUG-B-06), a Cloudinary outage, or a network error during upload leaves the principal with **no photo**. The old Cloudinary asset is already destroyed and can't be recovered.
- Status: confirmed by code; **not executed** (would destroy a real photo).
- Suggested correction: upload and link the new photo first, then remove the old one, as `AcademicCalendarManager` already does (add, then remove).

**BUG-B-02 – Any JSON API request over 16 KB fails with a misleading 500 on the Node server (port 5173)**
- Severity: Medium. Priority: P2. Affects every admin JSON endpoint reached through port 5173 (long About descriptions, Courses payloads, leadership bios, gallery descriptions).
- Steps: PATCH `/api/admin/about-sections/qa-20261125-about` with a 20,000-char description. The threshold is between 15,000 and 17,000 characters.
- Expected: 200, or 413/422 with a clear message.
- Actual: HTTP 500 `{"error":"The Nursery Academic Calendar request failed."}`. The request never reaches FastAPI; the same request to :8000 is processed normally.
- Root cause (confirmed): port 5173 is served by `node server.mjs`, not by plain Vite.
  - `server.mjs:47` applies `express.json({ limit: "16kb" })` globally before the `/api` proxy (`server.mjs:580`).
  - The final error handler (`server.mjs:603-607`) turns the resulting `PayloadTooLargeError` into this hard-coded calendar message.
- Suggested correction: apply `express.json` only to the routes that need it (not before the `/api` proxy), or raise the limit and return 413 with an accurate message.

**BUG-B-03 – About API returns 500 and leaks raw SQL for an unknown media_id**
- Severity: Medium (information disclosure + wrong status). Priority: P2.
- Steps: `POST /api/admin/about-sections` `{section_key:"qa-20261125-about", media_id:"00000000-0000-4000-8000-000000000000"}`.
- Actual: 500 `{"detail":"Failed to create/update about section: (sqlite3.IntegrityError) FOREIGN KEY constraint failed [SQL: UPDATE about_sections SET media_id=? …] [parameters …]"}`.
- Expected: 422/404 "media not found", as content-records does (`"One or more media items do not exist"`).
- Suggested correction: validate that `media_id` exists in the service before writing, and don't include exception text in responses.

**BUG-B-04 – About description accepts empty / whitespace (no frontend or backend validation)**
- Severity: Medium. Priority: P3. Sections: #8, #15, #22.
- Actual: clearing the textarea leaves Save enabled with no message. The backend (`backend/app/schemas/content.py:13`, `description: str = ""`) stores `""`, and PATCH `"   "` is stored as `""`. One click can blank the public About text.
- Suggested correction: require a trimmed non-empty description (frontend + backend), and add a `max_length`.

**BUG-B-05 – About photo input has no client-side validation**
- Severity: Medium. Priority: P3. Sections: #8, #15, #22.
- Actual: `src/components/admin/AboutSectionManager.tsx:63-73` accepts any file (qa.txt) as the pending photo. It shows a broken preview, enables Save, and relies entirely on the backend upload to reject it.
- Evidence: `B-22-about-txt-accepted-as-photo.png`.
- Suggested correction: reuse `validateImageFile` from `src/utils/imageUpload.ts`.

**BUG-B-06 – Client image validation trusts the extension; fake and empty .jpg files reach the save step**
- Severity: Low-Medium. Priority: P3. Sections: #2, #3 (`SinglePhotoManager` / `src/utils/imageUpload.ts`).
- Actual: `fake.jpg` (20 bytes of text) and `empty.jpg` (0 bytes) pass validation and show "Save this image? (0KB)". On confirm, a replace request for the **real** asset is sent. The backend correctly rejected it with 422 (see the QA-run incident), so the backend is the only safeguard.
- Suggested correction: reject `size === 0`, and decode the image (e.g. `createImageBitmap`) before offering the save.

**BUG-B-07 – DELETE of a missing About section returns 500 instead of 404**
- Severity: Low. Priority: P4.
- Actual: `DELETE /api/admin/about-sections/qa-20261125-missing` → 500 "Failed to delete about section: About section 'qa-20261125-missing' not found". PATCH on the same key correctly returns 404, and content-records DELETE returns 404.
- Suggested correction: map the not-found error to 404 in `routers/admin_about_sections.py` delete.

**BUG-B-09 – Admin error messages hide the API detail for validation errors**
- Severity: Low. Priority: P4. Sections: #23 and every caller of `photoKeyApi.request`.
- Actual: when FastAPI returns `detail` as an array (422), `src/services/photoKeyApi.ts:61-65` shows only "Request failed with status 422".
- Suggested correction: format `detail[0].msg` when `detail` is an array.

**BUG-B-10 – Public calendar blocks are inconsistent between schools**
- Severity: Low. Priority: P4. Sections: #17, #24.
- Actual: Nursery shows filename, upload date and a Download button. Primary and HS show only a "Download Academic Calendar" link.

**BUG-B-11 – Unsaved admin edits are discarded without warning**
- Severity: Low. Priority: P4. Sections: About, Principal, Calendar.
- Actual: switching admin nav sections silently drops pending text, photo and PDF changes.

**BUG-B-12 – Content-record PUT without `payload` silently wipes the payload**
- Severity: Low. Priority: P4.
- Actual: `PUT /api/admin/content-records/{key}` with `{media:[]}` returns 200 and stores `payload: {}`, because the schema defaults to an empty dict (`backend/app/schemas/content_record.py:21`). A buggy client could erase Courses, Principal or gallery descriptions.
- Suggested correction: make `payload` required.

**BUG-B-13 – Outdated "Features not yet implemented: Photo upload and validation" notice on School Sections / Hero 3D Cards**
- Severity: Low. Same issue as the Batch A stale-notice bug. Locations: `SchoolSectionsManager.tsx:84`, `Hero3DCardsManager.tsx:66`.

**DATA-B-01 – A personal résumé is published as the Academic Calendar on all three school pages**
- Severity: High (privacy/content). Priority: P1. Requires owner confirmation.
- Evidence: admin and public calendar blocks list `Shabarish_resume.pdf` (Nursery, Primary) and `Shabarish_resume-1.pdf` (HS). All three are publicly downloadable (200 application/pdf).
- QA did not open the files' content.
- Action: the owner should replace them with real calendars, or remove them. QA did not modify them, per the data-protection rule.

**SEC-B-01 – Legacy Nursery-calendar API and a second admin login are still live in `server.mjs`**
- Severity: Medium (attack surface). Priority: P2.
- Evidence: `server.mjs:291-575` serve `/api/nursery-academic-calendar*`, `/api/admin/nursery-academic-calendar*` and a password/cookie session at `POST/GET/DELETE /api/admin/session`. This is separate from FastAPI JWT auth, and `initializeAdminPassword()` runs at startup. The only consumer, `src/components/NurseryAcademicCalendar.tsx`, is **not rendered anywhere**. `GET /api/nursery-academic-calendar` and `GET /api/admin/session` respond 200 `null`.
- Not tested: login or brute-force against this endpoint (not permitted).
- Suggested correction: remove the legacy routes and component, or put them behind the FastAPI auth.

**Handed to Batch C (Leadership):** 3 broken homepage leadership images. One media row points to a deleted Cloudinary asset (`u68uddwtsnhisjhg74n3.png` → 404). Two profiles reference media `01d4128c…`, which is a **raw PDF** (`80810 - 4 (1).pdf`), as their photo (→ 404 via `/raw/upload/…`).

**Observations (not bugs):**
- Each admin GET fires twice in development because of `<StrictMode>` (`src/main.tsx:8`).
- `POST /api/admin/about-sections` is an upsert (201 on an existing key), and the admin UI depends on that.


---

## Batch C Results – Achievers, Alumni, Sports, Academic Info, Clubs, Leadership

**Run:** 2026-11-25, Chrome 157 via Playwright MCP. Log: `QA_EVIDENCE/batch-C-log.md`. QA IDs: `QA_EVIDENCE/batch-C-qa-ids.txt`. Unauthenticated API matrix: `QA_EVIDENCE/batch-C-unauth-api.txt`. Baseline: `QA_EVIDENCE/batch-C-baseline.json`.

**Blocker (ENV-C-01):** partway through the batch the Vite client logged "server connection lost. Polling for restart…" and reloaded tab 0 to `/admin/login`. The admin token lives only in memory, so the session was lost. QA didn't trigger this. Everything after that point that needs admin access is **BLOCKED-needs-login**: the Alumni, Sports, Sports Achievements, Academic Information, Clubs and Leadership lifecycles, plus cleanup of 2 QA toppers.

**Evidence types:** **B** = real browser (Playwright), **API** = authenticated fetch from the admin page, **DB** = read-only SQLite, **CODE** = source inspection, **curl** = unauthenticated HTTP.

### Test summary (Batch C)

| Metric | Count |
|---|---:|
| Total test cases | 104 |
| Passed | 35 |
| Failed | 26 |
| Blocked | 43 |
| Not tested | 0 |
| Bugs discovered | 17 (+1 environment blocker) |

### Test cases

| ID | Section | Case | Evidence | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| C-26-01 | Achievers | Empty submit | B | Rejected, no request | Alert "Please fill in all required fields…", no request | PASS |
| C-26-02 | Achievers | Whitespace-only name/score, backend | B | 422 | 422 `string_too_short` | PASS |
| C-26-03 | Achievers | Whitespace-only error message | B | Readable message | "Failed to save topper: [object Object]" | FAIL |
| C-26-04 | Achievers | Valid Class 12 overall create, qa.jpg, name with HTML + Tamil + quotes | B | 201, record created | upload 201 (2680 ms) → POST 201, id 622d3976 | PASS |
| C-26-05 | Achievers | DB row + media FK | DB | Matches API | Matches; media joined | PASS |
| C-26-06 | Achievers | Admin render, XSS escaping | B | Escaped text, image loads | Escaped, no `<b>` element, image loaded | PASS |
| C-26-07 | Achievers | Public sync in new isolated context | B | In Class 12 block only | Class 12 block only, exact text, image loaded | PASS |
| C-26-08 | Achievers | Public reload persistence | B | Persists | Persists | PASS |
| C-26-09 | Achievers | Backend `grade_level:"13"` | API | 422 | 201 | FAIL |
| C-26-10 | Achievers | Backend `rank:99` (UI offers 1–3) | API | 422 | 201 | FAIL |
| C-26-11 | Achievers | Backend duplicate rank 1 in the same year | API | 409/422 | 201 | FAIL |
| C-26-12 | Achievers | Backend centums 3 with 0 subjects | API | 422 | 201 | FAIL |
| C-26-13 | Achievers | Backend `academic_year:"abcd<script>"` | API | 422 | 201 | FAIL |
| C-26-14 | Achievers | Backend: negative rank/centums, name >160, missing name, bad/unknown media_id | API | 422 | 422 for all | PASS |
| C-26-15 | Achievers | No auth / missing id / malformed id | API | 401 / 404 / 422 | 401 / 404 / 422 | PASS |
| C-26-16 | Achievers | UI duplicate rank | B | Rejected | Alert "A topper with Rank 1 already exists…" | PASS |
| C-26-17 | Achievers | fake.jpg (text bytes) | B | Rejected | 422 "not a valid image" | PASS |
| C-26-18 | Achievers | qa.txt | B | Rejected | 422 "Supported formats are JPG, JPEG, PNG, and WebP" | PASS |
| C-26-19 | Achievers | empty.jpg (0 bytes) | B | Rejected | 422 "The uploaded file is empty" | PASS |
| C-26-20 | Achievers | Class 10 subject-wise create with qa.png, grade mapping | B | Class 10 block only | Class 10 block only, image loaded | PASS |
| C-26-21 | Achievers | Rapid double-click on Add | B | One record | 2 toppers + 2 Cloudinary uploads | FAIL |
| C-26-22 | Achievers | Edit text + replace image (qa.webp) | B | 200, all fields updated | PATCH 500; media swapped, old asset deleted, text not saved | FAIL |
| C-26-23 | Achievers | Edit again after the failed update | B | Succeeds | 422 "Referenced image was not found" (stale media_id) | FAIL |
| C-26-24 | Achievers | Text-only edit after list refresh | B+DB | 200, persisted | 200, DB updated | PASS |
| C-26-25 | Achievers | API reproduction of image replace | API+DB | 200 | 500, but media_id persisted and old asset 404 (2/2 reproductions) | FAIL |
| C-26-26 | Achievers | WebP accepted | B | 201 | 201 | PASS |
| C-26-27 | Achievers | Reorder API (QA rows only; wrong grade) | API+DB | Reorder works; real rows unchanged | 200; wrong grade 422; real display_order unchanged | PASS |
| C-26-28 | Achievers | Reorder UI | CODE | Control present | None (`reorderToppers` never used by ToppersManager) | FAIL |
| C-26-29 | Achievers | UI delete → API, DB, media, Cloudinary | B+DB | All removed | 204; row 0, media 0, Cloudinary 404 | PASS |
| C-26-30 | Achievers | Deleted record gone from public | B | Gone | Gone | PASS |
| C-26-31 | Achievers | Delete confirm names the record | B | Names the record | Generic "Are you sure you want to delete this topper?" | FAIL |
| C-26-32 | Achievers | Legacy toppers with null rank and null subject | B+DB | Visible/manageable | Shown in neither Admin tab nor public, though published | FAIL |
| C-26-33 | Achievers | Heading matches selected grade | B | Matches | Inner tab Class 10, heading still "Class 12 Achievers" | FAIL |
| C-26-34 | Toppers public | 500 vs empty state | B (route mock) | Error state on 500 | Same "No results available yet." as empty | FAIL |
| C-26-35 | Achievers | Cleanup of remaining QA toppers | — | Removed | Session lost | BLOCKED |
| C-27-01…07 | Alumni | Create / validation / image / read / update / delete / public sync | — | — | Session lost | BLOCKED ×7 |
| C-27-08 | Alumni | Unauthenticated admin CRUD | curl | 401 | 401 ×4 | PASS |
| C-27-09 | Alumni | Public `[]` / 500 fallback | B (route mock) | No static data | Empty-state text only | PASS |
| C-28-01…06 | Sports | Lifecycle | — | — | Session lost | BLOCKED ×6 |
| C-28-07 | Sports | Edit UI | CODE | Present (inventory claimed U) | Absent; `handleSave` only called with `createForm` | FAIL |
| C-28-08 | Sports | Delete confirmation | CODE | Confirm step | Deletes immediately | FAIL |
| C-28-09/10 | Sports | Unauthenticated 401; public fallback | curl / B | 401; no static data | 401; empty state | PASS ×2 |
| C-29-01…07 | Sports Achievements | Lifecycle + backend PATCH | — | — | Session lost | BLOCKED ×7 |
| C-29-08 | Sports Achievements | Edit UI | CODE | Present | Absent (backend has PATCH) | FAIL |
| C-29-09 | Sports Achievements | Delete confirmation | CODE | Confirm step | Immediate | FAIL |
| C-29-10 | Sports Achievements | Public empty state | B | Message | Heading only, blank body | FAIL |
| C-29-11/12 | Sports Achievements | Unauthenticated 401; public fallback | curl / B | — | 401; no static data | PASS ×2 |
| C-30-01…07 | Academic Information | Lifecycle + backend PATCH | — | — | Session lost | BLOCKED ×7 |
| C-30-08 | Academic Information | Edit UI | CODE | Present | Absent (backend has PATCH) | FAIL |
| C-30-09 | Academic Information | Delete confirmation | CODE | Confirm step | Immediate | FAIL |
| C-30-10/11 | Academic Information | Unauthenticated 401; public fallback | curl / B | — | 401; no static data | PASS ×2 |
| C-31-01…06 | Clubs | Lifecycle | — | — | Session lost | BLOCKED ×6 |
| C-31-07 | Clubs | Edit UI | CODE | Present (inventory claimed U) | Absent | FAIL |
| C-31-08 | Clubs | Delete confirmation | CODE | Confirm step | Immediate | FAIL |
| C-31-09/10 | Clubs | Unauthenticated 401; public fallback | curl / B | — | 401; empty state | PASS ×2 |
| C-32-01…07 | Leadership | Lifecycle + reorder | — | — | Session lost | BLOCKED ×7 |
| C-32-08 | Leadership | Public with `[]` | B (route mock) | Empty state | Static placeholder leaders ("Name to be added") | FAIL |
| C-32-09 | Leadership | Public with 500 | B (route mock) | Error state only | "temporarily unavailable" + placeholder leaders | FAIL |
| C-32-10/11 | Leadership | Unauthenticated 401 (PATCH 405); real display_order intact | curl / DB | — | As expected | PASS ×2 |
| C-34/35-01 | Excellence / Campus Life | Same managers as #26/#27 | CODE | Same | `ExcellenceManager`→`AchieversManager`, `CampusLifeManager`→`AlumniManager` | PASS ×2 |
| C-34/35-02 | Excellence / Campus Life | Browser smoke | — | — | Session lost | BLOCKED ×2 |

### Section-wise results

| Section | Create | Read | Update | Delete | Image | API | DB | Public Sync | Status |
|---|---|---|---|---|---|---|---|---|---|
| #26 HS Achievers | FAIL (double submit) | FAIL (legacy rows hidden) | FAIL (image update 500) | PASS | FAIL (replace) | FAIL (validation gaps) | PASS | PASS | FAIL |
| #27 Alumni | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | PASS (auth only) | BLOCKED | PASS (no fallback) | BLOCKED |
| #28 Sports | BLOCKED | BLOCKED | FAIL (no UI) | BLOCKED | BLOCKED | PASS (auth only) | BLOCKED | PASS (no fallback) | FAIL / BLOCKED |
| #29 Sports Achievements | BLOCKED | BLOCKED | FAIL (no UI) | BLOCKED | BLOCKED | PASS (auth only) | BLOCKED | FAIL (no empty state) | FAIL / BLOCKED |
| #30 Academic Information | BLOCKED | BLOCKED | FAIL (no UI) | BLOCKED | BLOCKED | PASS (auth only) | BLOCKED | PASS (no fallback) | FAIL / BLOCKED |
| #31 Clubs | BLOCKED | BLOCKED | FAIL (no UI) | BLOCKED | BLOCKED | PASS (auth only) | BLOCKED | PASS (no fallback) | FAIL / BLOCKED |
| #32 Leadership | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | PASS (auth only) | PASS (order intact) | FAIL (placeholders) | FAIL / BLOCKED |
| #34 / #35 | N/A (shared) | CODE PASS | N/A | N/A | N/A | N/A | N/A | N/A | BLOCKED (browser) |

### Bug reports

**BUG-C-01 — Topper image replacement returns 500 and partially saves** · Severity **High** · Priority P1 · #26/#34
- Steps: Admin → Achievers → Edit a topper → change text and choose a new photo → Save.
- Expected: 200, with all fields and the image updated.
- Actual: `PATCH /api/admin/toppers/{id}` → **500** `"Failed to update topper: Instance '<Media at 0x…>' has been deleted. Use the make_transient()…"`. In the DB, `media_id` is switched to the new image, the old media row is deleted, the old Cloudinary asset returns 404, and the name and score are **not** saved. The user sees "failed", but the photo was changed anyway. Reproduced 2/2 (UI on 94d240ff, API on 622d3976).
- Root cause (confirmed): `update_topper` (`backend/app/services/topper_service.py:178-185`) calls `_discard_media` → `delete_media`, which commits the media swap and deletes the old asset partway through the update. The next `session.add(topper)` / commit then touches the deleted `Media` instance and raises a `SQLAlchemyError`, which the router returns as a 500 with the raw message.
- Fix: apply all field updates first, commit, then discard the old media after the commit (for example, expire or reload the relationship). Don't put exception text in the response.
- Evidence: `QA_EVIDENCE/batch-C-log.md` steps 9 and 12.

**BUG-C-02 — Double-submit creates duplicate records and uploads** · **Medium** · P2 · #26 (code: all Batch C managers)
- Steps: fill the subject-wise form and double-click "Add".
- Actual: 2× `POST /api/media/upload` 201 and 2× `POST /api/admin/toppers` 201 → duplicate rows 94d240ff / ef4a8e5a, both shown publicly. No save button in the Batch C managers has a `disabled={saving}` guard (only `isUploading` on file inputs).
- Fix: disable the submit button while a request is in flight; optionally add an idempotency check on the backend.
- Evidence: `QA_EVIDENCE/C-26-13-public-duplicate-double-submit.png`.

**BUG-C-03 — Published toppers with null rank and null subject are invisible everywhere** · **Medium** · P2 · #26
- Toppers 33dd0ef5 and e4fb24c5 (grade 12, `is_published=1`) are returned by both the admin and public APIs. Admin counts a topper as "overall" only if `rank != null` and as "subject-wise" only if `subject != null` (`ToppersManager.tsx:76-81`), so these rows appear in neither tab and the public page doesn't show them either. Nobody can view, edit or delete them through the UI.
- Fix: migrate or repair these rows, or show uncategorized rows in Admin. Also have the backend require rank or subject.

**BUG-C-04 — Leadership shows static placeholder leaders when no profiles exist (R-01 confirmed)** · **Medium** · P2 · #32
- Steps: isolated public context, with `/api/public/leadership-profiles` mocked to `[]`. That's the state after an admin deletes every leader.
- Actual: the homepage shows the placeholder cards MANAGEMENT / TRUSTEE / SCHOOL HEAD / PRINCIPAL, "Name to be added". On a 500 it shows a "temporarily unavailable" notice plus the same placeholders. This is the same class of bug as the Courses Offered fallback.
- Source: `Leadership.tsx:11-25`.
- Evidence: `QA_EVIDENCE/C-32-leadership-public-{real,empty,500}.png`.

**BUG-C-05 — Toppers backend accepts invalid data** · **Medium** · P2 · #26
- `POST /api/admin/toppers` returns 201 for `grade_level:"13"`, `rank:99`, a duplicate rank in the same year (the duplicate check is frontend-only), `centums_scored:3` with an empty `centum_subjects`, and `academic_year:"abcd<script>"`.
- Fix: restrict `grade_level` to "10"/"12" and `rank` to 1..3, add a unique constraint or check on (grade, year, rank) for overall toppers, validate centums against the subject count on create, and pattern-validate the academic year.

**BUG-C-06 — Admin list goes stale after a failed update** · **Medium** · P2 · #26
- After BUG-C-01, the list isn't re-fetched. The next edit re-sends the deleted `media_id` and gets 422 "Referenced image was not found" until the admin leaves the section and comes back.

**BUG-C-07 — Validation errors shown as "[object Object]"** · Low · #26. FastAPI's 422 `detail` arrays aren't formatted for display.

**BUG-C-08 — Sports and Clubs have no edit UI** · Low · #28/#31. The PATCH branch in `handleSave` can't be reached (`SportsManager.tsx:269`, `ClubsManager.tsx:259` only pass `createForm`). The inventory row listing "U(PATCH)" is wrong.

**BUG-C-09 — Sports Achievements and Academic Information have no edit UI** · Low · #29/#30. The backend supports PATCH.

**BUG-C-10 — No delete confirmation** · Low · #28–#31. Clicking Delete removes the record immediately (`handleDelete`, e.g. `SportsManager.tsx:149`).

**BUG-C-11 — Topper delete confirm doesn't name the record** · Low · #26. The generic native `confirm()` makes it easy to delete the wrong row.

**BUG-C-12 — No reorder control for toppers** · Low · #26. The backend `/api/admin/toppers/reorder` and `useAdminToppers.reorderToppers` exist but aren't wired into the UI.

**BUG-C-13 — Achievers UI has redundant, conflicting grade tabs** · Low · #26. The outer "SSLC / Class 10 | Higher Secondary / Class 12" tabs and the inner "Class 12 | Class 10" tabs are independent, so the heading can say Class 12 while Class 10 data is shown.

**BUG-C-14 — Public sections show "no data" on API failure; Sports Achievements has no empty state** · Low · #26–#31.

**BUG-C-15 — Admin list GETs fire twice per section open** · Low (performance) · e.g. `/api/admin/toppers?grade_level=12` ×2, `/api/admin/alumni` ×2.

**BUG-C-16 — Admin form inputs have no associated labels; nav buttons default to type=submit** · Low (accessibility).

**BUG-C-17 — Partial reorder leaves duplicate display_order values** · Low · #26. `reorder_toppers` renumbers only the IDs passed in.

**ENV-C-01 — A dev-server reconnect logs the admin out** · Blocker for QA · An in-memory token plus Vite's full page reload on reconnect meant every later admin test had to be BLOCKED.

**Process note:** the topper delete confirm doesn't name the record (BUG-C-11), so it was accepted only after the clicked row had been uniquely filtered on its QA text. The DELETE target ID was verified straight afterwards (94d240ff, a QA record).

### Cleanup status (Batch C)

| Item | State |
|---|---|
| QA toppers created | 8 (1 UI Class 12, 5 API validation, 2 from the double-submit) → 6 deleted (5 via API, 1 via UI) |
| **Left behind (published, visible on /higher-secondary)** | topper `622d3976-a1b1-4e05-86c1-03d24ff3a7fb` (QA-20261125-T12…, Class 12 overall rank 1) with media `0b4499c7-8352-423a-845f-7c7cb4f8fda5` / Cloudinary `qdwobhftblebpmir2nru`; topper `ef4a8e5a-82ac-48a9-b0d7-4071235c77da` (QA-20261125-T10, Class 10 subject-wise) with media `18c05e05-9692-44ce-bb11-1580438056a0` / Cloudinary `wgue5cbguf2swffbkipg` |
| DB vs baseline | toppers 8 (baseline 6), media 138 (baseline 136); all other Batch C tables equal baseline |
| Real data | Unchanged. Leadership and real topper `display_order` values identical to baseline |
| Cloudinary | Deleted QA assets return 404 (tambye8putabvhisz3tp, a3tyeszkkcxs9s5c5si4, ujnfsflzohkcbofey0ee); the 2 leftovers return 200 |
| Required action | After admin re-login, delete both QA toppers (Achievers → Class 12 Overall, and Class 10 Subject-wise rows containing "QA-20261125-"). Deleting them removes their media and Cloudinary assets as well |
