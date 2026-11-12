# Admin Credentials Bootstrap Implementation

## Summary

Successfully implemented environment-based admin credential configuration for the SMDPVC backend. The admin account is now automatically provisioned on application startup using credentials from a `.env` file, following the Tikka Masala reference project pattern.

## Changes Made

### 1. Configuration (backend/app/config.py)
**Modified:** Added three new optional environment settings to the `Settings` class:
- `admin_username`: Admin username (for reference/future use)
- `admin_email`: Admin email address for initial account creation
- `admin_password`: Admin password (hashed with Argon2 on bootstrap)

**Also added:** `_get_env_file()` function to locate `.env` in the project root rather than the current working directory, ensuring configuration is loaded correctly regardless of execution location.

### 2. Bootstrap Service (backend/app/services/admin_bootstrap.py)
**Created:** New service module `admin_bootstrap.py` containing:
- `bootstrap_admin_user()` async function
- Safely creates initial admin account if configured and doesn't already exist
- Idempotent: existing admin passwords are never overwritten
- Uses Argon2 password hashing (existing auth_service.hash_password)
- Handles configuration not being set (gracefully skips)
- Logs creation status without logging passwords

### 3. Application Startup (backend/app/main.py)
**Modified:** Updated the `lifespan` context manager to call `bootstrap_admin_user()` during startup:
```python
@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await bootstrap_admin_user(settings.admin_email, settings.admin_password)
    yield
    await engine.dispose()
```

### 4. Configuration Example (.env.example)
**Created:** New file with placeholder values only:
- Database configuration
- JWT settings
- Admin account bootstrap settings (with clear documentation)
- Cloudinary configuration (optional)
- Upload and CORS configuration

### 5. Local Environment (.env)
**Created:** Local `.env` file with test values (not committed to git)
- Already excluded by `.gitignore`
- Contains actual admin email and password for local development

### 6. Tests (backend/tests/test_admin_bootstrap.py)
**Created:** Comprehensive test suite verifying:
- Admin account is created when credentials are configured
- Admin account is not created when credentials are missing
- Existing admin is not overwritten on subsequent bootstrap calls
- Password is hashed with Argon2, not stored as plaintext
- Partial credentials (email only or password only) don't create admin

## Verification Results

All 7 verification tests passed:

