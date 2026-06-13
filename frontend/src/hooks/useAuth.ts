import { trpc, clearAuthToken, queryClient } from "@/providers/trpc";
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

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 1000,
  });

  const logout = useCallback(() => {
    clearAuthToken();
    queryClient.clear();
    navigate(redirectPath);
  }, [queryClient, navigate, redirectPath]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
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
    }),
    [user, isLoading, error, logout, refetch],
  );
}
