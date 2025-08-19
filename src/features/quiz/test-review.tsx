import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getQuizAttempt } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { Separator } from '../../components/ui/separator'
import { 
  Timer, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Send,
  FileText
} from 'lucide-react'

// Helper function to format time in MM:SS format
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Question Review Component that shows during timed review
function QuestionReview({ question, questionNumber }: { question: any, questionNumber: number }) {
  const userAnswer = question.userAnswer
  const correctAnswer = question.answers.find((a: any) => a.isCorrect)
  const selectedAnswer = question.answers.find((a: any) => a.id === userAnswer?.selectedAnswerId)
  const isCorrect = userAnswer?.isCorrect

  return (
    <Card className={`${isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Question {questionNumber}</span>
          <div className="flex items-center gap-2">
            <Badge variant={question.difficulty === 'EASY' ? 'secondary' : question.difficulty === 'MEDIUM' ? 'default' : 'destructive'}>
              {question.difficulty}
            </Badge>
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-medium">{question.questionText}</p>
        
        <div className="space-y-2">
          {question.answers.map((answer: any) => (
            <div 
              key={answer.id} 
              className={`p-3 rounded-lg border ${
                answer.isCorrect 
                  ? 'bg-green-100 border-green-300 text-green-800' 
                  : answer.id === userAnswer?.selectedAnswerId
                  ? 'bg-red-100 border-red-300 text-red-800'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  answer.isCorrect 
                    ? 'bg-green-500 border-green-500' 
                    : answer.id === userAnswer?.selectedAnswerId
                    ? 'bg-red-500 border-red-500'
                    : 'border-gray-400'
                }`} />
                <span className="text-sm font-medium">{answer.answerText}</span>
                {answer.isCorrect && <Badge variant="secondary" className="text-xs">Correct</Badge>}
                {answer.id === userAnswer?.selectedAnswerId && !answer.isCorrect && (
                  <Badge variant="destructive" className="text-xs">Your Answer</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {question.explanation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
            <p className="text-sm text-blue-700">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function TestReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  
  const [reviewState, setReviewState] = useState<'decision' | 'reviewing' | 'submitted'>('decision')
  const [timeLeft, setTimeLeft] = useState(0)
  const [isReviewActive, setIsReviewActive] = useState(false)

  const { data: quizData, isLoading, error } = useQuery(
    getQuizAttempt,
    { quizAttemptId: parseInt(attemptId || '0') },
    { enabled: !!attemptId }
  )

  const totalQuestions = quizData?.questions?.length || 0
  const reviewTimeLimit = totalQuestions * 6 // 6 seconds per question

  // Initialize timer when component loads
  useEffect(() => {
    setTimeLeft(reviewTimeLimit)
  }, [reviewTimeLimit])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isReviewActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            setIsReviewActive(false)
            return 0
          }
          return timeLeft - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isReviewActive, timeLeft])

  const startReview = () => {
    setReviewState('reviewing')
    setIsReviewActive(true)
  }

  const stopReview = () => {
    setIsReviewActive(false)
  }

  const submitTest = () => {
    setReviewState('submitted')
    // Navigate to results page
    navigate(`/quiz/${attemptId}/results`)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Test Review...</h2>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Error Loading Review</h2>
          <p className="text-muted-foreground">Unable to load test review. Please try again.</p>
          <Button onClick={() => navigate('/play')}>Back to Play</Button>
        </div>
      </div>
    )
  }

  // Decision Phase - Choose to Review or Submit
  if (reviewState === 'decision') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Test Complete! 🎉</h1>
            <p className="text-muted-foreground">{quizData.document?.title}</p>
            <Badge variant="secondary" className="text-sm">Test Mode</Badge>
          </div>

          {/* Review Decision Card */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Timer className="h-6 w-6 text-blue-500" />
                Review Your Answers?
              </CardTitle>
              <CardDescription>
                You can review your answers before submitting, but you'll have limited time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Review Info */}
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">
                  {formatTime(reviewTimeLimit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Review time available ({totalQuestions} questions × 6 seconds each)
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={startReview}
                  size="lg"
                  className="h-auto p-6 flex flex-col items-center gap-2"
                >
                  <Eye className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Review Answers</div>
                    <div className="text-xs opacity-80">See correct solutions with timer</div>
                  </div>
                </Button>

                <Button 
                  onClick={submitTest}
                  variant="outline"
                  size="lg"
                  className="h-auto p-6 flex flex-col items-center gap-2"
                >
                  <Send className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Submit Now</div>
                    <div className="text-xs opacity-80">Skip review and see results</div>
                  </div>
                </Button>
              </div>

              {/* Info */}
              <div className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                <p>📝 <strong>Test Mode:</strong> This simulates real exam conditions.</p>
                <p>You can review your answers, but once time expires or you submit, it's final.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Review Phase - Timed review of questions
  if (reviewState === 'reviewing') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Timed Review</h1>
            <p className="text-muted-foreground">Review your answers and see correct solutions</p>
          </div>

          {/* Timer and Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${timeLeft <= 30 ? 'text-red-500' : timeLeft <= 60 ? 'text-orange-500' : 'text-green-500'}`}>
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-muted-foreground">Time Left</div>
                  </div>
                  <Progress 
                    value={(timeLeft / reviewTimeLimit) * 100} 
                    className="w-48"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={stopReview}
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Stop Review
                  </Button>
                  <Button 
                    onClick={submitTest}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Review */}
          {timeLeft > 0 && isReviewActive ? (
            <div className="space-y-6">
              {quizData.questions.map((question: any, index: number) => (
                <QuestionReview 
                  key={question.id}
                  question={question}
                  questionNumber={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Timer className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Review Time Expired</h3>
              <p className="text-muted-foreground mb-4">Your review time has ended.</p>
              <Button onClick={submitTest} className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                Submit Test
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
