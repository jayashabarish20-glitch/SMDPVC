# Nursery Academic Calendar

The calendar uses a small Express API included with the website. It stores one
Nursery PDF and its metadata on the server's filesystem; it does not use
Firebase or a paid service.

## Local development

1. Run `npm run dev`. The first run creates a random staff password and prints
   it in the server terminal. The configured email is
   `admin@smdpvc.local`. The password hash and uploaded file are kept under the
   ignored `.data/nursery-academic-calendar/` directory.
2. Open `/admin/photos`, choose **Nursery – Academic Calendar**, and sign in
   with those credentials. You may instead set
   `NURSERY_CALENDAR_ADMIN_EMAIL` and `NURSERY_CALENDAR_ADMIN_PASSWORD` in
   `.env.local` before starting the server.
3. Upload a PDF (maximum 20 MB). Uploads are validated on both the browser and
   server, stored privately, and published immediately. Admins can preview,
   replace, unpublish, republish, or delete the current PDF.
4. The Nursery page retrieves the published Nursery calendar from the API.
   The student download endpoint never exposes unpublished files.

## Production hosting

Build with `npm run build`, then run `npm start` (or `npm run preview`) on a
Node.js host. Configure `NURSERY_CALENDAR_ADMIN_EMAIL` and
`NURSERY_CALENDAR_ADMIN_PASSWORD` as server environment variables before
starting; production startup intentionally fails if the staff password is not
configured. Set `NURSERY_CALENDAR_STORAGE_DIR` to a persistent writable volume
when the deployment platform does not preserve the application directory.

The API and persistent directory must be shared by the website's users. Static
hosting alone, ephemeral server filesystems, or multiple uncoordinated server
instances will not share uploads across devices. Use a single application
instance with a persistent volume, or configure the hosting provider's shared
filesystem. Keep the `.data` directory and environment secrets private.
