# Stock Manager UI Template

This repo is a **frontend template** for a stock / inventory management system
(multi-site, healthcare-friendly) that you can reuse for future projects.

It is not a fully wired app, but it contains:

- Layout shell with navigation, user menu, and alert badge
- Types and JSON schema for `StockItem`
- An improved mobile barcode scanner component
- Original raw code you uploaded (dashboard, inventory, audit, etc.) in `/raw`
- Design notes so you can keep a consistent look & feel

## Folder Structure

```text
stock-manager-template/
├─ .gitignore
├─ README.md
├─ raw/
│  ├─ dashboard.txt
│  ├─ inventory.txt
│  └─ componenets.txt
├─ docs/
│  ├─ DESIGN.md
│  └─ BARCODE_SCANNER.md
└─ src/
   ├─ layout/
   │  └─ Layout.tsx
   ├─ types/
   │  ├─ StockItem.schema.json
   │  └─ stock.ts
   └─ components/
      └─ stock/
         └─ MobileBarcodeScanner.tsx
```

You can initialise this as a GitHub repo:

```bash
cd stock-manager-template
git init
git add .
git commit -m "Initial stock manager UI template"
git remote add origin <your-repo-url>
git push -u origin main
```

## Using in a new project

1. Create a new React + TypeScript + Tailwind project (e.g. with Vite).
2. Copy the `src/` folder from this template into your new project.
3. Install required deps (example):
   - `@tanstack/react-query`
   - `react-router-dom`
   - `lucide-react`
   - Your UI kit (e.g. shadcn/ui)
   - `@zxing/browser` (for the barcode scanner)
4. Wire `Layout.tsx` around your routes.
5. Implement the missing pieces like:
   - `base44` client
   - `PermissionsProvider`
   - `navigation` + `createPageUrl`
   - Actual page components (Dashboard, Inventory, Alerts, etc.) using your raw code.
