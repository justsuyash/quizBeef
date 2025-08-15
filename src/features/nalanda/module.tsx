import React from 'react'
import { Link } from 'wasp/client/router'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Grid3X3, BookOpen, HelpCircle, PlayCircle } from 'lucide-react'

export default function NalandaModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>()

  const tiles = [
    { id: 'concept', icon: BookOpen, title: 'Concept', desc: '60‑second overview' },
    { id: 'example', icon: Grid3X3, title: 'Example', desc: '1 practical example' },
    { id: 'check', icon: HelpCircle, title: 'Quick Check', desc: '1 question' },
    { id: 'quiz', icon: PlayCircle, title: 'Mini Quiz', desc: '3–5 questions' },
  ]

  return (
    <main className='w-full max-w-5xl mx-auto px-4 py-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Module {moduleId}</h1>
          <p className='text-sm text-muted-foreground'>Pick a tile to start</p>
        </div>
        <Button asChild variant='outline'>
          <Link to='/nalanda'>Back to Tree</Link>
        </Button>
      </div>

      <div className='grid gap-4 grid-cols-2 md:grid-cols-4'>
        {tiles.map(t => (
          <Card key={t.id} className='hover:shadow transition'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <t.icon className='h-5 w-5 text-primary' /> {t.title}
              </CardTitle>
              <CardDescription>{t.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size='sm' className='w-full' disabled>Open</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

