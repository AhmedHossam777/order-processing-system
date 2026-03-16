# Idempotency in the Saga

## What is the problem?

In a message-driven system, **the same event can be delivered more than once**. For example:

- The consumer processes the message, but crashes **before** sending `ack` → RabbitMQ redelivers.
- Network issues cause a duplicate publish.
- A bug or retry policy causes the publisher to send the same event twice.

If your handler is **not idempotent**, processing the same event twice can cause:

| Service   | Event            | Without idempotency                          |
|-----------|------------------|----------------------------------------------|
| Payments  | OrderCreated     | Two payments for one order, double charge.  |
| Payments  | InventoryFailed  | Refund executed twice (or error on 2nd run).|
| Inventory | PaymentSuccess   | Two reservations for one order (double stock).|
| Orders    | InventoryReserved| `updateStatus(COMPLETED)` twice → OK (same result).|

So: **idempotency = processing the same logical event multiple times has the same effect as processing it once.**

---

## How we implemented it

We use **“already processed?” checks** before doing the work. The key is: **one order = one payment, one reservation.**

### Payments – `processOrderPayment(OrderCreatedEvent)`

- **Before:** Create payment and emit success/failed.
- **Now:** Check if a payment for this `orderId` already exists. If yes → skip (log and return). If no → do the same as before.

So duplicate `OrderCreated` deliveries only result in one payment and one set of downstream events.

### Payments – `refundPayment(InventoryFailedEvent)`

- **Before:** Find payment by `orderId` + `status: SUCCESS`, then set REFUNDED and emit.
- **Now:** Find payment by `orderId`. If not found → throw (nack, retry). If `status === 'REFUNDED'` → skip (already refunded). Else if SUCCESS → refund and emit.

So duplicate `InventoryFailed` deliveries don’t double-refund or throw “payment not found” after the first refund.

### Inventory – `reserveStock(PaymentSuccessEvent)`

- **Before:** Create reservation and emit reserved/failed.
- **Now:** Check if a reservation for this `orderId` already exists. If yes → skip. If no → run the same logic as before.

So duplicate `PaymentSuccess` deliveries only result in one reservation and one set of downstream events.

### Orders – status updates

- `updateOrderStatus(orderId, 'COMPLETED')` (and FAILED/CANCELLED) is already idempotent: calling it twice leaves the same final state.

---

## Optional: stronger guarantees

- **Idempotency key table:** Store `(orderId, eventType)` or a message ID and skip if already seen (handles duplicates even across different event types if needed).
- **Unique DB constraint:** e.g. `UNIQUE(orderId)` on `payments` and `reservations` so duplicate inserts fail safely; then handle the “already exists” case in code (skip + ack).

The current “check by orderId / status” approach is enough for your saga and is a standard way to get idempotent handlers.
