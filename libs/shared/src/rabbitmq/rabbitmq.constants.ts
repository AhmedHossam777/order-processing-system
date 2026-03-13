export const RABBITMQ_URL = 'amqp://admin:password@localhost:5672';

// Queues names
export const ORDER_QUEUE = 'order_event_queue';
export const PAYMENT_QUEUE = 'payment_event_queue';
export const NOTIFICATION_QUEUE = 'notifaction_event_queue';

// Routing keys
export const ROUTING_KEYS = {
  ORDER_CREATED: 'order.created',
  ORDER_NOTIFICATION: 'order.notification',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
};

// Injection tokens
export const PAYMENT_CLIENT = 'PAYMENT_CLIENT';
export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';
