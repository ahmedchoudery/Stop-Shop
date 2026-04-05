/**
 * @fileoverview useAnime — anime.js React hooks
 * Fix: replaced all require('animejs') with ESM import — hooks now work correctly in ESM env
 */

import { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';

// ─────────────────────────────────────────────────────────────────
// EASING PRESETS (design-spells: expensive, natural motion)
// ─────────────────────────────────────────────────────────────────

export const EASING = {
  // Fabric settling — fast in, slow decelerate
  FABRIC: 'cubicBezier(0.16, 1, 0.3, 1)',
  // Spring bounce — for interactive elements
  SPRING: 'spring(1, 80, 10, 0)',
  // Soft spring — for cards, panels
  SOFT_SPRING: 'spring(1, 100, 14, 0)',
  // Silk slide — ultra smooth
  SILK: 'cubicBezier(0.25, 0.46, 0.45, 0.94)',
  // Dramatic entrance
  EXPO_OUT: 'cubicBezier(0.16, 1, 0.3, 1)',
  // Quick snap
  QUART_OUT: 'cubicBezier(0.25, 1, 0.5, 1)',
};

// ─────────────────────────────────────────────────────────────────
// useAnimeTimeline — orchestrate multi-stage animations
// ─────────────────────────────────────────────────────────────────

/**
 * Create and manage an anime.js timeline tied to component lifecycle.
 */
export const useAnimeTimeline = (buildTimeline, deps = []) => {
  const timelineRef = useRef(null);

  useEffect(() => {
    // Kill previous timeline
    timelineRef.current?.pause();
    timelineRef.current = buildTimeline(anime);

    return () => {
      timelineRef.current?.pause();
    };
  }, deps);  

  const play = useCallback(() => timelineRef.current?.play(), []);
  const pause = useCallback(() => timelineRef.current?.pause(), []);
  const restart = useCallback(() => timelineRef.current?.restart(), []);

  return { play, pause, restart, timelineRef };
};

// ─────────────────────────────────────────────────────────────────
// useAnimeEntrance — staggered entrance animation on mount
// ─────────────────────────────────────────────────────────────────

/**
 * Staggered entrance animation for a container's children.
 */
export const useAnimeEntrance = ({
  childSelector = ':scope > *',
  translateY = 60,
  duration = 900,
  stagger = 80,
  delay = 0,
  easing = EASING.FABRIC,
} = {}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const targets = containerRef.current.querySelectorAll(childSelector);
    if (!targets.length) return;

    const anim = anime({
      targets,
      translateY: [translateY, 0],
      opacity: [0, 1],
      duration,
      delay: anime.stagger(stagger, { start: delay }),
      easing,
    });

    return () => anim.pause();
  }, []);  

  return containerRef;
};

// ─────────────────────────────────────────────────────────────────
// useAnimeMagnetic — magnetic hover effect (design-spells)
// ─────────────────────────────────────────────────────────────────

/**
 * Magnetic button effect — element follows cursor when nearby.
 */
export const useAnimeMagnetic = (strength = 0.4, radius = 80) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < radius) {
        anime({
          targets: el,
          translateX: distX * strength,
          translateY: distY * strength,
          duration: 600,
          easing: EASING.SOFT_SPRING,
        });
      }
    };

    const onMouseLeave = () => {
      anime({
        targets: el,
        translateX: 0,
        translateY: 0,
        duration: 800,
        easing: EASING.SPRING,
      });
    };

    document.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [strength, radius]);

  return ref;
};

// ─────────────────────────────────────────────────────────────────
// useAnimeCounter — animated number counter (design-spells)
// ─────────────────────────────────────────────────────────────────

/**
 * Animate a number from 0 to target value.
 */
export const useAnimeCounter = (target, {
  duration = 1400,
  easing = EASING.EXPO_OUT,
  formatter = (n) => Math.round(n).toLocaleString(),
} = {}) => {
  const ref = useRef(null);
  const objRef = useRef({ value: 0 });

  useEffect(() => {
    if (!ref.current || target === undefined) return;

    const anim = anime({
      targets: objRef.current,
      value: [0, target],
      duration,
      easing,
      round: 1,
      update: () => {
        if (ref.current) {
          ref.current.textContent = formatter(objRef.current.value);
        }
      },
    });

    return () => anim.pause();
  }, [target]);  

  return ref;
};

