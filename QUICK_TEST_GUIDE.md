# Quick Test Guide - Admin Photo Upload

## 🚀 Start the Dev Server

```bash
cd C:\Users\acer\Downloads\SMDPVC
npm run dev
```

Dev server starts at `http://localhost:5173`

---

## 📋 Test Checklist

### Test 1: Upload Hero Image (Homepage)
- [ ] Navigate to: `http://localhost:5173/admin/photos`
- [ ] Click "Home Page Hero Carousel" section
- [ ] Click "Add Photo" button
- [ ] Select a JPG/PNG/WebP from your computer (< 5MB)
- [ ] Verify preview appears
- [ ] Click OK to confirm upload
- [ ] Image disappears from dialog (saved to localStorage)
- [ ] Image remains in grid when you scroll
- [ ] Refresh the page - image still there

**Verify on User Panel**:
- [ ] Navigate to `http://localhost:5173/` (home page)
- [ ] Look at hero section at the top
- [ ] Your uploaded image should be rotating in the background
- [ ] Refresh page - image persists

---

### Test 2: Upload Leadership Photo
- [ ] Go to Admin Panel: `/admin/photos`
- [ ] Click "Leadership Profiles" section
- [ ] Click "Choose Photo" on "School Head / Principal Profile"
- [ ] Select a photo from your computer
- [ ] Click OK to save
- [ ] Image appears in the preview area

**Verify on User Panel**:
- [ ] Go to home page: `http://localhost:5173/`
- [ ] Scroll down to "Meet Our School Leaders" section
- [ ] The principal card should show your uploaded image
- [ ] Refresh - image persists

---

### Test 3: Upload School Section Card Image
- [ ] Go to Admin Panel: `/admin/photos`
- [ ] Click "School Sections Cards" section
- [ ] Upload image for "Primary Section Card"
- [ ] Save

**Verify on User Panel**:
- [ ] Home page: `http://localhost:5173/`
- [ ] Scroll to "Find Your Learning Stage" section
- [ ] Primary card should show your image
- [ ] Refresh - persists

---

### Test 4: Error Handling
- [ ] Try uploading a **GIF** → Should show error: "Invalid file type"
- [ ] Try uploading a **20MB file** → Should show error: "File is too large"
- [ ] Try uploading a **text file** → Should show error: "Invalid file type"

---

### Test 5: Persistence Across Sessions
- [ ] Upload an image to Hero Carousel
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Navigate to `http://localhost:5173/` (home page)
- [ ] **✅ Image still there!** (stored in localStorage)

---

### Test 6: Verify Storage
- [ ] Open browser DevTools (F12)
- [ ] Go to Application tab → Local Storage
- [ ] Find key: `smdpvc_photo_config_v1`
- [ ] Expand it
- [ ] See JSON with your images as base64 `"dataUrl"` values
- [ ] Confirm the data structure

---

## 🔍 Debugging Tips

### Check Browser Console
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Upload an image
- [ ] Should see NO errors
- [ ] Should see upload success

### Check localStorage
```javascript
// In browser console:
localStorage.getItem('smdpvc_photo_config_v1') |> JSON.parse(...)
// Should show your image metadata
```

### Check Network Tab
- [ ] F12 → Network tab
- [ ] Upload image
- [ ] Should see NO network requests (everything local)
- [ ] Image NOT sent to any server (good for dev!)

### Clear All Data (Reset)
```javascript
// In browser console:
localStorage.removeItem('smdpvc_photo_config_v1')
location.reload()
// All admin photos will be gone, back to empty state
```

---

## 📊 File Specs

### Supported Formats
- ✅ JPG / JPEG
- ✅ PNG
- ✅ WebP

### File Size Limits
- Max: **5 MB per image**
- Min: No minimum

### Browser Storage Limit
- localStorage: **5-10 MB total**
- Can store ~5-10 medium quality images
- For production: Need backend storage

---

## ⚠️ Important Notes

1. **Data is NOT sent to any server** (stored only in your browser)
2. **Different browsers = different storage** (data doesn't sync)
3. **Private/Incognito mode** clears on close
4. **Images stored as base64** (larger than original files)

---

## ✅ Success Indicators

When everything works correctly:
- ✅ File picker opens when clicking upload
- ✅ Preview shows before saving
- ✅ No errors in console
- ✅ Image appears on user panel after upload
- ✅ Image persists after page refresh
- ✅ localStorage shows the base64 data
- ✅ Validation rejects bad files
- ✅ Clear success/error messages shown

---

## 📞 Troubleshooting

### Upload button doesn't work
- [ ] Check browser console (F12) for errors
- [ ] Try a different image format
- [ ] Try a smaller file (<1MB)

### Image doesn't appear on homepage
- [ ] Refresh page
- [ ] Check if image was actually saved (look in localStorage)
- [ ] Check browser console for errors
- [ ] Try uploading to a different section

### Changes lost on refresh
- [ ] Check localStorage hasn't been cleared
- [ ] Clear browser cache and try again
- [ ] Check browser console for errors

### Storage full
- [ ] Clear localStorage: `localStorage.clear()` in console
- [ ] Upload smaller/fewer images
- [ ] For production: move to backend storage

---

## 🎯 Next Phase (Future Work)

When ready for production:
1. Replace localStorage with backend API
2. Add image compression on upload
3. Add authentication/authorization
4. Implement proper file storage (S3, Cloudinary)
5. Add image optimization

For now: **Focus on testing the local upload functionality!**

---

Happy testing! 🚀
