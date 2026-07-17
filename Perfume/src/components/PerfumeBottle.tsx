import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PerfumeBottleProps {
  variant: string;
  scale?: number;
}

const VARIANT_COLORS: Record<string, { bottle: string; cap: string; liquid: string }> = {
  Gold: { bottle: '#d4a853', cap: '#c9a84c', liquid: '#e8c547' },
  Black: { bottle: '#1a1a1a', cap: '#2a2a2a', liquid: '#3d2b1f' },
  'Rose Gold': { bottle: '#b76e79', cap: '#c98a93', liquid: '#e8a0b0' },
  Emerald: { bottle: '#1a4a3a', cap: '#2d6b4f', liquid: '#3d9970' },
  Crystal: { bottle: '#e8e8e8', cap: '#c0c0c0', liquid: '#f0e6d3' },
};

// Bottle top is ~2.2 units, bottom ~-1.05, center ~0.575
// Offset downward so top breathing room > bottom → luxury composition
// Adjusted for much larger scale: maintain 80-100px top safe space
const BOTTLE_Y_OFFSET = -0.6;

export default function PerfumeBottle({ variant, scale = 1.0 }: PerfumeBottleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.Gold;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
      // Gentle float, anchored to offset
      groupRef.current.position.y = BOTTLE_Y_OFFSET + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
    }
  });

  const bottleMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.bottle),
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.85,
    thickness: 1.5,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 2,
    transparent: true,
    opacity: 0.9,
  }), [colors.bottle]);

  const capMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.cap),
    metalness: 0.95,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 3,
  }), [colors.cap]);

  const liquidMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.liquid),
    metalness: 0,
    roughness: 0,
    transmission: 0.6,
    thickness: 2,
    ior: 1.33,
    transparent: true,
    opacity: 0.7,
  }), [colors.liquid]);

  return (
    <group ref={groupRef} position={[0, BOTTLE_Y_OFFSET, 0]} scale={scale}>
      {/* Main bottle body */}
      <mesh position={[0, 0, 0]} material={bottleMaterial} castShadow>
        <boxGeometry args={[1.2, 1.8, 0.7, 4, 4, 4]} />
      </mesh>

      {/* Bottle rounded edges overlay */}
      <mesh position={[0, 0, 0]} material={bottleMaterial}>
        <cylinderGeometry args={[0.55, 0.55, 1.7, 32]} />
      </mesh>

      {/* Liquid inside */}
      <mesh position={[0, -0.15, 0]} material={liquidMaterial}>
        <boxGeometry args={[1.05, 1.2, 0.55]} />
      </mesh>

      {/* Bottle neck */}
      <mesh position={[0, 1.15, 0]} material={bottleMaterial} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 0.5, 32]} />
      </mesh>

      {/* Neck ring */}
      <mesh position={[0, 0.95, 0]} material={capMaterial}>
        <torusGeometry args={[0.38, 0.04, 16, 32]} />
      </mesh>

      {/* Cap base */}
      <mesh position={[0, 1.5, 0]} material={capMaterial} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.3, 32]} />
      </mesh>

      {/* Cap top */}
      <mesh position={[0, 1.85, 0]} material={capMaterial} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>

      {/* Cap top bevel */}
      <mesh position={[0, 2.15, 0]} material={capMaterial}>
        <boxGeometry args={[0.45, 0.1, 0.45]} />
      </mesh>

      {/* Label area */}
      <mesh position={[0, 0.1, 0.36]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.3}
          roughness={0.8}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Floor shadow */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.2, 32]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
