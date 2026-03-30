/**
 * @fileoverview Utility hooks
 * Applies: react-patterns (extract reusable hooks), javascript-mastery (closures, event loop),
 *          javascript-pro (ES6+, proper cleanup)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────
// useDebounce
// ─────────────────────────────────────────────────────────────────

/**
 * Debounce a rapidly changing value.
 * Prevents excessive API calls during search/filter.
 *
 * @template T
 * @param {T} value
 * @param {number} [delay=300]
 * @returns {T}
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // Cleanup on value/delay change
  }, [value, delay]);

  return debouncedValue;
}

// ─────────────────────────────────────────────────────────────────
// useLocalStorage
// ─────────────────────────────────────────────────────────────────

/**
 * Synchronized localStorage hook with SSR safety.
 * Replaces raw localStorage calls in contexts.
 *
 * @template T
 * @param {string} key
 * @param {T} initialValue
 * @returns {[T, function(T|function(T): T): void, function(): void]}
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    // SSR-safe initialization
    if (typeof window === 'undefined') return initialValue;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((newValue) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function' ? newValue(prev) : newValue;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        console.warn(`useLocalStorage: Could not persist key "${key}"`);
      }
      return resolved;
    });
  }, [key]);

  const remove = useCallback(() => {
    setValue(initialValue);
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail in restricted environments
    }
  }, [key, initialValue]);

  return [value, set, remove];
}

// ─────────────────────────────────────────────────────────────────
// useIntersectionObserver
// ─────────────────────────────────────────────────────────────────

/**
 * Track element visibility with IntersectionObserver.
 * Used for lazy loading and scroll-triggered animations.
 *
 * @param {Object} [options]
 * @param {string} [options.threshold='0']
 * @param {string} [options.rootMargin='0px']
 * @param {boolean} [options.triggerOnce=true]
 * @returns {{ ref: React.RefObject, isIntersecting: boolean }}
 */
export function useIntersectionObserver({ threshold = 0, rootMargin = '0px', triggerOnce = true } = {}) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) {
      setIsIntersecting(true); // Fallback: always show
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isIntersecting };
}

// ─────────────────────────────────────────────────────────────────
// useMediaQuery
// ─────────────────────────────────────────────────────────────────

/**
 * Reactive media query hook.
 *
 * @param {string} query - CSS media query string
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// ─────────────────────────────────────────────────────────────────
// useClickOutside
// ─────────────────────────────────────────────────────────────────

/**
 * Detect clicks outside a referenced element.
 * Used for modals, dropdowns, drawers.
 *
 * @param {function(): void} handler
 * @returns {React.RefObject}
 */
export function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);

  return ref;
}

// ─────────────────────────────────────────────────────────────────
// usePrevious
// ─────────────────────────────────────────────────────────────────

/**
 * Track the previous value of a variable.
 *
 * @template T
 * @param {T} value
 * @returns {T|undefined}
 */
export function usePrevious(value) {
  const ref = useRef(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// ─────────────────────────────────────────────────────────────────
// useToggle
// ─────────────────────────────────────────────────────────────────

/**
 * Boolean toggle state with stable callbacks.
 *
 * @param {boolean} [initial=false]
 * @returns {[boolean, function(): void, function(boolean): void]}
 */
export function useToggle(initial = false) {
  const [state, setState] = useState(initial);
  const toggle = useCallback(() => setState(s => !s), []);
  const set = useCallback((val) => setState(val), []);
  return [state, toggle, set];
}

// ─────────────────────────────────────────────────────────────────
// useScrollLock
// ─────────────────────────────────────────────────────────────────

/**
 * Lock/unlock body scroll. Used by modals, drawers, lightbox.
 *
 * @param {boolean} locked
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [locked]);
}