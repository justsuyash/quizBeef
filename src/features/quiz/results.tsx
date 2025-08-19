import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { Link } from 'wasp/client/router'
import { getQuizAttempt } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Separator } from '../../components/ui/separator'
import { 
  Trophy, 
  Target, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Share,
  TrendingUp,
  Brain,
  Shield,
  Heart,
  Timer,
  Eye,
  EyeOff
} from 'lucide-react'



export default function QuizResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const params = new URLSearchParams(window.location.search)
  const returnTo = params.get('return')
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
          <h2 className="text-xl font-semibold">Loading Results...</h2>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Results Not Found</h2>
          <p className="text-muted-foreground">
            {error?.message || 'The quiz results could not be loaded.'}
          </p>
          <Button onClick={() => navigate('/quiz-history')}>
            Back to Quiz History
          </Button>
        </div>
      </div>
    )
  }

  const {
    score,
    correctAnswers,
    totalQuestions,
    timeSpent,
    completedAt,
    document,
    questions,
    quizMode
  } = quizData

  const grade = getGradeFromScore(score)
  const gradeColor = getGradeColor(grade)
  
  // Calculate performance by difficulty
  const performanceByDifficulty = calculatePerformanceByDifficulty(questions)
  
  // Calculate confidence accuracy
  const confidenceAccuracy = calculateConfidenceAccuracy(questions)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  // Render mode-specific analysis based on quiz mode and gameplayStats
  const renderModeSpecificAnalysis = () => {
    const { quizMode, gameplayStats, timeSpent, totalQuestions, score } = quizData

    // Flashcard Frenzy - Confidence Analysis
    if (quizMode === 'FLASHCARD_FRENZY') {
      const stats = gameplayStats ? (typeof gameplayStats === 'string' ? JSON.parse(gameplayStats) : gameplayStats) : null
      
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Confidence Analysis
            </CardTitle>
            <CardDescription>
              How well your confidence matched your performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {stats?.confidenceStats || confidenceAccuracy !== null ? (
              <>
                {/* Main Confidence Accuracy */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {stats?.confidenceStats?.confidenceAccuracy ? 
                      Math.round(stats.confidenceStats.confidenceAccuracy) : 
                      Math.round(confidenceAccuracy || 0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence Accuracy
                  </div>
                </div>

                {/* Enhanced Stats from gameplayStats */}
                {stats?.confidenceStats && (
                  <>
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-500">
                          {stats.confidenceStats.highConfidenceCorrect}/{stats.confidenceStats.totalHighConfidence}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          High Confidence Correct
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stats.confidenceStats.totalHighConfidence > 0 ? 
                            Math.round((stats.confidenceStats.highConfidenceCorrect / stats.confidenceStats.totalHighConfidence) * 100) : 0}% accuracy
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-2xl font-bold text-orange-500">
                          {stats.confidenceStats.lowConfidenceCorrect}/{stats.confidenceStats.totalLowConfidence}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Low Confidence Correct
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stats.confidenceStats.totalLowConfidence > 0 ? 
                            Math.round((stats.confidenceStats.lowConfidenceCorrect / stats.confidenceStats.totalLowConfidence) * 100) : 0}% accuracy
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500 mb-2">
                        {stats.averageConfidence?.toFixed(1) || '0.0'}/5.0
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Average Confidence Level
                      </div>
                    </div>
                  </>
                )}

                                          <div className="text-sm text-muted-foreground text-center">
                            {(stats?.confidenceStats?.confidenceAccuracy || confidenceAccuracy || 0) >= 70 
                              ? "🎯 Excellent! Your confidence levels aligned well with your actual performance."
                              : (stats?.confidenceStats?.confidenceAccuracy || confidenceAccuracy || 0) >= 50
                              ? "👍 Good! You're developing good intuition about your knowledge."
                              : "📚 Consider calibrating your confidence levels with more practice."
                            }
                          </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                No confidence data available for this quiz.
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    // Rapid Fire - Performance Analysis
    if (quizMode === 'RAPID_FIRE') {
      const stats = gameplayStats ? (typeof gameplayStats === 'string' ? JSON.parse(gameplayStats) : gameplayStats) : null
      
      // Calculate average time per question
      const avgTimePerQuestion = timeSpent && totalQuestions ? ((timeSpent || 0) / totalQuestions).toFixed(1) : '0.0'
      
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Rapid Fire Performance
            </CardTitle>
            <CardDescription>
              Your speed and combo performance breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Max Combo */}
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-1">
                  {stats?.maxCombo || 0}x
                </div>
                <div className="text-sm text-muted-foreground">Max Combo</div>
                <div className="text-xs text-muted-foreground">
                  {(stats?.maxCombo || 0) >= 10 ? "🔥 Legendary!" :
                   (stats?.maxCombo || 0) >= 5 ? "🚀 Great!" :
                   (stats?.maxCombo || 0) >= 3 ? "⚡ Good!" : "Keep trying!"}
                </div>
              </div>

              {/* Perfect Streak */}
              <div>
                <div className="text-2xl font-bold text-purple-500 mb-1">
                  {stats?.perfectStreak || 0}
                </div>
                <div className="text-sm text-muted-foreground">Perfect Streak</div>
                <div className="text-xs text-muted-foreground">
                  {(stats?.perfectStreak || 0) >= 15 ? "🛡️ Invincible!" :
                   (stats?.perfectStreak || 0) >= 10 ? "🔥 Double pts!" :
                   (stats?.perfectStreak || 0) >= 5 ? "🎯 Accurate!" : "Practice more!"}
                </div>
              </div>

              {/* Average Time */}
              <div>
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {avgTimePerQuestion}s
                </div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
                <div className="text-xs text-muted-foreground">
                  {parseFloat(avgTimePerQuestion) <= 3 ? "⚡ Lightning!" :
                   parseFloat(avgTimePerQuestion) <= 7 ? "🚀 Fast!" :
                   parseFloat(avgTimePerQuestion) <= 12 ? "🎯 Normal" : "⚠️ Slow"}
                </div>
              </div>

              {/* Total Score */}
              <div>
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {stats?.totalScore || Math.round(score * 10) || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Score</div>
                <div className="text-xs text-muted-foreground">
                  With bonuses
                </div>
              </div>
            </div>

            <Separator />

            {/* Streak & Bonus Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">🏆 Achievements Unlocked:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Speed Bonuses */}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    ⚡ Speed Bonuses
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Lightning Zone (0-3s): 3x points<br/>
                    Fast Zone (3-7s): 2x points<br/>
                    Normal Zone (7-12s): 1x points
                  </div>
                </div>

                {/* Combo Multipliers */}
                <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                    🔥 Combo Multipliers
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">
                    3+ combo: 2x multiplier<br/>
                    5+ combo: 3x multiplier<br/>
                    10+ combo: 4x multiplier
                  </div>
                </div>

                {/* Streak Bonuses */}
                <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    🎯 Streak Bonuses
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">
                    Every correct: +5 points<br/>
                    10 perfect: Double points mode<br/>
                    15 perfect: Invincible mode
                  </div>
                </div>

                {/* Difficulty Bonuses */}
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    📚 Difficulty Bonuses
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    Easy: 1x base points<br/>
                    Medium: 1.5x base points<br/>
                    Hard: 2x base points
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">💡 Tips to Improve:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {parseFloat(avgTimePerQuestion) > 7 && <li>• Try to answer within 7 seconds for speed bonuses</li>}
                {(stats?.maxCombo || 0) < 5 && <li>• Build longer combos for higher multipliers</li>}
                {(stats?.perfectStreak || 0) < 10 && <li>• Get 10 perfect answers to unlock double points</li>}
                <li>• Last 20% of questions have reduced time but 2x base points</li>
                <li>• Focus on accuracy first, then speed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Precision Mode - Survival Analysis
    if (quizMode === 'PRECISION') {
      const stats = gameplayStats ? (typeof gameplayStats === 'string' ? JSON.parse(gameplayStats) : gameplayStats) : null
      
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Precision Survival Analysis
            </CardTitle>
            <CardDescription>
              Your survival performance and accuracy breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Survival Score */}
              <div>
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {stats?.precisionScore || correctAnswers || 0}
                </div>
                <div className="text-sm text-muted-foreground">Survival Score</div>
                <div className="text-xs text-muted-foreground">
                  Correct before elimination
                </div>
              </div>

              {/* Lives Remaining */}
              <div>
                <div className="flex justify-center gap-1 mb-1">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Heart 
                      key={i} 
                      className={`w-5 h-5 ${
                        (stats?.livesRemaining || 0) > i 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">Lives Left</div>
                <div className="text-xs text-muted-foreground">
                  {(stats?.livesRemaining || 0) === 3 ? "🏆 Perfect!" :
                   (stats?.livesRemaining || 0) === 2 ? "🎯 Great!" :
                   (stats?.livesRemaining || 0) === 1 ? "⚠️ Close call!" : "💀 Eliminated"}
                </div>
              </div>

              {/* Survival Rate */}
              <div>
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {Math.round(stats?.survivalRate || score || 0)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="text-xs text-muted-foreground">
                  {(stats?.survivalRate || score || 0) >= 90 ? "🎯 Sharpshooter!" :
                   (stats?.survivalRate || score || 0) >= 75 ? "🏹 Marksman!" :
                   (stats?.survivalRate || score || 0) >= 60 ? "🎪 Good aim!" : "🎯 Keep practicing!"}
                </div>
              </div>

              {/* Longest Streak */}
              <div>
                <div className="text-2xl font-bold text-purple-500 mb-1">
                  {stats?.longestStreak || 0}
                </div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
                <div className="text-xs text-muted-foreground">
                  {(stats?.longestStreak || 0) >= 10 ? "🔥 Unstoppable!" :
                   (stats?.longestStreak || 0) >= 5 ? "⚡ Hot streak!" :
                   (stats?.longestStreak || 0) >= 3 ? "📈 Building momentum!" : "🎯 Stay focused!"}
                </div>
              </div>
            </div>

            <Separator />

            {/* Survival Analysis */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">🛡️ Survival Breakdown:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Elimination Status */}
                <div className={`rounded-lg p-3 ${
                  stats?.eliminatedBy === 'quiz_completed' 
                    ? 'bg-green-50 dark:bg-green-950' 
                    : 'bg-red-50 dark:bg-red-950'
                }`}>
                  <div className={`text-sm font-medium mb-1 ${
                    stats?.eliminatedBy === 'quiz_completed'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {stats?.eliminatedBy === 'quiz_completed' ? '🏆 Quiz Completed' : '💀 Lives Exhausted'}
                  </div>
                  <div className={`text-xs ${
                    stats?.eliminatedBy === 'quiz_completed'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stats?.eliminatedBy === 'quiz_completed' 
                      ? 'Survived all questions with lives remaining'
                      : 'Made 3 mistakes and was eliminated'
                    }
                  </div>
                </div>

                {/* Precision Rating */}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    🎯 Precision Rating
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {(stats?.survivalRate || score || 0) >= 95 ? "Legendary Precision" :
                     (stats?.survivalRate || score || 0) >= 85 ? "Expert Marksman" :
                     (stats?.survivalRate || score || 0) >= 75 ? "Skilled Shooter" :
                     (stats?.survivalRate || score || 0) >= 60 ? "Developing Accuracy" : "Needs More Practice"}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">💡 Precision Tips:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {(stats?.survivalRate || score || 0) < 80 && <li>• Take your time to read questions carefully - accuracy is key</li>}
                {(stats?.longestStreak || 0) < 5 && <li>• Focus on building longer streaks for better consistency</li>}
                {stats?.eliminatedBy === 'lives_exhausted' && <li>• Review incorrect answers to avoid similar mistakes</li>}
                <li>• In Precision Mode, one wrong answer costs a life - prioritize accuracy over speed</li>
                <li>• Practice with easier topics first to build confidence</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Time Attack Mode - Beat the Clock Analysis
    if (quizMode === 'TIME_ATTACK') {
      const stats = gameplayStats ? (typeof gameplayStats === 'string' ? JSON.parse(gameplayStats) : gameplayStats) : null
      
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Time Attack Performance
            </CardTitle>
            <CardDescription>
              Your speed and survival performance breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Time Attack Score */}
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-1">
                  {stats?.timeAttackScore || correctAnswers || 0}
                </div>
                <div className="text-sm text-muted-foreground">Final Score</div>
                <div className="text-xs text-muted-foreground">
                  Questions answered
                </div>
              </div>

              {/* Time Remaining */}
              <div>
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {stats?.timeRemaining || 0}s
                </div>
                <div className="text-sm text-muted-foreground">Time Left</div>
                <div className="text-xs text-muted-foreground">
                  {(stats?.timeRemaining || 0) > 30 ? "🏆 Great!" :
                   (stats?.timeRemaining || 0) > 10 ? "🎯 Good!" :
                   (stats?.timeRemaining || 0) > 0 ? "⚡ Close!" : "⏰ Time's up!"}
                </div>
              </div>

              {/* Time Extended */}
              <div>
                <div className="text-2xl font-bold text-green-500 mb-1">
                  +{stats?.totalTimeExtended || 0}s
                </div>
                <div className="text-sm text-muted-foreground">Time Gained</div>
                <div className="text-xs text-muted-foreground">
                  From correct answers
                </div>
              </div>

              {/* Survival Time */}
              <div>
                <div className="text-2xl font-bold text-purple-500 mb-1">
                  {stats?.survivalTime || Math.round((timeSpent || 0))}s
                </div>
                <div className="text-sm text-muted-foreground">Survival Time</div>
                <div className="text-xs text-muted-foreground">
                  Total time played
                </div>
              </div>
            </div>

            <Separator />

            {/* Time Management Analysis */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">⏰ Time Management Breakdown:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Elimination Status */}
                <div className={`rounded-lg p-3 ${
                  stats?.eliminatedBy === 'quiz_completed' 
                    ? 'bg-green-50 dark:bg-green-950' 
                    : 'bg-red-50 dark:bg-red-950'
                }`}>
                  <div className={`text-sm font-medium mb-1 ${
                    stats?.eliminatedBy === 'quiz_completed'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {stats?.eliminatedBy === 'quiz_completed' ? '🏆 Quiz Completed' : '⏰ Time Expired'}
                  </div>
                  <div className={`text-xs ${
                    stats?.eliminatedBy === 'quiz_completed'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stats?.eliminatedBy === 'quiz_completed' 
                      ? 'Finished all questions with time remaining'
                      : 'Clock ran out before completing all questions'
                    }
                  </div>
                </div>

                {/* Speed Rating */}
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    ⚡ Speed Rating
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {(stats?.averageTimePerQuestion || 0) <= 5 ? "Lightning Fast" :
                     (stats?.averageTimePerQuestion || 0) <= 10 ? "Quick Thinker" :
                     (stats?.averageTimePerQuestion || 0) <= 15 ? "Steady Pace" : "Take Your Time"}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">💡 Time Attack Tips:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {(stats?.timeRemaining || 0) === 0 && <li>• Focus on accuracy - correct answers give +3s, wrong answers cost -2s</li>}
                {(stats?.totalTimeExtended || 0) < 15 && <li>• Try to answer more questions correctly to extend your time</li>}
                {stats?.eliminatedBy === 'time_expired' && <li>• Practice quick decision-making and avoid wrong answers</li>}
                <li>• In Time Attack, correct answers give +3 seconds, wrong answers deduct -2 seconds</li>
                <li>• Balance speed with accuracy - wrong answers hurt your survival time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Test Mode - Detailed Results Analysis
    if (quizMode === 'TEST_MODE') {
      const stats = gameplayStats ? (typeof gameplayStats === 'string' ? JSON.parse(gameplayStats) : gameplayStats) : null
      
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Test Results Analysis
            </CardTitle>
            <CardDescription>
              Detailed breakdown of your test performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Completion Rate */}
              <div>
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {stats?.completionRate ? Math.round(stats.completionRate) : Math.round((correctAnswers / totalQuestions) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <div className="text-xs text-muted-foreground">
                  {stats?.questionsAnswered || totalQuestions}/{stats?.totalQuestions || totalQuestions} answered
                </div>
              </div>

              {/* Accuracy */}
              <div>
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {Math.round(score)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <div className="text-xs text-muted-foreground">
                  {correctAnswers}/{totalQuestions} correct
                </div>
              </div>

              {/* Time Spent */}
              <div>
                <div className="text-2xl font-bold text-purple-500 mb-1">
                  {Math.round((timeSpent || 0) / 60)}m
                </div>
                <div className="text-sm text-muted-foreground">Total Time</div>
                <div className="text-xs text-muted-foreground">
                  {((timeSpent || 0) / totalQuestions / 60).toFixed(1)}m per question
                </div>
              </div>

              {/* Grade */}
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-1">
                  {score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'}
                </div>
                <div className="text-sm text-muted-foreground">Grade</div>
                <div className="text-xs text-muted-foreground">
                  {score >= 90 ? 'Excellent' : 
                   score >= 80 ? 'Good' : 
                   score >= 70 ? 'Satisfactory' : 
                   score >= 60 ? 'Needs Improvement' : 'Unsatisfactory'}
                </div>
              </div>
            </div>

            <Separator />

            {/* Performance Insights */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">📊 Performance Insights:</h4>
              
              <div className="grid gap-3">
                {/* Accuracy Insight */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-sm font-medium mb-1">
                    🎯 Accuracy Analysis
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {score >= 90 ? "Outstanding accuracy! You demonstrated excellent mastery of the material." :
                     score >= 80 ? "Good accuracy. You have a solid understanding with room for minor improvements." :
                     score >= 70 ? "Satisfactory performance. Focus on reviewing missed concepts." :
                     score >= 60 ? "Below average accuracy. Consider additional study and practice." :
                     "Significant improvement needed. Review all material thoroughly before retaking."}
                  </div>
                </div>

                {/* Time Management Insight */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-sm font-medium mb-1">
                    ⏱️ Time Management
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((timeSpent || 0) / totalQuestions / 60) < 1 ? "Efficient time usage. You completed questions quickly while maintaining accuracy." :
                     ((timeSpent || 0) / totalQuestions / 60) < 2 ? "Good pacing. You took appropriate time to consider each question." :
                     ((timeSpent || 0) / totalQuestions / 60) < 3 ? "Moderate pacing. Consider practicing to improve speed while maintaining accuracy." :
                     "Slow pacing. Work on improving your response time through practice."}
                  </div>
                </div>

                {/* Study Recommendations */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-sm font-medium mb-1">
                    📚 Study Recommendations
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {score >= 90 ? "Excellent work! You're ready for advanced topics or can help others learn." :
                     score >= 80 ? "Review the questions you missed and strengthen those specific areas." :
                     score >= 70 ? "Focus on the fundamental concepts and practice similar questions." :
                     score >= 60 ? "Comprehensive review needed. Consider additional resources and practice tests." :
                     "Extensive study required. Start with basic concepts and build up gradually."}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Mode Tips */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-2">💡 Test Mode Benefits:</h4>
              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <li>• No pressure from instant feedback - focus on thinking through each question</li>
                <li>• Ability to review and change answers before submitting</li>
                <li>• Simulates real exam conditions for better preparation</li>
                <li>• Comprehensive results analysis helps identify knowledge gaps</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    }

    // Default - No specific analysis available
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Analysis
          </CardTitle>
          <CardDescription>
            Quiz mode analysis not available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            No specific performance analysis available for this quiz mode.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => {
              if (returnTo) {
                window.location.href = returnTo
              } else {
                navigate('/quiz-history')
              }
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quiz History
            </Button>
          </div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <Trophy className="h-8 w-8" />
            Quiz Results
          </h1>
          <p className='text-muted-foreground'>
            Quiz completed for "{document?.title}"
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              alert('Quiz retake feature coming soon!');
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Quiz
          </Button>
          <Button variant="outline" disabled>
            <Share className="h-4 w-4 mr-2" />
            Share Results
          </Button>
        </div>
      </div>

        <div className="grid gap-6">
          {/* Overall Results */}
          <Card className="border-2">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${gradeColor}`}>
                  {grade}
                </div>
              </div>
              <CardTitle className="text-2xl">
                {Math.round(score)}% Score
              </CardTitle>
              <CardDescription>
                {getGradeMessage(grade)} You answered {correctAnswers} out of {totalQuestions} questions correctly.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">{totalQuestions - correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatTimeSpent(timeSpent)}</div>
                  <div className="text-sm text-muted-foreground">Time Spent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(timeSpent / totalQuestions)}s</div>
                  <div className="text-sm text-muted-foreground">Avg per Question</div>
                </div>
              </div>

              <Separator />

              <div className="text-center text-sm text-muted-foreground">
                Completed on {new Date(completedAt).toLocaleDateString()} at {new Date(completedAt).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Difficulty Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance by Difficulty
                </CardTitle>
                <CardDescription>
                  How you performed across different difficulty levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(performanceByDifficulty).map(([difficulty, data]) => (
                  <div key={difficulty}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={getDifficultyColor(difficulty.toUpperCase())}
                        >
                          {difficulty}
                        </Badge>
                        <span className="text-sm">{data.correct}/{data.total}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={data.total > 0 ? (data.correct / data.total) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Mode-Specific Analysis */}
            {renderModeSpecificAnalysis()}
          </div>

          {/* Question Review - Test Mode skips this section */}
          {quizMode !== 'TEST_MODE' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Question Review
                </CardTitle>
                <CardDescription>
                  Review your answers and see the correct solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question: any, index: number) => (
                  <QuestionReview 
                    key={question.id}
                    question={question}
                    questionNumber={index + 1}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  className="h-auto p-4 flex flex-col items-start"
                  onClick={() => {
                    alert('Quiz retake feature coming soon!');
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="h-4 w-4" />
                    <span className="font-medium">Retake This Quiz</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Try different difficulty settings to challenge yourself
                  </span>
                </Button>
                
                <Button asChild variant="outline" className="h-auto p-4">
                  <Link to="/documents" className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="h-4 w-4" />
                      <span className="font-medium">Try New Content</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Upload new documents and generate fresh quizzes
                    </span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </main>
  )
}

function QuestionReview({ question, questionNumber }: { question: any, questionNumber: number }) {
  const userAnswer = question.answers.find((a: any) => a.id === question.userAnswer)
  const correctAnswer = question.answers.find((a: any) => a.isCorrect)
  const isCorrect = question.wasCorrect

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Question {questionNumber}</span>
            <Badge variant="secondary" className={getDifficultyColor(question.difficulty)}>
              {question.difficulty}
            </Badge>
            {isCorrect ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            {question.confidenceLevel && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${
                      i < question.confidenceLevel ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-sm font-medium mb-3">{question.questionText}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {question.timeSpent}s
        </div>
      </div>

      <div className="space-y-2">
        {question.answers.map((answer: any) => {
          const isUserAnswer = answer.id === question.userAnswer
          const isCorrectAnswer = answer.isCorrect
          
          let className = "p-3 rounded border text-sm "
          
          if (isCorrectAnswer) {
            className += "border-green-200 bg-green-50 text-green-800"
          } else if (isUserAnswer && !isCorrectAnswer) {
            className += "border-red-200 bg-red-50 text-red-800"
          } else {
            className += "border-gray-200 bg-gray-50"
          }

          return (
            <div key={answer.id} className={className}>
              <div className="flex items-center gap-2">
                {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-600" />}
                {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600" />}
                <span>{answer.answerText}</span>
                {isUserAnswer && (
                  <Badge variant="secondary">Your Answer</Badge>
                )}
                {isCorrectAnswer && (
                  <Badge variant="secondary">Correct</Badge>
                )}
              </div>
              {(isCorrectAnswer || isUserAnswer) && answer.explanation && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {answer.explanation}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Helper functions
function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-green-100 text-green-800 border-green-200'
    case 'B': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'D': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'F': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getGradeMessage(grade: string): string {
  switch (grade) {
    case 'A': return '🎉 Excellent work!'
    case 'B': return '👏 Great job!'
    case 'C': return '👍 Good effort!'
    case 'D': return '📚 Keep studying!'
    case 'F': return '💪 Try again!'
    default: return ''
  }
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'EASY': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'HARD': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

function calculatePerformanceByDifficulty(questions: any[]) {
  const performance = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 }
  }

  questions.forEach(q => {
    const difficulty = q.difficulty.toLowerCase()
    if (performance[difficulty as keyof typeof performance]) {
      performance[difficulty as keyof typeof performance].total++
      if (q.wasCorrect) {
        performance[difficulty as keyof typeof performance].correct++
      }
    }
  })

  return performance
}

function calculateConfidenceAccuracy(questions: any[]): number | null {
  const withConfidence = questions.filter(q => q.confidenceLevel !== null)
  if (withConfidence.length === 0) return null

  const accurateConfident = withConfidence.filter(q => 
    (q.confidenceLevel >= 4 && q.wasCorrect) || (q.confidenceLevel <= 2 && !q.wasCorrect)
  ).length

  return (accurateConfident / withConfidence.length) * 100
}
