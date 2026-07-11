# Razorpay payment service
Isolated from order/inventory logic. Exposes only what services/orders
needs: createOrderForAmount(), verifySignature(). Does not know about
carts, products, or shipping.
