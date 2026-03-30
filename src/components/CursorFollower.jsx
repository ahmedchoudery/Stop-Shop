/**
 * @fileoverview CursorFollower — Design Spell
 * Custom cursor that follows mouse with lag, transforms on interactive elements.
 * Applies: design-spells (premium cursor = instant luxury signal),
 *          javascript-pro (requestAnimationFrame, event cleanup)
 *
 * Desktop only — mobile has no cursor.
 */

import React, { useEffect, useRef } from 'react';

const CursorFollower = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const isVisible = useRef(false);

  useEffect(() => {
    // Only on desktop pointer devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide default cursor (CSS in index.css handles body)
    document.body.style.cursor = 'none';

    const onMouseMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible.current) {
        isVisible.current = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
      }
    };

    const onMouseLeave = () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      isVisible.current = false;
    };

    // Track interactive elements for cursor state change
    const onMouseOver = (e) => {
      const target = e.target;
      const isInteractive = target.closest('a, button, [role="button"], input, textarea, select, label');
      if (isInteractive) {
        dot.style.transform = 'translate(-50%, -50%) scale(2)';
        dot.style.background = '#F63049';
        ring.style.transform = 'translate(-50%, -50%) scale(1.5)';
        ring.style.borderColor = 'rgba(246, 48, 73, 0.4)';
      } else {
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
        dot.style.background = '#ba1f3d';
        ring.style.transform = 'translate(-50%, -50%) scale(1)';
        ring.style.borderColor = 'rgba(186, 31, 61, 0.5)';
      }
    };

    // Smooth ring follow with lerp
    const animate = () => {
      const lerp = (a, b, n) => a + (b - a) * n;
      ringPosRef.current.x = lerp(ringPosRef.current.x, posRef.current.x, 0.12);
      ringPosRef.current.y = lerp(ringPosRef.current.y, posRef.current.y, 0.12);

      if (dot) {
        dot.style.left = `${posRef.current.x}px`;
        dot.style.top = `${posRef.current.y}px`;
      }
      if (ring) {
        ring.style.left = `${ringPosRef.current.x}px`;
        ring.style.top = `${ringPosRef.current.y}px`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseover', onMouseOver);
      cancelAnimationFrame(rafRef.current);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <>
      {/* Dot — follows instantly */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: 10,
          height: 10,
          background: '#ba1f3d',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99999,
          opacity: 0,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, opacity 0.3s ease',
          willChange: 'left, top',
        }}
      />
      {/* Ring — follows with lag (lerp in rAF) */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          width: 36,
          height: 36,
          border: '1px solid rgba(186, 31, 61, 0.5)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 99998,
          opacity: 0,
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, opacity 0.3s ease',
          willChange: 'left, top',
        }}
      />
    </>
  );
};

export default CursorFollower;