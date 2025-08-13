import React from 'react';
import { Link } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/cn';
import { 
  Gamepad2, 
  BookOpen, 
  Trophy, 
  Zap, 
  Brain,
  Target,
  Users,
  Rocket,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <svg
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="hero-pattern"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 60V0h60"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center space-y-8">
            {/* Logo & Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center space-x-4"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Quiz Beef
                </span>
                <span className="text-2xl md:text-4xl lg:text-5xl ml-2">🔥</span>
              </h1>
            </motion.div>

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-xl md:text-3xl lg:text-4xl font-semibold text-foreground">
                Transform Learning into Competition
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Turn any content into active recall challenges. Compete with friends, 
                track your progress, and become the ultimate quiz champion.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg">
                <Link to="/sign-up" className="flex items-center">
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Your Journey
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/login" className="flex items-center">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Sign In
                </Link>
              </Button>
            </motion.div>

            {/* Stats or Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-8 pt-8"
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Questions Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-accent">500+</div>
                <div className="text-sm text-muted-foreground">Active Learners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-secondary">95%</div>
                <div className="text-sm text-muted-foreground">Retention Rate</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Quiz Beef?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the most engaging way to learn and compete with our cutting-edge features.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                    feature.color
                  )}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="space-y-6"
          >
            <h4 className="text-3xl md:text-4xl font-bold">
              Ready to Beef Up Your Brain?
            </h4>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of learners who are transforming the way they study and compete.
            </p>
            <Button asChild size="lg" className="text-lg px-12 py-6 shadow-lg">
              <Link to="/sign-up" className="flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Get Started Free
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

const features = [
  {
    title: "AI-Powered Quiz Generation",
    description: "Upload any document, video, or text and our AI instantly creates personalized quiz questions for maximum retention.",
    icon: Brain,
    color: "bg-gradient-to-br from-primary to-primary/80"
  },
  {
    title: "Real-Time Competitions",
    description: "Challenge friends or join global tournaments. Compete in live 'Beef Challenges' and climb the leaderboards.",
    icon: Zap,
    color: "bg-gradient-to-br from-accent to-accent/80"
  },
  {
    title: "Smart Progress Tracking",
    description: "Track your learning journey with detailed analytics, performance trends, and personalized insights.",
    icon: Target,
    color: "bg-gradient-to-br from-secondary to-secondary/80"
  },
  {
    title: "Community Learning",
    description: "Join study groups, share knowledge, and learn from a community of passionate learners worldwide.",
    icon: Users,
    color: "bg-gradient-to-br from-primary to-accent"
  },
  {
    title: "Multiple Content Types",
    description: "Support for PDFs, videos, articles, and more. Transform any learning material into interactive quizzes.",
    icon: BookOpen,
    color: "bg-gradient-to-br from-accent to-secondary"
  },
  {
    title: "Gamified Experience",
    description: "Earn achievements, unlock badges, maintain streaks, and level up your knowledge in a fun, competitive environment.",
    icon: Trophy,
    color: "bg-gradient-to-br from-secondary to-primary"
  }
];
