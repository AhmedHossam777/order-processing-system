# Order Processing System

A distributed **microservices-based order processing system** built with NestJS, implementing **Event Sourcing**, **CQRS**, and **Saga-based orchestration** via RabbitMQ.

## Architecture Overview

```
┌──────────────┐     RabbitMQ     ┌──────────────────┐
│              │  order.created   │                  │
│   Orders     │ ───────────────► │    Payments      │
│   Service    │                  │    Service       │
│  (port 3000) │ ◄─────────────── │   (port 3001)    │
│              │ payment.success  │                  │
│              │ payment.failed   └──────────────────┘
│              │                         │
│              │                  payment.success
│              │                         │
│              │                         ▼
│              │                  ┌──────────────────┐
│              │ inventory.*      │                  │
│              │ ◄─────────────── │   Inventory      │
│              │                  │   Service        │
│              │                  │  (port 3003)     │
│              │                  └──────────────────┘
│              │
│              │  order.notification
│              │ ───────────────► ┌──────────────────┐
│              │                  │  Notifications   │
└──────────────┘                  │    Service       │
                                  │   (port 3002)    │
                                  └──────────────────┘
```

## Key Concepts

### CQRS (Command Query Responsibility Segregation)

The Orders service separates **writes** from **reads** using the `@nestjs/cqrs` module:

| Side | Storage | Purpose |
|------|---------|---------|
| **Write (Commands)** | `orders_events` (append-only event store) | Source of truth — records every state change |
| **Read (Queries)** | `orders_view` (projected read model) | Flattened, query-optimized view of current state |

**Commands** (write side):

| Command | Description |
|---------|-------------|
| `CreateOrderCommand` | Creates a new order, appends `ORDER_CREATED` event, publishes to payment and notification queues |
| `CompleteOrderCommand` | Marks order as completed when inventory is successfully reserved |
| `FailOrderCommand` | Marks order as failed when payment is declined |
| `CancelOrderCommand` | Marks order as cancelled when inventory fails (triggers payment refund) |

**Queries** (read side):

| Query | Description |
|-------|-------------|
| `GetAllOrdersQuery` | Lists all orders from the projected read model |
| `GetOrderByIdQuery` | Fetches a single order by ID from the read model |

### Event Sourcing

Instead of storing just the current state, every state change is captured as an **immutable event**:

- `ORDER_CREATED` — new order placed
- `ORDER_COMPLETED` — inventory reserved successfully
- `ORDER_FAILED` — payment failed
- `ORDER_CANCELLED` — payment refunded after inventory failure

The read model can be **rebuilt at any time** by replaying all events via `POST /admin/orders/replay`.

### Saga Pattern

Order processing follows an event-driven saga across services:

```
1. Order Created → Payment Service processes payment
2. Payment Success → Inventory Service reserves stock
3. Inventory Reserved → Order marked COMPLETED
   Payment Failed → Order marked FAILED
   Inventory Failed → Payment refunded → Order marked CANCELLED
```

Compensating transactions ensure consistency: if inventory reservation fails, the payment is automatically refunded.

### Idempotency

Both the Payment and Inventory services implement idempotent message handling. Before processing an event, each service checks whether a record for that `orderId` already exists. This prevents duplicate charges or reservations when RabbitMQ delivers the same message more than once (at-least-once delivery).

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (monorepo)
- **Language**: TypeScript
- **CQRS**: @nestjs/cqrs
- **Message Broker**: RabbitMQ (AMQP 0.9.1)
- **Database**: PostgreSQL 16 (one instance per service)
- **ORM**: TypeORM
- **Architecture**: Microservices, CQRS, Event Sourcing, Saga

## Project Structure

```
order-processing-system/
├── apps/
│   ├── orders/            # Order management + CQRS / Event Sourcing
│   ├── payments/          # Payment processing (80% success simulation)
│   ├── inventory/         # Stock reservation (70% availability simulation)
│   └── notifications/     # Notification handling (simulated email)
├── libs/
│   └── shared/            # Shared events, constants, DTOs, injection tokens
├── docker-compose.yaml    # RabbitMQ + 4 PostgreSQL databases
├── nest-cli.json          # NestJS monorepo configuration
└── package.json
```

