import React, { useState } from 'react';
import { Link } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { cn } from '../../lib/cn';
import { useAuth } from 'wasp/client/auth';
import { 
  Play, 
  Brain, 
  Clock, 
  Users, 
  TrendingUp,
  Sparkles,
  Heart,
  Eye,
  MessageCircle,
  Star,
  Filter,
  Search,
  ChevronRight,
  Flame,
  Trophy,
  BookOpen,
  Zap,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlayRecommendedPage() {
  const { data: user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            Ready to Play? 🎮
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover quizzes tailored to your interests, skill level, and learning goals
          </p>
        </div>
      </motion.div>

      {/* Tabs for different quiz types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="recent" className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="ai-recommended" className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Picks
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-6">
            <QuizSection title="Continue Where You Left Off" quizzes={recentQuizzes} />
            <QuizSection title="Your Recent Documents" quizzes={documentQuizzes} />
          </TabsContent>

          <TabsContent value="ai-recommended" className="space-y-6">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <Brain className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="text-xl font-bold">Nalanda AI Recommendations</h3>
                  <p className="text-muted-foreground">Personalized for your learning journey</p>
                </div>
              </div>
            </div>
            <QuizSection title="Recommended for You" quizzes={aiRecommendedQuizzes} />
            <QuizSection title="Skill Building" quizzes={skillBuildingQuizzes} />
          </TabsContent>

          <TabsContent value="popular" className="space-y-6">
            <QuizSection title="Trending Now" quizzes={trendingQuizzes} />
            <QuizSection title="Community Favorites" quizzes={popularQuizzes} />
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <QuizSection title="Study Group: React Masters" quizzes={groupQuizzes} />
            <QuizSection title="Following: #JavaScript" quizzes={hashtagQuizzes} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  );
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  creator: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  duration: string;
  questions: number;
  plays: number;
  rating: number;
  tags: string[];
  thumbnail?: string;
  isNew?: boolean;
  isHot?: boolean;
  completionRate?: number;
}

function QuizSection({ title, quizzes }: { title: string; quizzes: Quiz[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <QuizCard quiz={quiz} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuizCard({ quiz }: { quiz: Quiz }) {
  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {quiz.title}
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              by {quiz.creator}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-1 ml-2">
            {quiz.isNew && (
              <Badge variant="secondary" className="text-xs">
                New
              </Badge>
            )}
            {quiz.isHot && (
              <Badge variant="destructive" className="text-xs">
                <Flame className="w-3 h-3 mr-1" />
                Hot
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {quiz.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {quiz.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {quiz.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{quiz.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {quiz.duration}
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {quiz.questions}Q
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {quiz.plays}
            </span>
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              {quiz.rating}
            </span>
          </div>
        </div>

        {/* Difficulty and Progress */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={quiz.difficulty === 'Easy' ? 'secondary' : 
                    quiz.difficulty === 'Medium' ? 'default' : 
                    quiz.difficulty === 'Hard' ? 'destructive' : 'destructive'}
            className="text-xs"
          >
            {quiz.difficulty}
          </Badge>
          {quiz.completionRate !== undefined && (
            <div className="text-xs text-muted-foreground">
              {quiz.completionRate}% completion
            </div>
          )}
        </div>

        {/* Play Button */}
        <Button asChild className="w-full group-hover:shadow-lg transition-shadow">
          <Link to="/quiz-history" className="flex items-center justify-center">
            <Play className="w-4 h-4 mr-2" fill="currentColor" />
            Start Quiz
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Mock data
const recentQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'JavaScript ES6 Features',
    description: 'Test your knowledge of modern JavaScript features including arrow functions, destructuring, and promises.',
    creator: 'CodeMaster',
    difficulty: 'Medium',
    duration: '15 min',
    questions: 20,
    plays: 1234,
    rating: 4.8,
    tags: ['JavaScript', 'ES6', 'Programming'],
    completionRate: 65,
    isHot: true
  },
  {
    id: '2',
    title: 'React Hooks Deep Dive',
    description: 'Advanced concepts in React Hooks including useEffect, useContext, and custom hooks.',
    creator: 'ReactGuru',
    difficulty: 'Hard',
    duration: '25 min',
    questions: 30,
    plays: 892,
    rating: 4.9,
    tags: ['React', 'Hooks', 'Frontend'],
    completionRate: 45
  }
];

const documentQuizzes: Quiz[] = [
  {
    id: '3',
    title: 'Your Training Manual Quiz',
    description: 'Quiz generated from your uploaded "Comprehensive Training Plan" document.',
    creator: 'Nalanda AI',
    difficulty: 'Medium',
    duration: '12 min',
    questions: 15,
    plays: 1,
    rating: 0,
    tags: ['Personal', 'Training', 'Generated'],
    isNew: true
  }
];

const aiRecommendedQuizzes: Quiz[] = [
  {
    id: '4',
    title: 'TypeScript Advanced Types',
    description: 'Based on your JavaScript knowledge, explore TypeScript\'s powerful type system.',
    creator: 'Nalanda AI',
    difficulty: 'Hard',
    duration: '20 min',
    questions: 25,
    plays: 567,
    rating: 4.7,
    tags: ['TypeScript', 'Types', 'Recommended'],
    isNew: true
  }
];

const skillBuildingQuizzes: Quiz[] = [
  {
    id: '5',
    title: 'Async/Await Mastery',
    description: 'Build upon your promise knowledge with async/await patterns.',
    creator: 'SkillBuilder',
    difficulty: 'Medium',
    duration: '18 min',
    questions: 22,
    plays: 789,
    rating: 4.6,
    tags: ['JavaScript', 'Async', 'Skills']
  }
];

const trendingQuizzes: Quiz[] = [
  {
    id: '6',
    title: 'AI & Machine Learning Basics',
    description: 'Understanding the fundamentals of artificial intelligence and machine learning.',
    creator: 'AI_Expert',
    difficulty: 'Medium',
    duration: '30 min',
    questions: 35,
    plays: 5234,
    rating: 4.9,
    tags: ['AI', 'ML', 'Tech'],
    isHot: true
  }
];

const popularQuizzes: Quiz[] = [
  {
    id: '7',
    title: 'Web Development Fundamentals',
    description: 'Essential concepts every web developer should know.',
    creator: 'WebDev101',
    difficulty: 'Easy',
    duration: '20 min',
    questions: 25,
    plays: 8901,
    rating: 4.8,
    tags: ['HTML', 'CSS', 'Basics']
  }
];

const groupQuizzes: Quiz[] = [
  {
    id: '8',
    title: 'React Performance Optimization',
    description: 'Group challenge: Optimize React apps for better performance.',
    creator: 'ReactMasters',
    difficulty: 'Expert',
    duration: '40 min',
    questions: 45,
    plays: 234,
    rating: 4.9,
    tags: ['React', 'Performance', 'Group']
  }
];

const hashtagQuizzes: Quiz[] = [
  {
    id: '9',
    title: 'JavaScript Design Patterns',
    description: 'Popular quiz from the #JavaScript community.',
    creator: 'JSPatterns',
    difficulty: 'Hard',
    duration: '35 min',
    questions: 40,
    plays: 1567,
    rating: 4.7,
    tags: ['JavaScript', 'Patterns', 'Design']
  }
];
