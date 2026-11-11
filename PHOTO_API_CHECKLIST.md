# Photo API Layer - Implementation Checklist

## Core Files Created

### Service Layer
- [x] `src/services/photoAdminApi.ts` (7.0K)
  - API client for all photo operations
  - Methods for upload, delete, assign, reorder
  - Auth header injection via adminApi.ts token
  - Error handling for 401/403

### Hooks
- [x] `src/hooks/useAdminPhotos.ts` (7.6K)
  - State management for photos
  - Optimistic updates with rollback
  - Auto-retry on upload failure (3 retries)
  - Loading states and error handling
  
- [x] `src/hooks/useAdminPhotoConfig.ts` (4.1K)
  - Transforms backend photos into PhotoConfig structure
  - Organizes photos by config_key for display
  - Memoized for performance

### UI Components
- [x] `src/components/admin/UploadPhotoDialog.tsx` (8.4K)
  - Drag-drop file input
  - File validation (type, size)
  - Alt text input with counter
  - Preview image
  - Loading and error states

### Utilities
- [x] `src/utils/photoValidation.ts` (2.5K)
  - File format validation
  - Alt text validation
  - File size formatting
  - Accepted file types helper

### Examples & Docs
- [x] `src/components/admin/HomeHeroManager.tsx` (Updated)
  - Demonstrates full integration pattern
  - Uses new hooks and dialog
  - Error handling shown
  
- [x] `PHOTO_API_INTEGRATION_GUIDE.md`
  - Step-by-step integration for all managers
  - Config keys for each manager
  - Testing checklist

- [x] `LEADERSHIP_PHOTOS_EXAMPLE.md`
  - Shows how to handle mixed photo + text managers
  - Demonstrates dual hook usage
  - Migration strategy

- [x] `src/components/admin/PHOTO_API_README.md`
  - Architecture overview
  - Data flow diagrams
  - Error scenarios
  - Security notes

## API Endpoints Used

### Media Management
- [x] POST /api/media/upload → uploadPhoto()
- [x] PUT /api/media/{id} → replacePhoto()
- [x] DELETE /api/media/{id} → deletePhoto()

### Photo Configuration
- [x] POST /api/admin/photos/assign → assignPhotoToConfig()
- [x] DELETE /api/admin/photos/{id} → removePhotoFromConfig()
- [x] POST /api/admin/photos/reorder-batch → reorderPhotosInKey()
- [x] GET /api/admin/photos → listPhotos()
- [x] GET /api/admin/photos?config_key={key} → getPhotosByConfigKey()

## Features Implemented

### Upload
- [x] File validation (type, size)
- [x] Alt text validation (required, max 500 chars)
- [x] Preview generation
- [x] Drag-drop support
- [x] Optimistic UI update
- [x] Retry logic (3 attempts, 1s delay)
- [x] Error handling and rollback
- [x] Loading indication

### Delete
- [x] Confirm deletion (2-tap UI)
- [x] Remove from config
- [x] Delete media
- [x] Optimistic update with rollback
- [x] Error handling

### Reorder
- [x] Drag-to-reorder (existing PhotoGridManager)
- [x] Optimistic reorder in UI
- [x] Backend update via reorder-batch
- [x] Error rollback

### Display
- [x] Organize photos by config_key
- [x] Convert to PhotoMetadata format
- [x] Maintain sort order (display_order)

## Integration Ready

Photo managers ready to be updated (in priority order):

1. [x] HomeHeroManager - COMPLETED (example)
2. [ ] LeadershipPhotosManager - (see LEADERSHIP_PHOTOS_EXAMPLE.md)
3. [ ] PhotoGridManager - (generic - many use cases)
4. [ ] CampusLifeManager - (multiple keys)
5. [ ] PrimaryAboutManager - (single photo)
6. [ ] PrimaryClassesGalleryManager - (gallery)
7. [ ] SchoolPageHeroManager - (multiple sections)
8. [ ] SchoolSectionPhotosManager - (multiple sections)
9. [ ] SinglePhotoManager - (generic single photo)
10. [ ] ExcellenceManager - (section-specific)
11. [ ] Hero3DCardsManager - (card images)

## Compatibility

- [x] Works with existing PhotoMetadata interface
- [x] Works with existing PhotoGridManager component
- [x] Preserves PhotoConfig structure
- [x] No changes to public website endpoints
- [x] Uses existing auth via adminApi.ts
- [x] No localStorage for admin photos
- [x] Can coexist with old managers during migration

## Testing Checklist for Integration

For each manager being updated:

- [ ] Upload dialog opens
- [ ] File selection works (click and drag-drop)
- [ ] File validation works (reject large, wrong format)
- [ ] Alt text field present and works
- [ ] Preview displays correctly
- [ ] Upload button enabled only when file + alt text present
- [ ] Upload shows loading state
- [ ] Photo appears in manager after upload
- [ ] Delete works (confirm twice)
- [ ] Reorder works (drag between photos)
- [ ] Error messages display at top of manager
- [ ] Changes persist after page refresh
- [ ] Works on slow network (loading visible)
- [ ] Handles offline gracefully (error shown)

## Performance Targets

- Upload completes within 5 seconds (typical 5MB file)
- Retry logic handles transient failures
- Optimistic updates provide instant feedback
- Photo list loads in <1 second
- No memory leaks on component unmount

## Security Checklist

- [x] Auth token included in all requests
- [x] 401/403 handled (clear token, re-login)
- [x] File type validation (client + server)
- [x] File size limit enforced (5MB)
- [x] FormData used for file uploads (not base64)
- [x] No sensitive data in localStorage
- [x] Bearer token in Authorization header
- [x] HTTPS recommended for production

## Documentation

- [x] Service layer documented with JSDoc
- [x] Hook return types typed
- [x] Component props documented
- [x] Integration guide provided
- [x] Example managers shown
- [x] Error scenarios documented
- [x] Security notes included
- [x] Config keys listed

## Migration Path

1. Update managers one-by-one (no blocking dependencies)
2. Old and new managers can coexist
3. No database migrations needed
4. Backend endpoints already available
5. Public website unaffected
6. Can rollback any manager independently

## Next Steps for Integration

1. Choose first manager to update (HomeHeroManager is done)
2. Follow pattern from HomeHeroManager or LEADERSHIP_PHOTOS_EXAMPLE
3. Test all operations (upload, delete, reorder)
4. Check persists after page refresh
5. Repeat for other managers

## Known Limitations

- Config keys must be exact match to backend
- Photo ordering uses display_order field (0-indexed)
- Max file size: 5MB (configurable in utils/photoValidation.ts)
- Alt text max length: 500 chars (configurable)
- No batch delete (one at a time)
- No image compression (handled by backend)

## Success Criteria

All working when:
- All 11 photo managers using new API
- All photos persist in backend database
- Zero localStorage usage for admin photos
- Public website display unchanged
- Error handling working for all scenarios
- Performance acceptable on typical network

Last updated: 2026-11-12