### Orders Service — CQRS Architecture

```
apps/orders/src/orders/
├── commands/
│   ├── impl/                              # Command classes
│   │   ├── create-order.command.ts
│   │   ├── complete-order.command.ts
│   │   ├── fail-order.command.ts
│   │   └── cancel-order.command.ts
│   └── handlers/                          # Command handlers
│       ├── create-order.handler.ts
│       ├── complete-order.handler.ts
│       ├── fail-order.handler.ts
│       └── cancel-order.handler.ts
├── queries/
│   ├── impl/                              # Query classes
│   │   ├── get-all-orders.query.ts
│   │   └── get-order-by-id.query.ts
│   └── handlers/                          # Query handlers
│       ├── get-all-orders.handler.ts
│       └── get-order-by-id.handler.ts
├── domain/
│   └── order-doman-events.ts              # Domain event types & payload interfaces
├── entities/
│   ├── order-event.entity.ts              # Event store table (append-only)
│   └── order-view.entity.ts               # Read model table (projected)
├── services/
│   ├── order-event-store.service.ts       # Append & load events
│   └── order-projection.service.ts        # Apply events → update read model
├── orders.controller.ts                   # HTTP endpoints + RabbitMQ event handlers
├── orders.service.ts                      # Legacy service (pre-CQRS)
└── order-admin.controller.ts              # Admin: replay/rebuild projection
```

### Service Databases

| Service | Port | Database | User |
|---------|------|----------|------|
| Orders | 5433 | `orders_db` | `orders_user` |
| Payments | 5434 | `payments_db` | `payments_user` |
| Notifications | 5435 | `notifications_db` | `notifications_user` |
| Inventory | 5436 | `inventory_db` | `inventory_user` |

### Shared Library

Located at `libs/shared/src`, provides:

- **Events**: 8 event classes (`OrderCreatedEvent`, `PaymentSuccessEvent`, `PaymentFailedEvent`, `PaymentRefundedEvent`, `InventoryReservedEvent`, `InventoryFailedEvent`, `OrderCompletedEvent`, `OrderCancelledEvent`)
- **Constants**: RabbitMQ URL, queue names, routing keys, client injection tokens

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- **RabbitMQ** on `localhost:5672` (management UI: `localhost:15672`, user: `admin`, pass: `password`)
- **4 PostgreSQL** instances (ports 5433–5436)

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Services

Run each service in a separate terminal:

```bash
# Orders Service (port 3000)
nest start orders --watch

# Payments Service (port 3001)
nest start payments --watch

# Notifications Service (port 3002)
nest start notifications --watch

# Inventory Service (port 3003)
nest start inventory --watch
```

## API Endpoints

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create a new order |
| `GET` | `/orders` | List all orders (from read model) |
| `GET` | `/orders/:id` | Get order by ID (from read model) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/orders/replay` | Rebuild read model from event store |

### Create Order Example

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "product": "MacBook Pro",
    "quantity": 1,
    "price": 2499.99,
    "userId": "user-123"
  }'
```

## Event Flow

```
POST /orders
  │
  ├─ 1. CreateOrderCommand dispatched
  ├─ 2. Handler appends ORDER_CREATED to event store
  ├─ 3. Projects to read model (status: PENDING)
  ├─ 4. Publishes to payment queue
  └─ 5. Publishes to notification queue
         │
         ▼
   Payment Service (idempotent)
         │
    ┌────┴────┐
    │         │
 success    failed
    │         │
    ▼         ▼
 Inventory  FailOrderCommand
 Service    → ORDER_FAILED
    │         (event stored + projected)
 ┌──┴──┐
 │     │
 ok   failed
 │     │
 ▼     ▼
Complete  Payment refund
Order     → CancelOrderCommand
          → ORDER_CANCELLED
```

## Testing

```bash
npm run test           # Run unit tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # End-to-end tests
```

