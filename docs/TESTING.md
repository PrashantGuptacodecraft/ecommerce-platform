# Testing

## Philosophy

Phase 1 is not complete without tests (see `PHASE_1_SCOPE.md`'s definition
of done). Tests focus on the areas where a bug would cost money or trust:
pricing, stock, and payment verification.

## Unit / integration tests (Vitest) — `tests/unit`, `tests/integration`

Required coverage:

- Price calculation (subtotal, price adjustments per variant, total)
- Shipping charge calculation (flat rate + free-shipping threshold logic)
- Variant availability (inactive variant / zero stock cannot be added)
- Stock adjustment (reservation, commit, release — no negative stock)
- Order total generation (matches what checkout persisted)
- Razorpay signature verification (valid signature accepted, tampered
  signature rejected — using fixture data, never a real key)
- Webhook idempotency (duplicate `event_id` is a no-op)
- Authorization helpers (`requireAdmin()` rejects non-admin/unauthenticated
  callers)
- Input validation (Zod schemas reject malformed checkout/product payloads)

Run:
```bash
npm run test
```

## End-to-end tests (Playwright) — `tests/e2e`

Required critical-path coverage:

- Browse a product
- Select a valid variant
- Add to cart
- Change cart quantity
- Complete a Cash on Delivery checkout
- Attempt (and fail) to purchase an out-of-stock variant
- Admin login
- Admin creates or edits a product
- Admin updates an order status

Run:
```bash
npx playwright test
```

## Payment testing rules

- Never perform a real payment in automated tests.
- Use Razorpay test-mode fixtures/mocks in `tests/fixtures` for signature
  verification and webhook idempotency tests.
- If an end-to-end Razorpay flow is tested with Playwright, it should use
  Razorpay's documented test-mode card/UPI values in a controlled test
  environment only — never production credentials.

## Quality gate

All of the following must pass before a milestone is considered complete:

```bash
npm run lint
npm run type-check
npm run test
npm run build
npx playwright test
```

Fix the root cause of any failure. Do not disable a lint rule, add
`@ts-ignore`, or leave an empty `catch` block just to make a check pass —
these are treated as unresolved failures, not passes.
