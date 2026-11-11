# Example: Updating LeadershipPhotosManager

This document shows how to update a more complex photo manager that combines photos with text fields.

## Current Structure

LeadershipPhotosManager manages 3 leadership profiles:
- Management
- Trustee
- Principal

Each has:
- A photo (PhotoMetadata)
- Text fields (name, designation, shortBio, message)

## Integration Pattern

### 1. Replace Imports

**Before:**
```typescript
import { usePhotoConfig } from "../../hooks/usePhotoConfig";
import { handleFileInput } from "../../utils/imageUpload";
```

**After:**
```typescript
import { useAdminPhotos } from "../../hooks/useAdminPhotos";
import { useAdminPhotoConfig } from "../../hooks/useAdminPhotoConfig";
import { UploadPhotoDialog } from "./UploadPhotoDialog";
```

### 2. Update Component State

Add state for managing which profile''s upload dialog is open:

```typescript
const [uploadingProfile, setUploadingProfile] = useState<ProfileKey | null>(null);
```

### 3. Add Hooks

```typescript
const { uploadAndAssign, deletePhoto, loading, error, clearError } = useAdminPhotos();
const photoConfig = useAdminPhotoConfig();
```

### 4. Create Upload Handler

```typescript
const handleUploadLeadershipPhoto = async (
  profileKey: ProfileKey,
  file: File,
  altText: string
) => {
  try {
    const configKey = `leadershipPhotos.${profileKey}`;
    await uploadAndAssign(file, configKey, 0, altText);
    setUploadingProfile(null);
  } catch (err) {
    console.error("Upload failed:", err);
  }
};
```

### 5. Create Delete Handler

```typescript
const handleDeleteLeadershipPhoto = async (profileKey: ProfileKey) => {
  try {
    const photo = photoConfig.leadershipPhotos.profiles[profileKey].photo;
    if (photo?.id) {
      await deletePhoto(photo.id);
    }
  } catch (err) {
    console.error("Delete failed:", err);
  }
};
```

### 6. Update Profile Card Photo Section

In the profile card rendering:

**Before:**
```typescript
{/* Photo Upload Section */}
<div>
  <input
    ref={fileInputRef}
    type="file"
    accept=".jpg,.jpeg,.png,.webp"
    onChange={(e) => handleFileChange(e, profileKey)}
  />
  <button onClick={() => fileInputRef.current?.click()}>
    Upload Photo
  </button>
</div>

{/* Show current photo */}
{photo && <img src={photo.dataUrl} alt="" />}
```

**After:**
```typescript
{/* Photo Display and Upload */}
<div className="relative">
  {photo?.imageUrl && (
    <img
      src={photo.imageUrl}
      alt={photo.alt}
      className="w-full rounded-lg"
    />
  )}
  
  <button
    onClick={() => setUploadingProfile(profileKey)}
    className="mt-4 flex items-center gap-2 rounded-lg bg-school-gold px-4 py-2 text-sm font-medium text-school-navy"
  >
    <Icon name="upload" className="h-4 w-4" />
    {photo ? "Change Photo" : "Upload Photo"}
  </button>
  
  {photo && (
    <button
      onClick={() => handleDeleteLeadershipPhoto(profileKey)}
      className="mt-2 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-red-600"
    >
      <Icon name="trash" className="h-4 w-4" />
      Delete Photo
    </button>
  )}
</div>
```

### 7. Add Upload Dialogs

Add a dialog for each profile or a single reusable dialog:

```typescript
{/* Upload dialogs - one per profile or single with profile context */}
{[''management'', ''trustee'', ''principal''].map((profile) => (
  <UploadPhotoDialog
    key={profile}
    title={`Upload ${profile.charAt(0).toUpperCase() + profile.slice(1)} Photo`}
    isOpen={uploadingProfile === profile}
    isLoading={loading}
    onUpload={(file, altText) =>
      handleUploadLeadershipPhoto(profile as ProfileKey, file, altText)
    }
    onClose={() => setUploadingProfile(null)}
    errorMessage={error}
    onClearError={clearError}
  />
))}
```

### 8. Update Photo Config Access

In the render section where photos are displayed:

