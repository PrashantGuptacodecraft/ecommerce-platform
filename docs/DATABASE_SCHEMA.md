# Database Schema (Supabase / PostgreSQL)

Identifier strategy: **UUID v4** primary keys everywhere (`gen_random_uuid()`).
All monetary columns store **integer paise** (`price_paise`, `total_paise`, …).
All tables have `created_at timestamptz default now()`; mutable tables also
have `updated_at` maintained by a trigger. Migrations live in
`supabase/migrations/*.sql`, numbered sequentially — this file is the
human-readable spec they implement.

## 1. Entity list (Phase 1)

```
admin_profiles          customers               orders
categories               addresses               order_items
products                 carts                    payments
product_images           cart_items               shipments
product_options          inventory_transactions   store_settings
product_option_values    admin_audit_logs         webhook_events
product_variants
variant_option_values
```

## 2. Table specs

### admin_profiles
Trusted, server-managed role record — **never** derived from Supabase Auth
client-editable metadata.
| column | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` (1:1) |
| full_name | text | |
| role | text | check in `('admin')` — Phase 4 extends to staff roles table |
| is_active | boolean default true | disable without deleting the auth user |
| created_at / updated_at | timestamptz | |

### categories
| id (PK) | name | slug (unique) | description | image_url | sort_order | is_active | seo_title | seo_description | created_at | updated_at |

### products
| id (PK) | name | slug (unique) | description | short_description | category_id (FK→categories) | base_price_paise | compare_at_price_paise (nullable) | fabric | care_instructions | fit_info | size_chart (jsonb) | is_active | is_featured | is_new_arrival | seo_title | seo_description | created_at | updated_at |

- `compare_at_price_paise > base_price_paise` check constraint when present (discount display).
- Index on `slug`, `category_id`, `is_active`, `(is_featured, is_active)`, `(is_new_arrival, is_active)`.

### product_images
| id (PK) | product_id (FK) | storage_path | alt_text | sort_order | is_primary | created_at |

- Unique partial index: at most one `is_primary = true` per `product_id`.

### product_options / product_option_values
Generic, not hardcoded to "size"/"colour" only — future-proof for e.g. length.
```
product_options:        id, product_id (FK), name ('Size' | 'Colour' | ...), sort_order
product_option_values:  id, product_option_id (FK), value ('M' | 'Black' | ...), sort_order
```

### product_variants
| id (PK) | product_id (FK) | sku (unique) | stock_quantity (int, check >= 0) | price_adjustment_paise (default 0) | is_active | image_id (FK→product_images, nullable) | created_at | updated_at |

### variant_option_values
Join table mapping a variant to its option values (e.g. variant X → {Size: M, Colour: Black}).
| variant_id (FK) | option_value_id (FK) | — composite PK |

### inventory_transactions
Append-only ledger. Never delete rows.
| id (PK) | variant_id (FK) | change_quantity (int, signed) | reason (enum) | reference_type (text: 'order' \| 'manual' \| 'return') | reference_id (uuid, nullable) | note | created_by (FK→admin_profiles, nullable) | created_at |

`reason` enum: `initial_stock, manual_adjustment, order_reservation, order_completed, order_cancellation, return, damaged_item`.

### customers *(Phase 1: minimal, mostly for future Phase 3 linkage)*
| id (PK) | phone (unique, nullable) | email (unique, nullable) | full_name | created_at |

Phase 1 does not require account creation; guest orders may or may not link
here by matched phone/email for future convenience — schema present now,
UI/accounts deferred to Phase 3.

### addresses
| id (PK) | customer_id (FK, nullable) | full_name | phone | email | address_line1 | address_line2 | landmark | city | state | postal_code | country default 'IN' | created_at |

### carts / cart_items
Server-persisted representation used only for **re-validation**, not as the
pricing source of truth.
```
carts:       id (PK), session_token (unique), customer_id (FK, nullable), created_at, updated_at
cart_items:  id (PK), cart_id (FK), variant_id (FK), quantity (check > 0), created_at, updated_at
```

### orders
| id (PK) | order_number (unique, human-readable e.g. SN-0001) | customer_id (FK, nullable) | address_id (FK) | status (enum, see below) | payment_method ('razorpay' \| 'cod') | subtotal_paise | shipping_paise | discount_paise default 0 | total_paise | notes | created_at | updated_at |

Order status enum (superset covering both payment methods):
```
PENDING_PAYMENT, PENDING_CONFIRMATION, CONFIRMED, PROCESSING, PACKED,
SHIPPED, DELIVERED, CANCELLED, PAYMENT_FAILED, RETURN_REQUESTED, RETURNED
```

### order_items
Immutable price/product **snapshot** — editing a product later must never
change historical orders.
| id (PK) | order_id (FK) | product_id (FK, nullable — kept for reporting even if product later deleted) | variant_id (FK, nullable) | product_name_snapshot | product_slug_snapshot | product_image_snapshot | sku_snapshot | size_snapshot | colour_snapshot | unit_price_paise_snapshot | quantity | line_total_paise | created_at |

### payments
| id (PK) | order_id (FK) | provider ('razorpay' \| 'cod') | razorpay_order_id (nullable) | razorpay_payment_id (nullable) | razorpay_signature (nullable, never logged raw) | status ('created','authorized','captured','failed','refunded') | amount_paise | raw_event_ref (FK→webhook_events, nullable) | created_at | updated_at |

Unique constraint on `razorpay_payment_id` where not null (idempotency guard).

### shipments
Manual in Phase 1; same table serves Shiprocket in Phase 2 via `provider` column.
| id (PK) | order_id (FK) | provider ('manual' \| 'shiprocket') | courier_name | tracking_number | tracking_url (nullable) | status | shipped_at | delivered_at | created_at | updated_at |

### store_settings
Single-row (or key/value) configuration table — admin-editable, drives
flat shipping charge, free-shipping threshold, brand contact info, active
shipping provider, COD availability toggle.
| key (PK, text) | value (jsonb) | updated_at |

### admin_audit_logs
| id (PK) | admin_id (FK) | action (text) | entity_type | entity_id | metadata (jsonb) | created_at |

### webhook_events
Idempotency + audit trail for Razorpay webhooks.
| id (PK) | provider ('razorpay') | event_id (unique) | event_type | payload (jsonb) | processed_at (nullable) | created_at |

## 3. RLS policy intent (implemented per-table in migrations)

| Table | Public (anon) | Authenticated customer | Admin (server-verified) |
|---|---|---|---|
| categories, products, product_images, product_options/values, product_variants, variant_option_values | SELECT where `is_active = true` (products/categories) | same as public | full CRUD via service-role / verified admin actions only |
| inventory_transactions | none | none | SELECT/INSERT via server actions only |
| carts, cart_items | INSERT/UPDATE/SELECT scoped to own `session_token` (no cross-session read) | same, scoped to own cart | full read for support/debug |
| orders, order_items, addresses, payments | **no direct client SELECT** — created only via server (service-role) logic inside `services/orders`; guest lookup via order tracking endpoint uses a signed lookup token, not a raw table read | none in Phase 1 (no accounts yet) | full SELECT/UPDATE |
| shipments | none direct | none | full CRUD |
| store_settings | SELECT of public-safe subset only (shipping threshold, contact info) via a view; full row not exposed | same | full CRUD |
| admin_profiles | none | none | admin can read own profile only |
| admin_audit_logs | none | none | insert via server actions; read-only in admin UI |
| webhook_events | none | none | service-role only (webhook handler), never exposed to admin UI directly beyond a read-only debug view |

**Key rule:** Storage (product images) bucket allows public `SELECT`
(read), but `INSERT`/`UPDATE`/`DELETE` require the caller to be an
authenticated user whose `admin_profiles.role = 'admin'` and
`is_active = true` — checked via a Postgres policy function, not just
Storage's default auth check.

## 4. Constraints & integrity rules to encode in migrations

- `product_variants.stock_quantity >= 0` (check constraint) — belt-and-braces
  alongside application-level transaction control.
- Stock decrements happen only via a `SECURITY DEFINER` Postgres function
  (e.g. `reserve_variant_stock(variant_id, qty)`) that atomically checks and
  decrements within the same transaction as order creation — never a
  read-then-write from the app layer.
- `order_items` snapshot columns are `NOT NULL` except the FK references,
  which may become null if the source product/variant is later deleted —
  the snapshot data survives independently.
- Foreign keys use `ON DELETE RESTRICT` for anything referenced by
  historical orders/payments; `ON DELETE CASCADE` only for genuinely
  dependent child rows (e.g. `product_images` → `products`).

## 5. Future entities (Phase 2–4, not created in Phase 1 migrations)

```
customer_accounts   wishlists         wishlist_items      coupons
coupon_redemptions  return_requests   return_items         refunds
notifications        staff_roles       staff_permissions   abandoned_carts
reviews
```

These are documented here so column-naming and FK conventions used in
Phase 1 remain compatible (e.g. `orders.customer_id` already nullable and
UUID-typed, ready for `customer_accounts.id`).
