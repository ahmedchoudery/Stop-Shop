/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, PerspectiveCamera, Environment, Sphere, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const CARDINAL_RED = '#ba1f3d';

const Shard = ({ position, scale, speed }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002 * speed;
      meshRef.current.rotation.y += 0.001 * speed;
      
      // Gentle floating motion handled by Float parent, 
      // but we add a bit of scale pulsing
      const s = 1 + Math.sin(time * 0.5) * 0.05;
      meshRef.current.scale.set(scale * s, scale * s, scale * s);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={1}
          chromaticAberration={0.02}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.1}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor={CARDINAL_RED}
          color={CARDINAL_RED}
        />
      </mesh>
    </Float>
  );
};

const AbstractScene = () => {
  const { mouse } = useThree();
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      // Subtle parallax based on mouse
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        mouse.x * 0.1,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -mouse.y * 0.1,
        0.05
      );
    }
  });

  const shards = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      ],
      scale: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 2 + 1
    }));
  }, []);

  return (
    <group ref={groupRef}>
      {shards.map((props, i) => (
        <Shard key={i} {...props} />
      ))}
      
      {/* Core Energy Sphere */}
      <Float speed={5} rotationIntensity={2} floatIntensity={5}>
        <Sphere args={[1.5, 64, 64]}>
          <MeshDistortMaterial
            color={CARDINAL_RED}
            speed={2}
            distort={0.4}
          />
        </Sphere>
      </Float>

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} color={CARDINAL_RED} intensity={2} />
      <pointLight position={[-10, -10, -10]} color="#ffffff" intensity={1} />
    </group>
  );
};

const HeroScene = () => {
  return (
    <div className="w-full h-full">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
        <Suspense fallback={null}>
          <AbstractScene />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HeroScene;

