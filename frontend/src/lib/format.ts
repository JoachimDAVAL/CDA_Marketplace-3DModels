export function formatPrice(price: string): string {
  const n = parseFloat(price)
  return n === 0 ? 'Gratuit' : `${n.toFixed(2)} €`
}

export function shortId(id: string): string {
  return `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}
