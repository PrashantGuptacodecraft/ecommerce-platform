# Deployment (Vercel)

## 1. Pre-deployment checklist

- [ ] `npm run lint && npm run type-check && npm run test && npm run build`
      all pass locally
- [ ] Playwright suite passes locally against a staging Supabase project
- [ ] `.env.example` reflects every environment variable the app actually
      reads (no undocumented env var)
- [ ] No secret committed anywhere in git history
- [ ] Supabase migrations applied to the production project
- [ ] Seed data reviewed (real product data, not placeholder content, if
      going live for real; placeholder seed is fine for a staging deploy)
- [ ] Razorpay webhook URL will point at the real production domain
      (update in the Razorpay dashboard **after** the domain is live)

## 2. Vercel project setup

1. Import the repository into Vercel.
2. Framework preset: Next.js (auto-detected).
3. Set environment variables in the Vercel dashboard (Production +
   Preview separately where values differ, e.g. Razorpay test vs live
   keys):
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY        (server-only — do not expose)
   RAZORPAY_KEY_ID
   RAZORPAY_KEY_SECRET              (server-only)
   NEXT_PUBLIC_RAZORPAY_KEY_ID
   RAZORPAY_WEBHOOK_SECRET          (server-only)
   RESEND_API_KEY  (or SMTP_HOST/PORT/USER/PASS)
   EMAIL_FROM_ADDRESS
   SITE_URL
   ```
4. Deploy.

## 3. Post-deployment

- [ ] Update the Razorpay webhook endpoint to
      `https://<production-domain>/api/webhooks/razorpay`
- [ ] Verify security headers are present on a live response (CSP, HSTS,
      X-Frame-Options, etc.) — check via browser devtools or a header
      inspection tool
- [ ] Run a real (test-mode) Razorpay checkout end-to-end on production
- [ ] Run a real COD checkout end-to-end on production
- [ ] Confirm admin login works and non-admin accounts cannot reach
      `/admin/*`
- [ ] Confirm transactional emails are actually delivered (check spam
      folder placement too)
- [ ] Submit sitemap to Google Search Console

## 4. Ongoing

- Keep `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` out of any
  Vercel preview deployment that could be publicly shared, or scope
  preview environments to test-mode credentials only.
- Rotate keys if ever suspected of exposure (e.g. accidentally committed,
  then removed from history — rotate anyway, history scrubbing is not
  sufficient on its own).
- Re-run the pre-deployment checklist before every production release,
  not just the first one.
