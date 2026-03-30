/**
 * @fileoverview AnimatedCounter — Design Spell component
 * Applies: design-spells (numbers count up on first view, spring easing),
 *          animejs-animation (anime.js counter, intersection-triggered)
 */

import React, { useEffect, useRef } from 'react';
import { EASING } from '../hooks/useAnime.js';

/**
 * A number that animates from 0 to its value when scrolled into view.
 *
 * @param {{ value: number, duration?: number, prefix?: string, suffix?: string, formatter?: function }} props
 */
const AnimatedCounter = ({
  value,
  duration = 1600,
  prefix = '',
  suffix = '',
  formatter = (n) => Math.round(n).toLocaleString('en-PK'),
  className = '',
}) => {
  const spanRef = useRef(null);
  const hasRun = useRef(false);
  const objRef = useRef({ value: 0 });

  useEffect(() => {
    if (!spanRef.current || value === undefined) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return;
        hasRun.current = true;

        let anime;
        try {
          anime = require('animejs').default ?? require('animejs');
        } catch {
          // Fallback: just show the value
          if (spanRef.current) {
            spanRef.current.textContent = `${prefix}${formatter(value)}${suffix}`;
          }
          return;
        }

        objRef.current.value = 0;

        anime({
          targets: objRef.current,
          value: [0, value],
          duration,
          easing: EASING.EXPO_OUT,
          round: value > 100 ? 1 : 10,
          update: () => {
            if (spanRef.current) {
              spanRef.current.textContent = `${prefix}${formatter(objRef.current.value)}${suffix}`;
            }
          },
          complete: () => {
            if (spanRef.current) {
              spanRef.current.textContent = `${prefix}${formatter(value)}${suffix}`;
            }
          },
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(spanRef.current);
    return () => observer.disconnect();
  }, [value, duration, prefix, suffix, formatter]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}0{suffix}
    </span>
  );
};

export default AnimatedCounter;