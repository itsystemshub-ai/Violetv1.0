import { useState, useCallback } from 'react';
import { ApiResponse, ApiError } from '@/api';

/**
 * Generic hook for API calls with loading and error states
 */
export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<ApiResponse<T>>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiCall();

        if (response.success && response.data) {
          setData(response.data);
          return response.data;
        } else {
          const errorMessage = response.error || 'Request failed';
          setError(errorMessage);
          throw new ApiError(errorMessage);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook for API calls with automatic execution
 */
export function useApiQuery<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Auto-execute on mount and when dependencies change
  React.useEffect(() => {
    refetch();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
export function useMutation<TData, TVariables = void>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      apiCall: (variables: TVariables) => Promise<ApiResponse<TData>>,
      variables: TVariables
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiCall(variables);

        if (response.success && response.data) {
          return response.data;
        } else {
          const errorMessage = response.error || 'Mutation failed';
          setError(errorMessage);
          throw new ApiError(errorMessage);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    loading,
    error,
    reset,
  };
}

// Fix React import
import React from 'react';
