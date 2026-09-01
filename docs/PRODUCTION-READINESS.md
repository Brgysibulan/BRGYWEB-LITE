# BRGYWEB-LITE — Production Readiness

**Audit date:** 2026-09-01  
**Current readiness:** ~82%  
**Release stage:** Client Demo / Pilot / UAT  
**Target:** 95%+ before official client launch

## Product Scope

BRGYWEB-LITE is a reusable, single-barangay website and content management system. Each deployment is intended for one barangay and can be configured without changing the core architecture.

Technology stack:
- HTML
- CSS
- Vanilla JavaScript
- Bootstrap 5
- Supabase Auth
- Supabase Database
- Supabase Storage
- Supabase Edge Functions
- GitHub Pages or standard static hosting

## User Roles

### System Admin
Full management access, including:
- Dashboard
- Barangay profile/content
- Officials
- Announcements
- Services
- Downloadable forms
- Directory
- Disclosures
- Gallery
- Site settings
- Design Studio
- Verification records / QR
- Content Admin applications and account status

### Content Admin
Content-management access only. The intended lifecycle is:
1. Applicant submits a Content Admin application.
2. System Admin reviews the application.
3. System Admin approves or rejects it.
4. Approved applicant receives the activation flow.
5. Applicant creates a password.
6. Active Content Admin can log in to the content-management interface.

Verification records remain System Admin-only.

## Public Website

Implemented public areas include:
- Home
- Barangay Profile
- Officials
- Announcements
- Services
- Forms
- Barangay Directory
- Barangay Disclosure
- Gallery
- Verify ID
- Contact
- Admin Portal entry point

## Verification System

Implemented foundation:
- Verification records stored in Supabase
- Public verification page
- Manual ID/record lookup
- QR support
- Camera QR scanning support
- Verification record management restricted to System Admin

Before production launch, QR scanning must be regression-tested on actual Android/iOS devices and supported browsers.

## Design Studio

The Design Studio is the primary design-control interface.

### Public design controls
- 9 public presets
- Primary, secondary, accent, and signal colors
- Navigation position
- Navigation alignment
- Navigation mode
- Navigation skin
- Hero style
- Content width
- Font style
- Corner style
- Density
- Card style

### Admin design controls
- 7 admin presets
- Font
- Corners
- Density
- Sidebar style
- Card style

Saved designs are stored in `site_settings.design_theme` and are applied to public/admin interfaces. Theme cache and cross-tab synchronization are implemented.

## Backend and Security

Supabase project architecture includes:
- Auth
- Database
- Row Level Security
- Storage
- Edge Functions

Current active management function:
- `manage-editors` — JWT protected

Initial admin bootstrap is closed and returns HTTP 410.

### Current security item
Supabase Security Advisor currently reports:
- Leaked Password Protection disabled

This should be enabled before official client production.

### Current performance cleanup
Supabase Performance Advisor currently reports:
- Missing covering index for `content_admin_applications.reviewed_by`
- Multiple permissive policies on several tables for overlapping authenticated SELECT/INSERT access

These require review/optimization while preserving the existing authorization model.

## Storage

Current storage design includes:
- Gallery media
- Disclosure documents
- Branding/logo media

Production testing must verify upload, replacement, deletion, file-size restrictions, and role permissions.

## Deployment and Caching

The frontend is static and portable.

Supported deployment direction:
- GitHub Pages
- Hostinger/static hosting
- Other standard static web hosting

A service worker uses a network-first strategy for HTML/CSS/JavaScript and keeps runtime fallback cache. This reduces stale-asset problems after deployments.

Latest audited GitHub Pages deployment on 2026-09-01 completed successfully from `main`.

## Production Readiness Scorecard

