export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly product: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly userId: string,
  ) {}

  get totalPrice(): number {
    return this.quantity * this.price;
  }
}
