import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getQuizAttempt, submitQuizAnswer, completeQuiz } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Progress } from '../../components/ui/progress'
import { Badge } from '../../components/ui/badge'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Label } from '../../components/ui/label'
import { Separator } from '../../components/ui/separator'
import { toast } from '../../hooks/use-toast'
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle,
  AlertCircle,
  Trophy,
  Target,
  Star
} from 'lucide-react'

interface QuizAnswer {
  questionId: number
  selectedAnswerId: number | null
  timeSpent: number
  confidenceLevel: number | null
  isAnswered: boolean
}

interface QuizState {
  currentQuestionIndex: number
  answers: QuizAnswer[]
  startTime: number
  questionStartTime: number
  totalTimeSpent: number
  isCompleted: boolean
}

export default function QuizTakePage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const attemptId = urlParams.get('attemptId')

  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    totalTimeSpent: 0,
    isCompleted: false
  })

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<number>(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const { data: quizData, isLoading, error } = useQuery(getQuizAttempt, 
    { quizAttemptId: parseInt(attemptId || '0') },
    { enabled: !!attemptId }
  )

  const submitAnswerFn = useAction(submitQuizAnswer)
  const completeQuizFn = useAction(completeQuiz)

  const questions = quizData?.questions || []
  const currentQuestion = questions[quizState.currentQuestionIndex]
  const isLastQuestion = quizState.currentQuestionIndex === questions.length - 1
  const hasTimeLimit = quizData?.timeLimit
  const totalQuestions = questions.length

  // Initialize quiz state when data loads
  useEffect(() => {
    if (quizData?.questions) {
      const initialAnswers: QuizAnswer[] = quizData.questions.map((q: any) => ({
        questionId: q.id,
        selectedAnswerId: null,
        timeSpent: 0,
        confidenceLevel: null,
        isAnswered: false
      }))

      setQuizState(prev => ({
        ...prev,
        answers: initialAnswers,
        startTime: Date.now(),
        questionStartTime: Date.now()
      }))

      if (hasTimeLimit) {
        setTimeLeft(hasTimeLimit * 60) // Convert minutes to seconds
      }
    }
  }, [quizData, hasTimeLimit])

  // Timer for time limit
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto complete quiz
          handleCompleteQuiz(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Load existing answer for current question
  useEffect(() => {
    if (currentQuestion && quizState.answers.length > 0) {
      const existingAnswer = quizState.answers[quizState.currentQuestionIndex]
      setSelectedAnswer(existingAnswer?.selectedAnswerId || null)
      setConfidence(existingAnswer?.confidenceLevel || 3)
    }
  }, [quizState.currentQuestionIndex, currentQuestion, quizState.answers])

  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswer(answerId)
  }

  const handleConfidenceChange = (level: number) => {
    setConfidence(level)
  }

  const updateQuestionTime = useCallback(() => {
    const timeSpent = Math.round((Date.now() - quizState.questionStartTime) / 1000)
    
    setQuizState(prev => ({
      ...prev,
      answers: prev.answers.map((answer, index) => 
        index === prev.currentQuestionIndex 
          ? { ...answer, timeSpent: answer.timeSpent + timeSpent }
          : answer
      ),
      questionStartTime: Date.now()
    }))
  }, [quizState.questionStartTime, quizState.currentQuestionIndex])

  const handleNext = async () => {
    if (!currentQuestion || selectedAnswer === null) {
      toast({
        title: 'Please select an answer',
        description: 'You must select an answer before proceeding.',
        variant: 'destructive',
      })
      return
    }

    updateQuestionTime()
    
    const questionTimeSpent = Math.round((Date.now() - quizState.questionStartTime) / 1000)

    // Update local state
    setQuizState(prev => ({
      ...prev,
      answers: prev.answers.map((answer, index) => 
        index === prev.currentQuestionIndex 
          ? {
              ...answer,
              selectedAnswerId: selectedAnswer,
              confidenceLevel: confidence,
              timeSpent: answer.timeSpent + questionTimeSpent,
              isAnswered: true
            }
          : answer
      )
    }))

    // Submit answer to backend
    setIsSubmitting(true)
    try {
      await submitAnswerFn({
        quizAttemptId: parseInt(attemptId || '0'),
        questionId: currentQuestion.id,
        selectedAnswerId: selectedAnswer,
        timeSpent: questionTimeSpent,
        confidenceLevel: confidence
      })
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast({
        title: 'Failed to save answer',
        description: 'Your answer may not have been saved. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }

    if (isLastQuestion) {
      // Complete the quiz
      handleCompleteQuiz()
    } else {
      // Move to next question
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        questionStartTime: Date.now()
      }))
      setSelectedAnswer(null)
      setConfidence(3)
    }
  }

  const handlePrevious = () => {
    if (quizState.currentQuestionIndex > 0) {
      updateQuestionTime()
      
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        questionStartTime: Date.now()
      }))
    }
  }

  const handleCompleteQuiz = async (timeExpired = false) => {
    updateQuestionTime()
    
    const totalTime = Math.round((Date.now() - quizState.startTime) / 1000)
    
    try {
      const result = await completeQuizFn({
        quizAttemptId: parseInt(attemptId || '0'),
        totalTimeSpent: totalTime
      })

      if (result.success) {
        toast({
          title: timeExpired ? 'Time\'s Up!' : 'Quiz Completed!',
          description: `Final Score: ${Math.round(result.score)}%`,
        })

        // Navigate to results page
        navigate(`/quiz/${attemptId}/summary`)
      }
    } catch (error) {
      console.error('Error completing quiz:', error)
      toast({
        title: 'Failed to complete quiz',
        description: 'There was an error saving your results. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    const answeredQuestions = quizState.answers.filter(a => a.isAnswered).length
    return Math.round((answeredQuestions / totalQuestions) * 100)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'HARD': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Quiz...</h2>
        </div>
      </div>
    )
  }

  if (error || !quizData || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Quiz Not Found</h2>
          <p className="text-muted-foreground">
            {error?.message || 'The quiz could not be loaded.'}
          </p>
          <Button onClick={() => navigate('/documents')}>
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Quiz Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{quizData.document?.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {quizState.currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {hasTimeLimit && timeLeft !== null && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className={`font-mono ${timeLeft < 300 ? 'text-destructive' : ''}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCompleteQuiz()}
                disabled={isSubmitting}
              >
                <Flag className="h-4 w-4 mr-2" />
                Finish Quiz
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{getProgressPercentage()}% Complete</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Question {quizState.currentQuestionIndex + 1}
              </CardTitle>
              <Badge className={getDifficultyColor(currentQuestion.difficulty)} variant="secondary">
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <CardDescription className="text-base leading-relaxed pt-2">
              {currentQuestion.questionText}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Answer Options */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Select your answer:</Label>
              <RadioGroup 
                value={selectedAnswer?.toString() || ''} 
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
              >
                {currentQuestion.answers?.map((answer: any) => (
                  <div 
                    key={answer.id} 
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleAnswerSelect(answer.id)}
                  >
                    <RadioGroupItem 
                      value={answer.id.toString()} 
                      id={answer.id.toString()}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor={answer.id.toString()} 
                      className="flex-1 cursor-pointer text-sm leading-relaxed"
                    >
                      {answer.answerText}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Confidence Level */}
            <div className="space-y-3">
              <Label className="text-base font-medium">How confident are you?</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Not confident</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleConfidenceChange(level)}
                      className={`p-2 rounded-full transition-colors ${
                        confidence >= level 
                          ? 'text-yellow-400 hover:text-yellow-500' 
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Very confident</span>
              </div>
            </div>

            <Separator />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={quizState.currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-muted-foreground">
                {quizState.answers.filter(a => a.isAnswered).length} of {totalQuestions} answered
              </div>

              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Complete Quiz
                    <Trophy className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Navigation Grid */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Question Overview</CardTitle>
            <CardDescription>
              Click on any question to jump to it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((_, index) => {
                const isAnswered = quizState.answers[index]?.isAnswered
                const isCurrent = index === quizState.currentQuestionIndex
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      updateQuestionTime()
                      setQuizState(prev => ({
                        ...prev,
                        currentQuestionIndex: index,
                        questionStartTime: Date.now()
                      }))
                    }}
                    className={`
                      aspect-square rounded-lg border-2 text-sm font-medium transition-all
                      ${isCurrent 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : isAnswered
                          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }
                    `}
                  >
                    {index + 1}
                    {isAnswered && !isCurrent && (
                      <CheckCircle className="h-3 w-3 mx-auto mt-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
