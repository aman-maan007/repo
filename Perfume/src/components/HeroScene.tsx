import { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import PerfumeBottle from './PerfumeBottle';
import SceneParticles from './SceneParticles';
import FloatingCrystals from './FloatingCrystals';

interface HeroSceneProps {
  variant: string;
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <spotLight
        position={[0, 8, 2]}
        angle={0.4}
        penumbra={0.8}
        intensity={3}
        color="#fff8e7"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[4, 2, -2]} intensity={1.5} color="#d4a853" />
      <pointLight position={[-4, 1, -1]} intensity={0.8} color="#8a7040" />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#ffffff" />
    </>
  );
}

/** Dynamically adjusts camera Z based on viewport aspect ratio */
function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    // Much closer camera for dominant bottle presence
    if (aspect < 0.7) {
      // Mobile portrait
      camera.position.set(0, 0.4, 7);
    } else if (aspect < 1.1) {
      // Tablet / square
      camera.position.set(0, 0.4, 5.5);
    } else {
      // Desktop
      camera.position.set(0, 0.4, 4.8);
    }
    camera.updateProjectionMatrix();
  }, [size, camera]);

  return null;
}

function useResponsiveScale() {
  const [scale, setScale] = useState(1.15);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      // Significantly increased scale for dominant presence
      if (w < 640) setScale(0.85);
      else if (w < 1024) setScale(1.0);
      else setScale(1.15);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return scale;
}

export default function HeroScene({ variant }: HeroSceneProps) {
  const bottleScale = useResponsiveScale();

  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        shadows
        camera={{ position: [0, 0.4, 4.8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={['#0a0a08', 7, 16]} />
        <ResponsiveCamera />
        <Suspense fallback={null}>
          <SceneLighting />
          <PerfumeBottle variant={variant} scale={bottleScale} />
          <SceneParticles variant={variant} />
          <FloatingCrystals />
          <ContactShadows
            position={[0, -1.6, 0]}
            opacity={0.5}
            scale={8}
            blur={2}
            far={4}
            color="#000000"
          />
          <Environment preset="studio" environmentIntensity={0.5} />
        </Suspense>
      </Canvas>
    </div>
  );
}
