import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getQuizHistory } from 'wasp/client/operations'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Calendar } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../components/ui/sheet'

export default function QuizHistoryTable() {
  const [page, setPage] = React.useState(1)
  const [range, setRange] = React.useState<number | null>(30)
  const [mode, setMode] = React.useState<'ALL'|'PRACTICE'|'TEST_MODE'|'SPEED_ROUND'|'RAPID_FIRE'|'FLASHCARD_FRENZY'|'TIME_ATTACK'>('ALL')
  const pageSize = 20
  const { data, isLoading, error } = useQuery(getQuizHistory, { page, pageSize, rangeDays: range, mode })
  const [items, setItems] = React.useState<any[]>([])
  const [total, setTotal] = React.useState(0)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  // Side drawer removed per design decision (all info visible in table / results page)

  // Reset on filter change
  React.useEffect(() => {
    setItems([])
    setTotal(0)
    setPage(1)
  }, [range, mode])

  // Append newly fetched data
  React.useEffect(() => {
    if (data?.items) {
      setItems(prev => page === 1 ? data.items : [...prev, ...data.items])
      setTotal(data.total || 0)
    }
  }, [data, page])

  // Infinite scroll observer
  React.useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting && !isLoading) {
        if (items.length < total) setPage(p => p + 1)
      }
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [items.length, total, isLoading])

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Quiz History</CardTitle>
        <CardDescription>Your recent completed quizzes</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className='grid gap-4 md:grid-cols-3 mb-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-blue-500' /> Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex gap-2'>
                <Button variant={range===30?'default':'outline'} size='sm' onClick={()=>{setPage(1);setRange(30)}}>Past 30 days</Button>
                <Button variant={range===null?'default':'outline'} size='sm' onClick={()=>{setPage(1);setRange(null)}}>All</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Mode</CardTitle>
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

        {error ? (
          <div className='text-center text-destructive py-8'>Failed to load quiz history.</div>
        ) : isLoading ? (
          <div className='text-center text-muted-foreground py-8'>Loading…</div>
        ) : (
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
                {(items || []).map((row: any) => (
                  <TableRow key={row.id} className='hover:bg-muted/50'>
                    <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className='truncate max-w-[280px]'>{row.documentTitle}</TableCell>
                    <TableCell>{row.mode || row.quizMode}</TableCell>
                    <TableCell className='text-right font-medium'>{Math.round(row.score)}%</TableCell>
                    <TableCell className='text-right'>{row.correctAnswers}/{row.totalQuestions}</TableCell>
                    <TableCell className='text-right'>{row.timeSpent ?? '-'}</TableCell>
                    <TableCell className='text-right space-x-2 whitespace-nowrap'>
                      <Button variant='outline' size='sm' onClick={() => (window.location.href = `/quiz/${row.id}/results`)}>Review</Button>
                      <Button size='sm' onClick={() => (window.location.href = `/quiz/${row.documentId}/take`)}>Retake</Button>
                      
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div ref={bottomRef} className='h-10' />
            {items.length >= total && (
              <div className='text-center text-muted-foreground py-4'>No more results</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    
    </>
  )
}


