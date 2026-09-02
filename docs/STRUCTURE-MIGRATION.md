# Structure Migration

## Target layout

JavaScript is organized by responsibility:

- `assets/js/core/` — shared configuration and infrastructure.
- `assets/js/public/` — resident-facing runtime and page modules.
- `assets/js/admin/` — administrator modules.
- `assets/js/editor/` — editor/staff modules.
- `assets/js/` — folder documentation only; active feature modules should not live flat here.

## Public

- [x] Homepage runtime and statistics
- [x] Public shell and responsive guard
- [x] Announcements
- [x] Barangay directory
- [x] Barangay disclosure
- [x] Barangay profile
- [x] Services
- [x] Forms
- [x] Gallery
- [x] Officials
- [x] Contact
- [x] Verification
- [x] Homepage map

Special pages such as redirects, login, and maintenance remain intentionally separate where their behavior does not use a normal public feature module.

## Admin

- [x] Dashboard
- [x] Announcements
- [x] Directory
- [x] Disclosure
- [x] Forms
- [x] Gallery
- [x] Officials
- [x] Profile
- [x] Services
- [x] Verification
- [x] Settings
- [x] Content Admin access management
- [x] Design Studio module placed under `assets/js/admin/`
- [x] Shared admin shell runtime placed under `assets/js/admin/`

## Editor

- [x] Dashboard
- [x] Activation
- [x] Application
- [x] Shared staff context
- [x] Shared forms navigation

## Legacy cleanup

- [x] Removed migrated flat public modules.
- [x] Removed migrated flat admin modules.
- [x] Removed migrated flat editor modules.
- [x] Removed orphaned legacy dashboard, preset, brand, and health modules.
- [x] Corrected dynamic staff runtime paths in `core/supabase-config.js`.
- [x] Homepage references now use grouped public modules.

## Final cleanup

- [x] Search known deleted runtime names for dangling references.
- [x] Remove verified legacy duplicates only after reference checks.
- [x] Preserve dependency order: vendor → core → shared runtime → page module.
- [x] Review service-worker behavior and bump runtime cache after structural cleanup.
- [ ] Perform browser smoke test across public, admin, and editor pages.
- [ ] Perform final HTML link/asset 404 audit.

## Rule going forward

New JavaScript modules must be created directly in the correct responsibility folder. Do not reintroduce flat feature modules under `assets/js/`.
