# Supabase clients
client.ts (browser, anon key), server.ts (server component/action, cookie-based
session), admin.ts (service-role, SERVER-ONLY -- import-guarded so it can
never end up in a Client Component bundle).
