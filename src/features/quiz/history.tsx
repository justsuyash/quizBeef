import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { Link } from 'wasp/client/router'
import { getQuizHistory } from 'wasp/client/operations'
import { Header } from '../../components/layout/header'
import { Main } from '../../components/layout/main'
import { TopNav } from '../../components/layout/top-nav'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Search } from '../../components/search'
import { ThemeSwitch } from '../../components/theme-switch'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { History, Trophy, Clock, Target, PlayCircle, Calendar } from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Quiz History', href: '/quiz-history', isActive: true },
]

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
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
              <History className="h-8 w-8" />
              Quiz History
            </h1>
            <p className='text-muted-foreground'>
              Review your past quiz attempts and track your learning progress
            </p>
          </div>
          <Button asChild>
            <Link to='/documents'>
              <Target className='h-4 w-4 mr-2' />
              Take New Quiz
            </Link>
          </Button>
        </div>

        {isLoading && <QuizHistoryLoading />}
        
        {error && (
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center text-destructive'>
                Failed to load quiz history: {error.message}
              </div>
            </CardContent>
          </Card>
        )}

        {quizHistory && quizHistory.length === 0 && <EmptyState />}

        {quizHistory && quizHistory.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quizHistory.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / quizHistory.length)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {quizHistory.reduce((sum, quiz) => sum + quiz.totalQuestions, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(quizHistory.reduce((sum, quiz) => sum + quiz.timeSpent, 0) / 60)}m
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quiz History List */}
            <div className='grid gap-6'>
              {quizHistory.map((quiz) => (
                <QuizHistoryCard key={quiz.id} quiz={quiz} getGradeColor={getGradeColor} formatTimeSpent={formatTimeSpent} />
              ))}
            </div>
          </>
        )}
      </Main>
    </>
  )
}

function QuizHistoryCard({ 
  quiz, 
  getGradeColor, 
  formatTimeSpent 
}: { 
  quiz: any
  getGradeColor: (grade: string) => string
  formatTimeSpent: (seconds: number) => string
}) {
  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <CardTitle className='text-lg leading-tight'>{quiz.documentTitle}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className='h-3 w-3' />
              {new Date(quiz.completedAt).toLocaleDateString()} at {new Date(quiz.completedAt).toLocaleTimeString()}
            </CardDescription>
          </div>
          <Badge className={getGradeColor(quiz.grade)} variant='secondary'>
            Grade {quiz.grade}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
          <div className='flex items-center gap-2'>
            <Target className='h-4 w-4 text-muted-foreground' />
            <span>{Math.round(quiz.score)}% Score</span>
          </div>
          <div className='flex items-center gap-2'>
            <Trophy className='h-4 w-4 text-muted-foreground' />
            <span>{quiz.correctAnswers}/{quiz.totalQuestions} Correct</span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <span>{formatTimeSpent(quiz.timeSpent)}</span>
          </div>
          <div className='flex items-center gap-2'>
            <History className='h-4 w-4 text-muted-foreground' />
            <span>{quiz.questionCount} Questions</span>
          </div>
        </div>

        <div className='flex gap-2 pt-2'>
          <Button 
            size='sm' 
            variant='outline' 
            className='flex-1'
            onClick={() => {
              alert('Quiz review feature coming soon!');
            }}
          >
            <History className='h-4 w-4 mr-2' />
            Review Answers
          </Button>
          <Button 
            size='sm' 
            className='flex-1'
            onClick={() => {
              alert('Quiz retake feature coming soon!');
            }}
          >
            <PlayCircle className='h-4 w-4 mr-2' />
            Retake Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className='text-center py-12'>
      <div className='max-w-md mx-auto'>
        <div className='mb-6'>
          <History className='h-16 w-16 mx-auto text-muted-foreground' />
        </div>
        <h3 className='text-xl font-semibold mb-2'>No quiz history yet</h3>
        <p className='text-muted-foreground mb-6'>
          Start taking quizzes to track your learning progress and see your improvement over time.
        </p>
        <Button asChild>
          <Link to='/documents'>
            <Target className='h-4 w-4 mr-2' />
            Take Your First Quiz
          </Link>
        </Button>
      </div>
    </div>
  )
}

function QuizHistoryLoading() {
  return (
    <div className='space-y-6'>
      {/* Stats Loading */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiz Cards Loading */}
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <Skeleton className='h-6 w-full max-w-md' />
                <Skeleton className='h-4 w-32 mt-2' />
              </div>
              <Skeleton className='h-6 w-16' />
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              {[...Array(4)].map((_, j) => (
                <div key={j} className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-16' />
                </div>
              ))}
            </div>
            <div className='flex gap-2 pt-2'>
              <Skeleton className='h-8 flex-1' />
              <Skeleton className='h-8 flex-1' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
