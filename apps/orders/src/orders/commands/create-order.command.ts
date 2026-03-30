export class CreateOrderCommand {
  constructor(
    public readonly product: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly userId: string,
  ) {}
}
