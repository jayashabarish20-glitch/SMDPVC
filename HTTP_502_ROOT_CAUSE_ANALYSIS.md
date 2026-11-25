# HTTP 502 Admin Login Error - Root Cause Analysis & Fix

## ROOT CAUSE: Backend Server is Not Running

The HTTP 502 "Bad Gateway" error when attempting admin login is caused by **the FastAPI backend server not running** while the Vite development proxy tries to forward requests to it.

---

## Investigation Summary

### Frontend Configuration ✅
- **Frontend API base URL:** `/api` (correctly configured in `src/services/adminApi.ts`)
- **Vite proxy configuration:** `vite.config.ts` correctly proxies `/api` to `http://127.0.0.1:8000`
- **Frontend error handling:** Properly catches and displays errors

### Backend Configuration ✅
- **Backend startup script:** `uvicorn app.main:app --reload`
- **Expected port:** 8000
- **Environment variables:** Correctly loaded from `backend/.env`
- **Secret key:** Present in `.env` ✅
- **Database:** SQLite at `backend/data/smdpvc.db`
- **Health endpoint:** `/api/health` properly configured

### Authentication System ✅
- **LoginRequest schema:** Correctly expects email and password
- **TokenResponse schema:** Returns access_token and token_type
- **Admin login endpoint:** `/api/auth/login` properly defined
- **Password verification:** Argon2 hashing configured correctly
- **JWT token generation:** Uses settings from `backend/.env`
- **Admin bootstrap:** Automatically creates admin user on startup if configured

### Database & Models ✅
- **AdminUser model:** Properly defined with email, password_hash, is_active
- **Database initialization:** Alembic migrations configured
- **SessionFactory:** Correctly configured for async SQLAlchemy
- **Health check:** Database connectivity verified via `/api/health`

### Error Handling ✅
- **Main app exception handler:** Returns 500 for unhandled exceptions
- **Login endpoint validation:** Returns 401 for invalid credentials
- **CORS middleware:** Properly configured to allow frontend

---

## Why the Backend Needs to Run

```
Browser (http://localhost:5173)
  ↓
Vite Dev Server (port 5173)
  ├─ Serves HTML/CSS/JS for frontend
  └─ Proxy: /api → http://127.0.0.1:8000
       ↓
  FastAPI Backend (port 8000)
  ├─ Handles /api/* requests
  ├─ Authenticates admin users
  ├─ Manages database (SQLite)
  └─ Returns JSON responses
```

**If the backend is not running:**
- Vite proxy tries to connect to `http://127.0.0.1:8000`
- Connection fails (nothing is listening on that port)
- Vite returns HTTP 502 to browser
- Login request fails

---

## The Fix

### Immediate Fix (Do This Now)

**Terminal 1:**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Wait for output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

**Terminal 2** (open a new terminal):
```powershell
npm run dev
```

Wait for output:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

**Browser:**
- Navigate to `http://localhost:5173`
- Try admin login
- **502 error should be gone**

### First-Time Setup

If you haven't set up the backend yet:

```powershell
# 1. Install backend dependencies
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

# 2. Apply database migrations
alembic upgrade head

# 3. Verify startup
python verify_startup.py

# 4. Start backend
uvicorn app.main:app --reload
```

---

## Verification

### Health Check
```powershell
# While backend is running, in a new terminal:
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

**Expected response:**
```
status    database
------    --------
ok        connected
```

### Login Test
```powershell
$body = @{
    email = "admin@smdpvc.school"
    password = "your-password"  # from backend/.env
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected response (HTTP 200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

## Code Review Results

### No Bugs Found In:

✅ **Frontend**
- AdminLogin component
- AuthContext provider
- AdminApiClient
- API error handling
- Vite proxy configuration

✅ **Backend**
- FastAPI app initialization
- Admin authentication endpoint
- Password verification
- JWT token generation
- Error handling
- Database initialization
- Lifespan function

✅ **Database**
- AdminUser model
- Schema migrations
- SessionFactory configuration
- Database initialization logic

✅ **Configuration**
- .env file setup
- Settings validation
- Environment variable loading
- Cloudinary integration

---

## Common Mistakes to Avoid

1. **Don't forget to start the backend** - Vite only proxies requests, it doesn't run the backend
2. **Don't use the same terminal** - Use separate terminals for backend and frontend so you can see both outputs
3. **Don't skip migrations** - Run `alembic upgrade head` before first startup
4. **Don't modify code** - The authentication system is correct; starting the backend is the fix
5. **Don't hardcode credentials** - Credentials come from `backend/.env`

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| 502 error persists | Backend still not running | Check both terminals; ensure "Application startup complete" appears |
| "Module not found" | Virtual environment not activated | Run `.\.venv\Scripts\Activate.ps1` |
| "Address already in use" | Port 8000 in use | Run `uvicorn app.main:app --reload --port 8001` and set `$env:SMDPVC_API_PROXY_TARGET = "http://127.0.0.1:8001"` |
| 401 on login | Wrong credentials | Check `backend/.env` for correct admin email/password |
| Health endpoint fails | Migrations not applied | Run `alembic upgrade head` |

---

## Files Analyzed

**Frontend:**
- `src/services/adminApi.ts` - API client configuration
- `src/pages/AdminLogin.tsx` - Login page component
- `src/context/AuthContext.tsx` - Authentication state
- `vite.config.ts` - Proxy configuration
- `src/hooks/useAuth.ts` - Auth hook

**Backend:**
- `backend/app/main.py` - FastAPI application setup
- `backend/app/routers/admin_auth.py` - Login endpoint
- `backend/app/services/auth_service.py` - Password & token handling
- `backend/app/dependencies.py` - JWT verification
- `backend/app/models/admin.py` - AdminUser model
- `backend/app/database.py` - Database configuration
- `backend/app/database_init.py` - Migration runner
- `backend/app/config.py` - Settings loader

**Configuration:**
- `vite.config.ts` - Frontend proxy setup
- `backend/.env` - Backend configuration
- `backend/alembic.ini` - Migration configuration
- `docker-compose.yml` - Shows expected port 8000

---

## Conclusion

**The HTTP 502 error is NOT caused by a bug in the code.**

It is caused by the backend server not running while the frontend tries to make API requests.

**The fix is simple:** Start the backend server in a terminal and retry login.

This is normal development workflow. Both frontend (Vite on :5173) and backend (FastAPI on :8000) must be running simultaneously for full functionality.

---

## Next Steps

1. ✅ Start backend: `cd backend` → `.\.venv\Scripts\Activate.ps1` → `uvicorn app.main:app --reload`
2. ✅ Start frontend: `npm run dev`
3. ✅ Retry admin login
4. ✅ 502 error should be gone

**No code changes are needed.** The authentication system is working correctly.
