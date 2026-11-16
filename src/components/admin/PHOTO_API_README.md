# Photo API Layer - Architecture & Implementation

## Quick Start

### For Photo Managers
See `PHOTO_API_INTEGRATION_GUIDE.md` for step-by-step integration instructions.

### For API Calls
```typescript
import { photoAdminApi } from "../services/photoAdminApi";

// Upload a photo
const media = await photoAdminApi.uploadPhoto(file, "Alt text");

// Assign to config
const assigned = await photoAdminApi.assignPhotoToConfig(
  media.id,
  "campusImages.hero",
  0  // displayOrder
);

// List all photos
const response = await photoAdminApi.listPhotos();

// Reorder photos
await photoAdminApi.reorderPhotosInKey("campusImages.hero", [id1, id2, id3]);

// Delete photo
await photoAdminApi.deletePhoto(media.id);
```

### For Admin UI
```typescript
import { useAdminPhotos } from "../hooks/useAdminPhotos";
import { useAdminPhotoConfig } from "../hooks/useAdminPhotoConfig";

const Component = () => {
  const { uploadAndAssign, deletePhoto, reorderPhotos, loading, error } = useAdminPhotos();
  const photoConfig = useAdminPhotoConfig();

  return (
    <div>
      {photoConfig.campusImages.hero.map(photo => (
        <img key={photo.id} src={photo.imageUrl} alt={photo.alt} />
      ))}
    </div>
  );
};
```

## Architecture

### Service Layer: `photoAdminApi.ts`

Thin wrapper around backend API endpoints. Handles:
- Authentication header injection (via adminApi.ts token)
- Error handling and 401/403 detection
- FormData for file uploads
- Typed responses

**Key Methods:**
- `uploadPhoto(file, altText)` - POST /api/media/upload
- `replacePhoto(mediaId, file, altText)` - PUT /api/media/{id}
- `deletePhoto(mediaId)` - DELETE /api/media/{id}
- `assignPhotoToConfig(mediaId, configKey, displayOrder)` - POST /api/admin/photos/assign
- `removePhotoFromConfig(photoConfigId)` - DELETE /api/admin/photos/{id}
- `reorderPhotosInKey(configKey, mediaIds)` - POST /api/admin/photos/reorder-batch
- `listPhotos()` - GET /api/admin/photos
- `getPhotosByConfigKey(key)` - GET /api/admin/photos?config_key={key}

### State Management: `useAdminPhotos.ts`

React hook managing complete photo lifecycle. Handles:
- Fetching photos on mount
- Optimistic UI updates (show immediately, rollback on error)
- Auto-refresh after operations
- Error tracking and display
- Loading states
- Retry logic for failed uploads (max 3 retries)

**Return Object:**
```typescript
{
  photos: AdminPhoto[],
  loading: boolean,
  error: string | null,
  uploadAndAssign: (file, configKey, displayOrder, altText?) => Promise<void>,
  replacePhoto: (mediaId, file, altText?) => Promise<void>,
  deletePhoto: (mediaId) => Promise<void>,
  reorderPhotos: (configKey, mediaIds) => Promise<void>,
  refreshPhotos: () => Promise<void>,
  clearError: () => void,
  getPhotosByConfigKey: (configKey) => AdminPhoto[]
}
```

### Config Organization: `useAdminPhotoConfig.ts`

Transforms flat backend photo list into the PhotoConfig structure used by managers.

**Input:** Array of AdminPhoto objects from API
**Output:** Nested PhotoConfig object organized by section

```typescript
{
  campusImages: {
    hero: PhotoMetadata[],
    sports: PhotoMetadata | null,
    principal: PhotoMetadata | null,
    location: PhotoMetadata | null,
    alumni: PhotoMetadata[],
    toppers12: PhotoMetadata[]
  },
  leadershipPhotos: { ... },
  schoolSectionPhotos: { ... },
  schoolPageHeroes: { ... },
  primaryClassesGallery: { ... },
  primaryAbout: { ... }
}
```

### UI Components: `UploadPhotoDialog.tsx`

Reusable modal dialog for uploading photos. Features:
- Drag-and-drop file input
- File validation (type, size, alt text)
- Preview image
- Alt text input with character counter
- Loading indication
- Error messages
- Cancel/Upload buttons

**Props:**
```typescript
interface UploadPhotoDialogProps {
  title?: string;
  isOpen: boolean;
  isLoading: boolean;
  onUpload: (file: File, altText: string) => Promise<void>;
  onClose: () => void;
  errorMessage?: string;
  onClearError?: () => void;
}
```

### Validation: `photoValidation.ts`

