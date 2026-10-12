# Production readiness work

## Shared community backend

- [ ] Move questions, answers, upvotes, and status changes from device storage to a shared, authenticated service.
- [ ] Publish only approved public profile fields to the mentor directory; keep contact details and addresses private.
- [ ] Move connection requests and decisions to a shared service with authorization for both participants.
- [ ] Add pagination, duplicate-submit protection, and offline/error states for shared content.
- [ ] Remove preview-only wording after the shared service is live and verified.

## Identity, safety, and privacy

- [ ] Define how professional roles are reviewed; email verification alone does not verify academic credentials.
- [ ] Review and deploy Firestore rules from `firestore.rules` after emulator/rules tests.
- [ ] Add retention, account deletion, and data export behavior for profile and community data.
- [ ] Verify reports, blocks, notifications, and chat rules against authenticated test accounts.

## Organization website workflows

- [ ] Obtain the supported mobile API base URL and API contract.
- [ ] Confirm applicant, sponsor, volunteer, contact, profile, password change, and password recovery workflows.
- [ ] Connect those flows only to documented endpoints; do not replay Web Forms postbacks as a substitute.
- [ ] Confirm any mission or fundraising metrics against an authoritative source before displaying numbers.

## Release

- [ ] Verify the app on current Android, iOS, and web targets.
- [ ] Complete accessibility, responsive layout, error, loading, and empty-state reviews.
- [ ] Configure production Firebase, app signing, monitoring, privacy policy, and support contact.
