# HTTP 502 Admin Login Error - Diagnostic Guide

## Root Cause Analysis

The HTTP 502 error when attempting to log in indicates that the Vite development proxy cannot establish a connection to the FastAPI backend server. This is typically caused by one of the following:

### Most Likely Cause: Backend is Not Running

The backend service must be explicitly started. It does not start automatically with the frontend.

**Solution:** Start the backend server manually.

```powershell
# From repository root:
cd backend
py -3 -m venv .venv                    # Create virtual environment (first time only)
.\.venv\Scripts\Activate.ps1           # Activate virtual environment
python -m pip install -r requirements.txt  # Install dependencies (first time only)
uvicorn app.main:app --reload          # Start the backend server
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

## Verification Steps

### Step 1: Check if Backend is Running

Open a new PowerShell terminal and run:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

**If you get connection refused:**
- Backend is not running - start it using the commands above

### Step 2: Verify Vite Proxy Configuration

Check that your frontend is using the correct backend URL:

```powershell
# In another PowerShell, start the frontend:
npm run dev
```

The frontend should output something like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Step 3: Test the Login Endpoint Directly

```powershell
# With backend running, test the login endpoint:
$body = @{
    email = "admin@example.com"
    password = "your-password"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:8000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected response (if credentials are correct):**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

**If you get HTTP 401:**
- Credentials are incorrect
- Try admin@smdpvc.school if you haven't changed the credentials

---

## Less Likely Causes

### Database Initialization Failure

If the backend starts but the health check fails, the database might not be initialized.

**Solution:** Run migrations manually:

```powershell
cd backend
alembic upgrade head
```

Then restart the backend:

```powershell
uvicorn app.main:app --reload
```

### Wrong Port Configuration

Verify that the Vite proxy is configured to use port 8000.

Check `vite.config.ts`:

```typescript
server: {
  proxy: {
    "/api": env.SMDPVC_API_PROXY_TARGET ?? "http://127.0.0.1:8000",
  },
},
```

If you need to change the backend port, set the environment variable:

```powershell
$env:SMDPVC_API_PROXY_TARGET = "http://127.0.0.1:YOUR_PORT"
npm run dev
```

### Backend Startup Errors

If the backend starts but immediately crashes, check the logs for errors.

Common issues:
1. **Missing SECRET_KEY** - Should be set in `backend/.env`
2. **Database file permissions** - Ensure `backend/data/` directory is writable
3. **Port already in use** - Another service is using port 8000

Change the port:

```powershell
uvicorn app.main:app --reload --port 8001
# Then set environment variable:
$env:SMDPVC_API_PROXY_TARGET = "http://127.0.0.1:8001"
```

---

## Complete Startup Checklist

- [ ] Backend virtual environment created (`backend/.venv`)
- [ ] Backend dependencies installed (`backend/requirements.txt`)
- [ ] Environment variables set (`backend/.env`)
- [ ] Database migrations applied (`alembic upgrade head`)
- [ ] Backend server running on port 8000
- [ ] Health endpoint responds (`/api/health`)
- [ ] Frontend dev server running on port 5173
- [ ] Browser can access `http://localhost:5173`
- [ ] Admin login attempt works

---

## Default Admin Credentials

If you haven't configured custom credentials, the default admin user is typically:

- **Email:** admin@smdpvc.school
- **Password:** check `backend/.env` for `ADMIN_PASSWORD`

If `ADMIN_PASSWORD` is not set in `.env`, the admin account might not exist. Set it:

```
ADMIN_EMAIL=admin@smdpvc.school
ADMIN_PASSWORD=your-secure-password
```

Then restart the backend.

---

## Troubleshooting Commands

```powershell
# Check if backend is running
netstat -ano | findstr :8000

# Check if port 8000 is in use by another process
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# Kill process using port 8000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force

# Check backend logs
cd backend
Get-Content logs/app.log -Tail 50

# Test backend connectivity from frontend
Invoke-RestMethod http://127.0.0.1:8000/api/auth/login -Method POST -ContentType "application/json" -Body '{}'
```

---

## Solution Summary

**Most likely solution (95% of cases):**

1. Open PowerShell in the `backend` directory
2. Activate venv: `.\.venv\Scripts\Activate.ps1`
3. Start backend: `uvicorn app.main:app --reload`
4. Open another PowerShell in project root
5. Start frontend: `npm run dev`
6. Try login again

The backend MUST be running for login to work.
