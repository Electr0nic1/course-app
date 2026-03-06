import { http } from './http.js'

// Отчёты для тренера
// Предполагаемый API:
// GET /coach/reports?athleteId&from&to
// -> { summary: {...}, diary: [...], trainings: [...] }

export async function getCoachReportApi(params) {
  const { data } = await http.get('/coach/reports', { params })
  return data
}

export async function listCoachAthletesApi(params) {
  const { data } = await http.get('/coach/athletes', { params })
  return data
}