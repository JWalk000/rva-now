export function platformFeeCents(subtotalCents: number): number {
  return Math.round(subtotalCents * 0.035) + 50;
}

export function buyerTotalCents(unitPriceCents: number, quantity: number): number {
  const subtotal = unitPriceCents * quantity;
  return subtotal + platformFeeCents(subtotal);
}
