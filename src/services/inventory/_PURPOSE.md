# Inventory service
reserveStock(), commitStock(), releaseStock(), recordMovement() -- all
transactional, all backed by the inventory_transactions ledger. The ONLY
place stock_quantity is ever mutated.
