# 🛒 Order Processing System

A distributed **microservices-based order processing system** built with NestJS, implementing **Event Sourcing**, **CQRS**, and **Saga-based orchestration** via RabbitMQ.

## Architecture Overview

```
┌──────────────┐     RabbitMQ      ┌──────────────────┐
│              │  order.created    │                  │
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

The Orders service separates **writes** from **reads**:

| Side | Storage | Purpose |
|------|---------|---------|
| **Write** | `orders_events` (append-only event store) | Source of truth — records every state change |
| **Read** | `orders_view` (projected read model) | Flattened, query-optimized view of current state |

### Event Sourcing

Instead of storing just the current state, every state change is captured as an **immutable event**:

- `ORDER_CREATED` → new order placed
- `ORDER_COMPLETED` → inventory reserved successfully
- `ORDER_FAILED` → payment failed
- `ORDER_CANCELLED` → payment refunded

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

## Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (monorepo)
- **Language**: TypeScript
- **Message Broker**: RabbitMQ
- **Database**: PostgreSQL (one per service)
- **ORM**: TypeORM
- **Architecture**: Microservices, CQRS, Event Sourcing, Saga

## Project Structure

```
order-processing-system/
├── apps/
│   ├── orders/          # Order management + CQRS/Event Sourcing
│   ├── payments/        # Payment processing
│   ├── inventory/       # Stock management
│   └── notifications/   # Email/notification handling
├── libs/
│   └── shared/          # Shared events, constants, DTOs
└── docker-compose.yaml  # RabbitMQ + 4 PostgreSQL databases
```

### Orders Service (CQRS Architecture)

```
orders/
├── domain/
│   └── order-doman-events.ts          # Domain event types & payload interfaces
├── entities/
│   ├── order-event.entity.ts          # Event store table (append-only)
│   └── order-view.entity.ts           # Read model table (projected)
├── services/
│   ├── order-event-store.service.ts   # Append & load events
│   └── order-projection.service.ts    # Apply events → update read model
├── orders.controller.ts               # HTTP + RabbitMQ event handlers
├── orders.service.ts                  # Business logic (create order)
└── order-admin.controller.ts          # Admin: replay/rebuild projection
```

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
- **Orders DB** on `localhost:5433`
- **Payments DB** on `localhost:5434`
- **Notifications DB** on `localhost:5435`
- **Inventory DB** on `localhost:5436`

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
  ├─ 1. Append ORDER_CREATED to event store
  ├─ 2. Project to read model (status: PENDING)
  ├─ 3. Publish to payment queue
  └─ 4. Publish to notification queue
         │
         ▼
   Payment Service
         │
    ┌────┴────┐
    │         │
 success    failed
    │         │
    ▼         ▼
 Inventory  ORDER_FAILED
 Service    (event stored + projected)
    │
 ┌──┴──┐
 │     │
 ok   failed
 │     │
 ▼     ▼
ORDER  Payment refund
COMPLETED  → ORDER_CANCELLED
```

## License

MIT
