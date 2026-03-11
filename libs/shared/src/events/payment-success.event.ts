export class PaymentSuccessEvent {
  constructor(
    public readonly orderId: string,
    public readonly amount: number,
    public readonly userId: string,
    public readonly transactionId: string,
  ) {}
}
