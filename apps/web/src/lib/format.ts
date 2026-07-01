export function formatPrice(priceMinor: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(priceMinor / 100);
}
