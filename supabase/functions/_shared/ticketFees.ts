/** Citipilot platform fee: $0.50 per order + 3.5% of ticket subtotal */
export function platformFeeCents(subtotalCents: number): number {
  return Math.round(subtotalCents * 0.035) + 50;
}

export function buyerTotalCents(unitPriceCents: number, quantity: number): number {
  const subtotal = unitPriceCents * quantity;
  return subtotal + platformFeeCents(subtotal);
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
