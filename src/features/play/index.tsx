import React, { useState } from 'react';
import { Link } from 'wasp/client/router';
import { useNavigate } from 'react-router-dom';
import { useAction, useQuery } from 'wasp/client/operations';
import { startGameMode, seedQuizData, getQuizHistory, getStatsOverview } from 'wasp/client/operations';
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
  Gamepad2,
  CheckCircle,
  History,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlayPage() {
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  const startGameModeFn = useAction(startGameMode);
  const seedDataFn = useAction(seedQuizData);
  
  // Fetch recent activity: last 30 attempts
  const { data: quizHistory, isLoading: historyLoading } = useQuery(getQuizHistory, { page: 1, pageSize: 30 }, {
    enabled: !!user
  });

  // Fetch overview stats to show accurate streak in quick stats
  const { data: statsOverview } = useQuery(getStatsOverview, { range: 30 }, {
    enabled: !!user
  });

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(selectedMode === modeId ? null : modeId);
  };

  const recentItems: any[] = (quizHistory as any)?.items || []

  // Format time ago helper
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handlePlay = async () => {
    if (!selectedMode || isStarting) return;
    
    setIsStarting(true);
    
    try {
      // First ensure we have demo data
      await seedDataFn({});
      
      const mode = quizModes.find(m => m.id === selectedMode);
      if (!mode) return;

      // Map UI mode IDs to database mode types
      const modeMap: Record<string, string> = {
        'rapid-fire': 'RAPID_FIRE',
        'flashcard-frenzy': 'FLASHCARD_FRENZY',
        'time-attack': 'TIME_ATTACK',
        'precision': 'PRECISION',
        'test-mode': 'TEST_MODE',
        'study-mode': 'STUDY_MODE',
        'beef-challenges': 'BEEF_CHALLENGE',
        'trending': 'RAPID_FIRE', // Default to rapid fire for now
        'ai-curated': 'STUDY_MODE' // Default to study mode for now
      };

      const dbMode = modeMap[selectedMode];
      
      if (dbMode === 'BEEF_CHALLENGE') {
        // Navigate to beef challenges
        navigate('/beef');
        return;
      }

      if (!dbMode || (dbMode !== 'RAPID_FIRE' && dbMode !== 'FLASHCARD_FRENZY' && dbMode !== 'TIME_ATTACK' && dbMode !== 'PRECISION' && dbMode !== 'TEST_MODE' && dbMode !== 'STUDY_MODE')) {
        // For modes not yet implemented, navigate to placeholder
        window.location.href = mode.href;
        return;
      }

      // Start the game mode
      const result = await startGameModeFn({ mode: dbMode as any });
      
      if (result.success) {
        // Navigate to the appropriate quiz mode with the attempt ID
        const modeRoutes: Record<string, string> = {
          'RAPID_FIRE': '/quiz/rapid-fire',
          'FLASHCARD_FRENZY': '/quiz/flashcard-frenzy',
          'TIME_ATTACK': '/quiz/time-attack',
          'PRECISION': '/quiz/precision',
          'TEST_MODE': '/quiz/test-mode',
          'STUDY_MODE': '/quiz/study-mode'
        };
        
        const route = modeRoutes[dbMode];
        if (route) {
          navigate(`${route}?attemptId=${result.quizAttemptId}`);
        }
      }
    } catch (error) {
      console.error('Error starting game mode:', error);
      // Fallback to original navigation
      const mode = quizModes.find(m => m.id === selectedMode);
      if (mode) {
        window.location.href = mode.href;
      }
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Ready to Play? 🎮
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Each mode offers a unique challenge to test your knowledge
          </p>
        </div>
      </motion.div>

      {/* Grand Quiz Mode Tiles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6 mb-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {quizModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            >
              <GrandQuizTile 
                mode={mode} 
                isSelected={selectedMode === mode.id}
                onSelect={() => handleModeSelect(mode.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Play Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mb-12 text-center"
      >
        <Button 
          size="lg" 
          onClick={handlePlay}
          disabled={!selectedMode || isStarting}
          className={cn(
            "text-xl px-10 py-6 rounded-xl shadow-xl transition-all duration-300",
            "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            selectedMode && !isStarting && "animate-pulse"
          )}
        >
          {isStarting ? (
            <>
              <div className="w-8 h-8 mr-4 border-4 border-white border-t-transparent rounded-full animate-spin" />
              STARTING...
            </>
          ) : (
            <>
              <Play className="w-8 h-8 mr-4" fill="currentColor" />
              PLAY
              {selectedMode && <ChevronRight className="w-8 h-8 ml-4" />}
            </>
          )}
        </Button>
        {!selectedMode && (
          <p className="text-sm text-muted-foreground mt-3">
            Select a game mode above to start playing
          </p>
        )}
      </motion.div>

      {/* Streaks Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {(
          [
            {
              label: 'Your Streak',
              value: String(statsOverview?.streak ?? 0),
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
          ] as const
        ).map((stat, index) => (
          <Card key={stat.label} className="p-4 text-center hover:shadow-md transition-shadow rounded-xl">
            <CardContent className="space-y-2">
              <stat.icon className={cn("w-8 h-8 mx-auto", stat.color)} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Recent Activity: copy of Quiz History (last 30) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Recent Activity
          </h3>
        </div>

        <Card>
          <CardContent className="p-0">
            {historyLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading recent activity...</p>
              </div>
            ) : (
              <div className="w-full overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Document</th>
                      <th className="text-left p-3">Mode</th>
                      <th className="text-right p-3">Score</th>
                      <th className="text-right p-3">Questions</th>
                      <th className="text-right p-3">Time</th>
                      <th className="text-right p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentItems || []).map((row: any) => (
                      <tr key={row.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}</td>
                        <td className="p-3 truncate max-w-[280px]">{row.documentTitle}</td>
                        <td className="p-3">{row.mode || row.quizMode}</td>
                        <td className="p-3 text-right font-medium">{Math.round(row.score)}%</td>
                        <td className="p-3 text-right">{row.correctAnswers}/{row.totalQuestions}</td>
                        <td className="p-3 text-right">{formatTimeAgo(new Date(row.completedAt))}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <Button variant='outline' size='sm' onClick={() => (window.location.href = `/quiz/${row.id}/results`)}>Review</Button>
                          <Button size='sm' className="ml-2" onClick={() => (window.location.href = `/quiz/${row.documentId}/take`)}>Retake</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/analytics?tab=history')}>
            Quiz History
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    </main>
  );
}

interface QuizMode {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  textColor: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  duration: string;
  popularity: 'Hot' | 'New' | 'Popular' | null;
  href: string;
}

interface ActivityItem {
  title: string;
  description: string;
  type: 'quiz' | 'beef' | 'lesson';
  score: string;
  result: 'win' | 'loss' | 'neutral';
  date: string;
  icon: React.ElementType;
  color: string;
}

function GrandQuizTile({ mode, isSelected, onSelect }: { 
  mode: QuizMode; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-300 relative overflow-hidden",
          "border h-52 md:h-60 rounded-3xl",
          isSelected 
            ? "border-primary shadow-2xl shadow-primary/25 ring-4 ring-primary/20" 
            : "border-transparent hover:border-primary/20 hover:shadow-xl"
        )}
        onClick={onSelect}
      >
        {/* Beautiful Gradient Background */}
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          mode.gradient,
          isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-90"
        )} />
        
        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 z-20"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
          </motion.div>
        )}

        {/* Popularity Badge */}
        {mode.popularity && (
          <div className="absolute top-4 left-4 z-20">
            <Badge 
              variant={mode.popularity === 'Hot' ? 'destructive' : 'secondary'} 
              className="text-xs font-semibold shadow-lg"
            >
              {mode.popularity === 'Hot' && <Flame className="w-3 h-3 mr-1" />}
              {mode.popularity}
            </Badge>
          </div>
        )}
        
        <CardContent className="p-6 relative z-10 h-full flex flex-col justify-between">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300",
              "bg-white/10 backdrop-blur-sm",
              "group-hover:scale-110",
              isSelected && "scale-110"
            )}>
              <mode.icon className={cn("w-8 h-8", mode.textColor)} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3 flex-1">
            <h4 className={cn(
              "font-bold text-lg transition-colors",
              mode.textColor,
              "drop-shadow-sm"
            )}>
              {mode.title}
            </h4>
            <p className={cn(
              "text-sm line-clamp-2",
              mode.textColor,
              "opacity-90"
            )}>
              {mode.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/15">
            <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">
              {mode.difficulty}
            </Badge>
            <span className={cn("text-xs flex items-center", mode.textColor, "opacity-90")}>
              <Clock className="w-3 h-3 mr-1" />
              {mode.duration}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const quizModes: QuizMode[] = [
  {
    id: 'rapid-fire',
    title: 'Rapid Fire',
    description: 'Quick questions, faster thinking. Test your instant recall.',
    icon: Zap,
    gradient: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
    textColor: 'text-white',
    difficulty: 'Medium',
    duration: '5 min',
    popularity: 'Hot',
    href: '/quiz/rapid-fire'
  },
  {
    id: 'flashcard-frenzy',
    title: 'Flashcard Frenzy',
    description: 'Test your confidence with dynamic scoring and streak bonuses.',
    icon: Brain,
    gradient: 'bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500',
    textColor: 'text-white',
    difficulty: 'Hard',
    duration: '15 min',
    popularity: 'Popular',
    href: '/quiz/flashcard-frenzy'
  },
  {
    id: 'time-attack',
    title: 'Time Attack',
    description: 'Race against time in this high-pressure quiz format.',
    icon: Timer,
    gradient: 'bg-gradient-to-br from-red-500 via-pink-500 to-rose-500',
    textColor: 'text-white',
    difficulty: 'Expert',
    duration: '3 min',
    popularity: 'Hot',
    href: '/quiz/time-attack'
  },
  {
    id: 'precision',
    title: 'Precision',
    description: 'Accuracy over speed. Every answer counts.',
    icon: Target,
    gradient: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500',
    textColor: 'text-white',
    difficulty: 'Medium',
    duration: '10 min',
    popularity: null,
    href: '/quiz/precision'
  },
  {
    id: 'test-mode',
    title: 'Test Mode',
    description: 'Exam-style quiz with no instant feedback. Review before submitting.',
    icon: CheckCircle,
    gradient: 'bg-gradient-to-br from-slate-500 via-gray-600 to-zinc-700',
    textColor: 'text-white',
    difficulty: 'Medium',
    duration: '30 min',
    popularity: 'New',
    href: '/quiz/test-mode'
  },
  {
    id: 'study-mode',
    title: 'Study Mode',
    description: 'Learn as you play with detailed explanations and conceptual understanding.',
    icon: BookOpen,
    gradient: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500',
    textColor: 'text-white',
    difficulty: 'Easy',
    duration: '20 min',
    popularity: 'New',
    href: '/quiz/study-mode'
  },
  {
    id: 'beef-challenges',
    title: 'Beef Challenges',
    description: 'Challenge friends or compete with global players.',
    icon: Users,
    gradient: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500',
    textColor: 'text-white',
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
    gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-500',
    textColor: 'text-white',
    difficulty: 'Medium',
    duration: '12 min',
    popularity: 'Popular',
    href: '/play/recommended'
  },
  {
    id: 'ai-curated',
    title: 'AI Curated',
    description: 'Personalized quizzes crafted by Nalanda AI.',
    icon: Sparkles,
    gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    textColor: 'text-white',
    difficulty: 'Medium',
    duration: '15 min',
    popularity: 'New',
    href: '/library'
  }
];

const recentActivityList: ActivityItem[] = [
  {
    title: 'World History Quiz',
    description: 'Ancient civilizations and their impact on modern society',
    type: 'quiz',
    score: '85',
    result: 'win',
    date: '2 hours ago',
    icon: BookOpen,
    color: 'bg-gradient-to-br from-blue-500 to-cyan-500'
  },
  {
    title: 'Math Beef vs. Alex',
    description: 'Intense calculation battle with algebraic equations',
    type: 'beef',
    score: '240',
    result: 'win',
    date: '1 day ago',
    icon: Zap,
    color: 'bg-gradient-to-br from-orange-500 to-red-500'
  },
  {
    title: 'Science Concepts',
    description: 'Physics and chemistry fundamentals review',
    type: 'lesson',
    score: '92',
    result: 'win',
    date: '3 days ago',
    icon: Brain,
    color: 'bg-gradient-to-br from-purple-500 to-indigo-500'
  },
  {
    title: 'Geography Challenge',
    description: 'Countries, capitals, and geographical features',
    type: 'quiz',
    score: '67',
    result: 'loss',
    date: '4 days ago',
    icon: Target,
    color: 'bg-gradient-to-br from-green-500 to-emerald-500'
  },
  {
    title: 'Literature Beef vs. Sarah',
    description: 'Classic novels and poetry analysis showdown',
    type: 'beef',
    score: '150',
    result: 'loss',
    date: '5 days ago',
    icon: BookOpen,
    color: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  {
    title: 'Rapid Fire: General Knowledge',
    description: 'Quick-fire questions across multiple topics',
    type: 'quiz',
    score: '78',
    result: 'win',
    date: '6 days ago',
    icon: Zap,
    color: 'bg-gradient-to-br from-yellow-500 to-orange-500'
  },
  {
    title: 'Programming Fundamentals',
    description: 'Basic coding concepts and algorithms',
    type: 'lesson',
    score: '89',
    result: 'win',
    date: '1 week ago',
    icon: Brain,
    color: 'bg-gradient-to-br from-indigo-500 to-purple-500'
  },
  {
    title: 'Physics Beef vs. Marcus',
    description: 'Quantum mechanics and relativity theory battle',
    type: 'beef',
    score: '95',
    result: 'loss',
    date: '1 week ago',
    icon: Users,
    color: 'bg-gradient-to-br from-blue-500 to-indigo-500'
  },
  {
    title: 'Art History Quiz',
    description: 'Renaissance to modern art movements',
    type: 'quiz',
    score: '91',
    result: 'win',
    date: '1 week ago',
    icon: BookOpen,
    color: 'bg-gradient-to-br from-pink-500 to-rose-500'
  },
  {
    title: 'Chemistry Lab Simulation',
    description: 'Virtual experiments and molecular structures',
    type: 'lesson',
    score: '73',
    result: 'win',
    date: '2 weeks ago',
    icon: Brain,
    color: 'bg-gradient-to-br from-green-500 to-blue-500'
  },
  {
    title: 'Language Beef vs. Emma',
    description: 'Spanish vocabulary and grammar challenge',
    type: 'beef',
    score: '120',
    result: 'win',
    date: '2 weeks ago',
    icon: Zap,
    color: 'bg-gradient-to-br from-red-500 to-pink-500'
  },
  {
    title: 'Economics Quiz',
    description: 'Market dynamics and economic principles',
    type: 'quiz',
    score: '56',
    result: 'loss',
    date: '2 weeks ago',
    icon: TrendingUp,
    color: 'bg-gradient-to-br from-amber-500 to-orange-500'
  },
  {
    title: 'Biology Deep Dive',
    description: 'Cell structure and genetic mechanisms',
    type: 'lesson',
    score: '88',
    result: 'win',
    date: '3 weeks ago',
    icon: Brain,
    color: 'bg-gradient-to-br from-green-500 to-teal-500'
  },
  {
    title: 'Philosophy Beef vs. David',
    description: 'Ancient Greek philosophy and ethics debate',
    type: 'beef',
    score: '180',
    result: 'win',
    date: '3 weeks ago',
    icon: Users,
    color: 'bg-gradient-to-br from-purple-500 to-indigo-500'
  },
  {
    title: 'Astronomy Quiz',
    description: 'Solar system, stars, and galactic phenomena',
    type: 'quiz',
    score: '82',
    result: 'win',
    date: '3 weeks ago',
    icon: Target,
    color: 'bg-gradient-to-br from-indigo-500 to-blue-500'
  },
  {
    title: 'Music Theory Basics',
    description: 'Scales, chords, and composition fundamentals',
    type: 'lesson',
    score: '75',
    result: 'win',
    date: '1 month ago',
    icon: BookOpen,
    color: 'bg-gradient-to-br from-violet-500 to-purple-500'
  },
  {
    title: 'Statistics Beef vs. Lisa',
    description: 'Probability and data analysis showdown',
    type: 'beef',
    score: '110',
    result: 'loss',
    date: '1 month ago',
    icon: Zap,
    color: 'bg-gradient-to-br from-cyan-500 to-blue-500'
  },
  {
    title: 'Engineering Principles',
    description: 'Mechanical and electrical engineering concepts',
    type: 'quiz',
    score: '79',
    result: 'win',
    date: '1 month ago',
    icon: Target,
    color: 'bg-gradient-to-br from-orange-500 to-red-500'
  },
  {
    title: 'Psychology Study',
    description: 'Cognitive behavior and mental processes',
    type: 'lesson',
    score: '93',
    result: 'win',
    date: '1 month ago',
    icon: Brain,
    color: 'bg-gradient-to-br from-pink-500 to-purple-500'
  },
  {
    title: 'History Beef vs. Tom',
    description: 'World War events and political movements',
    type: 'beef',
    score: '160',
    result: 'win',
    date: '1 month ago',
    icon: Users,
    color: 'bg-gradient-to-br from-red-500 to-orange-500'
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