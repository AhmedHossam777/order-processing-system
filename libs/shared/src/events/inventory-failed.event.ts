export class InventoryFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly product: string,
    public readonly reason: string,
  ) {}
}
