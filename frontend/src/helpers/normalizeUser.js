export const normalizeUser = (apiUser) => ({
  id: apiUser.id,
  full_name: apiUser.full_name,
  email: apiUser.email,
  role: apiUser.role?.title,
})