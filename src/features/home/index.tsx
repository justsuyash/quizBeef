import React from 'react';
import { Link } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/cn';
import { useAuth } from 'wasp/client/auth';
import { 
  Play, 
  Brain, 
  Zap, 
  Trophy, 
  Clock, 
  Target,
  BookOpen,
  Users,
  TrendingUp,
  Flame,
  ChevronRight,
  Sparkles,
  Timer,
  Award,
  Gamepad2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { data: user } = useAuth();

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome back, {user?.id ? 'Champion' : 'Player'}! 🔥
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your battle. Master your knowledge. Dominate the leaderboards.
          </p>
        </div>
      </motion.div>

      {/* Main Play Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-12"
      >
        <Card className="p-8 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer group">
          <CardContent className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Play className="w-12 h-12 text-primary-foreground" fill="currentColor" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold">Ready to Play?</h2>
              <p className="text-lg text-muted-foreground">
                Jump into personalized quizzes curated just for you
              </p>
            </div>
            <Button asChild size="lg" className="text-xl px-12 py-6 shadow-lg group-hover:shadow-xl transition-shadow">
              <Link to="/play" className="flex items-center">
                <Gamepad2 className="w-6 h-6 mr-3" />
                START PLAYING
                <ChevronRight className="w-6 h-6 ml-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz Type Tiles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Choose Your Game Mode</h3>
          <p className="text-muted-foreground">Each mode offers a unique challenge to test your knowledge</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {quizModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
            >
              <QuizTile mode={mode} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {quickStats.map((stat, index) => (
          <Card key={stat.label} className="p-4 text-center hover:shadow-md transition-shadow">
            <CardContent className="space-y-2">
              <stat.icon className={cn("w-8 h-8 mx-auto", stat.color)} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </main>
  );
}

interface QuizMode {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  duration: string;
  popularity: 'Hot' | 'New' | 'Popular' | null;
  href: string;
}

function QuizTile({ mode }: { mode: QuizMode }) {
  return (
    <Link to={mode.href as any}>
      <Card className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105",
        "border-2 border-transparent hover:border-primary/20",
        "relative overflow-hidden"
      )}>
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          mode.bgGradient
        )} />
        
        <CardContent className="p-4 relative z-10">
          {/* Header with Icon and Badge */}
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
              mode.color,
              "group-hover:bg-white/20"
            )}>
              <mode.icon className="w-6 h-6 text-white" />
            </div>
            {mode.popularity && (
              <Badge variant={mode.popularity === 'Hot' ? 'destructive' : 'secondary'} className="text-xs">
                {mode.popularity === 'Hot' && <Flame className="w-3 h-3 mr-1" />}
                {mode.popularity}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
              {mode.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {mode.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {mode.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {mode.duration}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const quizModes: QuizMode[] = [
  {
    id: 'rapid-fire',
    title: 'Rapid Fire',
    description: 'Quick questions, faster thinking. Test your instant recall.',
    icon: Zap,
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500',
    bgGradient: 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10',
    difficulty: 'Medium',
    duration: '5 min',
    popularity: 'Hot',
    href: '/play'
  },
  {
    id: 'brain-storm',
    title: 'Brain Storm',
    description: 'Deep thinking challenges that push your cognitive limits.',
    icon: Brain,
    color: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    bgGradient: 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10',
    difficulty: 'Hard',
    duration: '15 min',
    popularity: 'Popular',
    href: '/play'
  },
  {
    id: 'time-attack',
    title: 'Time Attack',
    description: 'Race against time in this high-pressure quiz format.',
    icon: Timer,
    color: 'bg-gradient-to-br from-red-500 to-pink-500',
    bgGradient: 'bg-gradient-to-br from-red-500/10 to-pink-500/10',
    difficulty: 'Expert',
    duration: '3 min',
    popularity: 'Hot',
    href: '/play'
  },
  {
    id: 'precision',
    title: 'Precision',
    description: 'Accuracy over speed. Every answer counts.',
    icon: Target,
    color: 'bg-gradient-to-br from-green-500 to-emerald-500',
    bgGradient: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
    difficulty: 'Medium',
    duration: '10 min',
    popularity: null,
    href: '/play'
  },
  {
    id: 'study-mode',
    title: 'Study Mode',
    description: 'Learn as you play with detailed explanations.',
    icon: BookOpen,
    color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    bgGradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
    difficulty: 'Easy',
    duration: '20 min',
    popularity: null,
    href: '/play'
  },
  {
    id: 'multiplayer',
    title: 'Multiplayer',
    description: 'Challenge friends or compete with global players.',
    icon: Users,
    color: 'bg-gradient-to-br from-violet-500 to-purple-500',
    bgGradient: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10',
    difficulty: 'Medium',
    duration: '8 min',
    popularity: 'New',
    href: '/beef'
  },
  {
    id: 'trending',
    title: 'Trending',
    description: 'Popular quizzes everyone is talking about.',
    icon: TrendingUp,
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
    bgGradient: 'bg-gradient-to-br from-orange-500/10 to-red-500/10',
    difficulty: 'Medium',
    duration: '12 min',
    popularity: 'Popular',
    href: '/play'
  },
  {
    id: 'ai-curated',
    title: 'AI Curated',
    description: 'Personalized quizzes crafted by Nalanda AI.',
    icon: Sparkles,
    color: 'bg-gradient-to-br from-primary to-accent',
    bgGradient: 'bg-gradient-to-br from-primary/10 to-accent/10',
    difficulty: 'Medium',
    duration: '15 min',
    popularity: 'New',
    href: '/library'
  }
];

const quickStats = [
  {
    label: 'Your Streak',
    value: '7',
    icon: Flame,
    color: 'text-orange-500'
  },
  {
    label: 'Global Rank',
    value: '#42',
    icon: Trophy,
    color: 'text-yellow-500'
  },
  {
    label: 'Total Score',
    value: '2.4K',
    icon: Award,
    color: 'text-blue-500'
  },
  {
    label: 'Completed',
    value: '134',
    icon: Target,
    color: 'text-green-500'
  }
];
