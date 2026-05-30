# Non-functional requirements — implementation notes

## Usability
- Multi-step adoption request with step validation and Enter-to-advance (except in textareas).
- Unsaved-change warning when leaving the adoption request form (`useBlocker` + browser `beforeunload`).
- Owner message flow: approve request before reply (UI + API).
- Shared `PageState` component for loading / empty / error patterns.
- Role-based `ProtectedRoute` on dashboard routes.

## Reliability
- Listing delete uses ordered JDBC purge + detach (avoids Hibernate re-insert FK errors).
- Owner listing delete email sent `afterCommit` only.
- Decline inquiry email sent `afterCommit`.
- `GlobalExceptionHandler` for consistent API error bodies.

## Security
- Password reset stores BCrypt hashes.
- DB credentials via environment variables (not hard-coded in properties).
- Admin UI gated by role + email whitelist; sensitive actions still require backend checks.

## Performance
- Compatible animals reload when the browser tab becomes visible again (picks up owner listing edits).
- Match API returns full listing fields for adopter cards (no stale description-only gap).

## Maintainability
- Removed duplicate stale files under `frontend/src/utils/*Page.js` and `frontend/src/pages/platformApi.js`.
- Canonical API helpers: `frontend/src/utils/platformApi.js` (`apiFetch`, `apiFetchJson`).

## Not removed
These pages remain at `frontend/src/pages/`:
- `OwnerManageRequestsPage.js`
- `OwnerMessagesPage.js`

Only unused **copies** in `frontend/src/utils/` were deleted to prevent wrong imports.
