import React, { useEffect, useRef, useState } from 'react';

const CursorFollower = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const isVisible = useRef(false);
  const [isMagnetic, setIsMagnetic] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

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

    const onMouseOver = (e) => {
      const target = e.target;
      const isInteractive = target.closest('a, button, [role="button"], .magnetic-area');
      
      if (isInteractive) {
        setIsMagnetic(true);
        dot.style.width = '24px';
        dot.style.height = '24px';
        dot.style.background = 'rgba(186, 31, 61, 0.4)';
        dot.style.backdropFilter = 'blur(4px)';
        ring.style.width = '48px';
        ring.style.height = '48px';
        ring.style.borderColor = '#ba1f3d';
      } else {
        setIsMagnetic(false);
        dot.style.width = '10px';
        dot.style.height = '10px';
        dot.style.background = '#ba1f3d';
        dot.style.backdropFilter = 'none';
        ring.style.width = '36px';
        ring.style.height = '36px';
        ring.style.borderColor = 'rgba(186, 31, 61, 0.5)';
      }
    };

    const animate = () => {
      const lerp = (a, b, n) => a + (b - a) * n;
      
      // Calculate velocity
      const vx = posRef.current.x - ringPosRef.current.x;
      const vy = posRef.current.y - ringPosRef.current.y;
      velRef.current = { x: vx, y: vy };

      // Update ring with lerp
      ringPosRef.current.x = lerp(ringPosRef.current.x, posRef.current.x, 0.15);
      ringPosRef.current.y = lerp(ringPosRef.current.y, posRef.current.y, 0.15);

      // Warping based on velocity
      const speed = Math.hypot(vx, vy);
      const angle = Math.atan2(vy, vx) * (180 / Math.PI);
      const stretch = Math.min(speed / 15, 1.5);
      
      if (dot) {
        dot.style.left = `${posRef.current.x}px`;
        dot.style.top = `${posRef.current.y}px`;
        
        if (!isMagnetic) {
          dot.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.5})`;
        } else {
          dot.style.transform = `translate(-50%, -50%) scale(1.2)`;
        }
      }

      if (ring) {
        ring.style.left = `${ringPosRef.current.x}px`;
        ring.style.top = `${ringPosRef.current.y}px`;
        ring.style.transform = `translate(-50%, -50%)`;
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
  }, [isMagnetic]);

  return (
    <>
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
          willChange: 'left, top, transform',
          transition: 'width 0.3s ease, height 0.3s ease, background 0.3s ease, opacity 0.3s ease',
        }}
      />
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
          willChange: 'left, top, transform',
          transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), height 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, opacity 0.3s ease',
        }}
      />
    </>
  );
};

export default CursorFollower;

