'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

/**
 * Newsletter signup — UI foundation only. There is no email-list backend in
 * Phase 1; on submit it acknowledges via a toast and clears. Wiring to a real
 * provider (or `store_settings`-driven WhatsApp CTA) is a later enhancement.
 */
export function NewsletterForm() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!email) return
        toast({
          title: 'Thanks for subscribing',
          description: 'We’ll send the occasional update — nothing more.',
          variant: 'success',
        })
        setEmail('')
      }}
      className="flex gap-2"
    >
      <Input
        type="email"
        required
        placeholder="Email address"
        aria-label="Email address"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button type="submit" variant="secondary">
        Subscribe
      </Button>
    </form>
  )
}
