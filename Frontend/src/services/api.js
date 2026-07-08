import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const storedAuth = localStorage.getItem('simplyfly-auth')
  let authToken = ''

  if (storedAuth) {
    try {
      authToken = JSON.parse(storedAuth).token ?? ''
    } catch {
      authToken = ''
    }
  }

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }

  return config
})

async function requestJson(path, options = {}) {
  try {
    const response = await apiClient.request({
      url: path,
      method: options.method ?? 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
      params: options.params,
      headers: options.headers,
    })

    return response.data
  } catch (error) {
    const message =
      error?.response?.data?.message || error?.message || 'Request failed'
    throw new Error(message)
  }
}

export function registerUser(data) {
  return requestJson('/api/users/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function loginUser(data) {
  return requestJson('/api/users/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getFlights(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((accumulator, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        accumulator[key] = String(value)
      }
      return accumulator
    }, {}),
  ).toString()

  return requestJson(`/api/flights${query ? `?${query}` : ''}`)
}

export function addFlight(data) {
  return requestJson('/api/flights', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateFlight(id, data) {
  return requestJson(`/api/flights/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function getFlightBookings(id) {
  return requestJson(`/api/flights/${id}/bookings`)
}

export function searchFlights(params) {
  const query = new URLSearchParams(
    Object.entries(params).reduce((accumulator, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        accumulator[key] = String(value)
      }
      return accumulator
    }, {}),
  ).toString()

  return requestJson(`/api/flights/search${query ? `?${query}` : ''}`)
}

export function bookFlight(data) {
  return requestJson('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getBookingHistory() {
  return requestJson('/api/bookings/history')
}

export function getBookingDetails(id) {
  return requestJson(`/api/bookings/${id}`)
}

export function getFlightSeatMap(flightId) {
  return requestJson(`/api/bookings/flight/${flightId}/seats`)
}

export function cancelBooking(id) {
  return requestJson(`/api/bookings/cancel/${id}`, {
    method: 'PUT',
  })
}

export function makePayment(data) {
  return requestJson('/api/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getAdminUsers() {
  return requestJson('/api/admin/users')
}

export function getAdminBookings() {
  return requestJson('/api/admin/bookings')
}

export function getAdminPayments() {
  return requestJson('/api/admin/payments')
}
