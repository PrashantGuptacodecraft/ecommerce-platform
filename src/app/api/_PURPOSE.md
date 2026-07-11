# API routes
Only for things Server Actions can't cleanly do: webhooks (need raw body),
and endpoints called from Client Components that need a stable HTTP
contract (e.g. the Razorpay widget's client-side callback path).
