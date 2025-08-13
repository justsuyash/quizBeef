import React from 'react';
import { Link } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/cn';
import { 
  Brain, 
  BookOpen, 
  Sparkles, 
  Zap,
  Users,
  Target,
  Clock,
  TrendingUp,
  ChevronRight,
  Star,
  Lock,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from 'wasp/client/auth';

export default function LibraryPage() {
  const { data: user } = useAuth();

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nalanda AI Library</h1>
            <p className="text-muted-foreground">
              Ancient wisdom meets modern intelligence - Your personal AI tutor
            </p>
          </div>
        </div>

        {/* Coming Soon Badge */}
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            <Sparkles className="w-4 h-4 mr-1" />
            Coming Soon
          </Badge>
          <Badge variant="outline" className="text-sm">
            Beta Access Available
          </Badge>
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <Card className="p-8 bg-gradient-to-br from-muted/50 to-muted/20 border-2 border-dashed">
          <CardContent className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold">
                Nalanda: Your Ancient-Inspired AI Tutor
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Like the legendary university of ancient India, Nalanda will be your center of wisdom. 
                Experience adaptive learning paths, intelligent content curation, and personalized study sessions.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8">
                <Calendar className="w-5 h-5 mr-2" />
                Get Notified
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link to="/documents">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Upload Content
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Preview */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-6 text-center">What's Coming</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-xs">
                    {feature.status}
                  </Badge>
                </div>
                <CardHeader className="pb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                    feature.color
                  )}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    {feature.description}
                  </CardDescription>
                  <div className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center text-sm text-muted-foreground">
                        <ChevronRight className="w-4 h-4 mr-2 text-primary" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Early Access Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card className="p-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="text-center space-y-6">
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Join the Beta Program</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Be among the first to experience our AI Tutor. Get early access, 
                provide feedback, and help shape the future of personalized learning.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 my-8">
              {betaFeatures.map((feature, index) => (
                <div key={feature.title} className="text-center space-y-2">
                  <feature.icon className="w-8 h-8 mx-auto text-primary" />
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Button size="lg" className="text-lg px-12">
                <Star className="w-5 h-5 mr-2" />
                Request Beta Access
              </Button>
              <p className="text-sm text-muted-foreground">
                Limited spots available • Free for early adopters
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Features CTA */}
      <div className="mt-12 text-center space-y-4">
        <h4 className="text-lg font-semibold">Ready to start learning now?</h4>
        <p className="text-muted-foreground">
          Upload your content and start generating quizzes with our current AI features.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link to="/upload">
              <BookOpen className="w-4 h-4 mr-2" />
              Upload Document
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/documents">
              View My Documents
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

const upcomingFeatures = [
  {
    title: "Adaptive Learning Paths",
    description: "AI analyzes your performance and creates personalized study routes that adapt to your learning style and pace.",
    icon: Target,
    color: "bg-gradient-to-br from-primary to-primary/80",
    status: "In Development",
    highlights: [
      "Personalized difficulty progression",
      "Learning style adaptation", 
      "Smart topic sequencing"
    ]
  },
  {
    title: "Intelligent Content Curation",
    description: "Your AI tutor finds and recommends the best study materials from our vast library based on your goals.",
    icon: Sparkles,
    color: "bg-gradient-to-br from-accent to-accent/80",
    status: "Planning",
    highlights: [
      "Content recommendation engine",
      "Quality scoring system",
      "Relevance matching"
    ]
  },
  {
    title: "Real-time Study Coaching",
    description: "Get instant feedback, hints, and explanations as you study, like having a personal tutor by your side.",
    icon: Zap,
    color: "bg-gradient-to-br from-secondary to-secondary/80",
    status: "Research",
    highlights: [
      "Instant feedback loops",
      "Contextual explanations",
      "Study session optimization"
    ]
  },
  {
    title: "Progress Analytics",
    description: "Deep insights into your learning patterns with AI-powered analytics and predictive performance modeling.",
    icon: TrendingUp,
    color: "bg-gradient-to-br from-primary to-accent",
    status: "Design",
    highlights: [
      "Learning velocity tracking",
      "Knowledge gap identification",
      "Performance predictions"
    ]
  },
  {
    title: "Collaborative Learning",
    description: "Connect with study groups, share insights, and learn together with AI-facilitated peer interactions.",
    icon: Users,
    color: "bg-gradient-to-br from-accent to-secondary",
    status: "Concept",
    highlights: [
      "Smart group formation",
      "Peer knowledge sharing",
      "Collaborative challenges"
    ]
  },
  {
    title: "Smart Scheduling",
    description: "AI optimizes your study schedule based on your availability, energy levels, and retention patterns.",
    icon: Clock,
    color: "bg-gradient-to-br from-secondary to-primary",
    status: "Planning",
    highlights: [
      "Optimal timing detection",
      "Spaced repetition scheduling",
      "Energy level optimization"
    ]
  }
];

const betaFeatures = [
  {
    title: "Early Access",
    description: "Test features before public release",
    icon: Lock
  },
  {
    title: "Direct Feedback",
    description: "Shape the product with your input",
    icon: Star
  },
  {
    title: "Free Premium",
    description: "Complimentary access during beta",
    icon: Sparkles
  }
];
