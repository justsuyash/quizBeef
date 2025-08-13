import React from 'react';
import { cn } from '../../lib/cn';
import { motion } from 'framer-motion';
import { 
  Gamepad2, 
  Zap, 
  BookOpen, 
  Brain,
  Target
} from 'lucide-react';
import { useAuth } from 'wasp/client/auth';
import { Link } from 'wasp/client/router';

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  available: boolean;
  comingSoon?: boolean;
}

const gameModes: GameMode[] = [
  {
    id: 'normal',
    title: 'Classic Quiz',
    description: 'Test your knowledge at your own pace',
    icon: Brain,
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-primary/5',
    available: true,
  },
  {
    id: 'rapid',
    title: 'Rapid Fire',
    description: 'Quick questions, faster thinking!',
    icon: Zap,
    color: 'text-accent',
    bgGradient: 'from-accent/20 to-accent/5',
    available: false,
    comingSoon: true,
  },
  {
    id: 'flashcard',
    title: 'Flashcard Frenzy',
    description: 'Swipe through cards, build your memory',
    icon: BookOpen,
    color: 'text-secondary',
    bgGradient: 'from-secondary/20 to-secondary/5',
    available: false,
    comingSoon: true,
  },
  {
    id: 'test',
    title: 'Test Mode',
    description: 'Formal exam-style assessment',
    icon: Target,
    color: 'text-foreground',
    bgGradient: 'from-foreground/10 to-foreground/5',
    available: false,
    comingSoon: true,
  },
];

export default function PlayPage() {
  const { data: user } = useAuth();

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-2 md:py-4">
      {/* Hero Section */}
      <div className="relative">
        <div className="relative z-10 text-center py-4 md:py-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold mb-2"
          >
            <span className="competitive-text-gradient">
              Ready to Beef?
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-4"
          >
            Challenge yourself, compete with friends, and become the ultimate quiz champion
          </motion.p>

          {/* Main Play Button */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <Link
              to={user ? "/documents" : "/login"}
              className={cn(
                'inline-flex items-center gap-2',
                'px-6 py-3 md:px-8 md:py-4',
                'text-base md:text-lg font-bold',
                'rounded-xl',
                'play-button-glow',
                'text-primary-foreground',
                'transform transition-all duration-300',
                'hover:scale-105 active:scale-95',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50'
              )}
            >
              <Gamepad2 className="w-5 h-5 md:w-6 md:h-6" />
              PLAY NOW
            </Link>
          </motion.div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/10 via-transparent to-transparent animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-accent/10 via-transparent to-transparent animate-pulse delay-1000" />
        </div>
      </div>

      {/* Game Modes Grid */}
      <div className="py-4">
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-1">
            Choose Your Mode
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            Select a game mode to start your journey
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto px-4">
          {gameModes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <button
                  disabled={!mode.available}
                  className={cn(
                    'relative w-full p-4 md:p-6',
                    'rounded-2xl border-2',
                    'text-left',
                    'transition-all duration-300',
                    'group',
                    mode.available
                      ? 'border-border hover:border-primary/50 beef-card-hover cursor-pointer'
                      : 'border-border/50 opacity-75 cursor-not-allowed',
                    'bg-gradient-to-br',
                    mode.bgGradient
                  )}
                >
                  {/* Coming Soon Badge */}
                  {mode.comingSoon && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 text-xs font-medium bg-muted rounded-full">
                        Soon
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 md:w-12 md:h-12 mb-2',
                    'rounded-xl flex items-center justify-center',
                    'bg-background/80 backdrop-blur-sm',
                    'group-hover:scale-110 transition-transform duration-300',
                    mode.color
                  )}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>

                  {/* Content */}
                  <h3 className="text-base md:text-lg font-bold mb-1">
                    {mode.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {mode.description}
                  </p>

                  {/* Hover Effect */}
                  {mode.available && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
