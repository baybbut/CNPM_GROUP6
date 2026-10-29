# Website QR management

Overview now includes the visitor session list, search/status filters and its filtered CSV. The separate Visitors menu is removed; old `#Visitors` links resolve to Overview. Reports retains detailed analytics. The former QR Check-in menu is now **Quản lý QR** (`#QR%20Codes`); old `#QR Check-in` links resolve to it.

## QR inventory and lifecycle

One base QR is managed per artwork, including QR links already generated on the visitor website. Language and legacy reading-point variants share the artwork's enable/disable state. Published artworks with complete published Vietnamese title/description are available automatically; QR cannot expose a draft/hidden artwork. A code can be labelled and paused/re-enabled without unpublishing its artwork or losing analytics. QR availability requires BOTH published content and QRIsEnabled. Republishing does not clear a previous explicit pause.

The Admin list supports active/paused/unavailable/all filters and accent-insensitive search. It shows effective status, all-time QR-open counts and last open time, with edit and PNG preview/download actions. Counts mean successful QR-link openings, not proof of a physical camera scan; historic point/language variants are grouped by artwork. Previewing/downloading a PNG does not add a QR-open event. The preview URL must use the reachable visitor origin, not the Admin port. `VITE_VISITOR_BASE_URL` can set the Admin default; local phones need a network address, not localhost.

The public Scan QR catalogue passes `qr=1`; the API applies QRIsEnabled to both results and pagination totals. The normal collection remains unaffected. Both popup generation and QR landing links (`source=qr`, including existing printed links) check current availability using a no-store endpoint. Paused codes show an inactive screen, and unavailable/network errors never fall through to an artwork detail page. A successful validated landing records the QR event; reloads within ten seconds are deduplicated. An already-open page is not remotely erased: changes take effect on subsequent opens/generation/reloads. Direct ordinary collection links remain public when QR is paused. This is QR lifecycle management, not private-content access control.

## Update existing installations

From the repository root after pulling develop:

```sh
npm --prefix muses-backend run db:catalog
npm --prefix muses-backend start
# Another terminal:
npm --prefix muses-admin run dev -- --port 5174
# Another terminal:
npm --prefix muses-react run dev -- --host 0.0.0.0 --port 5173
```

`db:catalog` uses the existing administrative SQL prompt and verified backup workflow. Enter the SQL administrator account/password (not the web Admin or runtime muses_app account) and accept or supply an absolute backup path inside SQL Server. The additive `ArtworkQR.sql` adds QRIsEnabled (default true), QRLabel, QRUpdatedAt and QRUpdatedBy to Artworks. Re-running it preserves existing values; it does not reset artworks, translations or events. Existing Artworks SELECT/UPDATE grants cover these columns. Until migration succeeds, QR APIs return a recoverable setup error rather than silently treating disabled codes as active.

## API and verification

- `GET /api/admin/qr/artworks`: Admin-only inventory and counts.
- `PUT /api/admin/qr/artworks/:id`: Admin-only label/enabled update, strict boolean and length validation, actor/time recorded. Enabling requires current publication eligibility in the atomic UPDATE as well as validation.
- `GET /api/qr/artworks/:id`: guest-readable availability; 410 for paused, 404 for unavailable/unpublished/missing, 503 for missing setup/service failure; no-store.

Backend tests exercise authorization, validation, publication guards, persistence, missing schema and public QR filtering independently from normal artworks. Browser tests use controlled APIs to verify merged Overview search/filter/export, QR list and PNG preview, rename/pause/re-enable across Admin and visitor views, blocked legacy landings without QR events, ordinary collection access while paused, and successful validated QR landing events. Real QR PNG decoding is also checked in `qr-directions.mjs`. Both builds are verified. Live SQL migration/permissions and a physical phone require local verification; cloud tests do not claim to have run against the user's database.
