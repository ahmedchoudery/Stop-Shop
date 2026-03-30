/**
 * @fileoverview useAnime — anime.js React hooks
 * Applies: animejs-animation skill (spring easing, stagger, timeline orchestration),
 *          react-patterns (custom hooks, cleanup on unmount)
 *
 * INSTALL: npm install animejs
 */

import { useEffect, useRef, useCallback } from 'react';

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
 *
 * @param {function(anime: Object): Object} buildTimeline - Receives anime instance, returns timeline
 * @param {Array} deps - Dependencies to re-run timeline
 * @returns {{ play: function, pause: function, restart: function, timelineRef: Object }}
 */
export const useAnimeTimeline = (buildTimeline, deps = []) => {
  const timelineRef = useRef(null);

  useEffect(() => {
    let anime;
    try {
      anime = require('animejs').default ?? require('animejs');
    } catch {
      console.warn('[useAnime] animejs not installed. Run: npm install animejs');
      return;
    }

    // Kill previous timeline
    timelineRef.current?.pause();

    timelineRef.current = buildTimeline(anime);

    return () => {
      timelineRef.current?.pause();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

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
 * Applies the "fabric settling" easing from the design system.
 *
 * @param {Object} [options]
 * @param {string} [options.childSelector=':scope > *'] - CSS selector for children
 * @param {number} [options.translateY=60] - Start Y offset in px
 * @param {number} [options.duration=900]
 * @param {number} [options.stagger=80]
 * @param {number} [options.delay=0]
 * @param {string} [options.easing=EASING.FABRIC]
 * @returns {React.RefObject} Attach to container element
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

    let anime;
    try {
      anime = require('animejs').default ?? require('animejs');
    } catch {
      return;
    }

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return containerRef;
};

// ─────────────────────────────────────────────────────────────────
// useAnimeMagnetic — magnetic hover effect (design-spells)
// ─────────────────────────────────────────────────────────────────

/**
 * Magnetic button effect — element follows cursor when nearby.
 * Design Spell: replaces standard hover with physics-based attraction.
 *
 * @param {number} [strength=0.4] - How strongly the element is attracted (0–1)
 * @param {number} [radius=80] - Distance in px that triggers magnetism
 * @returns {React.RefObject}
 */
export const useAnimeMagnetic = (strength = 0.4, radius = 80) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let anime;
    try {
      anime = require('animejs').default ?? require('animejs');
    } catch {
      return;
    }

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
 * Design Spell: dashboard stats "count up" on first view.
 *
 * @param {number} target - The final value
 * @param {Object} [options]
 * @param {number} [options.duration=1400]
 * @param {string} [options.easing=EASING.EXPO_OUT]
 * @param {function} [options.formatter] - Format the number (e.g., add commas)
 * @returns {React.RefObject}
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

    let anime;
    try {
      anime = require('animejs').default ?? require('animejs');
    } catch {
      if (ref.current) ref.current.textContent = formatter(target);
      return;
    }

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
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
};

// ─────────────────────────────────────────────────────────────────
// useAnimeTextScramble — text scramble hover (design-spells)
// ─────────────────────────────────────────────────────────────────

/**
 * Text scramble effect — letters randomize then resolve to final text.
 * Design Spell: product names scramble briefly on card hover.
 *
 * @param {string} finalText - The text to resolve to
 * @returns {{ ref: React.RefObject, scramble: function }}
 */
export const useAnimeTextScramble = (finalText) => {
  const ref = useRef(null);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  const frameRef = useRef(null);

  const scramble = useCallback(() => {
    if (!ref.current) return;

    let iteration = 0;
    const maxIterations = finalText.length * 3;

    clearInterval(frameRef.current);

    frameRef.current = setInterval(() => {
      if (!ref.current) return;

      ref.current.textContent = finalText
        .split('')
        .map((char, idx) => {
          if (idx < iteration / 3) return char;
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iteration >= maxIterations) {
        clearInterval(frameRef.current);
        ref.current.textContent = finalText;
      }

      iteration++;
    }, 30);
  }, [finalText]);

  useEffect(() => () => clearInterval(frameRef.current), []);

  return { ref, scramble };
};