| Area | Readiness | Notes |
|---|---:|---|
| Public website | 92% | Main public modules implemented |
| System Admin | 90% | Core management modules implemented |
| Content Admin | 90% | Application, approval, activation and dashboard implemented |
| Verification / QR | 85% | Functional foundation; device regression test required |
| Design Studio | 78% | Functional; responsive/preset regression testing required |
| Mobile / responsive | 72% | Main current stabilization area |
| Supabase / Auth / RLS | 88% | Strong foundation; security warning remains |
| Storage / uploads | 90% | Final permission/file regression tests required |
| Deployment / cache | 90% | GitHub Pages and network-first cache implemented |
| Portability | 90% | Static frontend architecture |
| Client handoff/docs | 60% | Production/onboarding/backup documentation still required |

**Overall audited readiness: approximately 82%.**

## Production Blockers

Do not classify the product as final client production until these are completed.

### P0 — Release blockers
- [ ] Full responsive regression test on phone portrait
- [ ] Full responsive regression test on phone landscape
- [ ] Test browser `Desktop site` mode on phone
- [ ] Tablet/wide viewport test
- [ ] Laptop/desktop test
- [ ] Verify mobile navigation can always open, scroll, select links, and close
- [ ] Confirm Design Studio never conflicts with responsive safety rules
- [ ] Full System Admin login/session test
- [ ] Full Content Admin application → approval → activation → login test
- [ ] Create/edit/delete content and verify public output
- [ ] Verify Design Studio save → reload persistence → public/admin application
- [ ] Verify QR scanning on real devices
- [ ] Verify manual verification lookup
- [ ] Verify gallery/branding/document uploads
- [ ] Enable leaked-password protection

### P1 — Production hardening
- [ ] Add/review index for `content_admin_applications.reviewed_by`
- [ ] Review duplicate permissive RLS policies without weakening authorization
- [ ] Re-run Supabase security advisor
- [ ] Re-run Supabase performance advisor
- [ ] Test logout/session expiry/inactive account handling
- [ ] Test invalid/deactivated Content Admin access
- [ ] Confirm no secret/service-role keys are present in frontend code
- [ ] Verify cache behavior after a new deployment without manual hard refresh
- [ ] Verify all pages return correctly on target production domain

### P2 — Client handoff
- [ ] Configure real barangay name, logo, address and contacts
- [ ] Load actual officials/services/content
- [ ] Configure production domain
- [ ] Create/verify System Admin account
- [ ] Prepare backup/export procedure
- [ ] Prepare deployment/redeployment guide
- [ ] Prepare short System Admin user guide
- [ ] Prepare short Content Admin user guide
- [ ] Prepare acceptance/UAT checklist
- [ ] Record production version/commit used for client delivery

## Release Gates

### Demo / Pilot
Current system is suitable for controlled demonstration and UAT after checking the target deployment.

### Release Candidate
Target: **90%+**

Requirements:
- P0 functional tests substantially complete
- No known navigation-blocking responsive bug
- Auth and role separation verified
- Content CRUD verified
- Verification flow verified

### Production
Target: **95%+**

Requirements:
- All P0 items complete
- Critical P1 security items complete
- No known critical/high-severity defect
- Production domain/configuration verified
- Client data configured
- Admin access tested
- Backup/recovery procedure documented
- Client acceptance test completed

## Feature Freeze Rule

Until the first production release is stable, prioritize:
1. Bug fixes
2. Responsive stability
3. Security
4. Functional regression testing
5. Client onboarding/documentation

Avoid adding non-essential features during the production-hardening phase unless they are required by the first client.

## Definition of Done for First Client

BRGYWEB-LITE is ready for official first-client turnover when:
- Public pages work on supported mobile and desktop layouts.
- Navigation cannot trap or block the user.
- System Admin and Content Admin permissions behave correctly.
- Content changes persist and appear publicly as intended.
- Design Studio changes persist without breaking responsive behavior.
- Verification and QR workflows pass real-device testing.
- Uploads and storage permissions work correctly.
- Supabase security checks have no unresolved production-critical findings.
- Deployment updates reach users without requiring special cache-clearing instructions.
- Client configuration, credentials, backup process, and operating instructions are documented.

---

This document is the production-readiness baseline. Update the score and checkboxes as blockers are closed.