```typescript
const managementPhoto = photoConfig.leadershipPhotos.profiles.management.photo;
const trusteePhoto = photoConfig.leadershipPhotos.profiles.trustee.photo;
const principalPhoto = photoConfig.leadershipPhotos.profiles.principal.photo;

// Use these when rendering profile cards
<ProfileCard
  profileKey="management"
  photo={managementPhoto}
  onUploadClick={() => setUploadingProfile(''management'')}
  onDeletePhoto={() => handleDeleteLeadershipPhoto(''management'')}
/>
```

## Text Field Handling

Text fields (name, designation, shortBio, message) continue using the existing pattern:

```typescript
// Photo handling (NEW - uses API)
const photo = photoConfig.leadershipPhotos.profiles[profileKey].photo;

// Text handling (EXISTING - still uses usePhotoConfig for text)
const { updateLeadershipProfile } = usePhotoConfig();

const handleTextChange = (key: ProfileKey, field: string, value: string) => {
  updateLeadershipProfile(key, {
    [field]: value,
    // Note: if you have a photo field in the LeadershipProfileData, 
    // you could update it too, but photo updates now go through uploadAndAssign
  });
};
```

## Migration Strategy

Since LeadershipPhotosManager mixes photos and text:

1. Phase 1: Add upload dialog and photo API calls
   - Photos now go through API
   - Text still uses localStorage (usePhotoConfig)
   - Both update independently

2. Phase 2 (optional): Fully migrate to backend
   - Move text field updates to API as well
   - Requires backend endpoint for updating profile text
   - Can be done separately from photo API

## Full Component Structure

```typescript
export function LeadershipPhotosManager() {
  const [uploadingProfile, setUploadingProfile] = useState<ProfileKey | null>(null);

  // Photo management (API)
  const { uploadAndAssign, deletePhoto, loading, error, clearError } = useAdminPhotos();
  const photoConfig = useAdminPhotoConfig();

  // Text management (existing localStorage)
  const { config, updateLeadershipProfile } = usePhotoConfig();

  const handleUploadLeadershipPhoto = async (
    profileKey: ProfileKey,
    file: File,
    altText: string
  ) => {
    try {
      const configKey = `leadershipPhotos.${profileKey}`;
      await uploadAndAssign(file, configKey, 0, altText);
      setUploadingProfile(null);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleDeleteLeadershipPhoto = async (profileKey: ProfileKey) => {
    try {
      const photo = photoConfig.leadershipPhotos.profiles[profileKey].photo;
      if (photo?.id) {
        await deletePhoto(photo.id);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleProfileTextChange = (
    profileKey: ProfileKey,
    field: string,
    value: string
  ) => {
    updateLeadershipProfile(profileKey, { [field]: value });
  };

  return (
    <div>
      <SectionHeader {...headerProps} />

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={clearError} className="text-xs text-red-600 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile cards */}
      {[''management'', ''trustee'', ''principal''].map((profile) => {
        const profileKey = profile as ProfileKey;
        const photo = photoConfig.leadershipPhotos.profiles[profileKey].photo;
        const profileData = config.leadershipPhotos.profiles[profileKey];

        return (
          <div key={profile}>
            {/* Photo section with new upload dialog */}
            <div>
              {photo?.imageUrl && (
                <img src={photo.imageUrl} alt={photo.alt} />
              )}
              <button onClick={() => setUploadingProfile(profileKey)}>
                {photo ? "Change" : "Upload"} Photo
              </button>
            </div>

            {/* Text fields section (existing pattern) */}
            <input
              value={profileData.name}
              onChange={(e) =>
                handleProfileTextChange(profileKey, ''name'', e.target.value)
              }
            />
            {/* ... other text fields ... */}
          </div>
        );
      })}

      {/* Upload dialogs */}
      {[''management'', ''trustee'', ''principal''].map((profile) => (
        <UploadPhotoDialog
          key={`upload-${profile}`}
          title={`Upload ${profile} Photo`}
          isOpen={uploadingProfile === profile}
          isLoading={loading}
          onUpload={(file, altText) =>
            handleUploadLeadershipPhoto(profile as ProfileKey, file, altText)
          }
          onClose={() => setUploadingProfile(null)}
          errorMessage={error}
          onClearError={clearError}
        />
      ))}
    </div>
  );
}
```

## Key Takeaways

1. Photos now use API (useAdminPhotos)
2. Text still uses localStorage (usePhotoConfig) unless backend endpoint added
3. Both can coexist during migration
4. Dialog opens per-profile
5. Loading/error states shared across all profiles
6. No breaking changes to existing text field handling
