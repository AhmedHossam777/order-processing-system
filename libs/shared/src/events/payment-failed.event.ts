export class PaymentFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly amount: number,
    public readonly userId: string,
    public readonly reason: string,
  ) {}
}