export function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function getFlightList(response) {
  const data = response?.data ?? {}

  return data.flights ?? data.Flights ?? []
}

export function getArrayData(response) {
  return response?.data ?? []
}
