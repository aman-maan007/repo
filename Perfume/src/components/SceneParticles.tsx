import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SceneParticlesProps {
  variant: string;
}

const PARTICLE_COLORS: Record<string, string> = {
  Gold: '#d4a853',
  Black: '#888888',
  'Rose Gold': '#e8a0b0',
  Emerald: '#3d9970',
  Crystal: '#c0c0c0',
};

export default function SceneParticles({ variant }: SceneParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const mistRef = useRef<THREE.Points>(null);
  const count = 200;
  const mistCount = 80;

  const particleColor = PARTICLE_COLORS[variant] || PARTICLE_COLORS.Gold;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, []);

  const mistPositions = useMemo(() => {
    const pos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.0005;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (mistRef.current) {
      const positions = mistRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < mistCount; i++) {
        positions[i * 3 + 1] += 0.002;
        positions[i * 3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.001;
        if (positions[i * 3 + 1] > 2) {
          positions[i * 3 + 1] = -1;
        }
      }
      mistRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Shimmer particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color={particleColor}
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Mist particles */}
      <points ref={mistRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={mistCount}
            array={mistPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#ffffff"
          transparent
          opacity={0.15}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
