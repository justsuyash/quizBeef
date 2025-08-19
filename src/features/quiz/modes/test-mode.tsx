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
  FileText, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Flag
} from 'lucide-react'

interface QuizAnswer {
  questionId: number
  selectedAnswerId: number | null
  timeSpent: number
  isAnswered: boolean
}

interface TestModeState {
  currentQuestionIndex: number
  answers: QuizAnswer[]
  startTime: number
  questionStartTime: number
  isCompleted: boolean
}

export default function TestModePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const urlParams = new URLSearchParams(location.search)
  const attemptId = urlParams.get('attemptId')
  
  // Get document ID from location state or URL params
  const documentId = location.state?.documentId || urlParams.get('documentId')

  const [state, setState] = useState<TestModeState>({
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    questionStartTime: Date.now(),
    isCompleted: false
  })

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)

  // Fetch quiz data
  const { data: quizData, isLoading, error } = useQuery(
    getQuizAttempt,
    { quizAttemptId: parseInt(attemptId || '0') },
    { enabled: !!attemptId }
  )

  const submitAnswerAction = useAction(submitQuizAnswer)
  const completeQuizAction = useAction(completeQuiz)

  // Initialize answers array when quiz data loads
  useEffect(() => {
    if (quizData?.questions && state.answers.length === 0) {
      const initialAnswers: QuizAnswer[] = quizData.questions.map(q => ({
        questionId: q.id,
        selectedAnswerId: null,
        timeSpent: 0,
        isAnswered: false
      }))
      setState(prev => ({ ...prev, answers: initialAnswers }))
    }
  }, [quizData, state.answers.length])

  // Update question start time when question changes
  useEffect(() => {
    setState(prev => ({ ...prev, questionStartTime: Date.now() }))
    setSelectedAnswer(null)
  }, [state.currentQuestionIndex])

  // Load previously selected answer when navigating between questions
  useEffect(() => {
    if (state.answers.length > 0) {
      const currentAnswer = state.answers[state.currentQuestionIndex]
      setSelectedAnswer(currentAnswer?.selectedAnswerId || null)
    }
  }, [state.currentQuestionIndex, state.answers])

  const currentQuestion = quizData?.questions?.[state.currentQuestionIndex]
  const totalQuestions = quizData?.questions?.length || 0
  const progress = totalQuestions > 0 ? ((state.currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  const handleAnswerSelect = (answerId: number) => {
    setSelectedAnswer(answerId)
  }

  const handleNext = useCallback(async () => {
    if (!currentQuestion || selectedAnswer === null) return

    const timeSpent = Math.round((Date.now() - state.questionStartTime) / 1000)

    // Update the answer in our state (but don't submit to server yet)
    const updatedAnswers = [...state.answers]
    updatedAnswers[state.currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedAnswerId: selectedAnswer,
      timeSpent,
      isAnswered: true
    }

    setState(prev => ({ ...prev, answers: updatedAnswers }))

    // Move to next question or finish
    if (state.currentQuestionIndex < totalQuestions - 1) {
      setState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        answers: updatedAnswers
      }))
    } else {
      // Quiz completed - now submit all answers and complete
      await handleCompleteQuiz(updatedAnswers)
    }
  }, [currentQuestion, selectedAnswer, state.questionStartTime, state.currentQuestionIndex, totalQuestions, state.answers])

  const handlePrevious = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({ 
        ...prev, 
        currentQuestionIndex: prev.currentQuestionIndex - 1 
      }))
    }
  }

  const handleCompleteQuiz = async (finalAnswers: QuizAnswer[]) => {
    try {
      // Submit all answers to the server
      for (const answer of finalAnswers) {
        if (answer.isAnswered && answer.selectedAnswerId !== null) {
          await submitAnswerAction({
            quizAttemptId: parseInt(attemptId || '0'),
            questionId: answer.questionId,
            selectedAnswerId: answer.selectedAnswerId,
            timeSpent: answer.timeSpent
          })
        }
      }

      // Complete the quiz with test mode stats
      const totalTimeSpent = Math.round((Date.now() - state.startTime) / 1000)
      const answeredQuestions = finalAnswers.filter(a => a.isAnswered).length
      
      await completeQuizAction({
        quizAttemptId: parseInt(attemptId || '0'),
        totalTimeSpent: totalTimeSpent,
        gameplayStats: {
          testMode: true,
          questionsAnswered: answeredQuestions,
          totalQuestions: totalQuestions,
          completionRate: (answeredQuestions / totalQuestions) * 100
        }
      })

      // Navigate to test review page first (before results)
      navigate(`/quiz/${attemptId}/test-review`)

    } catch (error) {
      console.error('Error completing quiz:', error)
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      })
    }
  }



  const getAnsweredCount = () => {
    return state.answers.filter(a => a.isAnswered).length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Test...</h2>
        </div>
      </div>
    )
  }

  if (error || !quizData || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Error Loading Test</h2>
          <p className="text-muted-foreground">Unable to load test questions. Please try again.</p>
          <Button onClick={() => navigate('/play')}>Back to Play</Button>
        </div>
      </div>
    )
  }



  // Main test interface
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold">Test Mode</h1>
          </div>
          <p className="text-muted-foreground">{quizData.document?.title}</p>
          <Badge variant="secondary">
            Question {state.currentQuestionIndex + 1} of {totalQuestions}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQuestion.questionText}
            </CardTitle>
            {currentQuestion.difficulty && (
              <Badge variant="outline" className="w-fit">
                {currentQuestion.difficulty}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup 
              value={selectedAnswer?.toString() || ''} 
              onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            >
              {currentQuestion.answers.map((answer) => (
                <div key={answer.id} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={answer.id.toString()} id={answer.id.toString()} />
                  <Label 
                    htmlFor={answer.id.toString()} 
                    className="flex-1 cursor-pointer text-sm leading-relaxed"
                  >
                    {answer.answerText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={state.currentQuestionIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <Badge variant="outline">
              {getAnsweredCount()}/{totalQuestions} Answered
            </Badge>
          </div>

          {state.currentQuestionIndex === totalQuestions - 1 ? (
            <Button 
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="bg-green-600 hover:bg-green-700"
            >
              <Flag className="h-4 w-4 mr-2" />
              Finish Test
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={selectedAnswer === null}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Test Mode Info */}
        <div className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
          <p>📝 <strong>Test Mode:</strong> No instant feedback is provided. Review your answers before submitting.</p>
          <p>You can navigate between questions and change your answers until you submit the test.</p>
        </div>
      </div>
    </div>
  )
}
