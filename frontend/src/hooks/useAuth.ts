import { trpc, clearAuthToken, queryClient, setAuthToken } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";

const DEFAULT_REDIRECT = "/";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = DEFAULT_REDIRECT } =
    options ?? {};

  const navigate = useNavigate();
  const refreshMutation = trpc.auth.refresh.useMutation();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    retryDelay: 1000,
  });

  const tryRefresh = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refresh_token");
    if (!storedRefreshToken) return false;
    try {
      const result = await refreshMutation.mutateAsync({ refreshToken: storedRefreshToken });
      setAuthToken(result.accessToken);
      localStorage.setItem("refresh_token", result.refreshToken);
      return true;
    } catch {
      return false;
    }
  }, [refreshMutation]);

  const logout = useCallback(() => {
    clearAuthToken();
    queryClient.clear();
    navigate(redirectPath);
  }, [queryClient, navigate, redirectPath]);

  useEffect(() => {
    if (isLoading) return;
    if (user) return;
    if (redirectOnUnauthenticated) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading,
      error,
      logout,
      refresh: refetch,
      tryRefresh,
    }),
    [user, isLoading, error, logout, refetch, tryRefresh],
  );
}
