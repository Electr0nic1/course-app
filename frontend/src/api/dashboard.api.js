import { http } from './http'

export async function dashboardSummaryApi() {
  const { data } = await http.get('/dashboard/summary')
  return data
}