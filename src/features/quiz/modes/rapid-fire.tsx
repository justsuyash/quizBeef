import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getQuizAttempt, submitQuizAnswer, completeQuiz } from 'wasp/client/operations'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { Badge } from '../../../components/ui/badge'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { Label } from '../../../components/ui/label'
import { toast } from '../../../hooks/use-toast'
import { 
  Clock, 
  Zap, 
  Flame,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  Timer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizAnswer {
  questionId: number
  selectedAnswerId: number | null
  timeSpent: number
  isAnswered: boolean
}

interface RapidFireState {
  currentQuestionIndex: number
  answers: QuizAnswer[]
  startTime: number
  questionStartTime: number
  correctStreak: number
  longestStreak: number
  timeLeft: number
  isCompleted: boolean
  showResult: boolean
  lastAnswerCorrect: boolean | null
  currentCombo: number
  maxCombo: number
  perfectStreak: number
  doublePointsRemaining: number
  isInvincible: boolean
  totalScore: number
  speedZone: 'lightning' | 'fast' | 'normal' | 'danger'
  comboMultiplier: number
}

export default function RapidFireQuiz() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const attemptId = urlParams.get('attemptId')

  // Rapid Fire specific settings
  const QUESTION_TIME_LIMIT = 15 // seconds per question
  const BONUS_TIME_THRESHOLD = 5 // bonus if answered within 5 seconds
  const STREAK_BONUS_THRESHOLD = 3 // bonus points for 3+ streak

  // Advanced enhancement functions
  const getSpeedZone = (timeSpent: number): 'lightning' | 'fast' | 'normal' | 'danger' => {
    if (timeSpent <= 3) return 'lightning'
    if (timeSpent <= 7) return 'fast'
    if (timeSpent <= 12) return 'normal'
    return 'danger'
  }

  const getSpeedMultiplier = (speedZone: string): number => {
    switch (speedZone) {
      case 'lightning': return 3
      case 'fast': return 2
      case 'normal': return 1
      case 'danger': return 0.5
      default: return 1
    }
  }

  const getComboMultiplier = (combo: number): number => {
    if (combo >= 10) return 4
    if (combo >= 5) return 3
    if (combo >= 3) return 2
    return 1
  }

  const getDifficultyMultiplier = (difficulty: string): number => {
    switch (difficulty) {
      case 'HARD': return 2
      case 'MEDIUM': return 1.5
      case 'EASY': return 1
      default: return 1
    }
  }

  const getDynamicTimeLimit = (questionIndex: number, totalQuestions: number): number => {
    const isLastTwentyPercent = questionIndex >= Math.floor(totalQuestions * 0.8)
    return isLastTwentyPercent ? Math.floor(QUESTION_TIME_LIMIT * 0.6) : QUESTION_TIME_LIMIT // 40% reduction = 60% of original
  }

  const getBasePointsForLastTwentyPercent = (questionIndex: number, totalQuestions: number): number => {
    const isLastTwentyPercent = questionIndex >= Math.floor(totalQuestions * 0.8)
    return isLastTwentyPercent ? 2 : 1 // 2x base points for last 20%
  }

  const [quizState, setQuizState] = useState<RapidFireState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    correctStreak: 0,
    longestStreak: 0,
    timeLeft: QUESTION_TIME_LIMIT,
    isCompleted: false,
    showResult: false,
    lastAnswerCorrect: null,
    currentCombo: 0,
    maxCombo: 0,
    perfectStreak: 0,
    doublePointsRemaining: 0,
    isInvincible: false,
    totalScore: 0,
    speedZone: 'normal',
    comboMultiplier: 1
  })

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bonusPoints, setBonusPoints] = useState(0)

  const { data: quizData, isLoading, error } = useQuery(getQuizAttempt, 
    { quizAttemptId: parseInt(attemptId || '0') },
    { enabled: !!attemptId }
  )

  const submitAnswerFn = useAction(submitQuizAnswer)
  const completeQuizFn = useAction(completeQuiz)

  const questions = quizData?.questions || []
  const currentQuestion = questions[quizState.currentQuestionIndex]
  const isLastQuestion = quizState.currentQuestionIndex === questions.length - 1
  const totalQuestions = questions.length

  // Initialize quiz state
  useEffect(() => {
    if (quizData?.questions) {
      const initialAnswers: QuizAnswer[] = quizData.questions.map((q: any) => ({
        questionId: q.id,
        selectedAnswerId: null,
        timeSpent: 0,
        isAnswered: false
      }))

      const dynamicTimeLimit = getDynamicTimeLimit(0, quizData.questions.length)

      setQuizState(prev => ({
        ...prev,
        answers: initialAnswers,
        startTime: Date.now(),
        questionStartTime: Date.now(),
        timeLeft: dynamicTimeLimit
      }))
    }
  }, [quizData])

  // Question timer countdown
  useEffect(() => {
    if (quizState.isCompleted || quizState.showResult) return

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (prev.timeLeft <= 1) {
          // Time's up! Auto-submit with no answer
          handleTimeUp()
          return prev
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizState.currentQuestionIndex, quizState.isCompleted, quizState.showResult])

  const handleTimeUp = useCallback(async () => {
    if (!currentQuestion || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Submit with no answer (incorrect)
      const timeSpent = QUESTION_TIME_LIMIT
      await submitAnswerFn({
        quizAttemptId: parseInt(attemptId || '0'),
        questionId: currentQuestion.id,
        selectedAnswerId: currentQuestion.answers[0]?.id || 0, // Default to first answer
        timeSpent
      })

      // Update state for incorrect answer
      setQuizState(prev => {
        const shouldResetCombo = !prev.isInvincible
        return {
          ...prev,
          lastAnswerCorrect: false,
          correctStreak: 0,
          currentCombo: shouldResetCombo ? 0 : prev.currentCombo, // Don't reset combo if invincible
          isInvincible: false, // Use up invincible mode
          showResult: true,
          speedZone: 'danger'
        }
      })

      // Show result briefly then move to next
      setTimeout(() => {
        if (isLastQuestion) {
          handleCompleteQuiz()
        } else {
          moveToNextQuestion()
        }
      }, 1500)

    } catch (error) {
      console.error('Error submitting answer:', error)
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [currentQuestion, attemptId, isLastQuestion, isSubmitting])

  const handleAnswerSelect = async (answerId: number) => {
    if (!currentQuestion || isSubmitting || quizState.showResult) return

    setSelectedAnswer(answerId)
    setIsSubmitting(true)

    try {
      const dynamicTimeLimit = getDynamicTimeLimit(quizState.currentQuestionIndex, totalQuestions)
      const timeSpent = dynamicTimeLimit - quizState.timeLeft
      
      await submitAnswerFn({
        quizAttemptId: parseInt(attemptId || '0'),
        questionId: currentQuestion.id,
        selectedAnswerId: answerId,
        timeSpent
      })

      // Check if answer is correct
      const correctAnswer = currentQuestion.answers.find((a: any) => a.isCorrect)
      const isCorrect = answerId === correctAnswer?.id

      // Calculate comprehensive scoring
      let totalPoints = 0
      if (isCorrect) {
        // Base points (10 points base)
        const basePoints = 10
        
        // Difficulty multiplier
        const difficultyMultiplier = getDifficultyMultiplier(currentQuestion.difficulty)
        
        // Speed zone and multiplier
        const speedZone = getSpeedZone(timeSpent)
        const speedMultiplier = getSpeedMultiplier(speedZone)
        
        // Combo multiplier (based on current combo before increment)
        const comboMultiplier = getComboMultiplier(quizState.currentCombo + 1)
        
        // Last 20% bonus
        const lastTwentyPercentMultiplier = getBasePointsForLastTwentyPercent(quizState.currentQuestionIndex, totalQuestions)
        
        // Double points mode
        const doublePointsMultiplier = quizState.doublePointsRemaining > 0 ? 2 : 1
        
        // Calculate final points
        totalPoints = Math.floor(
          basePoints * 
          difficultyMultiplier * 
          speedMultiplier * 
          comboMultiplier * 
          lastTwentyPercentMultiplier * 
          doublePointsMultiplier
        )

        // Perfect streak bonus (+5 for every correct answer)
        totalPoints += 5
      }

      // Update quiz state with all new mechanics
      setQuizState(prev => {
        const newStreak = isCorrect ? prev.correctStreak + 1 : 0
        const newCombo = isCorrect ? prev.currentCombo + 1 : (prev.isInvincible ? prev.currentCombo : 0)
        const newMaxCombo = Math.max(prev.maxCombo, newCombo)
        const newPerfectStreak = isCorrect ? prev.perfectStreak + 1 : prev.perfectStreak
        
        // Check for streak bonuses
        let newDoublePointsRemaining = prev.doublePointsRemaining
        let newIsInvincible = prev.isInvincible
        
        if (isCorrect && newPerfectStreak === 10) {
          newDoublePointsRemaining = 3 // Next 3 questions get double points
        }
        
        if (isCorrect && newPerfectStreak === 15) {
          newIsInvincible = true // Next wrong answer won't break combo
        }
        
        // Decrease double points counter
        if (newDoublePointsRemaining > 0) {
          newDoublePointsRemaining -= 1
        }
        
        // Use up invincible mode if wrong answer
        if (!isCorrect && prev.isInvincible) {
          newIsInvincible = false
        }
        
        const speedZone = isCorrect ? getSpeedZone(dynamicTimeLimit - prev.timeLeft) : 'danger'
        const comboMultiplier = getComboMultiplier(newCombo)
        
        return {
          ...prev,
          lastAnswerCorrect: isCorrect,
          correctStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
          currentCombo: newCombo,
          maxCombo: newMaxCombo,
          perfectStreak: newPerfectStreak,
          doublePointsRemaining: newDoublePointsRemaining,
          isInvincible: newIsInvincible,
          totalScore: prev.totalScore + totalPoints,
          speedZone,
          comboMultiplier,
          showResult: true
        }
      })

      setBonusPoints(prev => prev + totalPoints)

      // Show result briefly then move to next
      setTimeout(() => {
        if (isLastQuestion) {
          handleCompleteQuiz()
        } else {
          moveToNextQuestion()
        }
      }, 1500)

    } catch (error) {
      console.error('Error submitting answer:', error)
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const moveToNextQuestion = () => {
    setQuizState(prev => {
      const nextQuestionIndex = prev.currentQuestionIndex + 1
      const dynamicTimeLimit = getDynamicTimeLimit(nextQuestionIndex, totalQuestions)
      
      return {
        ...prev,
        currentQuestionIndex: nextQuestionIndex,
        questionStartTime: Date.now(),
        timeLeft: dynamicTimeLimit,
        showResult: false,
        lastAnswerCorrect: null,
        speedZone: 'normal' // Reset speed zone for new question
      }
    })
    setSelectedAnswer(null)
  }

  const handleCompleteQuiz = async () => {
    try {
      const totalTime = Math.floor((Date.now() - quizState.startTime) / 1000)
      
      await completeQuizFn({
        quizAttemptId: parseInt(attemptId || '0'),
        bonusPoints: quizState.totalScore,
        perfectStreak: quizState.longestStreak,
        totalTimeSpent: totalTime,
        gameplayStats: {
          maxCombo: quizState.maxCombo,
          perfectStreak: quizState.perfectStreak,
          totalScore: quizState.totalScore,
          highestComboMultiplier: Math.max(...Array.from({length: quizState.maxCombo + 1}, (_, i) => getComboMultiplier(i))),
          speedZoneBreakdown: {
            lightning: 0, // Could track these if needed
            fast: 0,
            normal: 0,
            danger: 0
          }
        }
      })

      // Navigate to results
      navigate(`/quiz/${attemptId}/summary`)
    } catch (error) {
      console.error('Error completing quiz:', error)
      toast({
        title: "Error",
        description: "Failed to complete quiz. Please try again.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Zap className="w-12 h-12 mx-auto text-orange-500 animate-pulse" />
          <div className="text-lg font-semibold">Loading Rapid Fire Quiz...</div>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 mx-auto text-red-500" />
          <div className="text-lg font-semibold">Failed to load quiz</div>
          <Button onClick={() => navigate('/play')}>
            Back to Play
          </Button>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 mx-auto text-primary" />
          <div className="text-lg font-semibold">Quiz Complete!</div>
        </div>
      </div>
    )
  }

  const progressPercentage = ((quizState.currentQuestionIndex + 1) / totalQuestions) * 100
  const currentTimeLimit = getDynamicTimeLimit(quizState.currentQuestionIndex, totalQuestions)
  const timePercentage = (quizState.timeLeft / currentTimeLimit) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-orange-600">Rapid Fire</h1>
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-muted-foreground">Answer fast, think faster!</p>
        </div>

        {/* Progress and Enhanced Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {quizState.currentQuestionIndex + 1}/{totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </CardContent>
          </Card>
          
          <Card className={`${quizState.currentCombo >= 10 ? 'ring-2 ring-gold-500 bg-gradient-to-br from-yellow-50 to-orange-50' : 
                              quizState.currentCombo >= 5 ? 'ring-2 ring-red-500 bg-gradient-to-br from-red-50 to-pink-50' :
                              quizState.currentCombo >= 3 ? 'ring-2 ring-orange-500 bg-gradient-to-br from-orange-50 to-red-50' : ''}`}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${
                quizState.currentCombo >= 10 ? 'text-yellow-600 animate-pulse' :
                quizState.currentCombo >= 5 ? 'text-red-500' :
                quizState.currentCombo >= 3 ? 'text-orange-500' : 'text-gray-500'
              }`}>
                {quizState.currentCombo}x
              </div>
              <div className="text-sm text-muted-foreground">
                Combo {quizState.comboMultiplier > 1 && `(${quizState.comboMultiplier}x)`}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {quizState.totalScore}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </CardContent>
          </Card>

          <Card className={`${quizState.speedZone === 'lightning' ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50' :
                              quizState.speedZone === 'fast' ? 'ring-2 ring-green-500 bg-gradient-to-br from-green-50 to-emerald-50' :
                              quizState.speedZone === 'danger' ? 'ring-2 ring-red-500 bg-gradient-to-br from-red-50 to-pink-50' : ''}`}>
            <CardContent className="p-4 text-center">
              <div className={`text-lg font-bold ${
                quizState.speedZone === 'lightning' ? 'text-blue-600' :
                quizState.speedZone === 'fast' ? 'text-green-600' :
                quizState.speedZone === 'normal' ? 'text-gray-600' :
                'text-red-600'
              }`}>
                {quizState.speedZone === 'lightning' ? '⚡' :
                 quizState.speedZone === 'fast' ? '🚀' :
                 quizState.speedZone === 'normal' ? '🎯' : '⚠️'}
              </div>
              <div className="text-sm text-muted-foreground">
                {quizState.speedZone === 'lightning' ? '3x Speed' :
                 quizState.speedZone === 'fast' ? '2x Speed' :
                 quizState.speedZone === 'normal' ? 'Normal' : '0.5x Speed'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${
                quizState.timeLeft <= 3 ? 'text-red-500 animate-pulse' : 
                quizState.timeLeft <= 7 ? 'text-orange-500' : 'text-green-500'
              }`}>
                {quizState.timeLeft}s
              </div>
              <div className="text-sm text-muted-foreground">
                {getDynamicTimeLimit(quizState.currentQuestionIndex, totalQuestions) < QUESTION_TIME_LIMIT ? 'Blitz!' : 'Time'}
              </div>
            </CardContent>
          </Card>

          <Card className={`${quizState.perfectStreak >= 15 ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50' :
                              quizState.perfectStreak >= 10 ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50' : ''}`}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">
                {quizState.perfectStreak}
                {quizState.isInvincible && '🛡️'}
                {quizState.doublePointsRemaining > 0 && '🔥'}
              </div>
              <div className="text-sm text-muted-foreground">
                Perfect
                {quizState.doublePointsRemaining > 0 && ` (2x×${quizState.doublePointsRemaining})`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Timer Progress */}
        <Card className={`${quizState.timeLeft <= 3 ? 'ring-2 ring-red-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {quizState.speedZone === 'lightning' ? '⚡ Lightning Zone!' :
                 quizState.speedZone === 'fast' ? '🚀 Fast Zone!' :
                 quizState.speedZone === 'danger' ? '⚠️ Danger Zone!' : '🎯 Normal Zone'}
              </span>
              <span className="text-sm text-muted-foreground">
                {getDynamicTimeLimit(quizState.currentQuestionIndex, totalQuestions) < QUESTION_TIME_LIMIT && '⚡ Blitz Mode'}
              </span>
            </div>
            <Progress 
              value={timePercentage} 
              className={`h-4 ${
                quizState.timeLeft <= 3 ? 'bg-red-100' : 
                quizState.timeLeft <= 7 ? 'bg-orange-100' : 'bg-green-100'
              }`}
            />
          </CardContent>
        </Card>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={quizState.currentQuestionIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden">
              {quizState.showResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`absolute inset-0 z-10 flex items-center justify-center ${
                    quizState.lastAnswerCorrect 
                      ? 'bg-green-500/20 backdrop-blur-sm' 
                      : 'bg-red-500/20 backdrop-blur-sm'
                  }`}
                >
                  <div className="text-center space-y-2">
                    {quizState.lastAnswerCorrect ? (
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                    ) : (
                      <XCircle className="w-16 h-16 mx-auto text-red-500" />
                    )}
                    <div className="text-2xl font-bold text-white">
                      {quizState.lastAnswerCorrect ? 'Correct!' : 'Incorrect!'}
                    </div>
                    
                    {quizState.lastAnswerCorrect && (
                      <div className="space-y-1">
                        <div className="text-lg text-yellow-300 font-bold">
                          +{Math.floor((quizState.totalScore - (quizState.perfectStreak - 1) * 5) / quizState.perfectStreak)} Points!
                        </div>
                        
                        {quizState.speedZone === 'lightning' && (
                          <div className="text-sm text-blue-300">⚡ Lightning Speed! 3x Multiplier</div>
                        )}
                        {quizState.speedZone === 'fast' && (
                          <div className="text-sm text-green-300">🚀 Fast Answer! 2x Multiplier</div>
                        )}
                        
                        {quizState.comboMultiplier > 1 && (
                          <div className="text-sm text-orange-300">🔥 Combo {quizState.comboMultiplier}x Multiplier!</div>
                        )}
                        
                        {quizState.doublePointsRemaining > 0 && (
                          <div className="text-sm text-purple-300">💎 Double Points Active!</div>
                        )}
                        
                        {quizState.perfectStreak === 10 && (
                          <div className="text-sm text-blue-300 animate-pulse">🎉 10 Perfect! Double Points Unlocked!</div>
                        )}
                        
                        {quizState.perfectStreak === 15 && (
                          <div className="text-sm text-purple-300 animate-pulse">🛡️ 15 Perfect! Invincible Mode Activated!</div>
                        )}
                      </div>
                    )}
                    
                    {!quizState.lastAnswerCorrect && quizState.isInvincible && (
                      <div className="text-sm text-purple-300">🛡️ Invincible Mode Protected Your Combo!</div>
                    )}
                  </div>
                </motion.div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Question {quizState.currentQuestionIndex + 1}</span>
                  <Badge variant={currentQuestion.difficulty === 'HARD' ? 'destructive' : 
                                currentQuestion.difficulty === 'MEDIUM' ? 'default' : 'secondary'}>
                    {currentQuestion.difficulty}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-lg font-medium">
                  {currentQuestion.questionText}
                </div>
                
                <RadioGroup 
                  value={selectedAnswer?.toString() || ''} 
                  onValueChange={(value) => !quizState.showResult && handleAnswerSelect(parseInt(value))}
                  className="space-y-3"
                  disabled={quizState.showResult || isSubmitting}
                >
                  {currentQuestion.answers.map((answer: any, index: number) => (
                    <motion.div
                      key={answer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative flex items-center space-x-2 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-muted/50 ${
                        selectedAnswer === answer.id ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                      onClick={() => !quizState.showResult && handleAnswerSelect(answer.id)}
                    >
                      <RadioGroupItem value={answer.id.toString()} id={answer.id.toString()} />
                      <Label htmlFor={answer.id.toString()} className="flex-1 cursor-pointer">
                        {answer.answerText}
                      </Label>
                      {!isLastQuestion && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </motion.div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
