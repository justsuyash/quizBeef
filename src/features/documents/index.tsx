import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
import { getMyDocuments, generateQuiz } from 'wasp/client/operations'
import { useQueryClient } from '@tanstack/react-query'
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
import { FileText, Clock, Upload, PlayCircle, BarChart3, Calendar, Brain, Loader2, Flame } from 'lucide-react'
import { toast } from '../../hooks/use-toast'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: true },
  { title: 'Upload', href: '/upload', isActive: false },
]

export default function DocumentsPage() {
  const { data: user, isLoading: authLoading } = useAuth()
  const { data: documents, isLoading, error } = useQuery(getMyDocuments, undefined, {
    enabled: !!user // Only fetch documents if user is authenticated
  })

  // Show loading while checking auth
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view your documents.</p>
          <div className="space-x-4">
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
            <Link to="/sign-up">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    )
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

        {isLoading ? (
          <DocumentsLoading />
        ) : error ? (
          <Card>
            <CardContent className='pt-6'>
              <div className='text-center text-destructive'>
                Failed to load documents: {error?.message || 'Unknown error'}
              </div>
            </CardContent>
          </Card>
        ) : !documents || documents.length === 0 ? (
          <EmptyState />
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {documents.map((document) => (
              <DocumentCard key={document?.id || Math.random()} document={document} />
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
  const queryClient = useQueryClient()

  // Safety check for document
  if (!document) {
    return (
      <Card className='hover:shadow-md transition-shadow'>
        <CardContent className='pt-6'>
          <div className='text-center text-muted-foreground'>
            Invalid document data
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'PDF': return <FileText className='h-4 w-4' />
      case 'YOUTUBE': return <PlayCircle className='h-4 w-4' />
      case 'WEB_ARTICLE': return <FileText className='h-4 w-4' />
      case 'TEXT_INPUT': return <FileText className='h-4 w-4' />
      default: return <FileText className='h-4 w-4' />
    }
  }

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'PDF': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'YOUTUBE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'WEB_ARTICLE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'TEXT_INPUT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
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
        
        // Invalidate and refetch the documents query to show updated question count
        await queryClient.invalidateQueries()
        // Force a hard refresh of this specific query
        window.location.reload()
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
            {getSourceTypeIcon(document.sourceType || 'PDF')}
            <Badge 
              className={getSourceTypeColor(document.sourceType || 'PDF')}
              variant='secondary'
            >
              {document.sourceType || 'PDF'}
            </Badge>
          </div>
          <div className='text-xs text-muted-foreground flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown date'}
          </div>
        </div>
        <CardTitle className='text-lg leading-tight'>{document.title || 'Untitled Document'}</CardTitle>
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
            <span>{document.questions?.length || 0} questions</span>
          </div>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-muted-foreground' />
            <span>Uploaded {document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Unknown'}</span>
          </div>
        </div>

        {document.sourceUrl && (
          <div className='text-xs text-muted-foreground truncate'>
            <span className='font-medium'>Source:</span> {document.sourceUrl}
          </div>
        )}

        <div className='flex gap-2 pt-2'>
          {(document.questions && document.questions.length > 0) ? (
            <>
              <Button 
                size='sm' 
                className='flex-1' 
                onClick={() => {
                  // Navigate to quiz settings page
                  window.location.href = `/quiz/${document.id}/settings`;
                }}
              >
                <PlayCircle className='h-4 w-4 mr-2' />
                Start Quiz
              </Button>
              <Button 
                size='sm' 
                variant='outline'
                onClick={() => {
                  // Navigate to create beef page
                  window.location.href = `/beef/create/${document.id}`;
                }}
              >
                <Flame className='h-4 w-4 mr-2 text-orange-500' />
                Start Beef
              </Button>
            </>
          ) : (
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
          )}
          <Button size='sm' variant='outline' className='flex-1' disabled>
            View Questions
          </Button>
        </div>
        
        {(document.questions && document.questions.length > 0) && (
          <div className='text-xs text-center text-muted-foreground'>
            ✅ {document.questions.length} questions ready for quiz
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
