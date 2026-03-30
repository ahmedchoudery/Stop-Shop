/**
 * @fileoverview MagneticButton — Design Spell component
 * Applies: design-spells (magnetic hover, physics-based attraction),
 *          animejs-animation (spring easing, GPU-accelerated transform)
 */

import React, { useRef, useCallback } from 'react';
import { EASING } from '../hooks/useAnime.js';

/**
 * A button that magnetically attracts toward the cursor when nearby.
 *
 * @param {{ children, className, onClick, strength, radius, as, href, ...rest }} props
 */
const MagneticButton = ({
  children,
  className = '',
  onClick,
  strength = 0.38,
  radius = 85,
  as: Tag = 'button',
  href,
  ...rest
}) => {
  const ref = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      let anime;
      try { anime = require('animejs').default ?? require('animejs'); } catch { return; }
      anime({
        targets: ref.current,
        translateX: dx * strength,
        translateY: dy * strength,
        duration: 500,
        easing: EASING.SOFT_SPRING,
      });
    }
  }, [strength, radius]);

  const handleMouseLeave = useCallback(() => {
    let anime;
    try { anime = require('animejs').default ?? require('animejs'); } catch { return; }
    anime({
      targets: ref.current,
      translateX: 0,
      translateY: 0,
      duration: 700,
      easing: EASING.SPRING,
    });
  }, []);

  const props = {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onClick,
    className,
    style: { willChange: 'transform', display: 'inline-flex' },
    ...(href && { href }),
    ...rest,
  };

  return <Tag {...props}>{children}</Tag>;
};

export default MagneticButton;