Helper functions for validating files and metadata:
- `validateImageFile(file)` - Check format and size
- `validateAltText(text)` - Check required, length
- `validatePhotoUpload(file, altText)` - Combined validation
- `formatFileSize(bytes)` - Human-readable size
- `getAllowedFileTypesString()` - For file input accept attribute

## Data Flow

### Upload & Assign
```
User clicks upload
  ↓
Opens UploadPhotoDialog
  ↓
User selects file + enters alt text
  ↓
Validates file (type, size, alt text)
  ↓
Shows preview
  ↓
User clicks "Upload Photo"
  ↓
uploadAndAssign() called with (file, configKey, displayOrder, altText)
  ↓
Optimistic update: adds temp photo to UI immediately
  ↓
API: uploadPhoto() → POST /api/media/upload → {id, image_url, ...}
  ↓
Retry if failed (up to 3 times, 1s delay)
  ↓
API: assignPhotoToConfig() → POST /api/admin/photos/assign → {id, media_id, ...}
  ↓
Replace temp photo with actual response
  ↓
Close dialog, refresh manager display
```

### Delete
```
User clicks delete on photo
  ↓
Confirm click (2-tap delete UI in PhotoGridManager)
  ↓
deletePhoto(mediaId) called
  ↓
Optimistic update: removes from UI
  ↓
API: removePhotoFromConfig(configId) → DELETE
  ↓
API: deletePhoto(mediaId) → DELETE
  ↓
On error: restore previous state, show error
```

### Reorder
```
User drags photo to new position
  ↓
reorderPhotos(configKey, [id1, id2, id3]) called
  ↓
Optimistic update: reorder in UI immediately
  ↓
API: reorderPhotosInKey() → POST /api/admin/photos/reorder-batch
  ↓
On error: restore previous order, show error
```

## Integration with Existing Code

### Compatibility
- `PhotoMetadata` interface unchanged
- `PhotoGridManager` component works with new hooks
- `PhotoConfig` structure mirrors backend organization
- No changes to public website endpoints

### Gradual Migration
Photo managers can be updated one-by-one:
1. HomeHeroManager (done)
2. Others can be updated independently
3. Old localStorage-based managers can coexist during transition

### Error Handling
All API errors flow to `useAdminPhotos`:
- 401/403 → "Unauthorized - please log in again"
- Network errors → Displayed to user
- Validation errors → Caught before API call
- Optimistic updates → Automatically rolled back on error

## Performance Considerations

### Optimistic Updates
- Photos appear immediately in UI
- Network latency invisible to user
- Automatic rollback if API fails
- No "ghost" photos if connection drops

### Retry Logic
- Failed uploads retry up to 3 times
- 1 second delay between retries
- Total worst-case: 3 seconds for 3 failed attempts
- User can manually retry if all attempts fail

### Caching
- Full photo list loaded once on component mount
- Incremental updates as photos are added/deleted/reordered
- `refreshPhotos()` available for manual refresh

### Memory
- Photos stored in React state (not localStorage)
- Optimistic updates use refs for previous state
- No memory leaks on unmount

## Error Scenarios

### User Not Authenticated
- 401 response triggers "Unauthorized - please log in again"
- User redirected to login
- Token cleared automatically

### File Too Large
- Caught by validation before upload
- User sees: "File is too large. Maximum size is 5MB..."

### Invalid Alt Text
- Validation checks: required, max 500 chars
- Dialog prevents submit if alt text invalid

### Network Failure During Upload
- Auto-retry up to 3 times
- If all fail, error displayed: "Failed to upload photo"
- Optimistic update rolled back
- User can retry manually

### Reorder Fails
- Order stays as user dragged it (optimistic)
- Error shown at top of manager
- User can try again or refresh

## Testing Checklist

For each photo manager:

- [ ] Upload button opens dialog
- [ ] Can select file by clicking
- [ ] Can drag-drop file
- [ ] File validation works (reject oversized, wrong format)
- [ ] Alt text field shown and works
- [ ] Preview shows uploaded image
- [ ] Upload button disabled until alt text entered
- [ ] Upload shows loading state
- [ ] Photo appears after upload
- [ ] Error messages display correctly
- [ ] Can delete photos (2-tap)
- [ ] Can drag-reorder photos
- [ ] Changes persist after page refresh
- [ ] Works offline (graceful error handling)
- [ ] Works with slow network (loading states visible)

## Security Notes

- Auth token included in all requests (via adminApi.ts)
- FormData used for file uploads (not base64)
- File type validation both client and server
- File size limit: 5MB
- All API endpoints require admin authentication
- No sensitive data stored in localStorage
- CSRF protection: bearer token in Authorization header
