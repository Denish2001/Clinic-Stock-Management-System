import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login as loginApi, getCurrentUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!localStorage.getItem('accessToken'),
  });

  const isAuthenticated = !!user && !isError;

  const loginMutation = useMutation({
    mutationFn: ({ username, password }) => loginApi(username, password),
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      queryClient.setQueryData(['user'], data.user);
      navigate('/stock');
    },
  });

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    queryClient.removeQueries();
    navigate('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    logout,
  };
}
