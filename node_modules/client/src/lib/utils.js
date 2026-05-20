const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2
})

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '-'
  return currencyFormatter.format(Number(amount))
}

export function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}