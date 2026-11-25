# HTTP 502 Admin Login Error - Complete Fix Guide

## Executive Summary

The HTTP 502 "Bad Gateway" error when attempting to log in indicates that the Vite development proxy cannot communicate with the FastAPI backend server. This is typically caused by the backend not running, but can also be caused by configuration issues or startup failures.

---

## Quick Fix (95% of Cases)

**The backend is not running. Start it now:**

```powershell
# 1. Open PowerShell in the backend directory
cd backend

# 2. Activate virtual environment (if not already activated)
.\.venv\Scripts\Activate.ps1

# 3. Start the backend server
uvicorn app.main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

**Then in a new PowerShell window, start the frontend:**

```powershell
npm run dev
```

**Now try logging in again.** The 502 error should be gone.

---

## Detailed Investigation & Fix

If the quick fix doesn't work, follow these steps:

### Step 1: Verify Environment Setup

```powershell
cd backend

# Check if virtual environment exists
Test-Path .\.venv\Scripts\python.exe
# Output should be: True

# If False, create it:
py -3 -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# Install dependencies
python -m pip install -r requirements.txt
```

### Step 2: Verify Backend Configuration

```powershell
# Check if .env file exists and has required settings
Test-Path backend\.env
# Should output: True

# View .env contents
Get-Content backend\.env
# Should include:
# SECRET_KEY=...
# DATABASE_URL=sqlite+aiosqlite:///./data/smdpvc.db
```

If `.env` is missing or incomplete, check `.env.example` and copy the structure:

```powershell
Copy-Item backend\.env.example backend\.env
# Then edit backend\.env and set the values
```

### Step 3: Verify Database Migrations

```powershell
cd backend

# Check if migrations are applied
python verify_startup.py

# If migrations are needed, run:
alembic upgrade head

# Then try starting the backend again
uvicorn app.main:app --reload
```

### Step 4: Verify Backend Connectivity

**With backend running**, open a NEW PowerShell and test:

```powershell
# Test health endpoint
Invoke-RestMethod http://127.0.0.1:8000/api/health

