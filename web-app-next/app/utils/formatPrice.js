export function formatPricePKR(pricePKR, currency) {
  if (currency === 'PKR' || !currency) return `PKR ${Number(pricePKR || 0).toLocaleString()}`
  const rates = { USD: 0.0036, EUR: 0.0032, GBP: 0.0031 }
  const rate = rates[currency] || 1
  const converted = (pricePKR || 0) * rate
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(converted)
  } catch {
    return `${currency} ${converted.toLocaleString()}`
  }
}
