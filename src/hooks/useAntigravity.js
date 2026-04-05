/**
 * ─────────────────────────────────────────────────────────────────
 * useAntigravity.js
 * Core Motion Logic: Parallax, Tilt, Magnetic, and Gyroscope
 * Part of the Cardinal Collection 2026 motion engine.
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';

export const useAntigravity = (options = {}) => {
  const {
    type = 'parallax', // 'parallax' | 'tilt' | 'magnetic'
    power = 1,
    lerp = 0.1,
    gyroPower = 1.5,
  } = options;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [gyroInit, setGyroInit] = useState(false);
  const elementRef = useRef(null);
  const frameRef = useRef();

  // ── Mouse Interaction ───────────────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (type === 'magnetic') {
        const rect = elementRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
          
          if (dist < 100) {
            setTarget({
              x: (e.clientX - centerX) * 0.4 * power,
              y: (e.clientY - centerY) * 0.4 * power
            });
          } else {
            setTarget({ x: 0, y: 0 });
          }
        }
      } else if (type === 'tilt') {
        const rect = elementRef.current?.getBoundingClientRect();
        if (rect) {
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          setTarget({ x: x * 20 * power, y: -y * 20 * power });
        }
      } else {
        // Default parallax
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        setTarget({ x: x * 50 * power, y: y * 50 * power });
      }
    };

    if (type !== 'gyro-only') {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [type, power]);

  // ── Gyroscope Interaction ──────────────────────────────────
  useEffect(() => {
    const handleOrientation = (e) => {
      // Gamma: Left/Right, Beta: Front/Back
      const x = (e.gamma || 0) / 45; // -1 to 1 range approx
      const y = (e.beta - 45 || 0) / 45; // Centered around 45deg tilt
      setTarget({
        x: x * 30 * gyroPower,
        y: y * 30 * gyroPower
      });
    };

    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (err) {
          console.warn('Gyro permission denied', err);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    // We trigger permission on first click or significant interaction
    const initGyro = () => {
      if (!gyroInit) {
        requestPermission();
        setGyroInit(true);
      }
    };

    window.addEventListener('click', initGyro, { once: true });
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('click', initGyro);
    };
  }, [gyroInit, gyroPower]);

  // ── Animation Loop (Lerp) ──────────────────────────────────
  useEffect(() => {
    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (target.x - prev.x) * lerp,
        y: prev.y + (target.y - prev.y) * lerp
      }));
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, lerp]);

  return { elementRef, position };
};
