import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import HeroScene from '@/components/HeroScene';
import HeroContent from '@/components/HeroContent';
import FragrancePanel from '@/components/FragrancePanel';
import VariantSlider from '@/components/VariantSlider';
import { FRAGRANCE_VARIANTS, getVariant } from '@/data/fragranceVariants';

const Index = () => {
  const [activeVariant, setActiveVariant] = useState('Gold');
  const [cycleKey, setCycleKey] = useState(0);
  const variant = useMemo(() => getVariant(activeVariant), [activeVariant]);

  const selectVariant = useCallback((name: string) => {
    setActiveVariant(name);
    setCycleKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveVariant((current) => {
        const index = FRAGRANCE_VARIANTS.findIndex(({ name }) => name === current);
        return FRAGRANCE_VARIANTS[(index + 1) % FRAGRANCE_VARIANTS.length].name;
      });
    }, 6000);
    return () => window.clearInterval(timer);
  }, [cycleKey]);

  const theme = {
    '--primary': variant.accent, '--gold': variant.accent,
    '--gold-light': variant.accentLight, '--gold-dark': variant.accentDark,
    '--variant-glow': variant.glow,
  } as CSSProperties;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: 'var(--gradient-dark)', ...theme }}>
      {/* 3D Scene */}
      <HeroScene variant={activeVariant} />

      {/* Content overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-between px-4 md:px-8">
        {/* Left: Text content */}
        <HeroContent variant={variant} />

        {/* Right: Glass panel - hidden on small screens */}
        <div className="hidden lg:flex items-center pr-8 xl:pr-16">
          <FragrancePanel variant={activeVariant} notes={variant.notes} />
        </div>
      </div>

      {/* Variant slider */}
      <VariantSlider
        variants={FRAGRANCE_VARIANTS.map(({ name }) => name)}
        activeVariant={activeVariant}
        onSelect={selectVariant}
      />

      {/* Top nav hint */}
      <div className="absolute top-6 left-8 z-20">
        <p className="font-display text-lg tracking-[0.3em] text-gold-gradient">MAISON ROYALE</p>
      </div>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, hsla(0,0%,0%,0.6) 100%)',
        }}
      />
    </div>
  );
};

export default Index;
