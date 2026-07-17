import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function FloatingCrystals() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.03;
    }
  });

  const crystals = [
    { pos: [-3.5, 1.5, -3] as [number, number, number], scale: 0.3, speed: 0.7 },
    { pos: [4, -1, -4] as [number, number, number], scale: 0.2, speed: 0.5 },
    { pos: [-2, -2, -2] as [number, number, number], scale: 0.15, speed: 0.9 },
    { pos: [3, 2, -5] as [number, number, number], scale: 0.25, speed: 0.6 },
    { pos: [-4, 0, -3] as [number, number, number], scale: 0.18, speed: 0.8 },
  ];

  return (
    <group ref={group}>
      {crystals.map((c, i) => (
        <Crystal key={i} position={c.pos} scale={c.scale} speed={c.speed} />
      ))}
    </group>
  );
}

function Crystal({ position, scale, speed }: { position: [number, number, number]; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * speed * 0.3;
      ref.current.rotation.z = state.clock.elapsedTime * speed * 0.2;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial
        color="#d4a853"
        metalness={0.1}
        roughness={0.05}
        transmission={0.8}
        thickness={1}
        ior={2.0}
        transparent
        opacity={0.4}
        envMapIntensity={2}
      />
    </mesh>
  );
}
