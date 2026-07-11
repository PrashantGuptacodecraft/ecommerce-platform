# admin route group
Protected routes. layout.tsx enforces requireAdmin() server-side on every
request in this group -- this is the real gate, not a client-side check.
Sidebar navigation + admin chrome lives here.
