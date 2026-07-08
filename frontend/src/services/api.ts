import axios, { AxiosHeaders } from 'axios'

export const ACCESS_TOKEN_KEY = 'qlcv.accessToken'
export const REFRESH_TOKEN_KEY = 'qlcv.refreshToken'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
})

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)

  if (accessToken) {
    const headers = AxiosHeaders.from(config.headers)

    headers.set('Authorization', `Bearer ${accessToken}`)
    config.headers = headers
  }

  return config
})
