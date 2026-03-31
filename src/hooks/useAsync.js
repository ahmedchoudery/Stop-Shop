/**
 * @fileoverview useAsync — universal async state hook
 * Applies: react-patterns (custom hook extraction), react-ui-patterns (loading/error states),
 *          javascript-pro (async/await, race condition prevention)
 */

import { useState, useCallback, useRef } from 'react';

/**
 * @typedef {Object} AsyncState
 * @property {T|null} data - The resolved data
 * @property {boolean} loading - True only when loading with no existing data
 * @property {boolean} refreshing - True when reloading existing data
 * @property {string|null} error - Error message if failed
 */

/**
 * @typedef {Object} AsyncActions
 * @property {function} execute - Triggers the async function
 * @property {function} reset - Resets state to initial
 */

/**
 * Universal async state manager following React UI Patterns:
 * - Shows loading ONLY when no data exists (loading && !data)
 * - Shows refreshing indicator when re-fetching existing data
 * - Always surfaces errors to the user
 * - Prevents race conditions with AbortController
 *
 * @template T
 * @param {function(...args): Promise<T>} asyncFn - The async function to wrap
 * @param {Object} [options]
 * @param {T|null} [options.initialData=null]
 * @param {boolean} [options.immediate=false] - Run on mount
 * @param {function(T): void} [options.onSuccess]
 * @param {function(Error): void} [options.onError]
 * @returns {[AsyncState<T>, AsyncActions]}
 */
export function useAsync(asyncFn, options = {}) {
  const { initialData = null, onSuccess, onError } = options;

  const [state, setState] = useState({
    data: initialData,
    loading: false,
    refreshing: false,
    error: null,
  });

  // Ref to track latest call and prevent stale updates
  const callIdRef = useRef(0);

  const execute = useCallback(
    async (...args) => {
      const callId = ++callIdRef.current;

      setState(prev => {
        // Show full loading spinner when: null OR empty array (nothing yet loaded)
        const hasNoData = prev.data === null
          || (Array.isArray(prev.data) && prev.data.length === 0);
        return {
          ...prev,
          loading: hasNoData,
          refreshing: !hasNoData,
          error: null,
        };
      });

      try {
        const result = await asyncFn(...args);

        // Ignore stale responses from superseded calls
        if (callId !== callIdRef.current) return;

        setState({
          data: result,
          loading: false,
          refreshing: false,
          error: null,
        });

        onSuccess?.(result);
        return result;
      } catch (err) {
        if (callId !== callIdRef.current) return;

        const message = err instanceof Error ? err.message : 'An unexpected error occurred';

        setState(prev => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: message,
        }));

        onError?.(err instanceof Error ? err : new Error(message));
        throw err;
      }
    },
    [asyncFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    callIdRef.current++;
    setState({ data: initialData, loading: false, refreshing: false, error: null });
  }, [initialData]);

  return [state, { execute, reset }];
}

/**
 * Simplified version for fire-and-forget mutations
 * (form submissions, delete, status changes)
 *
 * @template T
 * @param {function(...args): Promise<T>} mutationFn
 * @param {Object} [options]
 * @param {function(T): void} [options.onSuccess]
 * @param {function(Error): void} [options.onError]
 * @returns {{ mutate: function, loading: boolean, error: string|null }}
 */
export function useMutation(mutationFn, options = {}) {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(...args);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Operation failed';
        setError(message);
        onError?.(err instanceof Error ? err : new Error(message));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onSuccess, onError]
  );

  return { mutate, loading, error };
}
