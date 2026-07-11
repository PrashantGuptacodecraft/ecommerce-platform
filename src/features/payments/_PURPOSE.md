# features/payments
Domain module for payments. components/ = thin client-side presentation specific
to this domain (not generic enough for components/ui). hooks/ = client-side
state/data hooks. actions/ = Server Actions / mutation entry points, Zod
validated, calling into services/ for real logic -- this is where auth and
validation checks happen, not inside services/. types/ = domain types + Zod
schemas shared between actions, hooks, and components.
