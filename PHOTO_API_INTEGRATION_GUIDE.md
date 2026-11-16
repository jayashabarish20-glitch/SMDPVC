# Photo API Layer Integration Guide

## Overview

This guide walks through integrating the new photo API layer into existing photo managers.

## Files Created

1. `src/services/photoAdminApi.ts` - API client for all photo operations
2. `src/hooks/useAdminPhotos.ts` - Hook for managing photos with optimistic updates
3. `src/hooks/useAdminPhotoConfig.ts` - Hook for organizing photos by config_key
4. `src/utils/photoValidation.ts` - Validation utilities for photos
5. `src/components/admin/UploadPhotoDialog.tsx` - Reusable upload dialog component

## Integration Steps

### Step 1: Replace Hook Usage

**Before (localStorage):**
```typescript
const { config, addPhoto, removePhoto, reorderPhotos } = usePhotoConfig();
```

**After (Backend API):**
```typescript
const { uploadAndAssign, deletePhoto, reorderPhotos, loading, error, clearError } = useAdminPhotos();
const photoConfig = useAdminPhotoConfig();
```

### Step 2: Update Photo Manager Structure

Each manager needs:

1. State for upload dialog:
```typescript
const [isUploadOpen, setIsUploadOpen] = useState(false);
```

2. Error handling:
```typescript
{error && (
  <div className="...error styles...">
    <p>{error}</p>
    <button onClick={clearError}>Dismiss</button>
  </div>
)}
```

3. Upload dialog:
```typescript
<UploadPhotoDialog
  title="Upload [Section] Image"
  isOpen={isUploadOpen}
  isLoading={loading}
  onUpload={handleUploadPhoto}
  onClose={() => setIsUploadOpen(false)}
  errorMessage={error}
  onClearError={clearError}
/>
```

### Step 3: Implement Handler Functions

#### Upload Handler
```typescript
const handleUploadPhoto = async (file: File, altText: string) => {
  try {
    const displayOrder = heroPhotos.length;
    await uploadAndAssign(file, CONFIG_KEY, displayOrder, altText);
    setIsUploadOpen(false);
  } catch (err) {
    console.error('Upload failed:', err);
  }
};
```

#### Delete Handler
```typescript
const handleRemovePhoto = async (id: string) => {
  try {
    await deletePhoto(id);
  } catch (err) {
    console.error('Delete failed:', err);
  }
};
```

#### Reorder Handler
```typescript
const handleReorderPhotos = async (reorderedPhotos: PhotoMetadata[]) => {
  try {
    const mediaIds = reorderedPhotos.map((p) => p.id);
    await reorderPhotos(CONFIG_KEY, mediaIds);
  } catch (err) {
    console.error('Reorder failed:', err);
  }
};
```

### Step 4: Update PhotoGridManager Props

The `onAddPhoto` callback should now open the upload dialog:

```typescript
<PhotoGridManager
  title="Hero Carousel Images"
  photos={heroPhotos}
  onAddPhoto={() => setIsUploadOpen(true)}
  onRemovePhoto={handleRemovePhoto}
  onReorderPhotos={handleReorderPhotos}
  emptyMessage="No hero images added yet. Upload images to create the carousel."
  maxPhotos={undefined}
  sectionId="home-hero"
/>
```

## Config Keys

Each photo manager has a specific `CONFIG_KEY`:

| Manager | Config Key |
|---------|-----------|
| HomeHeroManager | `campusImages.hero` |
| LeadershipPhotosManager | `leadershipPhotos.management`, `leadershipPhotos.trustee`, `leadershipPhotos.principal` |
| PhotoGridManager | Based on section |
| CampusLifeManager | Various (alumni, toppers, sports, location) |
| PrimaryAboutManager | `primaryAbout.photo` |
| PrimaryClassesGalleryManager | `primaryClassesGallery.photos` |
| SchoolPageHeroManager | `schoolPageHeroes.nursery/primary/higherSecondary` |
| SchoolSectionPhotosManager | `schoolSectionPhotos.nursery/primary/higherSecondary` |
| SinglePhotoManager | Various single photo keys |
| ExcellenceManager | Specific excellence section |
| Hero3DCardsManager | Specific card images |

## Photo Manager to Update

Update these files in `src/components/admin/`:

1. LeadershipPhotosManager.tsx
2. CampusLifeManager.tsx
3. PrimaryAboutManager.tsx
4. PrimaryClassesGalleryManager.tsx
5. SchoolPageHeroManager.tsx
6. SchoolSectionPhotosManager.tsx
7. SinglePhotoManager.tsx
8. ExcellenceManager.tsx
9. Hero3DCardsManager.tsx

Each follows the same pattern as HomeHeroManager.tsx.

## API Behavior

### Upload & Assign
- Optimistic UI update before API call
- Shows temporary preview while uploading
- On success: replaces temp ID with real media ID
- On error: rolls back to previous state, shows error message

### Delete
- Removes photo from config
- Deletes media from library
- Optimistic update with rollback on error

### Reorder
- Optimistic reorder in UI immediately
- Updates display_order on backend
- Rollback if API fails

## Error Handling

All hooks handle errors gracefully:
- Authentication errors (401/403) trigger re-login
- Network errors show user-friendly messages
- Validation errors caught and displayed
- Previous state restored on failure

## Loading States

Components receive `loading` prop to show:
- Upload progress indication
- Disabled buttons during operations
- Spinner on dialog button

## Types

Main types to use:

```typescript
import { useAdminPhotos, type AdminPhoto } from '../../hooks/useAdminPhotos';
import { useAdminPhotoConfig, type AdminPhotoConfig } from '../../hooks/useAdminPhotoConfig';
import type { PhotoMetadata } from '../../data/photoService';
```

## Testing

After updating a manager:

1. Check that upload button opens dialog
2. Upload an image with alt text
3. Verify it appears in the manager
4. Reorder the photo
5. Delete the photo
6. Check that changes persist (refresh page)
7. Verify error messages display correctly

## No Changes Needed

- Public website photo display (uses existing /api/public/photos endpoint)
- AdminPanel structure
- Database or backend endpoints
- PhotoMetadata interface (compatible with both old and new)

## Rollout

Can be rolled out manager-by-manager as they're updated, with no impact on other parts of the system.
