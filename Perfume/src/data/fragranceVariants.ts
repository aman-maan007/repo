export interface FragranceVariant {
  name: string; overline: string; title: string; titleAccent: string;
  subtitle: string; description: string; notes: string;
  accent: string; accentLight: string; accentDark: string; glow: string;
}

export const FRAGRANCE_VARIANTS: FragranceVariant[] = [
  { name: 'Gold', overline: 'Collection Privée', titleAccent: 'ESSENCE', title: 'OF ROYALTY', subtitle: 'Luxury Redefined', description: 'An exquisite fusion of rare oud, Damask rose, and golden amber. Crafted for those who command presence without speaking.', notes: 'Bergamot · Saffron · Pink Pepper', accent: '42 78% 55%', accentLight: '42 60% 70%', accentDark: '42 80% 35%', glow: '42 78% 55%' },
  { name: 'Black', overline: 'Noir Collection', titleAccent: 'MIDNIGHT', title: 'AUTHORITY', subtitle: 'Power After Dark', description: 'Smoked vetiver, black cardamom, and polished woods create a magnetic signature of quiet, uncompromising confidence.', notes: 'Black Cardamom · Vetiver · Cedarwood', accent: '36 18% 56%', accentLight: '36 15% 72%', accentDark: '30 18% 30%', glow: '36 24% 55%' },
  { name: 'Rose Gold', overline: 'Édition Rosée', titleAccent: 'VELVET', title: 'ALLURE', subtitle: 'Elegance In Bloom', description: 'Damask rose and luminous peony melt into warm amber, leaving an intimate trail that is soft, radiant, and unforgettable.', notes: 'Damask Rose · Peony · Amber', accent: '350 50% 65%', accentLight: '350 48% 78%', accentDark: '350 38% 42%', glow: '350 50% 65%' },
  { name: 'Emerald', overline: 'Jardin Impérial', titleAccent: 'VERDANT', title: 'MAJESTY', subtitle: 'Nature, Made Noble', description: 'Crushed fig leaf, green mandarin, and deep moss capture the rare stillness of a private garden after rain.', notes: 'Green Mandarin · Fig Leaf · Oakmoss', accent: '155 45% 42%', accentLight: '155 38% 66%', accentDark: '155 48% 25%', glow: '155 45% 42%' },
  { name: 'Crystal', overline: 'La Collection Pure', titleAccent: 'CRYSTAL', title: 'CLARITY', subtitle: 'Light, Captured', description: 'Iris, white tea, and sheer musk unfold with pristine luminosity—a modern composition of effortless refinement.', notes: 'White Tea · Iris · Sheer Musk', accent: '210 10% 72%', accentLight: '210 15% 88%', accentDark: '210 8% 46%', glow: '210 15% 78%' },
];

export const getVariant = (name: string) => FRAGRANCE_VARIANTS.find((variant) => variant.name === name) ?? FRAGRANCE_VARIANTS[0];
