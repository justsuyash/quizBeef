import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getQuizAttempt, submitQuizAnswer, completeQuiz } from 'wasp/client/operations'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { Badge } from '../../../components/ui/badge'
import { Slider } from '../../../components/ui/slider'
import { Label } from '../../../components/ui/label'
import { toast } from '../../../hooks/use-toast'
import { 
  Clock, 
  Brain, 
  Star,
  RotateCcw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../../lib/cn'

interface FlashcardAnswer {
  questionId: number
  selectedAnswerId: number | null
  confidenceLevel: number
  timeSpent: number
  isAnswered: boolean
}

interface FloatingScore {
  id: string
  points: number
  type: 'base' | 'speed' | 'confidence' | 'streak'
  color: string
  label?: string
}

interface FlashcardState {
  currentQuestionIndex: number
  answers: FlashcardAnswer[]
  startTime: number
  questionStartTime: number
  showAnswer: boolean
  confidenceTotal: number
  averageConfidence: number
  currentScore: number
  currentStreak: number
  isCompleted: boolean
  showResult: boolean
  lastAnswerCorrect: boolean | null
  lastQuestionTimeSpent: number
  showScoreAnimation: boolean
  floatingScores: FloatingScore[]
  studyMode: boolean // Show explanations
}

export default function FlashcardFrenzyQuiz() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const attemptId = urlParams.get('attemptId')

  const [quizState, setQuizState] = useState<FlashcardState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    showAnswer: false,
    confidenceTotal: 0,
    averageConfidence: 0,
    currentScore: 0,
    currentStreak: 0,
    isCompleted: false,
    showResult: false,
    lastAnswerCorrect: null,
    lastQuestionTimeSpent: 0,
    showScoreAnimation: false,
    floatingScores: [],
    studyMode: false
  })

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<number>(3)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get streak visual properties based on streak level
  const getStreakProperties = (streak: number) => {
    if (streak < 2) return null // No streak bonus for first answer
    if (streak < 5) return { color: 'bg-yellow-400', label: `Streak +${streak}` }
    if (streak < 8) return { color: 'bg-orange-500', label: `Streak +${streak}` }
    if (streak < 12) return { color: 'bg-red-500', label: `Streak +${streak}` }
    if (streak < 15) return { color: 'bg-red-600', label: `Streak +${streak}` }
    return { color: 'bg-red-700', label: `Streak +${streak}` } // Glowing handled separately
  }

  // Get streak color for the display card
  const getStreakDisplayColor = (streak: number) => {
    if (streak === 0) return "text-gray-300"
    if (streak < 3) return "text-gray-600"
    if (streak < 5) return "text-yellow-400"
    if (streak < 8) return "text-orange-500"
    if (streak < 12) return "text-red-500"
    if (streak < 15) return "text-red-600"
    return "text-red-700" // Will add glow effect
  }

  // Get streak card styling
  const getStreakCardStyle = (streak: number) => {
    if (streak >= 15) {
      return {
        className: "ring-2 ring-red-500 shadow-lg shadow-red-500/50 animate-pulse",
        textClass: "text-red-700 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
      }
    }
    return {
      className: "",
      textClass: getStreakDisplayColor(streak)
    }
  }

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
  const correctAnswer = currentQuestion?.answers?.find((a: any) => a.isCorrect)

  // Initialize quiz state
  useEffect(() => {
    if (quizData?.questions) {
      const initialAnswers: FlashcardAnswer[] = quizData.questions.map((q: any) => ({
        questionId: q.id,
        selectedAnswerId: null,
        confidenceLevel: 3,
        timeSpent: 0,
        isAnswered: false
      }))

      setQuizState(prev => ({
        ...prev,
        answers: initialAnswers,
        startTime: Date.now(),
        questionStartTime: Date.now()
      }))
    }
  }, [quizData])

  const handleRevealAnswer = () => {
    setQuizState(prev => ({ ...prev, showAnswer: true }))
  }

  const handleAnswerSelect = async (answerId: number, wasCorrectGuess: boolean) => {
    if (!currentQuestion || isSubmitting) return

    setSelectedAnswer(answerId)
    setIsSubmitting(true)

    try {
      const timeSpent = Math.floor((Date.now() - quizState.questionStartTime) / 1000)
      
      await submitAnswerFn({
        quizAttemptId: parseInt(attemptId || '0'),
        questionId: currentQuestion.id,
        selectedAnswerId: answerId,
        timeSpent,
        confidenceLevel: confidence
      })

      const isCorrect = answerId === correctAnswer?.id

      // Calculate score for this question
      let questionScore = 0
      let newStreak = isCorrect ? quizState.currentStreak + 1 : 0
      
      if (isCorrect) {
        const baseScore = 100
        const speedBonus = Math.max(0, 50 - Math.floor(timeSpent / 2))
        const confidenceBonus = confidence * 10
        const streakBonus = newStreak >= 2 ? newStreak : 0 // +1 point per streak level
        questionScore = baseScore + speedBonus + confidenceBonus + streakBonus
        
        // Create multiple floating score animations
        const baseId = Date.now()
        const newFloatingScores: FloatingScore[] = []
        
        // Base score animation (immediate)
        newFloatingScores.push({
          id: `base-${baseId}`,
          points: baseScore,
          type: 'base' as const,
          color: 'bg-green-500'
        })
        
        // Speed bonus animation (delayed)
        if (speedBonus > 0) {
          setTimeout(() => {
            setQuizState(prev => ({
              ...prev,
              floatingScores: [...prev.floatingScores, {
                id: `speed-${baseId}`,
                points: speedBonus,
                type: 'speed' as const,
                color: 'bg-orange-500'
              }]
            }))
          }, 300)
        }
        
        // Confidence bonus animation (more delayed)
        if (confidenceBonus > 0) {
          setTimeout(() => {
            setQuizState(prev => ({
              ...prev,
              floatingScores: [...prev.floatingScores, {
                id: `confidence-${baseId}`,
                points: confidenceBonus,
                type: 'confidence' as const,
                color: 'bg-blue-500'
              }]
            }))
          }, 600)
        }
        
        // Streak bonus animation (most delayed)
        if (streakBonus > 0) {
          const streakProps = getStreakProperties(newStreak)
          if (streakProps) {
            setTimeout(() => {
              setQuizState(prev => ({
                ...prev,
                floatingScores: [...prev.floatingScores, {
                  id: `streak-${baseId}`,
                  points: streakBonus,
                  type: 'streak' as const,
                  color: streakProps.color,
                  label: streakProps.label
                }]
              }))
            }, 900)
          }
        }
        
        setQuizState(prev => ({
          ...prev,
          lastAnswerCorrect: isCorrect,
          showResult: true,
          confidenceTotal: prev.confidenceTotal + confidence,
          averageConfidence: (prev.confidenceTotal + confidence) / (prev.currentQuestionIndex + 1),
          lastQuestionTimeSpent: timeSpent,
          currentScore: prev.currentScore + questionScore,
          currentStreak: newStreak,
          showScoreAnimation: true,
          floatingScores: [...prev.floatingScores, ...newFloatingScores]
        }))
        
        // Stop score animation after all bonuses (including streak)
        setTimeout(() => {
          setQuizState(prev => ({
            ...prev,
            showScoreAnimation: false
          }))
        }, 1500)
        
        // Clean up floating scores after animations
        const cleanupIds = [`base-${baseId}`, `speed-${baseId}`, `confidence-${baseId}`, `streak-${baseId}`]
        setTimeout(() => {
          setQuizState(prev => ({
            ...prev,
            floatingScores: prev.floatingScores.filter(score => !cleanupIds.includes(score.id))
          }))
        }, 2300)
      } else {
        // Calculate overconfidence penalty for incorrect answers
        const overconfidencePenalty = confidence >= 4 ? confidence * 5 : 0 // -20 or -25 for high confidence mistakes
        const finalPenalty = Math.min(overconfidencePenalty, quizState.currentScore) // Don't go negative
        
        const newConfidenceTotal = quizState.confidenceTotal + confidence
        const newAverageConfidence = newConfidenceTotal / (quizState.currentQuestionIndex + 1)

        // Show penalty animation if overconfident
        if (overconfidencePenalty > 0) {
          const penaltyId = `penalty-${Date.now()}`
          setTimeout(() => {
            setQuizState(prev => ({
              ...prev,
              floatingScores: [...prev.floatingScores, {
                id: penaltyId,
                points: -finalPenalty,
                type: 'confidence' as const,
                color: 'bg-red-600',
                label: `Overconfident -${finalPenalty}`
              }]
            }))
          }, 500)
          
          // Clean up penalty animation
          setTimeout(() => {
            setQuizState(prev => ({
              ...prev,
              floatingScores: prev.floatingScores.filter(score => score.id !== penaltyId)
            }))
          }, 2000)
        }

        setQuizState(prev => ({
          ...prev,
          lastAnswerCorrect: isCorrect,
          showResult: true,
          confidenceTotal: newConfidenceTotal,
          averageConfidence: newAverageConfidence,
          lastQuestionTimeSpent: timeSpent,
          currentScore: Math.max(0, prev.currentScore - finalPenalty), // Apply penalty
          currentStreak: 0, // Reset streak on incorrect answer
          showScoreAnimation: overconfidencePenalty > 0 // Light up score card for penalty too
        }))
        
        // Stop penalty animation
        if (overconfidencePenalty > 0) {
          setTimeout(() => {
            setQuizState(prev => ({
              ...prev,
              showScoreAnimation: false
            }))
          }, 800)
        }
      }

      // Show result briefly then move to next
      setTimeout(() => {
        if (isLastQuestion) {
          handleCompleteQuiz()
        } else {
          moveToNextQuestion()
        }
      }, 2500) // Longer delay for flashcard mode

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
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      questionStartTime: Date.now(),
      showAnswer: false,
      showResult: false,
      lastAnswerCorrect: null
    }))
    setSelectedAnswer(null)
    setConfidence(3)
  }

  const handleCompleteQuiz = async () => {
    try {
      const totalTime = Math.floor((Date.now() - quizState.startTime) / 1000)
      
      // Calculate confidence statistics
      const highConfidenceAnswers = quizState.answers.filter(a => a.confidenceLevel >= 4)
      const lowConfidenceAnswers = quizState.answers.filter(a => a.confidenceLevel <= 2)
      
      // Calculate correct answers for confidence analysis
      let correctAnswersCount = 0
      questions.forEach((q: any, index: number) => {
        if (q.wasCorrect) correctAnswersCount++
      })
      
      const correctHighConfidence = questions.filter((q: any, index: number) => {
        const answer = quizState.answers[index]
        return answer?.confidenceLevel >= 4 && q.wasCorrect
      }).length
      const correctLowConfidence = questions.filter((q: any, index: number) => {
        const answer = quizState.answers[index]
        return answer?.confidenceLevel <= 2 && q.wasCorrect
      }).length
      
      await completeQuizFn({
        quizAttemptId: parseInt(attemptId || '0'),
        averageConfidence: quizState.averageConfidence,
        totalTimeSpent: totalTime,
        gameplayStats: {
          averageConfidence: quizState.averageConfidence,
          totalScore: quizState.currentScore,
          maxStreak: quizState.currentStreak,
          confidenceStats: {
            highConfidenceCorrect: correctHighConfidence,
            lowConfidenceCorrect: correctLowConfidence,
            totalHighConfidence: highConfidenceAnswers.length,
            totalLowConfidence: lowConfidenceAnswers.length,
            confidenceAccuracy: quizState.averageConfidence > 0 ? (correctAnswersCount / totalQuestions) * 100 * (quizState.averageConfidence / 5) : 0
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

  const getConfidenceLabel = (level: number) => {
    switch (level) {
      case 1: return "Not Sure"
      case 2: return "Somewhat Sure"
      case 3: return "Moderately Sure"
      case 4: return "Quite Sure"
      case 5: return "Very Sure"
      default: return "Moderately Sure"
    }
  }

  const getConfidenceColor = (level: number) => {
    if (level <= 2) return "text-red-500"
    if (level === 3) return "text-yellow-500"
    if (level === 4) return "text-orange-500"
    return "text-green-500"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Brain className="w-12 h-12 mx-auto text-purple-500 animate-pulse" />
          <div className="text-lg font-semibold">Loading Flashcard Frenzy...</div>
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
          <Sparkles className="w-12 h-12 mx-auto text-primary" />
          <div className="text-lg font-semibold">Quiz Complete!</div>
        </div>
      </div>
    )
  }

  const progressPercentage = ((quizState.currentQuestionIndex + 1) / totalQuestions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            <h1 className="text-2xl font-bold text-purple-600">Flashcard Frenzy</h1>
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-muted-foreground">Test your confidence and knowledge</p>
        </div>

        {/* Progress and Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {quizState.currentQuestionIndex + 1}/{totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "relative overflow-hidden transition-all duration-500",
            quizState.showScoreAnimation && (
              quizState.lastAnswerCorrect 
                ? "ring-4 ring-yellow-400 shadow-lg shadow-yellow-200 scale-105"
                : "ring-4 ring-red-400 shadow-lg shadow-red-200 scale-105"
            )
          )}>
            <CardContent className="p-4 text-center relative">
              <div className={cn(
                "text-2xl font-bold transition-all duration-300",
                quizState.showScoreAnimation ? (
                  quizState.lastAnswerCorrect 
                    ? "text-yellow-600 scale-110" 
                    : "text-red-600 scale-110"
                ) : "text-green-600"
              )}>
                {quizState.currentScore || 0}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
              
              {/* Floating score animations */}
              <AnimatePresence>
                {quizState.floatingScores.map((floatingScore, index) => (
                  <motion.div
                    key={floatingScore.id}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ y: 0, opacity: 0, scale: 0.5 }}
                    animate={{ 
                      y: -60, 
                      opacity: [0, 1, 1, 0], 
                      scale: [0.5, 1.2, 1, 0.8],
                      x: [0, (index % 3 - 1) * 20, 0] // Slight horizontal spread
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ 
                      duration: 1.5,
                      ease: "easeOut",
                      delay: floatingScore.type === 'base' ? 0 : floatingScore.type === 'speed' ? 0.1 : floatingScore.type === 'confidence' ? 0.2 : 0.3
                    }}
                  >
                    <div className={`${floatingScore.color} text-white px-3 py-1 rounded-full font-bold text-lg shadow-lg`}>
                      {floatingScore.label ? (
                        floatingScore.label
                      ) : (
                        <>
                          {floatingScore.type === 'speed' && 'Speed '}
                          {floatingScore.type === 'confidence' && 'Confidence '}
                          +{floatingScore.points}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Sparkle effects */}
              {quizState.showScoreAnimation && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                      style={{
                        left: `${20 + (i * 12)}%`,
                        top: `${30 + (i % 2) * 40}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.1,
                        repeat: 1,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
          
          <Card className={cn(
            "transition-all duration-500",
            getStreakCardStyle(quizState.currentStreak).className
          )}>
            <CardContent className="p-4 text-center">
              <div className={cn(
                "text-2xl font-bold transition-all duration-500",
                getStreakCardStyle(quizState.currentStreak).textClass
              )}>
                {quizState.currentStreak}
              </div>
              <div className="text-sm text-muted-foreground">Streak</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-500">
                {quizState.averageConfidence.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-end justify-center gap-1">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isSelected = confidence >= level;
                  const barHeight = 8 + (level * 3); // 11px to 23px (compact for progress)
                  
                  return (
                    <div
                      key={level}
                      className={cn(
                        "w-3 rounded-full transition-all duration-200",
                        isSelected
                          ? "bg-blue-500 shadow-sm"
                          : "bg-gray-200"
                      )}
                      style={{ 
                        height: `${barHeight}px`
                      }}
                    />
                  );
                })}
              </div>
              <div className="text-sm text-muted-foreground">Current Confidence</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Flashcard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${quizState.currentQuestionIndex}-${quizState.showAnswer}`}
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="relative overflow-hidden min-h-[400px]">
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
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                        delay: 0.1 
                      }}
                    >
                      {quizState.lastAnswerCorrect ? (
                        <CheckCircle className="w-20 h-20 mx-auto text-white mb-4" />
                      ) : (
                        <XCircle className="w-20 h-20 mx-auto text-white mb-4" />
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="text-4xl font-bold text-white"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {quizState.lastAnswerCorrect ? 'CORRECT!' : 'INCORRECT!'}
                    </motion.div>
                    
                    {quizState.lastAnswerCorrect ? (
                      <motion.div 
                        className="text-yellow-300 text-lg font-semibold mt-2"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        Great job! 🎉
                      </motion.div>
                    ) : (
                      confidence >= 4 && (
                        <motion.div 
                          className="text-orange-300 text-base font-medium mt-2"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          Overconfidence penalty: -{confidence * 5} points
                        </motion.div>
                      )
                    )}
                  </div>
                </motion.div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Question {quizState.currentQuestionIndex + 1}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={currentQuestion.difficulty === 'HARD' ? 'destructive' : 
                                  currentQuestion.difficulty === 'MEDIUM' ? 'default' : 'secondary'}>
                      {currentQuestion.difficulty}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuizState(prev => ({ ...prev, studyMode: !prev.studyMode }))}
                    >
                      {quizState.studyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Question */}
                <div className="text-center space-y-4">
                  <div className="text-xl font-medium p-6 bg-muted/50 rounded-lg">
                    {currentQuestion.questionText}
                  </div>
                  
                  {!quizState.showAnswer && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Think about your answer, then choose your confidence and reveal the options.
                      </p>
                      
                      {/* Confidence + Reveal Button Row */}
                      <div className="flex items-center justify-center gap-4">
                        {/* Low Confidence Button (Down Arrow) */}
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setConfidence(2)}
                          className={`group relative p-4 rounded-full transition-all duration-300 ${
                            confidence === 2 
                              ? 'bg-gradient-to-b from-orange-400 to-orange-600 shadow-lg shadow-orange-500/50' 
                              : 'bg-gradient-to-b from-gray-300 to-gray-400 hover:from-orange-300 hover:to-orange-500'
                          }`}
                          style={{
                            boxShadow: confidence === 2 
                              ? '0 8px 25px rgba(251, 146, 60, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                              : '0 4px 15px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div className={`text-2xl transition-all duration-300 ${
                            confidence === 2 ? 'text-white' : 'text-gray-600 group-hover:text-white'
                          }`}>
                            ⬇️
                          </div>
                          {/* Glow effect */}
                          {confidence === 2 && (
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-orange-400/50 to-orange-600/50 opacity-75 blur-sm -z-10 animate-pulse" />
                          )}
                        </motion.button>

                        {/* Reveal Options Button */}
                        <Button 
                          onClick={handleRevealAnswer}
                          size="lg"
                          disabled={confidence === 3} // Require confidence selection
                          className={`bg-purple-500 hover:bg-purple-600 transition-all duration-300 ${
                            confidence === 3 ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'
                          }`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Reveal Options
                        </Button>

                        {/* High Confidence Button (Up Arrow) */}
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setConfidence(5)}
                          className={`group relative p-4 rounded-full transition-all duration-300 ${
                            confidence === 5 
                              ? 'bg-gradient-to-b from-green-400 to-green-600 shadow-lg shadow-green-500/50' 
                              : 'bg-gradient-to-b from-gray-300 to-gray-400 hover:from-green-300 hover:to-green-500'
                          }`}
                          style={{
                            boxShadow: confidence === 5 
                              ? '0 8px 25px rgba(34, 197, 94, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 20px rgba(34, 197, 94, 0.4)' 
                              : '0 4px 15px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div className={`text-2xl transition-all duration-300 ${
                            confidence === 5 ? 'text-white' : 'text-gray-600 group-hover:text-white'
                          }`}>
                            ⬆️
                          </div>
                          {/* Glow effect */}
                          {confidence === 5 && (
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-b from-green-400/50 to-green-600/50 opacity-75 blur-sm -z-10 animate-pulse" />
                          )}
                        </motion.button>
                      </div>
                      
                      {/* Confidence Indicator */}
                      {confidence !== 3 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center"
                        >
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            confidence === 2 
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' 
                              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {confidence === 2 ? '🤔 Low Confidence' : '💪 High Confidence'}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {/* Answer Options */}
                  {quizState.showAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {!quizState.showResult ? (
                        // Show answer options with confidence already selected
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Confidence: {confidence === 2 ? '🤔 Low Confidence' : '💪 High Confidence'}
                            </p>
                          </div>
                          
                          {currentQuestion.answers.map((answer: any, index: number) => (
                            <motion.button
                              key={answer.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`w-full p-4 text-left rounded-lg border-2 transition-all hover:bg-muted/50 ${
                                selectedAnswer === answer.id ? 'border-primary bg-primary/10' : 'border-border'
                              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              onClick={() => !isSubmitting && handleAnswerSelect(answer.id, answer.isCorrect)}
                              disabled={isSubmitting || quizState.showResult}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{answer.answerText}</span>
                                {!isLastQuestion && (
                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      ) : null}
                      
                      {/* Show explanation in study mode */}
                      {quizState.studyMode && correctAnswer?.explanation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500"
                        >
                          <div className="text-sm">
                            <strong>Explanation:</strong> {correctAnswer.explanation}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </div>
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
