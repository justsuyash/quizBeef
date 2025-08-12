/**
 * Quiz Beef Statistics Dashboard Component
 * Displays learning progress and competitive stats
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'

export function QuizStats() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {/* Questions Mastered */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Questions Mastered
          </CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'
          >
            <path d='M9 12l2 2 4-4' />
            <path d='M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z' />
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>1,247</div>
          <p className='text-xs text-muted-foreground'>
            +15.2% from last week
          </p>
        </CardContent>
      </Card>

      {/* Documents Uploaded */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Documents Uploaded
          </CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'
          >
            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
            <polyline points='14,2 14,8 20,8' />
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>23</div>
          <p className='text-xs text-muted-foreground'>
            +3 new this week
          </p>
        </CardContent>
      </Card>

      {/* Beef Wins */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Beef Victories 🔥
          </CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'
          >
            <path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6' />
            <path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18' />
            <path d='M4 22h16' />
            <path d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' />
            <path d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' />
            <path d='M18 2H6v7a6 6 0 0 0 12 0V2Z' />
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>87</div>
          <p className='text-xs text-muted-foreground'>
            12 win streak! 🔥
          </p>
        </CardContent>
      </Card>

      {/* Study Streak */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Study Streak
          </CardTitle>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            className='h-4 w-4 text-muted-foreground'
          >
            <path d='M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z' />
          </svg>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>28 days</div>
          <p className='text-xs text-muted-foreground'>
            Keep it up! 💪
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
