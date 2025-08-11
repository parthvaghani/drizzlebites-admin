
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from '@tanstack/react-router';
// Import js-cookie
import api from '@/lib/api';
import { setCookie, removeCookie } from './use-cookie';

// Types
interface LoginData {
  emailOrUsername: string; // This can be either email or username from the form
  password: string;
}

interface RegisterData {
  email: string;
  phoneNumber: string;
  password: string;
  user_details: {
    name: string;
    country: string;
    gender: 'Male' | 'Female' | 'Other';
  };
  acceptedTerms: boolean;
  role?: 'user' | 'admin';
}

interface AuthUser {
  accountNo: string;
  email: string;
  role: string[];
  exp: number;
  user_details: {
    country: string;
    gender: string;
    name: string;
  };
}

interface AccessToken {
  token: string;
  expires: string;
}

interface AuthResponse {
  tokens: {
    access: AccessToken;
    refresh: string;
  };
  user?: AuthUser;
  success?: boolean;
}


// API functions
const loginApi = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

const registerApi = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

const getUsersApi = async () => {
  const response = await api.get('/auth/getUsers');
  return response.data;
};



// Custom hooks
export function useLogin() {
  const setAccessToken = useAuthStore((state) => state.auth.setAccessToken);
  const navigate = useNavigate({ from: '/sign-in' });
  const fetchUser = useAuthStore((state) => state.auth.fetchUser);

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      const { access } = data.tokens;

      if (!data.success || !access.token) {
        const message = 'Login failed. Please try again.';
        toast.error(message);
        return;
      }

      setCookie('session', access.token, {
        expires: new Date(access.expires),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        httpOnly: false
      });

      setAccessToken(access.token);
      if (access.token) {
        fetchUser();
        navigate({ to: '/' });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useRegister() {
  const navigate = useNavigate({ from: '/sign-up' });

  return useMutation({
    mutationFn: registerApi,
    onSuccess: () => {
      toast.success('Account created successfully!');

      navigate({ to: '/sign-in' });
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Register error:', error);
      // Error handling is done by the mutation's error state
    },
  });
}
export function useGetUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsersApi,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
export function useLogout() {
  const queryClient = useQueryClient();
  const reset = useAuthStore((state) => state.auth.reset);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      // If you have a logout API endpoint, call it here
      // await api.post('/logout')
      return Promise.resolve();
    },
    onSuccess: () => {
      reset();
      queryClient.clear(); // Clear all queries
      removeCookie('session');
      navigate({ to: '/sign-in' });
      toast.success('Logged out successfully');
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Logout error:', error);
      // Even if logout API fails, clear local state
      reset();
      queryClient.clear();
      navigate({ to: '/sign-in' });
    },
  });
}
