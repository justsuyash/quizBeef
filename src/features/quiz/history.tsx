import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { Link } from 'wasp/client/router'
import { getQuizHistory } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { History, Trophy, Clock, Target, PlayCircle, Calendar } from 'lucide-react'

export default function QuizHistoryPage() {
  const { data: quizHistory, isLoading, error } = useQuery(getQuizHistory)

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'C': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'D': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'F': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatTimeSpent = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <History className='h-8 w-8 text-primary' />
          Quiz History 📊
        </h1>
        <p className='text-muted-foreground mt-2'>
          Track your learning progress and review your quiz performance
        </p>
      </div>

      {isLoading ? (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-3 w-1/2' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-20 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center text-destructive'>
              Failed to load quiz history: {error?.message || 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      ) : !quizHistory || quizHistory.length === 0 ? (
        <Card className='p-12 text-center'>
          <CardContent className='space-y-6'>
            <History className='w-24 h-24 mx-auto text-muted-foreground' />
            <div className='space-y-2'>
              <h2 className='text-2xl font-bold'>No quiz history yet</h2>
              <p className='text-muted-foreground max-w-md mx-auto'>
                Take your first quiz to start tracking your learning progress and performance.
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button asChild size='lg'>
                <Link to='/play'>
                  <PlayCircle className='h-5 w-5 mr-2' />
                  Start Your First Quiz
                </Link>
              </Button>
              <Button variant='outline' size='lg' asChild>
                <Link to='/documents'>
                  Upload Content
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {quizHistory.map((attempt) => (
            <Card key={attempt.id} className='hover:shadow-md transition-shadow'>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    <CardTitle className='text-lg line-clamp-2'>
                      {attempt.document?.title || 'Quiz Attempt'}
                    </CardTitle>
                    <CardDescription className='flex items-center text-sm mt-1'>
                      <Calendar className='h-4 w-4 mr-1' />
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getGradeColor(attempt.grade || 'N/A')}>
                    {attempt.grade || 'N/A'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                {/* Stats Grid */}
                <div className='grid grid-cols-2 gap-4 text-center'>
                  <div className='space-y-1'>
                    <div className='flex items-center justify-center text-sm text-muted-foreground'>
                      <Target className='h-4 w-4 mr-1' />
                      Score
                    </div>
                    <div className='text-2xl font-bold text-primary'>
                      {attempt.score}%
                    </div>
                  </div>
                  <div className='space-y-1'>
                    <div className='flex items-center justify-center text-sm text-muted-foreground'>
                      <Clock className='h-4 w-4 mr-1' />
                      Time
                    </div>
                    <div className='text-2xl font-bold'>
                      {formatTimeSpent(attempt.timeSpent || 0)}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Correct: {attempt.correctAnswers}</span>
                    <span>Total: {attempt.totalQuestions}</span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div 
                      className='bg-primary h-2 rounded-full transition-all duration-500'
                      style={{ width: `${attempt.score}%` }}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <Button asChild variant='outline' className='w-full'>
                  <Link to="/quiz-history">
                    <Trophy className='h-4 w-4 mr-2' />
                    View Results
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}