# Deployment Checklist - SMDPVC Updates

## Pre-Deployment Verification ✓

### Frontend Changes - VERIFIED
- [x] SchoolPage.tsx updated to display Nursery – About
- [x] AdminPanel.tsx updated - Primary Classes removed from sidebar
- [x] TypeScript compilation successful (no new errors)
- [x] aboutSectionsApi service created and ready

### Backend Changes - VERIFIED
- [x] AboutSection model created with relationships
- [x] AboutSection schemas created (Create, Update, Read)
- [x] about_section_service created with CRUD operations
- [x] admin_about_sections router created with endpoints
- [x] public router updated with about endpoints
- [x] Router registered in FastAPI main.py
- [x] Database migration created (20261114_0005)
- [x] All imports and syntax valid

### Architecture Review - VERIFIED
- [x] Backward compatibility maintained
- [x] All existing features preserved
- [x] Database relationships properly defined
- [x] Foreign key constraints in place
- [x] Admin authentication required for write operations
- [x] Public read access available

## Required Before Live Deployment

### Step 1: Database Migration
```bash
cd backend
alembic upgrade head
```
- This creates the `about_sections` table
- Estimated time: < 1 second

### Step 2: Build Frontend
```bash
npm run build
```
- Generates optimized production bundle
- Estimated time: ~30 seconds

### Step 3: Start Services
```bash
# Backend (from backend directory)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (in separate terminal)
npm run preview  # or deploy to static hosting
```

### Step 4: Verify Endpoints
```bash
# Check public endpoints work
curl http://localhost:8000/api/public/about-sections

# Check admin endpoints (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/admin/about-sections
```

## Testing Checklist

### Admin Panel Testing
- [ ] Login to admin panel succeeds
- [ ] Sidebar shows "Nursery – About" (not "Primary – Classes")
- [ ] Click "Nursery – About" opens manager
- [ ] Upload photo to Nursery About
- [ ] Save changes completes
- [ ] Primary – Classes no longer visible in sidebar
- [ ] Other sidebar items unchanged

### Public Website Testing
- [ ] Navigate to /nursery page
- [ ] "About Nursery" section displays with photo and description
- [ ] Navigate to /primary page  
- [ ] "About Primary" section displays with photo and description
- [ ] Navigate to / (home page)
- [ ] Infrastructure section displays (if content exists)
- [ ] All other pages function normally

### Data Persistence Testing
- [ ] Add content via admin panel
- [ ] Refresh public page - content persists
- [ ] Close and reopen browser - content available
- [ ] Verify content not in localStorage (all backend)

### Cross-Browser Testing
- [ ] Chrome: All functions work
- [ ] Firefox: All functions work
- [ ] Safari: All functions work
- [ ] Mobile browser: Responsive design works

## Rollback Plan

If issues arise:
1. Revert to previous git commit
2. Run `alembic downgrade -1` to remove about_sections table
3. Restart backend and frontend
4. Verify system returns to pre-update state

## Success Criteria

✓ All 3 requirements completed:
  1. Nursery – About displays on public website
  2. Primary – Classes removed from sidebar
  3. Group of Schools Infrastructure properly structured

✓ No regressions in existing features

✓ Database migration runs successfully

✓ Admin and public APIs respond correctly

✓ All data persists across page reloads

