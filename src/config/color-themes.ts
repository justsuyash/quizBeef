// Alternative Color Themes for Quiz Beef
// Each theme is designed with competitive gaming and modern UI principles in mind

export const colorThemes = {
  // Current Theme
  competitorsEdge: {
    name: "Competitor's Edge",
    description: "Bold red and gold - classic competitive colors",
    colors: {
      primary: 'hsl(0 84% 50%)', // Energetic Red
      secondary: 'hsl(210 8% 60%)', // Medium Grey
      accent: 'hsl(45 93% 55%)', // Gold/Yellow
      background: 'hsl(0 0% 98%)', // Off-White
      foreground: 'hsl(210 11% 15%)', // Dark Charcoal
    }
  },

  // Option 1: Neon Arena
  neonArena: {
    name: "Neon Arena",
    description: "Cyberpunk-inspired with electric blue and purple",
    colors: {
      primary: 'hsl(259 100% 65%)', // Electric Purple (#7C3AED)
      secondary: 'hsl(217 91% 60%)', // Bright Blue (#3B82F6)
      accent: 'hsl(280 100% 70%)', // Hot Pink (#E879F9)
      background: 'hsl(222 47% 11%)', // Deep Dark Blue (#0F172A)
      foreground: 'hsl(210 40% 98%)', // Blue-tinted White
    },
    gradients: {
      competitive: 'from-purple-600 via-blue-600 to-pink-600',
      glow: 'shadow-[0_0_30px_rgba(124,58,237,0.5)]'
    }
  },

  // Option 2: Victory Royale
  victoryRoyale: {
    name: "Victory Royale",
    description: "Fortnite-inspired with vibrant purple and orange",
    colors: {
      primary: 'hsl(271 91% 65%)', // Royal Purple (#9333EA)
      secondary: 'hsl(25 95% 53%)', // Vibrant Orange (#F97316)
      accent: 'hsl(190 90% 50%)', // Cyan Blue (#06B6D4)
      background: 'hsl(240 10% 3.9%)', // Almost Black (#0A0A0A)
      foreground: 'hsl(0 0% 98%)', // Pure White
    },
    gradients: {
      competitive: 'from-purple-600 to-orange-500',
      glow: 'shadow-[0_0_40px_rgba(147,51,234,0.6)]'
    }
  },

  // Option 3: Emerald Champions
  emeraldChampions: {
    name: "Emerald Champions",
    description: "Premium feel with emerald green and gold",
    colors: {
      primary: 'hsl(160 84% 39%)', // Emerald Green (#059669)
      secondary: 'hsl(43 96% 56%)', // Rich Gold (#FCD34D)
      accent: 'hsl(199 89% 48%)', // Ocean Blue (#0891B2)
      background: 'hsl(0 0% 100%)', // White
      foreground: 'hsl(240 10% 3.9%)', // Rich Black
    },
    gradients: {
      competitive: 'from-emerald-600 to-teal-600',
      premium: 'from-yellow-400 to-amber-600'
    }
  },

  // Option 4: Midnight Duel
  midnightDuel: {
    name: "Midnight Duel",
    description: "Dark mode first with neon accents",
    colors: {
      primary: 'hsl(157 100% 49%)', // Neon Mint (#00F5A0)
      secondary: 'hsl(234 89% 73%)', // Periwinkle (#818CF8)
      accent: 'hsl(43 100% 70%)', // Warm Yellow (#FDE047)
      background: 'hsl(224 71% 4%)', // Midnight Blue (#030712)
      foreground: 'hsl(213 31% 91%)', // Light Grey (#E2E8F0)
    },
    gradients: {
      competitive: 'from-green-400 to-blue-600',
      neon: 'text-shadow: 0 0 10px currentColor'
    }
  },

  // Option 5: Blaze Rush
  blazeRush: {
    name: "Blaze Rush",
    description: "High energy with orange to pink gradients",
    colors: {
      primary: 'hsl(343 100% 58%)', // Hot Pink (#FF1F6E)
      secondary: 'hsl(33 100% 50%)', // Blazing Orange (#FF8C00)
      accent: 'hsl(51 100% 50%)', // Electric Yellow (#FFD700)
      background: 'hsl(0 0% 100%)', // White
      foreground: 'hsl(0 0% 9%)', // Near Black
    },
    gradients: {
      competitive: 'from-pink-500 via-orange-500 to-yellow-500',
      fire: 'shadow-[0_0_25px_rgba(255,31,110,0.5)]'
    }
  },

  // Option 6: Nalanda Scholar
  nalandaScholar: {
    name: "Nalanda Scholar",
    description: "Inspired by the ancient university of Bihar - wisdom meets warmth",
    colors: {
      primary: 'hsl(19 85% 38%)', // Terracotta - Nalanda's brick architecture
      secondary: 'hsl(30 100% 60%)', // Saffron - Buddhist robes, spirituality
      accent: 'hsl(234 66% 30%)', // Deep Indigo - Wisdom and depth
      background: 'hsl(30 42% 96%)', // Palm Leaf - Ancient manuscripts
      foreground: 'hsl(16 25% 20%)', // Dark Brown - Traditional ink
      gold: 'hsl(46 64% 52%)', // Manuscript Gold - Achievement
    },
    gradients: {
      knowledge: 'from-orange-700 via-orange-500 to-yellow-500',
      enlightenment: 'shadow-[0_0_30px_rgba(255,153,51,0.4),0_0_60px_rgba(212,175,55,0.2)]'
    },
    cultural: {
      significance: 'One of the worlds first universities (427-1197 CE)',
      philosophy: 'Celebrates Indian educational heritage and Buddhist wisdom'
    }
  }
};