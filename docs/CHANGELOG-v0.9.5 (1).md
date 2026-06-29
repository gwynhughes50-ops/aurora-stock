# MedTrak+ Changelog

## v0.9.5 - Purchasing Integration Model

### Added
- Purchasing module tabs:
  - Basket
  - Purchase Orders
  - Deliveries
  - Supplier Performance
- Integration-ready supplier ordering model.
- Purchase order submission fields for manual, email, portal, CSV, API and EDI workflows.
- Supplier Directory fields for ordering method, portal, API provider, account number and lead time.
- Purchase order actions:
  - Ready
  - Mark Submitted
  - Awaiting Delivery
  - Mark Delivery Complete
- Early supplier performance summary based on purchase order history.

### Improved
- Purchase orders now explicitly support one supplier with multiple items.
- Purchasing Basket groups approved reorder requests by supplier.
- Supplier information is carried into purchase orders for future automation.

### Deferred
- Direct API/EDI supplier submission.
- PDF purchase order generation.
- Goods receiving with automatic stock update.
- Partial delivery handling.
- Invoice matching.
