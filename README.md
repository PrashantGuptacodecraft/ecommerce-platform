# Premium Clothing E-Commerce Platform (India) — Project Scaffold

> This repository is a **planning + file-structure scaffold**. No application
> code has been written yet. It is designed to be opened in VS Code and
> implemented by Claude (Opus 4.8 or similar) folder-by-folder, milestone-by-milestone,
> following the documents in `/docs`.

## What this is

A production-grade, mobile-first, premium clothing e-commerce platform for an
Indian D2C clothing shop, built to a **Phase 1 (~₹20,000 scope)** feature set,
on an architecture that can grow to a **Phase 4 (~₹80,000 scope)** system
without a rewrite.

## Start here (in order)

1. `docs/PROJECT_BRIEF.md` — what we're building and why
2. `docs/ARCHITECTURE.md` — system design, module boundaries, data flow
3. `docs/DATABASE_SCHEMA.md` — full schema + RLS policy intent
4. `docs/SECURITY_MODEL.md` — auth, payments, RLS, headers, threat model
5. `docs/PHASE_ROADMAP.md` — Phase 1 → Phase 4 feature map
6. `docs/PHASE_1_SCOPE.md` — exact Phase 1 boundary (in/out)
7. `docs/phases/PHASE_1_IMPLEMENTATION_CHECKLIST.md` — build order, milestone by milestone
8. `docs/DECISIONS.md` — assumptions & placeholder decisions made so far
9. `docs/PROGRESS.md` — living log, update after every milestone

## Tech stack (Phase 1)

Next.js (App Router) · TypeScript (strict) · React · Tailwind CSS ·
`motion/react` · Supabase (Postgres + Auth + Storage) · Zod ·
React Hook Form · Razorpay · Resend/SMTP email · Vercel · Vitest · Playwright

## Repository status

- [x] Folder structure scaffolded
- [x] Architecture, schema, security, roadmap documented
- [ ] Dependencies installed (`package.json` not yet created — do this first in VS Code)
- [ ] Supabase project created
- [ ] Migrations written
- [ ] Phase 1 implementation started

## Local setup (once implementation begins)

See `docs/SUPABASE_SETUP.md`, `docs/RAZORPAY_SETUP.md`, and `docs/DEPLOYMENT.md`.
Copy `.env.example` to `.env.local` and fill in real values — **never commit `.env.local`**.

## Folder map

See `docs/ARCHITECTURE.md` §3 for the annotated full tree. Every folder in
`src/`, `supabase/`, and `tests/` contains a `_PURPOSE.md` explaining exactly
what belongs there, so implementation in VS Code stays on-architecture.
