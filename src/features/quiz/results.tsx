import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { Link } from 'wasp/client/router'
import { getQuizAttempt } from 'wasp/client/operations'
import { Header } from '../../components/layout/header'
import { Main } from '../../components/layout/main'
import { TopNav } from '../../components/layout/top-nav'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Search } from '../../components/search'
import { ThemeSwitch } from '../../components/theme-switch'
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
  Brain
} from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Quiz History', href: '/quiz-history', isActive: false },
  { title: 'Results', href: '#', isActive: true },
]

export default function QuizResultsPage() {
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
    questions
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

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/quiz-history')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to History
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

            {/* Confidence Analysis */}
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
              <CardContent className="space-y-4">
                {confidenceAccuracy !== null ? (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {Math.round(confidenceAccuracy)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence Accuracy
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {confidenceAccuracy >= 70 
                        ? "Great! Your confidence levels aligned well with your actual performance."
                        : confidenceAccuracy >= 50
                        ? "Good! You're developing good intuition about your knowledge."
                        : "Consider calibrating your confidence levels with more practice."
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
          </div>

          {/* Question Review */}
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
      </Main>
    </>
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
