export const ORDER_DOMAIN_EVENT_TYPES = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_FAILED: 'ORDER_FAILED',
} as const;

export type OrderDomainEventType =
  (typeof ORDER_DOMAIN_EVENT_TYPES)[keyof typeof ORDER_DOMAIN_EVENT_TYPES];

export interface OrderCreatedDomainEventPayload {
  orderId: string;
  product: string;
  quantity: number;
  price: number;
  userId: string;
}

export interface OrderCompletedDomainEventPayload {
  orderId: string;
}

export interface OrderCancelledDomainEventPayload {
  orderId: string;
  reason: string;
}

export interface OrderFailedDomainEventPayload {
  orderId: string;
  reason: string;
}