import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { Link } from 'wasp/client/router'
import { getMyDocuments, generateQuiz } from 'wasp/client/operations'
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
import { FileText, Clock, Upload, PlayCircle, BarChart3, Calendar, Brain, Loader2 } from 'lucide-react'
import { toast } from '../../hooks/use-toast'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: true },
  { title: 'Upload', href: '/upload', isActive: false },
]

export default function DocumentsPage() {
  const { data: documents, isLoading, error } = useQuery(getMyDocuments)

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
            <h1 className='text-3xl font-bold tracking-tight'>My Documents 📚</h1>
            <p className='text-muted-foreground'>
              Manage your uploaded content and track your learning progress
            </p>
          </div>
          <Button asChild>
            <Link to='/upload'>
              <Upload className='h-4 w-4 mr-2' />
              Upload Content
            </Link>
          </Button>
        </div>

        {isLoading && <DocumentsLoading />}
        
        {error && (
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center text-destructive'>
                Failed to load documents: {error.message}
              </div>
            </CardContent>
          </Card>
        )}

        {documents && documents.length === 0 && <EmptyState />}

        {documents && documents.length > 0 && (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </Main>
    </>
  )
}

function DocumentCard({ document }: { document: any }) {
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const generateQuizFn = useAction(generateQuiz)

  const sourceTypeIcon = {
    PDF: <FileText className='h-4 w-4' />,
    YOUTUBE: <PlayCircle className='h-4 w-4' />,
    WEB_ARTICLE: <FileText className='h-4 w-4' />,
    TEXT_INPUT: <FileText className='h-4 w-4' />,
  }

  const sourceTypeColor = {
    PDF: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    YOUTUBE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    WEB_ARTICLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    TEXT_INPUT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  }

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true)
    try {
      const result = await generateQuizFn({
        documentId: document.id,
        questionCount: 10,
        difficulty: 'MIXED'
      })

      if (result.success) {
        toast({
          title: result.isNewGeneration ? 'Quiz Generated!' : 'Quiz Ready!',
          description: `${result.questionCount} questions ${result.isNewGeneration ? 'generated' : 'available'} for "${document.title}"`,
        })
      }
    } catch (error) {
      console.error('Quiz generation error:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate quiz questions',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            {sourceTypeIcon[document.sourceType as keyof typeof sourceTypeIcon]}
            <Badge 
              className={sourceTypeColor[document.sourceType as keyof typeof sourceTypeColor]}
              variant='secondary'
            >
              {document.sourceType}
            </Badge>
          </div>
          <div className='text-xs text-muted-foreground flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {new Date(document.createdAt).toLocaleDateString()}
          </div>
        </div>
        <CardTitle className='text-lg leading-tight'>{document.title}</CardTitle>
      </CardHeader>
      
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div className='flex items-center gap-2'>
            <FileText className='h-4 w-4 text-muted-foreground' />
            <span>{document.wordCount || 0} words</span>
          </div>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <span>{document.estimatedReadTime || 0} min read</span>
          </div>
          <div className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
            <span>{document.quizCount || 0} quizzes</span>
          </div>
          <div className='flex items-center gap-2'>
            <PlayCircle className='h-4 w-4 text-muted-foreground' />
            <span>{document.questionCount || 0} questions</span>
          </div>
        </div>

        {document.sourceUrl && (
          <div className='text-xs text-muted-foreground truncate'>
            <span className='font-medium'>Source:</span> {document.sourceUrl}
          </div>
        )}

        <div className='flex gap-2 pt-2'>
          <Button 
            size='sm' 
            className='flex-1' 
            onClick={handleGenerateQuiz}
            disabled={isGeneratingQuiz}
          >
            {isGeneratingQuiz ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Generating...
              </>
            ) : (
              <>
                <Brain className='h-4 w-4 mr-2' />
                Generate Quiz
              </>
            )}
          </Button>
          <Button size='sm' variant='outline' className='flex-1' disabled>
            View Questions
          </Button>
        </div>
        
        {document.questionCount > 0 && (
          <div className='text-xs text-center text-muted-foreground'>
            ✅ {document.questionCount} questions ready for quiz
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className='text-center py-12'>
      <div className='max-w-md mx-auto'>
        <div className='mb-6'>
          <FileText className='h-16 w-16 mx-auto text-muted-foreground' />
        </div>
        <h3 className='text-xl font-semibold mb-2'>No documents yet</h3>
        <p className='text-muted-foreground mb-6'>
          Upload your first document to start creating quiz challenges and tracking your learning progress.
        </p>
        <Button asChild>
          <Link to='/upload'>
            <Upload className='h-4 w-4 mr-2' />
            Upload Your First Document
          </Link>
        </Button>
      </div>
    </div>
  )
}

function DocumentsLoading() {
  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-6 w-16' />
              </div>
              <Skeleton className='h-4 w-20' />
            </div>
            <Skeleton className='h-6 w-full' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
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
