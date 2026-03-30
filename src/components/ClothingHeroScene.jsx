/**
 * @fileoverview ClothingHeroScene — Clothing-themed 3D hero
 * Replaces the abstract icosahedra with a fashion-forward fabric simulation.
 *
 * Scene contains:
 *  - Waving fabric cloth panel (wind-driven vertex displacement)
 *  - Floating garment ring hoops (clothing rack aesthetic)
 *  - Silk-thread particle system
 *  - Dynamic cardinal red/gold lighting
 *  - Mouse parallax on the full group
 *  - Mobile fallback (renders nothing = static image shows instead)
 *
 * Applies: 3d-web-experience (R3F, performance optimization, mobile fallback),
 *          design-spells (purposeful 3D, fabric feel, no 3D for 3D's sake)
 */

/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, MeshDistortMaterial, Torus } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const CARDINAL = new THREE.Color('#ba1f3d');
const GOLD = new THREE.Color('#FBBF24');
const DARK = new THREE.Color('#111827');
const SILK = new THREE.Color('#f8f4f0');

// ─────────────────────────────────────────────────────────────────
// FABRIC CLOTH PANEL
// Wind-driven vertex displacement simulating waving fabric
// ─────────────────────────────────────────────────────────────────

const FabricPanel = ({ position = [0, 0, 0], color = CARDINAL, width = 3, height = 4 }) => {
  const meshRef = useRef();
  const geomRef = useRef();

  // Store original positions for displacement
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

    // Wind simulation: each vertex displaced by overlapping sine waves
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = orig[ix];
      const y = orig[ix + 1];

      // Multi-frequency wind displacement
      const windX = Math.sin(x * 1.2 + t * 1.4) * 0.08;
      const windY = Math.sin(y * 0.8 + t * 1.1) * 0.06;
      const wave = Math.sin(x * 2 + y * 1.5 + t * 2) * 0.04;
      const sway = Math.sin(t * 0.7 + x * 0.5) * 0.12;

      pos.setZ(i, windX + windY + wave + sway);
    }

    pos.needsUpdate = true;
    geomRef.current.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry ref={geomRef} args={[width, height, 32, 40]} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────────
// CLOTHING RACK HOOP
// Torus geometry representing garment rings / clothing hanger hoops
// ─────────────────────────────────────────────────────────────────

const GarmentHoop = ({ position, radius = 0.6, tube = 0.035, color = GOLD, speed = 1, rotOffset = 0 }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t * speed * 0.5 + rotOffset) * 0.3;
    meshRef.current.rotation.y = t * speed * 0.3 + rotOffset;
    meshRef.current.position.y = position[1] + Math.sin(t * speed * 0.8 + rotOffset) * 0.15;
  });

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[radius, tube, 16, 80]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </mesh>
    </Float>
  );
};

// ─────────────────────────────────────────────────────────────────
// SILK THREAD PARTICLES
// Thin elongated particles representing loose threads / fabric fibers
// ─────────────────────────────────────────────────────────────────

const SilkParticles = ({ count = 80 }) => {
  const meshRef = useRef();

  const { positions, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      speeds[i] = 0.3 + Math.random() * 0.7;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions, speeds, offsets };
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      // Gentle drift upward with sinusoidal sway
      const drift = (t * speeds[i] * 0.2 + offsets[i]) % 10 - 5;
      pos.setY(i, positions[ix + 1] + drift * 0.3);
      pos.setX(i, positions[ix] + Math.sin(t * speeds[i] * 0.5 + offsets[i]) * 0.1);
    }

    pos.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color={SILK}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
};

// ─────────────────────────────────────────────────────────────────
// HANGING FABRIC STRIP
// Thinner vertical fabric panels like hanging garments
// ─────────────────────────────────────────────────────────────────

