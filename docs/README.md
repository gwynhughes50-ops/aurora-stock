# MedTrak+ v0.9.3 Inventory Supplier Integration

## What this release contains

This package contains a corrected and working `Inventory.jsx` file with supplier integration added safely.

## Files included

- `src/pages/Inventory.jsx`
- `CHANGELOG.md`
- `docs/firestore-supplier-rules.md`

## Install

1. Back up your current file:
   - `src/pages/Inventory.jsx`
2. Copy the included `src/pages/Inventory.jsx` into your project.
3. Make sure your Firestore rules include access to the `suppliers` collection.
4. Restart Vite:

```bash
Ctrl + C
npm run dev
```

## Test checklist

- Inventory page loads.
- Stock cards display correctly.
- Edit item dialog opens.
- Supplier dropdown appears in edit item.
- Selecting a supplier saves supplier details to the stock item.
- Existing stock actions still work: Use, Receive, History, Photo, Archive, Restore.
- Emergency Drugs and Anaphylaxis tabs still open.

## Suggested commit

```bash
git add .
git commit -m "feat: link inventory items to suppliers"
git push
```
