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
  Heart, 
  Shield,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizAnswer {
  questionId: number
  selectedAnswerId: number | null
  timeSpent: number
  isAnswered: boolean
}

interface PrecisionState {
  currentQuestionIndex: number
  answers: QuizAnswer[]
  startTime: number
  questionStartTime: number
  correctStreak: number
  longestStreak: number
  lives: number
  isCompleted: boolean
  showResult: boolean
  lastAnswerCorrect: boolean | null
  correctAnswers: number
  totalScore: number
}

const PrecisionMode: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const attemptId = urlParams.get('attemptId')
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [quizState, setQuizState] = useState<PrecisionState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    correctStreak: 0,
    longestStreak: 0,
    lives: 3, // Start with 3 lives
    isCompleted: false,
    showResult: false,
    lastAnswerCorrect: null,
    correctAnswers: 0,
    totalScore: 0
  })

  const { data: quizData, isLoading, error } = useQuery(getQuizAttempt, 
    { quizAttemptId: parseInt(attemptId!) },
    { enabled: !!attemptId }
  )

  const submitAnswerAction = useAction(submitQuizAnswer)
  const completeQuizAction = useAction(completeQuiz)

  // Initialize quiz state when data loads
  useEffect(() => {
    if (quizData?.questions) {
      const initialAnswers: QuizAnswer[] = quizData.questions.map((q: any) => ({
        questionId: q.id,
        selectedAnswerId: null,
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

  // Watch for lives reaching 0 - end quiz immediately
  useEffect(() => {
    if (quizState.lives === 0 && !quizState.isCompleted) {
      handleCompleteQuiz()
    }
  }, [quizState.lives])

  const currentQuestion = quizData?.questions?.[quizState.currentQuestionIndex]
  const isLastQuestion = quizState.currentQuestionIndex === (quizData?.questions?.length || 0) - 1

  const handleAnswerSelect = async (answerId: number, isCorrect: boolean) => {
    if (isSubmitting || quizState.showResult) return
    
    setIsSubmitting(true)
    setSelectedAnswer(answerId)
    
    const timeSpent = Math.round((Date.now() - quizState.questionStartTime) / 1000)
    
    try {
      await submitAnswerAction({
        quizAttemptId: parseInt(attemptId!),
        questionId: currentQuestion.id,
        selectedAnswerId: answerId,
        timeSpent
      })

      // Calculate points (base 10 points per correct answer)
      const basePoints = 10
      let earnedPoints = 0
      
      if (isCorrect) {
        earnedPoints = basePoints
      }

      // Update quiz state
      setQuizState(prev => {
        const newAnswers = [...prev.answers]
        newAnswers[prev.currentQuestionIndex] = {
          questionId: currentQuestion.id,
          selectedAnswerId: answerId,
          timeSpent,
          isAnswered: true
        }

        const newCorrectAnswers = isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers
        const newLives = isCorrect ? prev.lives : prev.lives - 1
        const newCorrectStreak = isCorrect ? prev.correctStreak + 1 : 0
        const newLongestStreak = Math.max(prev.longestStreak, newCorrectStreak)
        const newTotalScore = prev.totalScore + earnedPoints

        return {
          ...prev,
          answers: newAnswers,
          correctAnswers: newCorrectAnswers,
          lives: newLives,
          correctStreak: newCorrectStreak,
          longestStreak: newLongestStreak,
          totalScore: newTotalScore,
          lastAnswerCorrect: isCorrect,
          showResult: true
        }
      })

      // Show result for 2 seconds, then move to next question or complete
      setTimeout(() => {
        if (quizState.lives <= 1 && !isCorrect) {
          // Lives will be 0 after this wrong answer - quiz will end via useEffect
          return
        }
        
        if (isLastQuestion) {
          handleCompleteQuiz()
        } else {
          moveToNextQuestion()
        }
      }, 2000)

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
      showResult: false,
      lastAnswerCorrect: null
    }))
    setSelectedAnswer(null)
  }

  const handleCompleteQuiz = useCallback(async () => {
    if (quizState.isCompleted) return

    setQuizState(prev => ({ ...prev, isCompleted: true }))

    const totalTimeSpent = Math.round((Date.now() - quizState.startTime) / 1000)
    const accuracy = quizState.answers.length > 0 ? (quizState.correctAnswers / quizState.answers.filter(a => a.isAnswered).length) * 100 : 0

    // Prepare precision-specific gameplay stats
    const gameplayStats = {
      precisionScore: quizState.correctAnswers, // Number of correct answers before elimination
      livesRemaining: quizState.lives,
      survivalRate: accuracy,
      longestStreak: quizState.longestStreak,
      totalScore: quizState.totalScore,
      eliminatedBy: quizState.lives === 0 ? 'lives_exhausted' : 'quiz_completed'
    }

    try {
      const result = await completeQuizAction({
        quizAttemptId: parseInt(attemptId!),
        totalTimeSpent: totalTimeSpent,
        gameplayStats
      })

      // Navigate to summary page
      navigate(`/quiz/${attemptId}/summary`)
    } catch (error) {
      console.error('Error completing quiz:', error)
      toast({
        title: "Error",
        description: "Failed to complete quiz. Please try again.",
        variant: "destructive"
      })
    }
  }, [attemptId, navigate, completeQuizAction, quizState])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Precision Mode...</p>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="w-12 h-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Quiz Not Found</h3>
                <p className="text-muted-foreground">The quiz you're looking for doesn't exist or has been removed.</p>
              </div>
              <Button onClick={() => navigate('/play')} variant="outline">
                Back to Play
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizState.isCompleted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Completing quiz...</p>
        </div>
      </div>
    )
  }

  const progress = ((quizState.currentQuestionIndex + 1) / quizData.questions.length) * 100
  const correctAnswer = currentQuestion?.answers?.find((a: any) => a.isCorrect)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-500" />
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Precision Mode ⚡
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-sm">
              Survival Challenge
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Answer carefully - you only have 3 lives! One wrong answer loses a life.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {/* Progress */}
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {quizState.currentQuestionIndex + 1}/{quizData.questions.length}
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </Card>

            {/* Lives */}
            <Card className="p-4">
              <div className="flex justify-center gap-1 mb-1">
                {Array.from({ length: 3 }, (_, i) => (
                  <motion.div
                    key={i}
                    animate={quizState.lives <= i ? { scale: [1, 0.8, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {quizState.lives > i ? (
                      <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                    ) : (
                      <Heart className="w-6 h-6 text-gray-300" />
                    )}
                  </motion.div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">Lives</div>
            </Card>

            {/* Score */}
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-500 mb-1">
                {quizState.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </Card>

            {/* Streak */}
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-500 mb-1">
                {quizState.correctStreak}
              </div>
              <div className="text-sm text-muted-foreground">Streak</div>
            </Card>

            {/* Survival Rate */}
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-500 mb-1">
                {quizState.answers.filter(a => a.isAnswered).length > 0 
                  ? Math.round((quizState.correctAnswers / quizState.answers.filter(a => a.isAnswered).length) * 100)
                  : 100}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Low Lives Warning */}
          {quizState.lives === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">⚠️ Last Life! One wrong answer will end the quiz.</span>
              </div>
            </motion.div>
          )}

          {/* Question */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Question {quizState.currentQuestionIndex + 1}
                </h2>
                {currentQuestion?.difficulty && (
                  <Badge 
                    variant={
                      currentQuestion.difficulty === 'HARD' ? 'destructive' :
                      currentQuestion.difficulty === 'MEDIUM' ? 'default' : 'secondary'
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </div>

              <div className="text-center space-y-4">
                <div className="text-xl font-medium p-6 bg-muted/50 rounded-lg">
                  {currentQuestion?.questionText}
                </div>
                
                {!quizState.showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {currentQuestion?.answers?.map((answer: any, index: number) => (
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
                )}

                {/* Result Display */}
                <AnimatePresence>
                  {quizState.showResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="space-y-4"
                    >
                      <div className={`p-4 rounded-lg border-2 ${
                        quizState.lastAnswerCorrect 
                          ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                          : 'border-red-500 bg-red-50 dark:bg-red-950'
                      }`}>
                        <div className="flex items-center justify-center gap-2">
                          {quizState.lastAnswerCorrect ? (
                            <>
                              <CheckCircle className="w-6 h-6 text-green-600" />
                              <span className="text-green-700 dark:text-green-300 font-medium">
                                Correct! +10 points
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-6 h-6 text-red-600" />
                              <span className="text-red-700 dark:text-red-300 font-medium">
                                Wrong! Lost a life ❤️
                              </span>
                            </>
                          )}
                        </div>
                        
                        {!quizState.lastAnswerCorrect && correctAnswer?.explanation && (
                          <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                            <p className="font-medium mb-1">Explanation:</p>
                            <p className="text-muted-foreground">{correctAnswer.explanation}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>

          {/* Game Over Message */}
          {quizState.lives === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="text-2xl font-bold text-red-500">Game Over!</div>
              <p className="text-muted-foreground">
                You've run out of lives. Final score: {quizState.correctAnswers} correct answers
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PrecisionMode
