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

export async function assignTrainingApi(trainingId, athleteIds) {
  const { data } = await http.post(`/coach/trainings/${trainingId}/assign`, {
    athleteIds,
  })
  return data
}

export async function updateTrainingStatusApi(id, status) {
  const { data } = await http.patch(`/trainings/${id}/status`, { status })
  return data
}

export async function updateAthleteTrainingStatusApi(trainingId, status) {
  const { data } = await http.patch(`/athlete/trainings/${trainingId}/status`, {
    status,
  })
  return data
}
