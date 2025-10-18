import Cookies from 'js-cookie'
import { create } from 'zustand'
import { QueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { toast } from 'sonner';

const ACCESS_TOKEN = 'thisisjustarandomstring'

interface AuthUser {
  _id: string
  accountNo: string
  email: string
  role: string[]
  exp: number
  user_details: {
    country: string
    gender: string
    name: string
  }
}

const getCurrentUser = async () => {
  const response = await api.get('/users/me')
  return response.data
}

const queryClient = new QueryClient()

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    clearAuth: () => void
    isLoading: boolean
    error: string | null
    fetchUser: () => Promise<void>
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  const cookieState = Cookies.get(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''

  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          Cookies.set(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
      clearAuth: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          localStorage.removeItem('admin_session')
          sessionStorage.clear()
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
      isLoading: false,
      error: null,
      fetchUser: async () => {
        set((state) => ({
          ...state,
          auth: { ...state.auth, isLoading: true, error: null }
        }))
        try {
          const userData = await queryClient.fetchQuery({
            queryKey: ['user'],
            queryFn: getCurrentUser
          })
          set((state) => ({
            ...state,
            auth: { ...state.auth, user: userData, isLoading: false }
          }))
        } catch (error) {
          toast.error(error instanceof Error ? error.message : String(error));
          set((state) => ({
            ...state,
            auth: {
              ...state.auth,
              error: error instanceof Error ? error.message : 'Failed to fetch user',
              isLoading: false
            }
          }))
        }
      },
    },
  }
})
