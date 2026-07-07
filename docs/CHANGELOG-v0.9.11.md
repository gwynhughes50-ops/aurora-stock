# MedTrak+ v0.9.11 - Practice Administration Foundation

## Added
- New Practice Administration page.
- Practice setup foundation for practice details, sites, departments, roles and Pulse weighting.
- New practice administration service for Firestore persistence.
- Main desktop navigation entry for Practice Admin.
- Route for `/practice-admin`.

## Purpose
This release lays the foundation for a configurable MedTrak+ practice structure. It allows MedTrak+ to move away from hardcoded roles and towards a practice-specific digital twin that future modules can use.

## Notes
This is a foundation build. It does not yet enforce dynamic role-based navigation. It creates the data model that later releases will use for role-aware dashboards, permissions and Pulse weighting.

## Suggested commit
```bash
git add .
git commit -m "release(v0.9.11): add practice administration foundation"
git push
git tag v0.9.11
git push origin v0.9.11
```
