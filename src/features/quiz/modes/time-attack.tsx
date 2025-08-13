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
  Timer, 
  Zap, 
  Flame,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizAnswer {
  questionId: number
  selectedAnswerId: number | null
  timeSpent: number
  isAnswered: boolean
}

interface TimeAttackState {
  currentQuestionIndex: number
  answers: QuizAnswer[]
  startTime: number
  questionStartTime: number
  totalTimeLeft: number // Total quiz time limit
  questionTimeLeft: number // Current question time limit
  correctAnswers: number
  streak: number
  maxStreak: number
  isCompleted: boolean
  showResult: boolean
  lastAnswerCorrect: boolean | null
  multiplier: number
}

export default function TimeAttackQuiz() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const attemptId = urlParams.get('attemptId')

  // Time Attack specific settings
  const TOTAL_TIME_LIMIT = 180 // 3 minutes total
  const QUESTION_TIME_LIMIT = 10 // 10 seconds per question
  const SPEED_BONUS_THRESHOLD = 3 // bonus if answered within 3 seconds
  const STREAK_MULTIPLIER_THRESHOLD = 5 // multiplier starts at 5 streak

  const [quizState, setQuizState] = useState<TimeAttackState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    totalTimeLeft: TOTAL_TIME_LIMIT,
    questionTimeLeft: QUESTION_TIME_LIMIT,
    correctAnswers: 0,
    streak: 0,
    maxStreak: 0,
    isCompleted: false,
    showResult: false,
    lastAnswerCorrect: null,
    multiplier: 1
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

      setQuizState(prev => ({
        ...prev,
        answers: initialAnswers,
        startTime: Date.now(),
        questionStartTime: Date.now(),
        totalTimeLeft: TOTAL_TIME_LIMIT,
        questionTimeLeft: QUESTION_TIME_LIMIT
      }))
    }
  }, [quizData])

  // Total timer countdown
  useEffect(() => {
    if (quizState.isCompleted) return

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (prev.totalTimeLeft <= 1) {
          // Time's up! Complete the quiz
          handleTimeUp()
          return { ...prev, totalTimeLeft: 0, isCompleted: true }
        }
        return { ...prev, totalTimeLeft: prev.totalTimeLeft - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizState.isCompleted])

  // Question timer countdown
  useEffect(() => {
    if (quizState.isCompleted || quizState.showResult) return

    const timer = setInterval(() => {
      setQuizState(prev => {
        if (prev.questionTimeLeft <= 1) {
          // Question time's up! Auto-submit with no answer
          handleQuestionTimeUp()
          return prev
        }
        return { ...prev, questionTimeLeft: prev.questionTimeLeft - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizState.currentQuestionIndex, quizState.isCompleted, quizState.showResult])

  const handleTimeUp = useCallback(async () => {
    try {
      const totalTime = TOTAL_TIME_LIMIT
      
      await completeQuizFn({
        quizAttemptId: parseInt(attemptId || '0'),
        bonusPoints,
        perfectStreak: quizState.maxStreak,
        totalTimeSpent: totalTime
      })

      toast({
        title: "Time's Up!",
        description: "Quiz completed due to time limit",
        variant: "destructive"
      })

      // Navigate to results
      navigate(`/quiz/${attemptId}/results`)
    } catch (error) {
      console.error('Error completing quiz:', error)
    }
  }, [attemptId, bonusPoints, quizState.maxStreak])

  const handleQuestionTimeUp = useCallback(async () => {
    if (!currentQuestion || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // Submit with first answer (incorrect by default)
      await submitAnswerFn({
        quizAttemptId: parseInt(attemptId || '0'),
        questionId: currentQuestion.id,
        selectedAnswerId: currentQuestion.answers[0]?.id || 0,
        timeSpent: QUESTION_TIME_LIMIT
      })

      // Update state for incorrect answer
      setQuizState(prev => ({
        ...prev,
        lastAnswerCorrect: false,
        streak: 0,
        showResult: true,
        multiplier: 1
      }))

      // Show result briefly then move to next
      setTimeout(() => {
        if (isLastQuestion) {
          handleCompleteQuiz()
        } else {
          moveToNextQuestion()
        }
      }, 1000) // Shorter delay for time attack

    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [currentQuestion, attemptId, isLastQuestion, isSubmitting])

  const handleAnswerSelect = async (answerId: number) => {
    if (!currentQuestion || isSubmitting || quizState.showResult) return

    setSelectedAnswer(answerId)
    setIsSubmitting(true)

    try {
      const timeSpent = QUESTION_TIME_LIMIT - quizState.questionTimeLeft
      
      await submitAnswerFn({
        quizAttemptId: parseInt(attemptId || '0'),
        questionId: currentQuestion.id,
        selectedAnswerId: answerId,
        timeSpent
      })

      // Check if answer is correct
      const correctAnswer = currentQuestion.answers.find((a: any) => a.isCorrect)
      const isCorrect = answerId === correctAnswer?.id

      // Calculate multiplier and bonus
      let newStreak = isCorrect ? quizState.streak + 1 : 0
      let newMultiplier = newStreak >= STREAK_MULTIPLIER_THRESHOLD ? 
        Math.floor(newStreak / STREAK_MULTIPLIER_THRESHOLD) + 1 : 1

      let bonus = 0
      if (isCorrect) {
        // Speed bonus
        if (timeSpent <= SPEED_BONUS_THRESHOLD) {
          bonus += 20 * newMultiplier
        }
        
        // Streak bonus
        if (newStreak >= STREAK_MULTIPLIER_THRESHOLD) {
          bonus += newStreak * 10 * newMultiplier
        }
      }

      setBonusPoints(prev => prev + bonus)

      // Update quiz state
      setQuizState(prev => ({
        ...prev,
        lastAnswerCorrect: isCorrect,
        correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        multiplier: newMultiplier,
        showResult: true
      }))

      // Show result briefly then move to next
      setTimeout(() => {
        if (isLastQuestion) {
          handleCompleteQuiz()
        } else {
          moveToNextQuestion()
        }
      }, 1000)

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
      questionTimeLeft: QUESTION_TIME_LIMIT,
      showResult: false,
      lastAnswerCorrect: null
    }))
    setSelectedAnswer(null)
  }

  const handleCompleteQuiz = async () => {
    try {
      const totalTime = Math.floor((Date.now() - quizState.startTime) / 1000)
      
      await completeQuizFn({
        quizAttemptId: parseInt(attemptId || '0'),
        bonusPoints,
        perfectStreak: quizState.maxStreak,
        totalTimeSpent: totalTime
      })

      // Navigate to results
      navigate(`/quiz/${attemptId}/results`)
    } catch (error) {
      console.error('Error completing quiz:', error)
      toast({
        title: "Error",
        description: "Failed to complete quiz. Please try again.",
        variant: "destructive"
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Timer className="w-12 h-12 mx-auto text-red-500 animate-pulse" />
          <div className="text-lg font-semibold">Loading Time Attack...</div>
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
  const totalTimePercentage = (quizState.totalTimeLeft / TOTAL_TIME_LIMIT) * 100
  const questionTimePercentage = (quizState.questionTimeLeft / QUESTION_TIME_LIMIT) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-bold text-red-600">Time Attack</h1>
            <Flame className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-muted-foreground">Race against the clock!</p>
        </div>

        {/* Critical Time Warning */}
        {quizState.totalTimeLeft <= 30 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500 text-white p-4 rounded-lg text-center font-bold animate-pulse"
          >
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            CRITICAL TIME WARNING!
          </motion.div>
        )}

        {/* Time Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={`${quizState.totalTimeLeft <= 30 ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}>
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${
                quizState.totalTimeLeft <= 30 ? 'text-red-500 animate-pulse' : 
                quizState.totalTimeLeft <= 60 ? 'text-orange-500' : 'text-green-500'
              }`}>
                {formatTime(quizState.totalTimeLeft)}
              </div>
              <div className="text-sm text-muted-foreground">Total Time Left</div>
              <Progress 
                value={totalTimePercentage} 
                className={`mt-2 h-2 ${
                  quizState.totalTimeLeft <= 30 ? 'bg-red-100' : 
                  quizState.totalTimeLeft <= 60 ? 'bg-orange-100' : 'bg-green-100'
                }`}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${
                quizState.questionTimeLeft <= 3 ? 'text-red-500 animate-pulse' : 
                quizState.questionTimeLeft <= 5 ? 'text-orange-500' : 'text-green-500'
              }`}>
                {quizState.questionTimeLeft}s
              </div>
              <div className="text-sm text-muted-foreground">Question Time</div>
              <Progress 
                value={questionTimePercentage} 
                className={`mt-2 h-2 ${
                  quizState.questionTimeLeft <= 3 ? 'bg-red-100' : 
                  quizState.questionTimeLeft <= 5 ? 'bg-orange-100' : 'bg-green-100'
                }`}
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {quizState.currentQuestionIndex + 1}/{totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">
                {quizState.streak}
              </div>
              <div className="text-sm text-muted-foreground">Streak</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {quizState.multiplier}x
              </div>
              <div className="text-sm text-muted-foreground">Multiplier</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {bonusPoints}
              </div>
              <div className="text-sm text-muted-foreground">Bonus</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {quizState.correctAnswers}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={quizState.currentQuestionIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2 }}
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
                    {quizState.multiplier > 1 && (
                      <div className="text-lg text-yellow-300">
                        {quizState.multiplier}x Multiplier!
                      </div>
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex items-center space-x-2 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-muted/50 ${
                        selectedAnswer === answer.id ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                      onClick={() => !quizState.showResult && handleAnswerSelect(answer.id)}
                    >
                      <RadioGroupItem value={answer.id.toString()} id={answer.id.toString()} />
                      <Label htmlFor={answer.id.toString()} className="flex-1 cursor-pointer">
                        {answer.answerText}
                      </Label>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
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
