# Razorpay Setup

## 1. Test mode first

Always implement and test against Razorpay's **test mode** keys before any
live-mode credential is introduced. Never put real payment credentials in
source files, examples, or automated tests.

1. Create a Razorpay account, switch to **Test Mode**.
2. Generate a Test API Key ID + Key Secret.
3. Set:
   ```
   RAZORPAY_KEY_ID=
   RAZORPAY_KEY_SECRET=
   NEXT_PUBLIC_RAZORPAY_KEY_ID=   # publishable key id only — safe for client
   ```
   `RAZORPAY_KEY_SECRET` is server-only and must never be referenced from a
   Client Component or appear in any `NEXT_PUBLIC_*` variable.

## 2. Payment flow implementation order

Follow `SECURITY_MODEL.md` §2 exactly:

1. Server validates cart/stock/address and computes the order total in
   integer paise.
2. Server creates the pending order row.
3. Server calls Razorpay's Orders API using that server-computed amount.
4. Client renders the Razorpay Checkout widget using the returned
   `order_id` and the **publishable** key only.
5. On completion, the client sends `razorpay_order_id`,
   `razorpay_payment_id`, `razorpay_signature` to
   `/api/payments/razorpay/verify`.
6. Server recomputes the expected signature
   (`HMAC_SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)`) and
   compares — only then is the order shown as paid to the customer.
7. **Independently**, configure a webhook (see below) that is the
   authoritative source of truth for payment state.

## 3. Webhook configuration

1. In the Razorpay dashboard, add a webhook pointing to
   `https://<your-domain>/api/webhooks/razorpay`.
2. Subscribe at minimum to: `payment.captured`, `payment.failed`,
   `order.paid`.
3. Generate a **Webhook Secret**, set:
   ```
   RAZORPAY_WEBHOOK_SECRET=
   ```
4. The webhook route handler must read the **raw request body** (do not
   let a body-parsing middleware transform it first) to compute the
   signature — Razorpay signs the exact raw bytes.
5. Verify `x-razorpay-signature` against
   `HMAC_SHA256(raw_body, RAZORPAY_WEBHOOK_SECRET)`.
6. Check `webhook_events` for an existing row with the same `event_id`
   before processing — if found, return 200 without reprocessing
   (idempotency; Razorpay retries webhook delivery on non-2xx or timeout).
7. On successful, new-event processing: update `payments.status`, update
   `orders.status`, commit or release inventory accordingly.

## 4. Local webhook testing

Use the Razorpay CLI or a tunneling tool (e.g. `ngrok`) to receive webhook
calls locally during development. Never point a production webhook secret
at a local tunnel.

## 5. Handling edge cases

| Scenario | Handling |
|---|---|
| Client closes tab before redirect completes | Webhook still arrives and resolves the order asynchronously; order starts `PENDING_PAYMENT` and later moves to `CONFIRMED`/`PAYMENT_FAILED` |
| Duplicate webhook delivery | No-op via `webhook_events.event_id` uniqueness |
| Signature verification fails | Reject with 400, log the attempt (no secret values), do not mutate order state |
| Payment captured but order was already cancelled (e.g. stock ran out in the interim) | Flag for manual admin review rather than silently auto-refunding in Phase 1 (automated refunds are a Phase 4 feature) |

## 6. Going live (future, not Phase 1 default)

Switching to live-mode keys is a deliberate, separate step outside this
scaffold — requires KYC completion on the Razorpay account and careful
re-verification of the webhook URL/secret for the production domain.
