import { useState, useCallback, useRef } from 'react';

interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  nextRetryIn: number | null;
}

export function useRetryWithBackoff<T>(
  fetchFn: () => Promise<T>,
  config: RetryConfig = {}
) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = config;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    nextRetryIn: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateDelay = useCallback((attempt: number): number => {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }, [baseDelayMs, backoffMultiplier, maxDelayMs]);

  const execute = useCallback(async (): Promise<T | null> => {
    // Cancel any pending retry
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: null,
    }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fetchFn();
        setState({
          isRetrying: false,
          retryCount: 0,
          lastError: null,
          nextRetryIn: null,
        });
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          const delay = calculateDelay(attempt);
          
          setState({
            isRetrying: true,
            retryCount: attempt + 1,
            lastError,
            nextRetryIn: Math.round(delay / 1000),
          });

          // Wait before retrying
          await new Promise<void>(resolve => {
            timeoutRef.current = setTimeout(resolve, delay);
          });
        } else {
          setState({
            isRetrying: false,
            retryCount: attempt + 1,
            lastError,
            nextRetryIn: null,
          });
        }
      }
    }

    return null;
  }, [fetchFn, maxRetries, calculateDelay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: null,
    });
  }, []);

  return {
    execute,
    cancel,
    ...state,
  };
}
