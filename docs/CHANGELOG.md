# Changelog

## v0.9.3 - Inventory Supplier Integration

### Added

- Supplier list subscription from Firestore `suppliers` collection.
- Preferred supplier fields on stock items:
  - `preferred_supplier_id`
  - `preferred_supplier_name`
  - `supplier_sku`
  - `order_quantity`
  - `lead_time_days`
- Supplier Information section inside the Inventory edit item dialog.
- Supplier name and SKU display on stock cards.

### Fixed

- Rebuilt `Inventory.jsx` from a clean working baseline after the edit form state became corrupted during snippet-based editing.

### Preserved

- Barcode scanning.
- Stock use and receive actions.
- Stock history.
- Manual add item.
- Photo capture.
- Archive and restore.
- Emergency Drugs tab.
- Anaphylaxis Emergency Boxes tab.
