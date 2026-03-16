export const RABBITMQ_URL = 'amqp://admin:password@localhost:5672';

// Queues names
export const ORDER_QUEUE = 'order_event_queue';
export const PAYMENT_QUEUE = 'payment_event_queue';
export const NOTIFICATION_QUEUE = 'notification_event_queue';
export const INVENTORY_QUEUE = 'inventory_events_queue';

// Routing keys
export const ROUTING_KEYS = {
  ORDER_CREATED: 'order.created',
  ORDER_NOTIFICATION: 'order.notification',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_FAILED: 'inventory.failed',
};

// Injection tokens
export const PAYMENT_CLIENT = 'PAYMENT_CLIENT';
export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';
export const ORDER_CLIENT = 'ORDER_CLIENT';
export const INVENTORY_CLIENT = 'INVENTORY_CLIENT';
