import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getQuizAttempt } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { 
  Trophy, 
  Target, 
  Clock, 
  Star, 
  CheckCircle, 
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Zap,
  Brain
} from 'lucide-react'

export default function QuizSummaryPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()

  const { data: quizData, isLoading, error } = useQuery(getQuizAttempt, 
    { quizAttemptId: parseInt(attemptId || '0') },
    { enabled: !!attemptId }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Summary...</h2>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Error Loading Summary</h2>
          <p className="text-muted-foreground">Unable to load quiz summary. Please try again.</p>
          <Button onClick={() => navigate('/play')}>Back to Play</Button>
        </div>
      </div>
    )
  }

  const { 
    score, 
    correctAnswers, 
    totalQuestions, 
    timeSpent, 
    quizMode, 
    gameplayStats,
    document: doc 
  } = quizData

  // Parse gameplay stats
  const stats = gameplayStats ? (typeof gameplayStats === 'string' ? JSON.parse(gameplayStats) : gameplayStats) : null

  // Calculate key metrics
  const avgTimePerQuestion = timeSpent && totalQuestions ? ((timeSpent || 0) / totalQuestions).toFixed(1) : '0.0'
  const maxCombo = stats?.maxCombo || 0
  const perfectStreak = stats?.perfectStreak || 0
  const totalScore = stats?.totalScore || Math.round(score * 10) || 0

  // Generate AI tips based on performance
  const generateAITips = (): string[] => {
    const tips: string[] = []
    const avgTime = parseFloat(avgTimePerQuestion)

    // Speed coaching
    if (avgTime > 10) {
      tips.push("⚡ Focus on speed - try to answer within 7 seconds for speed bonuses")
    } else if (avgTime > 7) {
      tips.push("🚀 Good pace! Aim for under 7 seconds to unlock Fast Zone multipliers")
    } else if (avgTime <= 3) {
      tips.push("⚡ Lightning fast! You're mastering the Lightning Zone (3x points)")
    }

    // Combo coaching
    if (maxCombo < 3) {
      tips.push("🔥 Build longer combos - 3+ consecutive correct answers unlock 2x multipliers")
    } else if (maxCombo < 5) {
      tips.push("🚀 Great combos! Reach 5+ for 3x multipliers and even higher scores")
    } else if (maxCombo >= 10) {
      tips.push("🔥 Legendary combos! You've mastered the 4x multiplier zone")
    }

    // Accuracy coaching
    if (score < 60) {
      tips.push("🎯 Focus on accuracy first - getting questions right builds confidence and combos")
    } else if (score < 80) {
      tips.push("📚 Good accuracy! Now work on maintaining it while increasing speed")
    } else if (score >= 90) {
      tips.push("🏆 Excellent accuracy! You're ready for harder difficulty questions")
    }

    // Perfect streak coaching
    if (perfectStreak < 5) {
      tips.push("🎯 Aim for 5+ perfect answers in a row to build momentum")
    } else if (perfectStreak < 10) {
      tips.push("🔥 Great streak! Reach 10 perfect answers to unlock double points mode")
    } else if (perfectStreak >= 15) {
      tips.push("🛡️ Invincible mode achieved! Your consistency is outstanding")
    }

    // Mode-specific tips
    if (quizMode === 'RAPID_FIRE') {
      tips.push("⚡ In Rapid Fire, the last 20% of questions have reduced time but 2x base points")
      if (totalQuestions > 5) {
        tips.push("🎯 Practice harder questions - they give 2x base points in Rapid Fire")
      }
    }

    // General improvement
    if (tips.length < 5) {
      tips.push("📈 Keep practicing to improve your QLO rating and climb the leaderboards")
      tips.push("🏆 Challenge friends to Beef matches to test your skills")
      tips.push("📚 Try different quiz modes to diversify your learning")
    }

    return tips.slice(0, 5) // Return top 5 tips
  }

  const aiTips = generateAITips()

  const handleViewDetails = () => {
    navigate(`/quiz/${attemptId}/results`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Quiz Complete! 🎉</h1>
          <p className="text-muted-foreground">{doc?.title}</p>
          <Badge variant="secondary" className="text-sm">
            {quizMode?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>

        {/* Summary Card - Clickable */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
          onClick={handleViewDetails}
        >
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Performance Summary
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Click to view detailed analysis and question review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Final Score */}
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-500">
                  {Math.round(score)}%
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className="text-xs text-muted-foreground">
                  {correctAnswers}/{totalQuestions} correct
                </div>
              </div>

              {/* Max Combo */}
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-500">
                  {maxCombo}x
                </div>
                <div className="text-sm text-muted-foreground">Max Combo</div>
                <div className="text-xs text-muted-foreground">
                  {maxCombo >= 10 ? "🔥 Legendary!" :
                   maxCombo >= 5 ? "🚀 Great!" :
                   maxCombo >= 3 ? "⚡ Good!" : "Keep trying!"}
                </div>
              </div>

              {/* Perfect Streak */}
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-500">
                  {perfectStreak}
                </div>
                <div className="text-sm text-muted-foreground">Perfect Streak</div>
                <div className="text-xs text-muted-foreground">
                  {perfectStreak >= 15 ? "🛡️ Invincible!" :
                   perfectStreak >= 10 ? "🔥 Double pts!" :
                   perfectStreak >= 5 ? "🎯 Accurate!" : "Practice more!"}
                </div>
              </div>

              {/* Average Time */}
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-500">
                  {avgTimePerQuestion}s
                </div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
                <div className="text-xs text-muted-foreground">
                  {parseFloat(avgTimePerQuestion) <= 3 ? "⚡ Lightning!" :
                   parseFloat(avgTimePerQuestion) <= 7 ? "🚀 Fast!" :
                   parseFloat(avgTimePerQuestion) <= 12 ? "🎯 Normal" : "⚠️ Slow"}
                </div>
              </div>
            </div>

            {/* Total Score (if available) */}
            {totalScore > 0 && (
              <div className="mt-4 pt-4 border-t text-center">
                <div className="text-lg font-semibold text-primary">
                  Total Points: {totalScore}
                </div>
                <div className="text-sm text-muted-foreground">
                  Including all bonuses and multipliers
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Coaching Tips
            </CardTitle>
            <CardDescription>
              Personalized suggestions to improve your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="text-sm text-muted-foreground flex-1">
                    {tip}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleViewDetails}
            className="flex-1"
            size="lg"
          >
            <Target className="h-4 w-4 mr-2" />
            View Detailed Analysis
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/play')}
            className="flex-1"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    </div>
  )
}
