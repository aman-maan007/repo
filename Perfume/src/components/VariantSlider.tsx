import { motion } from 'framer-motion';

interface VariantSliderProps {
  variants: string[];
  activeVariant: string;
  onSelect: (v: string) => void;
}

const VARIANT_SWATCHES: Record<string, string> = {
  Gold: 'bg-[hsl(42,78%,55%)]',
  Black: 'bg-[hsl(0,0%,12%)]',
  'Rose Gold': 'bg-[hsl(350,50%,65%)]',
  Emerald: 'bg-[hsl(155,45%,35%)]',
  Crystal: 'bg-[hsl(0,0%,85%)]',
};

export default function VariantSlider({ variants, activeVariant, onSelect }: VariantSliderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 1.5 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-glass rounded-full px-6 py-3 flex items-center gap-5"
    >
      {variants.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          aria-label={`Select ${v} fragrance`}
          aria-pressed={activeVariant === v}
          className="flex flex-col items-center gap-2 group"
        >
          <div
            className={`w-8 h-8 rounded-full border-2 transition-all duration-300
              ${VARIANT_SWATCHES[v]}
              ${activeVariant === v
                ? 'border-primary scale-110 glow-gold variant-swatch-active'
                : 'border-transparent opacity-60 group-hover:opacity-100 group-hover:scale-105'
              }`}
          />
          <span
            className={`font-ui text-[10px] tracking-wider transition-colors duration-300
              ${activeVariant === v ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
          >
            {v.toUpperCase()}
          </span>
        </button>
      ))}
    </motion.div>
  );
}
