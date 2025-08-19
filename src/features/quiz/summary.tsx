import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getQuizAttempt } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
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
  Brain,
  Play,
  FileText
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
    } else if (quizMode === 'FLASHCARD_FRENZY') {
      tips.push("🧠 In Flashcard Frenzy, calibrate your confidence: high confidence for sure answers, low for guesses.")
      tips.push("💡 High confidence correct = +3 points, Low confidence correct = +1 point. Choose wisely!")
    } else if (quizMode === 'PRECISION') {
      tips.push("🛡️ In Precision Mode, accuracy is everything - one wrong answer costs a life!")
      tips.push("🎯 Take your time to read questions carefully - speed doesn't matter here")
      if (gameplayStats?.livesRemaining === 0) {
        tips.push("💀 You were eliminated! Review your mistakes to avoid them next time")
      } else if (gameplayStats?.livesRemaining === 3) {
        tips.push("🏆 Perfect survival! You didn't lose a single life - incredible precision!")
      }
    } else if (quizMode === 'TIME_ATTACK') {
      tips.push("⏰ In Time Attack, correct answers give +3s, wrong answers cost -2s!")
      tips.push("⚡ Balance speed with accuracy - wrong answers hurt your survival time")
      if (gameplayStats?.timeRemaining === 0) {
        tips.push("🕐 Time ran out! Avoid wrong answers to prevent time penalties")
      } else if ((gameplayStats?.timeRemaining || 0) > 30) {
        tips.push("🏆 Excellent time management! You finished with plenty of time left")
      }
      if ((gameplayStats?.totalTimeExtended || 0) < 15) {
        tips.push("🎯 Try to answer more questions correctly to extend your survival time")
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Quiz Complete! 🎉</h1>
          <p className="text-muted-foreground">{doc?.title}</p>
          <Badge variant="secondary" className="text-sm">
            {quizMode?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>

        {/* Combined Summary & Coaching Tips Card */}
        <Card className="overflow-hidden">
          {/* Summary Section */}
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Performance Summary
            </CardTitle>
            <CardDescription>
              Your quiz results and key metrics
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Performance Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Final Score */}
              <div className="space-y-1">
                <div className="text-3xl font-bold text-green-500">
                  {Math.round(score)}%
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className="text-xs text-muted-foreground">
                  {correctAnswers}/{totalQuestions} correct
                </div>
              </div>

              {/* Mode-specific metrics */}
              {quizMode === 'PRECISION' ? (
                <>
                  {/* Lives Remaining */}
                  <div className="space-y-1">
                    <div className="flex justify-center gap-1">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="text-xl">
                          {(gameplayStats?.livesRemaining || 0) > i ? '❤️' : '💀'}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">Lives Left</div>
                  </div>

                  {/* Survival Score */}
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-blue-500">
                      {gameplayStats?.precisionScore || correctAnswers}
                    </div>
                    <div className="text-sm text-muted-foreground">Survival Score</div>
                  </div>

                  {/* Precision Rating */}
                  <div className="space-y-1">
                    <div className="text-3xl">
                      {score >= 95 ? "🎯" : score >= 85 ? "🏹" : score >= 75 ? "🎪" : "🎯"}
                    </div>
                    <div className="text-sm text-muted-foreground">Precision</div>
                  </div>
                </>
              ) : quizMode === 'TIME_ATTACK' ? (
                <>
                  {/* Time Remaining */}
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-orange-500">
                      {gameplayStats?.timeRemaining || 0}s
                    </div>
                    <div className="text-sm text-muted-foreground">Time Left</div>
                  </div>

                  {/* Time Extended */}
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-green-500">
                      +{gameplayStats?.totalTimeExtended || 0}s
                    </div>
                    <div className="text-sm text-muted-foreground">Time Gained</div>
                  </div>

                  {/* Survival Time */}
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-purple-500">
                      {gameplayStats?.survivalTime || 0}s
                    </div>
                    <div className="text-sm text-muted-foreground">Survival Time</div>
                  </div>
                </>
              ) : (
                <>
                  {/* Max Combo */}
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-orange-500">
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
                    <div className="text-3xl font-bold text-purple-500">
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
                    <div className="text-3xl font-bold text-blue-500">
                      {avgTimePerQuestion}s
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Time</div>
                    <div className="text-xs text-muted-foreground">
                      {parseFloat(avgTimePerQuestion) <= 3 ? "⚡ Lightning!" :
                       parseFloat(avgTimePerQuestion) <= 7 ? "🚀 Fast!" :
                       parseFloat(avgTimePerQuestion) <= 12 ? "🎯 Normal" : "⚠️ Slow"}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Total Score (if available) */}
            {totalScore > 0 && (
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-xl font-bold text-primary">
                  Total Points: {totalScore}
                </div>
                <div className="text-sm text-muted-foreground">
                  Including all bonuses and multipliers
                </div>
              </div>
            )}

            <Separator />

            {/* AI Coaching Tips Section - More Discreet */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Quick Tips</h3>
              </div>
              
              <div className="space-y-2">
                {aiTips.slice(0, 3).map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground/80">
                    <div className="flex-shrink-0 w-4 h-4 bg-muted/30 rounded-full flex items-center justify-center text-xs font-medium text-muted-foreground/60 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 leading-relaxed">
                      {tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Action Buttons Inside Card */}
            <div className="flex items-center justify-center gap-6 pt-2">
              {/* Review Button */}
              <Button 
                onClick={handleViewDetails}
                size="lg"
                className="px-8"
              >
                <FileText className="h-4 w-4 mr-2" />
                Review
              </Button>
              
              {/* Circular Play Again Button */}
              <Button 
                onClick={() => navigate('/play')}
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 p-0"
              >
                <Play className="h-6 w-6 fill-current" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
