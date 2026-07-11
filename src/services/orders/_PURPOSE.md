# Order service
createPendingOrder(), finalizeOrder(), cancelOrder() -- the ONLY place
order.status transitions happen. Keeps the Razorpay branch and the COD
branch clearly separate internally.
