import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Result, useTimeout, useAbortableFetch } from '../hooks/useUtils.js';

// ─────────────────────────────────────────────────────────────────
// RESULT PATTERN HELPER TESTS
// ─────────────────────────────────────────────────────────────────

describe('Result Helper Utility', () => {
  it('should wrap a successful value correctly', () => {
    const res = Result.ok('success_data');
    expect(res).toEqual({ ok: true, value: 'success_data' });
  });

  it('should wrap an error string correctly', () => {
    const res = Result.err('critical_failure');
    expect(res).toEqual({ ok: false, error: 'critical_failure' });
  });

  it('should format an Error object as an error string', () => {
    const res = Result.err(new Error('connection_timeout'));
    expect(res).toEqual({ ok: false, error: 'connection_timeout' });
  });

  it('should capture a resolving promise using Result.from', async () => {
    const promise = Promise.resolve({ user: 'ahmed' });
    const res = await Result.from(promise);
    expect(res).toEqual({ ok: true, value: { user: 'ahmed' } });
  });

  it('should capture a rejecting promise using Result.from', async () => {
    const promise = Promise.reject(new Error('unauthorized'));
    const res = await Result.from(promise);
    expect(res).toEqual({ ok: false, error: 'unauthorized' });
  });
});

// ─────────────────────────────────────────────────────────────────
// useTimeout HOOK TESTS
// ─────────────────────────────────────────────────────────────────

describe('useTimeout Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should execute callback after correct duration', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTimeout());

    act(() => {
      result.current(callback, 2000);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel outstanding timeout when trigger is re-called', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const { result } = renderHook(() => useTimeout());

    act(() => {
      result.current(callback1, 2000);
    });

    act(() => {
      result.current(callback2, 1000);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback1).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback1).not.toHaveBeenCalled();
  });

  it('should automatically clear timeouts on unmount to prevent leaks', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useTimeout());

    act(() => {
      result.current(callback, 3000);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────
// useAbortableFetch HOOK TESTS
// ─────────────────────────────────────────────────────────────────

describe('useAbortableFetch Hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should skip operation if url is falsy', () => {
    const { result } = renderHook(() => useAbortableFetch(null));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch and update data on success', async () => {
    const testPayload = { success: true, count: 42 };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(testPayload),
    });

    const { result } = renderHook(() => useAbortableFetch('/api/stats'));

    expect(result.current.loading).toBe(true);

    // Allow promise microtasks to flush
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(testPayload);
    expect(result.current.error).toBeNull();
  });

  it('should catch and register HTTP failure statuses', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    const { result } = renderHook(() => useAbortableFetch('/api/secure'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('HTTP 403');
    expect(result.current.data).toBeNull();
  });

  it('should trigger request abort when component unmounts', () => {
    let controllerSignal = null;
    global.fetch.mockImplementationOnce((url, options) => {
      controllerSignal = options.signal;
      return new Promise(() => {}); // non-resolving mock
    });

    const { unmount } = renderHook(() => useAbortableFetch('/api/slow'));

    expect(controllerSignal).not.toBeNull();
    expect(controllerSignal.aborted).toBe(false);

    unmount();

    expect(controllerSignal.aborted).toBe(true);
  });
});