const HangingStrip = ({ position, color, width = 0.8, delay = 0 }) => {
  const meshRef = useRef();
  const origPos = useRef(null);

  useEffect(() => {
    if (!meshRef.current?.geometry) return;
    const pos = meshRef.current.geometry.attributes.position;
    origPos.current = new Float32Array(pos.array);
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current?.geometry || !origPos.current) return;
    const t = clock.getElapsedTime() + delay;
    const pos = meshRef.current.geometry.attributes.position;
    const orig = origPos.current;

    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const y = orig[ix + 1];
      // Fabric hangs from top — bottom sways more than top
      const hangFactor = (y + 2) / 4; // 0 at top, 1 at bottom
      const sway = Math.sin(t * 1.2 + orig[ix] * 2) * 0.15 * hangFactor;
      pos.setZ(i, sway);
      pos.setX(i, orig[ix] + Math.sin(t * 0.8 + y) * 0.04 * hangFactor);
    }

    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, 3.5, 8, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0}
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN SCENE
// ─────────────────────────────────────────────────────────────────

const ClothingScene = () => {
  const { mouse, size } = useThree();
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    // Smooth mouse parallax — fabric responds to viewer movement
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      mouse.x * 0.08,
      0.04
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      -mouse.y * 0.05,
      0.04
    );
  });

  return (
    <group ref={groupRef}>
      {/* Main cardinal fabric panel — center stage */}
      <FabricPanel
        position={[0, 0.3, 0]}
        color={CARDINAL}
        width={2.8}
        height={4.2}
      />

      {/* Secondary fabric panel — dark, slightly offset */}
      <HangingStrip position={[-2.2, 0.2, -1.2]} color={DARK} width={0.9} delay={0.5} />
      <HangingStrip position={[2.4, 0.1, -1.0]} color={new THREE.Color('#1f1f2e')} width={0.7} delay={1.2} />

      {/* Gold garment hoops — clothing rack aesthetic */}
      <GarmentHoop position={[-1.8, 1.8, 0.5]} radius={0.55} color={GOLD} speed={0.8} rotOffset={0} />
      <GarmentHoop position={[2.0, 2.1, 0.3]} radius={0.4} color={GOLD} speed={1.1} rotOffset={1.5} />
      <GarmentHoop position={[0.6, -2.1, 0.8]} radius={0.35} color={new THREE.Color('#d4a843')} speed={0.6} rotOffset={3} />

      {/* Small cardinal hoop accent */}
      <GarmentHoop position={[-0.8, -1.6, 1.2]} radius={0.28} color={CARDINAL} speed={1.4} rotOffset={2} />

      {/* Silk thread particles */}
      <SilkParticles count={60} />

      {/* Lighting — warm fashion-studio feel */}
      <ambientLight intensity={0.4} color="#fff5e6" />
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.8}
        color="#fff8f0"
        castShadow={false}
      />
      <pointLight position={[-4, 2, 2]} intensity={2.5} color={CARDINAL} distance={8} />
      <pointLight position={[4, -2, 1]} intensity={1.2} color={GOLD} distance={6} />
      <pointLight position={[0, -4, 3]} intensity={0.8} color="#ffffff" distance={5} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────
// EXPORT — with mobile fallback
// ─────────────────────────────────────────────────────────────────

const ClothingHeroScene = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    // Detect mobile — skip 3D to save battery
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    setIsMobile(mobile);

    // Detect low-end device by memory or renderer
    const nav = navigator;
    if (nav.deviceMemory && nav.deviceMemory < 4) setIsLowEnd(true);
    if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) setIsLowEnd(true);
  }, []);

  // Static fallback for mobile / low-end — show brand-colored gradient
  if (isMobile || isLowEnd) {
    return (
      <div className="w-full h-full" style={{
        background: 'linear-gradient(135deg, #111827 0%, #1f0a10 40%, #ba1f3d 100%)',
      }} />
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 1.5]}                    // Cap pixel ratio for performance
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        performance={{ min: 0.5 }}       // Adaptive quality
        frameloop="always"
      >
        <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={52} />
        <Suspense fallback={null}>
          <ClothingScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ClothingHeroScene;