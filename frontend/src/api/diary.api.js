import { http } from './http.js'

// Дневник самоконтроля спортсмена
// Предполагаемый API:
// GET  /athlete/self-controls?from=YYYY-MM-DD&to=YYYY-MM-DD
// POST /athlete/self-controls
//      { date, heart_rate, systolic_pressure, diastolic_pressure, body_weight, feeling, description }

export async function listSelfControlsApi(params = {}) {
  const { data } = await http.get('/athlete/self-controls', { params })
  return data
}

export async function createSelfControlApi(payload) {
  const { data } = await http.post('/athlete/self-controls', payload)
  return data
}
