import axios from 'axios'
import Cookies from 'js-cookie'
import type { AxiosRequestHeaders } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Fully clear auth and storage on unauthorized
      const { clearAuth } = useAuthStore.getState().auth
      if (clearAuth) clearAuth()
      Cookies.remove('admin_session')
      // Avoid leaving stale header around
      const commonHeaders = (api.defaults.headers as unknown as { common: AxiosRequestHeaders }).common
      if (commonHeaders && 'Authorization' in commonHeaders) {
        delete commonHeaders.Authorization
      }
      toast.error('Session expired! Please login again.')
      // Force a replace navigation to sign-in
      // window.location.replace('/sign-in')
    } else if (error.response?.status === 403) {
      toast.error('Access denied!')
    } else if (error.response?.status === 500) {
      toast.error('Internal server error!')
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout! Please try again.')
    } else if (!error.response) {
      toast.error('Network error! Please check your connection.')
    }
    return Promise.reject(error)
  }
)

export default api
