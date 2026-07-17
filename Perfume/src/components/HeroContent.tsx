import { AnimatePresence, motion } from 'framer-motion';
import type { FragranceVariant } from '@/data/fragranceVariants';

interface HeroContentProps { variant: FragranceVariant }

const container = {
  hidden: { opacity: 0, x: -34 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.08 } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.28, ease: 'easeIn' } },
};
const item = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

export default function HeroContent({ variant }: HeroContentProps) {
  return (
    <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16 lg:px-24 max-w-2xl">
      <AnimatePresence mode="wait">
        <motion.div key={variant.name} variants={container} initial="hidden" animate="visible" exit="exit">
          <motion.p variants={item} className="font-ui text-xs tracking-[0.4em] text-gold-light uppercase mb-6">{variant.overline}</motion.p>
          <motion.h1 variants={item} className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] mb-4">
            <span className="text-gold-gradient">{variant.titleAccent}</span><br />
            <span className="text-foreground">{variant.title}</span>
          </motion.h1>
          <motion.p variants={item} className="font-body text-xl md:text-2xl text-champagne tracking-[0.15em] mb-6">{variant.subtitle}</motion.p>
          <motion.p variants={item} className="font-body text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-md">{variant.description}</motion.p>
          <motion.div variants={item} className="flex flex-wrap gap-4">
            <button className="btn-gold rounded-sm">Buy Now</button>
            <button className="btn-glass rounded-sm">Discover Fragrance</button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
