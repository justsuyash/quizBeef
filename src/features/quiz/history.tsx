import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { Link } from 'wasp/client/router'
import { getQuizHistory } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { History, PlayCircle, Calendar } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

export default function QuizHistoryPage() {
  const [page, setPage] = React.useState(1)
  const [range, setRange] = React.useState<number | null>(30)
  const [mode, setMode] = React.useState<'ALL'|'PRACTICE'|'TEST_MODE'|'SPEED_ROUND'|'RAPID_FIRE'|'FLASHCARD_FRENZY'|'TIME_ATTACK'>('ALL')
  const { data, isLoading, error } = useQuery(getQuizHistory, { page, pageSize: 10, rangeDays: range, mode })

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
        <div className='space-y-4'>
          <Skeleton className='h-10 w-64' />
          <Skeleton className='h-64 w-full' />
        </div>
      ) : error ? (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center text-destructive'>
              Failed to load quiz history: {error?.message || 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      ) : !data || data.total === 0 ? (
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
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {/* Filters */}
          <div className='grid gap-4 md:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5 text-blue-500' />
                  Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex gap-2'>
                  {[7,30,90].map((d)=> (
                    <Button key={d} variant={range===d?'default':'outline'} size='sm' onClick={()=>{setPage(1);setRange(d)}}>{d}d</Button>
                  ))}
                  <Button variant={range===null?'default':'outline'} size='sm' onClick={()=>{setPage(1);setRange(null)}}>All</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={mode} onValueChange={(v:any)=>{setPage(1);setMode(v)}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>All</SelectItem>
                    <SelectItem value='PRACTICE'>Practice</SelectItem>
                    <SelectItem value='TEST_MODE'>Test Mode</SelectItem>
                    <SelectItem value='SPEED_ROUND'>Speed Round</SelectItem>
                    <SelectItem value='RAPID_FIRE'>Rapid Fire</SelectItem>
                    <SelectItem value='FLASHCARD_FRENZY'>Flashcard Frenzy</SelectItem>
                    <SelectItem value='TIME_ATTACK'>Time Attack</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Your recent completed quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='w-full overflow-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className='text-right'>Score</TableHead>
                      <TableHead className='text-right'>Questions</TableHead>
                      <TableHead className='text-right'>Time</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.items || []).map((row: any) => (
                      <TableRow key={row.id} className='hover:bg-muted/50'>
                        <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className='truncate max-w-[280px]'>{row.documentTitle}</TableCell>
                        <TableCell>{row.mode}</TableCell>
                        <TableCell className='text-right font-medium'>{Math.round(row.score)}%</TableCell>
                        <TableCell className='text-right'>{row.correctAnswers}/{row.totalQuestions}</TableCell>
                        <TableCell className='text-right'>{formatTimeSpent(row.timeSpent)}</TableCell>
                        <TableCell className='text-right space-x-2 whitespace-nowrap'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              const q = new URLSearchParams({ range: String(range ?? ''), mode, page: String(page) })
                              const ret = `/quiz-history?${q.toString()}`
                              window.location.href = `/quiz/${row.id}/results?return=${encodeURIComponent(ret)}`
                            }}
                          >
                            Review
                          </Button>
                          <Button size='sm' onClick={() => (window.location.href = `/quiz/${row.documentId}/take`)}>Retake</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination */}
                <div className='flex items-center justify-between mt-4'>
                  <div className='text-sm text-muted-foreground'>Page {data.page} of {Math.max(1, Math.ceil(data.total / data.pageSize))}</div>
                  <div className='flex gap-2'>
                    <Button variant='outline' size='sm' disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
                    <Button variant='outline' size='sm' disabled={data.page * data.pageSize >= data.total} onClick={()=>setPage(p=>p+1)}>Next</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}