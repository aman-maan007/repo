import { useState } from 'react';
import { motion } from 'framer-motion';

interface FragrancePanelProps { variant: string; notes: string }

const PRICES: Record<string, Record<string, number>> = {
  Gold: { '30ml': 185, '50ml': 265, '100ml': 395 },
  Black: { '30ml': 195, '50ml': 280, '100ml': 420 },
  'Rose Gold': { '30ml': 175, '50ml': 255, '100ml': 385 },
  Emerald: { '30ml': 205, '50ml': 295, '100ml': 445 },
  Crystal: { '30ml': 225, '50ml': 315, '100ml': 475 },
};
const sizes = ['30ml', '50ml', '100ml'];

export default function FragrancePanel({ variant, notes }: FragrancePanelProps) {
  const [selectedSize, setSelectedSize] = useState('50ml');
  const price = PRICES[variant]?.[selectedSize] || 265;

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 1.3 }} className="relative z-10 bg-glass rounded-lg p-8 w-72 animate-float">
      <p className="font-ui text-xs tracking-[0.3em] text-gold-light uppercase mb-6">Select Size</p>
      <div className="flex gap-3 mb-8">
        {sizes.map((size) => (
          <button key={size} onClick={() => setSelectedSize(size)} className={`w-16 h-16 rounded-full flex items-center justify-center font-ui text-xs tracking-wider transition-all duration-300 ${selectedSize === size ? 'border-2 border-primary text-primary glow-gold' : 'border border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}>{size}</button>
        ))}
      </div>
      <div className="mb-6">
        <p className="font-ui text-xs text-muted-foreground tracking-wider mb-1">PRICE</p>
        <motion.p key={`${variant}-${price}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold text-gold-gradient">${price}</motion.p>
      </div>
      <div className="border-t border-border pt-4">
        <p className="font-ui text-xs text-muted-foreground tracking-wider mb-2">TOP NOTES</p>
        <motion.p key={notes} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-body text-sm text-foreground">{notes}</motion.p>
      </div>
      <button className="btn-gold w-full mt-6 rounded-sm text-center">Add to Cart</button>
    </motion.div>
  );
}
