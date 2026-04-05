/* eslint-disable react/no-unknown-property */
import React, { useRef, useEffect, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, ContactShadows, Text } from '@react-three/drei';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS — Editorial Masculine Palette
// ─────────────────────────────────────────────────────────────────

const CARDINAL = new THREE.Color('#ba1f3d');
const CHROME   = new THREE.Color('#ffffff');
const DARK     = new THREE.Color('#050505');
const GOLD     = new THREE.Color('#FBBF24');

// ─────────────────────────────────────────────────────────────────
// FABRIC CLOTH PANEL
// ─────────────────────────────────────────────────────────────────

const FabricPanel = ({ position = [0, 0, 0], color = CARDINAL, width = 3, height = 4 }) => {
  const meshRef = useRef();
  const geomRef = useRef();
  const originalPositions = useRef(null);

  useEffect(() => {
    if (!geomRef.current) return;
    const pos = geomRef.current.attributes.position;
    originalPositions.current = new Float32Array(pos.array);
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current || !geomRef.current || !originalPositions.current) return;
    const t = clock.getElapsedTime();
    const pos = geomRef.current.attributes.position;
    const orig = originalPositions.current;

    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = orig[ix];
      const y = orig[ix + 1];
      
      // Complex fabric ripple
      const windX = Math.sin(x * 1.2 + t * 0.8) * 0.08;
      const windY = Math.cos(y * 0.9 + t * 1.2) * 0.06;
      const sway = Math.sin(t * 0.5 + x * 0.4) * 0.15;
      
      pos.setZ(i, windX + windY + sway);
    }
    pos.needsUpdate = true;
    geomRef.current.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <planeGeometry ref={geomRef} args={[width, height, 64, 80]} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────────
// CHROME GARMENT RING
// ─────────────────────────────────────────────────────────────────

const GarmentRing = ({ position, radius = 0.6, speed = 1, rotOffset = 0 }) => {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * speed + rotOffset;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.5;
    meshRef.current.rotation.y = t * 0.2;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.2;
  });

  return (
    <Float speed={speed * 2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[radius, 0.015, 16, 128]} />
        <meshStandardMaterial color={CHROME} roughness={0} metalness={1} />
      </mesh>
    </Float>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN SCENE logic
// ─────────────────────────────────────────────────────────────────

const ClothingScene = ({ gyroPos }) => {
  const { mouse } = useThree();
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    // Enhanced depth response
    const targetX = (mouse.x * 0.15) + (gyroPos.x * 0.4);
    const targetY = (-mouse.y * 0.12) + (gyroPos.y * 0.3);

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
  });

  return (
    <group ref={groupRef}>
      <FabricPanel position={[0, 0, 0]} color={CARDINAL} width={2.8} height={4.2} />
      <FabricPanel position={[-2.5, -0.5, -2]} color={DARK} width={1.5} height={3.5} />
      <FabricPanel position={[2.8, 0.5, -1.5]} color={DARK} width={1.2} height={3} />
      
      <GarmentRing position={[-1.8, 2.2, 0.8]} radius={0.6} speed={0.8} rotOffset={1} />
      <GarmentRing position={[2, 1.8, 0.5]} radius={0.4} speed={1.2} rotOffset={4} />
      <GarmentRing position={[0.5, -2.5, 1.2]} radius={0.35} speed={0.6} rotOffset={2} />

      <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      <Environment preset="city" />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={3} color="#fff" castShadow />
      <pointLight position={[-5, 5, 5]} intensity={5} color={CARDINAL} />
      <pointLight position={[5, -5, 5]} intensity={3} color={GOLD} />
    </group>
  );
};

const ClothingHeroScene = () => {
  const [gyroPos, setGyroPos] = useState({ x: 0, y: 0 });
  const [hasSensors, setHasSensors] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    if (navigator.deviceMemory && navigator.deviceMemory < 2) setIsLowEnd(true);

    const checkPermission = () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        setNeedsPermission(true);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    const handleOrientation = (e) => {
      if (!hasSensors && (e.beta || e.gamma)) setHasSensors(true);
      const x = (e.gamma || 0) / 45; 
      const y = (e.beta - 45 || 0) / 45;
      setGyroPos({ x, y });
    };

    checkPermission();
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [hasSensors]);

  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res === 'granted') {
          setNeedsPermission(false);
          window.addEventListener('deviceorientation', (e) => {
            const x = (e.gamma || 0) / 45; 
            const y = (e.beta - 45 || 0) / 45;
            setGyroPos({ x, y });
            setHasSensors(true);
          });
        }
      } catch (e) {
        console.error('Gyro access denied:', e);
      }
    }
  };

  if (isLowEnd) return <div className="w-full h-full bg-[#050505]" />;

  return (
    <div className="w-full h-full relative">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }} shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <Suspense fallback={null}>
          <ClothingScene gyroPos={gyroPos} />
        </Suspense>
      </Canvas>

      {/* Sensor Request Badge — Luxury Editorial UI */}
      {needsPermission && !hasSensors && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <button 
            onClick={requestPermission}
            className="glass-premium px-8 py-4 rounded-full text-white text-[9px] font-black uppercase tracking-[0.4em] border border-white/20 whitespace-nowrap animate-pulse hover:bg-white hover:text-black transition-all duration-500"
          >
            Enable Experience Sensors
          </button>
        </div>
      )}

      {/* Subtle "Immersive Mode Active" hint */}
      {hasSensors && (
        <div className="absolute bottom-10 left-10 opacity-30 select-none pointer-events-none">
          <p className="text-[7px] font-black uppercase tracking-[0.8em] text-white/50 vertical-text">
            IMMERSIVE SENSORS ACTIVE
          </p>
        </div>
      )}
    </div>
  );
};

export default ClothingHeroScene;

