import { http } from './http.js'

// Тренировки
// Предполагаемый API:
// Athlete:
//   GET /athlete/trainings?from&to
// Coach:
//   GET  /coach/trainings?athleteId&from&to
//   POST /coach/trainings
//        { athleteIds: number[], date, duration_minutes, description, training_type_id }
//   PATCH /coach/trainings/:id

export async function listAthleteTrainingsApi(params = {}) {
  const { data } = await http.get('/athlete/trainings', { params })
  return data
}

export async function listCoachTrainingsApi(params = {}) {
  const { data } = await http.get('/coach/trainings', { params })
  return data
}

export async function createTrainingApi(payload) {
  const { data } = await http.post('/coach/trainings', payload)
  return data
}

export async function updateTrainingApi(id, payload) {
  const { data } = await http.patch(`/coach/trainings/${id}`, payload)
  return data
}
