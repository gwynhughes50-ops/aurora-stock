# MedTrak+ Build v0.9.5 - Purchasing Integration Model

## Purpose
This build strengthens the Purchasing module and prepares MedTrak+ for future supplier ordering integrations.

## Updated files

- `src/pages/Purchasing.jsx`
- `src/pages/SupplierDirectory.jsx`
- `docs/CHANGELOG-v0.9.5.md`
- `docs/firestore-purchasing-rules.md`

## What changed

### Purchasing
- Adds a fuller Purchasing module with tabs for:
  - Basket
  - Purchase Orders
  - Deliveries
  - Supplier Performance
- Keeps the correct ERP model: one purchase order per supplier containing multiple items.
- Groups approved reorder requests by supplier.
- Creates purchase orders with multiple line items.
- Stores supplier submission data on purchase orders.
- Adds integration-ready fields:
  - `submission_method`
  - `submission_status`
  - `supplier_ordering_method`
  - `supplier_ordering_email`
  - `supplier_portal_url`
  - `external_order_reference`
  - `supports_auto_ordering`

### Suppliers
- Extends the Supplier Directory to support future external ordering routes:
  - Manual
  - Email
  - Supplier Portal
  - CSV Upload
  - API
  - EDI / NHS Procurement
- Adds supplier metadata:
  - contact name
  - phone
  - ordering email
  - portal URL
  - account number
  - lead time
  - delivery days
  - API provider
  - notes
  - preferred supplier
  - supports auto ordering
  - requires portal login

## Important note
This build does not send orders directly to suppliers yet. It prepares the internal data model so that email, portal, CSV, API, or EDI ordering can be added later without redesigning the purchasing workflow.

## Testing checklist

After installing:

1. Open Suppliers.
2. Add or update a supplier with an ordering method.
3. Open Purchasing.
4. Confirm approved reorder requests appear in supplier baskets.
5. Create a purchase order from a supplier basket.
6. Confirm one PO is created with multiple items.
7. Mark the PO Ready.
8. Mark the PO Submitted.
9. Mark it Awaiting Delivery.
10. Check Deliveries tab.
11. Confirm Inventory, Mobile, Reorder Centre and Dashboard still load.

## Recommended commit

```bash
git add .
git commit -m "release(v0.9.5): add integration-ready purchasing workflow"
git push
```

## Recommended tag

```bash
git tag v0.9.5
git push origin v0.9.5
```