# Should output:
# status    database
# ------    --------
# ok        connected
```

If this fails with "connection refused", the backend is not running. If it returns an error, check the error details.

### Step 5: Verify Login Endpoint Directly

```powershell
# Test login with default admin credentials
$body = @{
    email = "admin@smdpvc.school"
    password = "your-password"  # Check backend/.env for ADMIN_PASSWORD
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected success response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**If HTTP 401 (Unauthorized):**
- Credentials are incorrect
- Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`

**If connection error:**
- Backend is not running (go back to Step 1)
- Backend is running on wrong port (check Step 6)

### Step 6: Verify Port Configuration

**Check which port the backend is running on:**

```powershell
# See listening ports
netstat -ano | findstr :8000

# If you see something, the port is in use
# If nothing, backend is not running

# Check what process is using it (if port is in use)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess
```

**If port 8000 is not available, change the backend port:**

```powershell
# Start on different port
uvicorn app.main:app --reload --port 8001
```

**Then set environment variable for Vite proxy:**

```powershell
# In PowerShell where you'll run frontend:
$env:SMDPVC_API_PROXY_TARGET = "http://127.0.0.1:8001"
npm run dev
```

### Step 7: Check Frontend Vite Configuration

Verify `vite.config.ts` has correct proxy setup:

```typescript
server: {
  proxy: {
    "/api": env.SMDPVC_API_PROXY_TARGET ?? "http://127.0.0.1:8000",
  },
},
```

This tells Vite to proxy all `/api/*` requests to the backend.

---

## Troubleshooting Specific Errors

### Error: "ModuleNotFoundError: No module named 'app'"

**Cause:** Wrong working directory or virtual environment not activated

**Fix:**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Error: "Alembic migration failed"

**Cause:** Database migrations not applied

**Fix:**
```powershell
cd backend
alembic upgrade head
uvicorn app.main:app --reload
```

### Error: "SQLAlchemy: Database is locked"

**Cause:** Another process is using the database file

**Fix:**
```powershell
# Kill all Python processes
Get-Process python | Stop-Process -Force

# Try again
cd backend
uvicorn app.main:app --reload
```

### Error: "Address already in use"

**Cause:** Port 8000 is already in use by another process

**Fix:**
```powershell
# Option 1: Kill the process using port 8000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force

# Option 2: Use a different port
uvicorn app.main:app --reload --port 8001
$env:SMDPVC_API_PROXY_TARGET = "http://127.0.0.1:8001"
```

### Error: "SECRET_KEY must be set"

**Cause:** Missing SECRET_KEY in .env file

**Fix:**
```powershell
# Edit backend\.env and add:
SECRET_KEY=your-secret-key-here
# Or use generated key from .env.example
```

---

## Full Startup Process (Complete)

Follow this exact sequence:

```powershell
# Terminal 1: Setup Backend
cd backend
py -3 -m venv .venv                    # First time only
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt  # First time only
alembic upgrade head                   # First time only
python verify_startup.py               # Verify everything works
uvicorn app.main:app --reload          # Start backend

# Terminal 2: Start Frontend (wait for "Application startup complete" in Terminal 1)
cd ..
npm install                            # First time only
npm run dev                            # Start frontend

# Terminal 3: Test (optional)
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

Then:
1. Open browser to `http://localhost:5173`
2. Try logging in with admin credentials
3. Should work now!

---

## Verification Checklist

Before trying to log in, verify:

- [ ] Backend PowerShell shows "Application startup complete"
- [ ] Frontend PowerShell shows "VITE ... ready in XXXms"
- [ ] Health check returns `status: ok` and `database: connected`
- [ ] Browser can access `http://localhost:5173`
- [ ] Admin credentials are correct (check `backend/.env`)
- [ ] No firewall blocking ports 5173 or 8000
- [ ] Virtual environment is activated in backend terminal

---

## Default Admin Credentials

**Email:** `admin@smdpvc.school`

**Password:** Check `backend/.env` for `ADMIN_PASSWORD` value

If you don't remember the password:
1. Edit `backend/.env`
2. Set `ADMIN_PASSWORD=your-new-password`
3. Restart backend
4. Admin user will be reset with new password

---

## Connection Diagram

```
Browser (localhost:5173)
  ↓
Vite Dev Server (5173)
  ↓ (proxy /api to :8000)
FastAPI Backend (8000)
  ↓
SQLite Database (backend/data/smdpvc.db)
```

Each arrow must work:
1. Browser can reach Vite (http://localhost:5173) ✅
2. Vite can reach FastAPI (http://127.0.0.1:8000) ✅
3. FastAPI can reach database (backend/data/smdpvc.db) ✅

If any arrow fails → 502 error

---

## Still Having Issues?

If the above doesn't work:

1. **Check logs:**
   ```powershell
   # Backend logs should show any errors
   # Look for ERROR or EXCEPTION in output
   ```

2. **Run verification:**
   ```powershell
   cd backend
   python verify_startup.py
   # Will show which startup step fails
   ```

3. **Clear cache:**
   ```powershell
   # Clear Vite cache and node_modules
   rm -r node_modules
   npm install
   rm -r .vite
   ```

4. **Reset database:**
   ```powershell
   # WARNING: This deletes all data
   rm backend/data/smdpvc.db
   cd backend
   alembic upgrade head
   ```

---

## Summary

**The HTTP 502 error when logging in means the backend is not responding.**

**Most common fix (applies 95% of the time):**
1. Open PowerShell in backend directory
2. Run `.\.venv\Scripts\Activate.ps1`
3. Run `uvicorn app.main:app --reload`
4. Retry login

**If that doesn't work:**
1. Run `python verify_startup.py` to diagnose
2. Follow the specific error message guidance
3. Try login again

The backend MUST be running for ANY API calls to work, including login.
