/**
 * @fileoverview MagneticButton — Cinematic Depth Edition
 * Replaced simple magnetic movement with 3D parallax layers.
 * Applies: design-spells (magnetic attraction, parallax depth),
 *          animejs-animation (synchronized spring physics)
 */

import React, { useRef, useCallback, useState } from 'react';
import anime from 'animejs';
import { EASING } from '../hooks/useAnime.js';

/**
 * A button that magnetically attracts toward the cursor and has internal 3D parallax.
 */
const MagneticButton = ({
  children,
  className = '',
  onClick,
  strength = 0.4,
  textStrength = 0.25,
  radius = 100,
  as: Tag = 'button',
  href,
  ...rest
}) => {
  const buttonRef = useRef(null);
  const textRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!buttonRef.current || !textRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < radius) {
      if (!isHovered) setIsHovered(true);
      
      // Outer button movement
      anime({
        targets: buttonRef.current,
        translateX: dx * strength,
        translateY: dy * strength,
        rotateX: -dy * 0.1,
        rotateY: dx * 0.1,
        duration: 400,
        easing: EASING.SOFT_SPRING,
      });

      // Inner text parallax (moving slightly less for depth)
      anime({
        targets: textRef.current,
        translateX: dx * textStrength,
        translateY: dy * textStrength,
        duration: 400,
        easing: EASING.SOFT_SPRING,
      });
    } else {
      handleMouseLeave();
    }
  }, [strength, textStrength, radius, isHovered]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    // Reset both layers
    anime({
      targets: [buttonRef.current, textRef.current],
      translateX: 0,
      translateY: 0,
      rotateX: 0,
      rotateY: 0,
      duration: 800,
      easing: EASING.SPRING,
    });
  }, []);

  const buttonProps = {
    ref: buttonRef,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onClick,
    className: `relative inline-flex items-center justify-center transition-shadow duration-500 ${className}`,
    style: { 
      willChange: 'transform',
      transformStyle: 'preserve-3d',
      perspective: '1000px'
    },
    ...(href && { href }),
    ...rest,
  };

  return (
    <Tag {...buttonProps}>
      <span 
        ref={textRef} 
        className="relative z-10 pointer-events-none block"
        style={{ willChange: 'transform' }}
      >
        {children}
      </span>
      
      {/* Visual background / border logic can be handled via className or added here */}
      {isHovered && (
        <span className="absolute inset-0 rounded-full border border-[#ba1f3d]/30 animate-ping-once pointer-events-none" />
      )}
    </Tag>
  );
};

export default MagneticButton;
