/**
 * Controlled admin-account creation — the ONLY way an admin is created in
 * Phase 1. There is no public admin signup route (docs/SECURITY_MODEL.md §1).
 *
 *   npm run create-admin -- --email you@yourstore.in [--name "Your Name"]
 *
 * Creates the Supabase Auth user AND its admin_profiles row in one step using
 * the service-role key. The password is prompted interactively (masked) — it is
 * NEVER accepted as a CLI argument, so it never lands in shell history.
 * Enforces the 12-character minimum from the security model.
 *
 * Standalone Node program (run via tsx); builds its own Supabase client rather
 * than importing the `server-only`-guarded admin.ts.
 */
import readline from 'node:readline'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import type { Database } from '../../src/types/database'

loadEnv({ path: '.env.local' })

const MIN_PASSWORD_LENGTH = 12

// readline.Interface exposes an internal `_writeToOutput` hook we override to
// mask typed characters. Typed here (rather than `any`/`@ts-ignore`) so strict
// mode is satisfied while still reaching the internal method.
type MaskableInterface = readline.Interface & {
  _writeToOutput?: (stringToWrite: string) => void
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Set it in .env.local.`)
  }
  return value
}

function parseArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function promptHidden(query: string): Promise<string> {
  const rl: MaskableInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })
  return new Promise((resolve) => {
    let promptShown = false
    rl._writeToOutput = (stringToWrite: string) => {
      if (!promptShown) {
        process.stdout.write(query)
        promptShown = true
        return
      }
      // Mask everything the user types; still emit newlines so Enter works.
      if (stringToWrite.includes('\n') || stringToWrite.includes('\r')) {
        process.stdout.write('\n')
      } else {
        process.stdout.write('*')
      }
    }
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function main(): Promise<void> {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  const email = parseArg('--email')
  const fullName = parseArg('--name') ?? null

  if (!email || !isValidEmail(email)) {
    throw new Error('Provide a valid email: npm run create-admin -- --email you@yourstore.in')
  }

  const password = await promptHidden(`Password (min ${MIN_PASSWORD_LENGTH} chars): `)
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
  const confirm = await promptHidden('Confirm password: ')
  if (password !== confirm) {
    throw new Error('Passwords do not match.')
  }

  const db: SupabaseClient<Database> = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(`Creating admin auth user for ${email}…`)
  const { data: created, error: createErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createErr || !created.user) {
    throw new Error(`Could not create auth user: ${createErr?.message ?? 'unknown error'}`)
  }

  console.log('Linking admin_profiles row…')
  const { error: profileErr } = await db.from('admin_profiles').upsert(
    {
      id: created.user.id,
      full_name: fullName,
      role: 'admin',
      is_active: true,
    },
    { onConflict: 'id' },
  )
  if (profileErr) {
    throw new Error(`Auth user created but admin_profiles insert failed: ${profileErr.message}`)
  }

  console.log(`✓ Admin account ready: ${email}`)
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`create-admin failed: ${message}`)
  process.exit(1)
})
