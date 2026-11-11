# SMDPVC Backend

FastAPI service using asynchronous SQLAlchemy, SQLite, Alembic, and Cloudinary.
The database stores administration/content records and Cloudinary image
metadata; image binaries remain in Cloudinary.

## Requirements

- Python 3.11 or newer
- SQLite (included with Python)

## Local setup

From the repository root, run these commands in PowerShell:

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

The default `DATABASE_URL` is
`sqlite+aiosqlite:///./data/smdpvc.db`. Relative database paths are resolved
from the backend directory, independent of the process working directory. The
database file is stored at `backend/data/smdpvc.db`; its parent directory is
created automatically. `CORS_ORIGINS` is a JSON array; add other frontend
origins there if needed.

If you already have a `backend/.env`, it is not overwritten by these changes.
Update only its `DATABASE_URL` value to the SQLite URL when you are ready to
switch. Do not delete the PostgreSQL database: SQLite is a separate database
file and existing PostgreSQL rows are not copied automatically.

Set Cloudinary credentials in `.env` before attempting media operations:

```text
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
MAX_UPLOAD_SIZE_BYTES=5242880
```

The maximum upload size defaults to 5 MiB. Do not commit `.env` or put
Cloudinary secrets in the frontend.

Apply migrations from the `backend` directory:

```powershell
alembic upgrade head
```

When models change, create and review a migration before applying it:

```powershell
alembic revision --autogenerate -m "describe the schema change"
alembic upgrade head
```

SQLite schema changes that require table alteration are rendered in Alembic
batch mode. To roll back one migration:

```powershell
alembic downgrade -1
```

Start the API:

```powershell
uvicorn app.main:app --reload
```

The API listens on `http://127.0.0.1:8000`. Interactive API documentation is at
`http://127.0.0.1:8000/docs`.

## Persistent deployment storage

SQLite requires a persistent, writable disk. The default database directory is
`backend/data`, which can be changed by setting `DATABASE_URL` to another
`sqlite+aiosqlite:///...` file path. For Render, attach a persistent disk to the
backend service and set `DATABASE_URL` to a file on its mount path, for example:

```text
DATABASE_URL=sqlite+aiosqlite:////var/data/smdpvc.db
```

Configure the disk mount path to `/var/data` in the Render service settings.
Render's default service filesystem is ephemeral; without an attached persistent
disk, database records are lost on redeploy/restart. Run `alembic upgrade head`
after configuring the persistent path. Do not run multiple backend instances
against a SQLite file on a network filesystem; SQLite is intended for this
single-administrator deployment and one local persistent disk.

## Health check

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

When SQLite is reachable, the response is:

```json
{
  "status": "ok",
  "database": "connected"
}
```

If SQLite cannot be reached, the endpoint responds with HTTP 503 and reports the
database as unavailable. The health check executes `SELECT 1`; it does not
create or modify tables.

## Schema and media storage

The Alembic schema includes admin users, roles and permissions, Cloudinary media
metadata, photo configurations, leadership profiles, school sections, gallery
collections and images, achievements, toppers, announcements, and JSON website
settings. SQLite stores records and Cloudinary URLs/metadata, not image binaries
or Base64 data.

The media service validates image content and dimensions using Pillow and
accepts JPEG, PNG, and WebP files. Cloudinary stores image binaries; SQLite
stores the public ID and image metadata. Replacement cleanup failures are
recorded for retry.

The media router defines `POST /api/media/upload`, `PUT /api/media/{media_id}`,
and `DELETE /api/media/{media_id}`. These write routes are mounted and require
an authenticated administrator. The public website reads active media through
`GET /api/public/photos`; leadership profile details and linked media are
available through `GET /api/public/leadership-profiles`.

The read-only `GET /api/public/photos` endpoint lists active media linked
through `photo_configurations`; it is not a write API.

## Existing PostgreSQL data

The PostgreSQL database, if one exists, is not modified or automatically copied
by switching `DATABASE_URL`. No PostgreSQL data export/import has been performed.
Before moving production use to SQLite, identify and back up the source database
and perform a separately verified data migration if its records must be kept.

## Tests

Install test dependencies and run the backend suite:

```powershell
python -m pip install -r requirements-dev.txt
python -m pytest
```