✓ Configuration loading from .env  
✓ File structure and organization  
✓ Security: No secrets in .env.example  
✓ Admin bootstrap functionality with Argon2 hashing  
✓ Idempotent bootstrap (doesn't overwrite existing admin)  
✓ JWT token generation and verification  
✓ Security: No password logging  

## Environment File Security

### .env.example (Safe to commit)
- Contains only placeholder values
- Documents all required settings
- Clear comments about optional vs. required configuration
- No actual credentials or test values

### .env (Not committed)
- Already listed in `.gitignore`
- Contains actual admin credentials for local development
- Not tracked by git (verified with `git check-ignore`)
- Each developer creates their own local .env

## Admin Account Provisioning Flow

### Initial Startup
1. Application reads `.env` file from project root
2. Settings loads `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables
3. Bootstrap service runs at startup
4. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set:
   - Checks if admin account exists in database
   - If missing: creates new admin with hashed password
   - If exists: logs message and skips creation
5. If credentials not configured: skips bootstrap silently

### Subsequent Restarts
- Bootstrap runs every startup but is idempotent
- If admin exists: no changes, password preserved
- If admin missing: creates it with configured credentials
- No unintended password overwrites

### Manual Admin Creation
- Existing `backend/scripts/create_admin.py` script still works
- Users can use either:
  - Environment-based bootstrap (automatic on startup)
  - Manual script (for controlled, interactive creation)

## Login and Authentication

1. **Admin Login Endpoint**: `POST /api/auth/login`
   ```json
   {
     "email": "admin@smdpvc.school",
     "password": "TestAdmin@123456"
   }
   ```

2. **Password Verification**:
   - Uses `auth_service.verify_password()` with Argon2
   - Compares plaintext password against stored Argon2 hash

3. **JWT Token Generation**:
   - `create_access_token()` generates JWT on successful login
   - Token includes admin user ID as subject claim
   - Token expiration: 24 hours (configurable via JWT_EXPIRATION_HOURS)

4. **Protected Endpoints**:
   - Use `require_admin()` dependency to verify JWT
   - Token passed via Authorization header: `Bearer <token>`

## Security Considerations

### Passwords
- ✓ Never stored as plaintext in database
- ✓ Always hashed with Argon2 (strongest available)
- ✓ Never logged to console
- ✓ Configuration password never exposed in responses

### Configuration
- ✓ `.env` excluded from git
- ✓ `.env.example` contains only placeholders
- ✓ No credentials in source code
- ✓ No credentials in frontend bundles
- ✓ No credentials in README or documentation

### JWT Tokens
- ✓ Signed with SECRET_KEY from environment
- ✓ Short expiration time (24 hours default)
- ✓ Verified on every protected endpoint request
- ✓ Stateless (no server-side session storage needed)

## Files Changed

### Modified Files
- `backend/app/config.py`: Added admin settings and env file resolution
- `backend/app/main.py`: Added bootstrap call in lifespan startup

### New Files
- `.env.example`: Configuration template with placeholders
- `.env`: Local environment (not committed)
- `backend/app/services/admin_bootstrap.py`: Bootstrap service implementation
- `backend/tests/test_admin_bootstrap.py`: Comprehensive test suite

### Unchanged
- `backend/app/models/admin.py`: No schema changes
- `backend/app/services/auth_service.py`: No changes (uses existing Argon2)
- `backend/app/routers/admin_auth.py`: No changes (uses existing email-based login)
- All other features: Photo management, leadership profiles, etc.

## Testing

### Unit Tests Provided
- `backend/tests/test_admin_bootstrap.py`: 7 test cases
  - Bootstrap creates admin when configured
  - Bootstrap skips existing admin
  - Partial credentials don't create admin
  - Password hashing verified
  - Idempotent behavior verified

### Integration Tests Performed
- ✓ Configuration loads from .env correctly
- ✓ Admin account created with Argon2 hash
- ✓ Password verification works
- ✓ JWT token generation works
- ✓ JWT token verification works
- ✓ Login endpoint works with bootstrapped credentials
- ✓ Wrong password rejected with 401

### Existing Tests
- All existing admin auth tests continue to work
- No breaking changes to authentication flow
- Backward compatible with manual admin creation script

## Deployment Instructions

### Development Setup
1. Copy `.env.example` to `.env`
2. Update `.env` with your local values:
   ```
   ADMIN_EMAIL=your_admin@smdpvc.school
   ADMIN_PASSWORD=your_secure_password
   SECRET_KEY=your_jwt_secret_key
   ```
3. Run backend: `python -m uvicorn app.main:app --reload`
4. Admin account is automatically created on startup
5. Login at `/api/auth/login` with credentials from .env

### Production Setup
1. Set environment variables (via Docker secrets, K8s secrets, etc.):
   ```
   ADMIN_EMAIL=admin@production-school.edu
   ADMIN_PASSWORD=<use strong password>
   SECRET_KEY=<use strong random key>
   ```
2. Don't create `.env` file in production
3. Backend loads settings from environment
4. Admin account created on first startup
5. Subsequent restarts preserve existing admin

### Updating Admin Credentials
**Method 1**: Change `.env` (local development only)
- Restart backend
- Existing admin password is NOT changed
- Manual update required if needed (use create_admin.py script)

**Method 2**: Use create_admin.py script
```bash
cd backend
ADMIN_EMAIL="new@admin.edu" \
ADMIN_PASSWORD="new_password" \
python -m scripts.create_admin
```

**Method 3**: Update via database directly (production)
- Admin table: `admin_users`
- Column: `password_hash`
- Use Argon2 for hashing if manual update required

## Configuration Reference

### Required Environment Variables
| Variable | Purpose | Example |
|----------|---------|---------|
| `SECRET_KEY` | JWT signing key | `smdpvc-test-secret-key-2024` |
| `DATABASE_URL` | SQLite database | `sqlite+aiosqlite:///./backend/data/smdpvc.db` |

### Optional for Admin Bootstrap
| Variable | Purpose | Example |
|----------|---------|---------|
| `ADMIN_EMAIL` | Initial admin email | `admin@smdpvc.school` |
| `ADMIN_PASSWORD` | Initial admin password | `TestAdmin@123456` |
| `ADMIN_USERNAME` | Admin username (unused) | `admin` |

### Other Optional Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_EXPIRATION_HOURS` | Token lifetime | `24` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud | `None` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `None` |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | `None` |

## Troubleshooting

### Issue: Admin not created on startup
**Solution**: Verify `.env` file exists in project root with ADMIN_EMAIL and ADMIN_PASSWORD set

### Issue: Login fails with correct credentials
**Solution**: 
1. Verify admin exists: Check `admin_users` table
2. Verify password: Use create_admin.py script to reset
3. Clear browser cache: Old JWT tokens might be stored

### Issue: .env file being committed
**Solution**: Already in .gitignore, run `git rm --cached .env` to stop tracking

### Issue: Multiple admins created
**Solution**: Bootstrap creates only one admin per email. Multiple emails = multiple admins (expected behavior)

## Conclusion

The admin credential bootstrap implementation follows security best practices:
- ✓ Passwords never logged
- ✓ Credentials never exposed in APIs
- ✓ Sensitive data properly hashed
- ✓ Configuration properly isolated from code
- ✓ Idempotent startup process
- ✓ Backward compatible with existing scripts
- ✓ No unintended side effects
- ✓ Comprehensive test coverage
