import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
import { getMyDocuments, generateQuiz } from 'wasp/client/operations'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { FileText, Clock, Upload, PlayCircle, BarChart3, Calendar, Brain, Loader2, Flame } from 'lucide-react'
import { toast } from '../../hooks/use-toast'

export default function DocumentsPage() {
  const { data: user, isLoading: authLoading } = useAuth()
  const { data: documents, isLoading, error } = useQuery(getMyDocuments, undefined, {
    enabled: !!user // Only fetch documents if user is authenticated
  })

  // Show loading while checking auth
  if (authLoading) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex items-center justify-center min-h-96">Loading...</div>
      </main>
    )
  }

  // Show welcome message if not authenticated
  if (!user) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Document Library</h1>
            <p className="text-muted-foreground">Upload and manage your study materials</p>
          </div>
          
          <Card className="p-8 text-center">
            <CardContent className="space-y-4">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-bold">Welcome to Your Library</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Sign in to upload documents, generate quizzes, and track your learning progress.
              </p>
              <div className="space-x-4 pt-4">
                <Link to="/login">
                  <Button>Sign In</Button>
                </Link>
                <Link to="/sign-up">
                  <Button variant="outline">Create Account</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
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
        <DocumentsList documents={documents} />
      )}
    </main>
  )
}

// Loading component
function DocumentsLoading() {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-3 w-1/2' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-20 w-full' />
            <div className='mt-4 flex justify-between'>
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-8 w-20' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Empty state component
function EmptyState() {
  return (
    <Card className='p-12 text-center'>
      <CardContent className='space-y-6'>
        <FileText className='w-24 h-24 mx-auto text-muted-foreground' />
        <div className='space-y-2'>
          <h2 className='text-2xl font-bold'>No documents yet</h2>
          <p className='text-muted-foreground max-w-md mx-auto'>
            Upload your first document to start generating AI-powered quizzes and track your learning progress.
          </p>
        </div>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button asChild size='lg'>
            <Link to='/upload'>
              <Upload className='h-5 w-5 mr-2' />
              Upload Your First Document
            </Link>
          </Button>
          <Button variant='outline' size='lg' asChild>
            <Link to='/library'>
              <Brain className='h-5 w-5 mr-2' />
              Explore AI Library
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Documents list component
function DocumentsList({ documents }: { documents: any[] }) {
  const [generatingQuiz, setGeneratingQuiz] = useState<number | null>(null)
  const generateQuizAction = useAction(generateQuiz)
  const queryClient = useQueryClient()

  const handleGenerateQuiz = async (documentId: number) => {
    setGeneratingQuiz(documentId)
    try {
      await generateQuizAction({ documentId })
      toast({
        title: "Quiz Generated! 🎉",
        description: "Your quiz is ready. Check the Quiz History to start playing.",
      })
      queryClient.invalidateQueries(['quizzes'])
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingQuiz(null)
    }
  }

  return (
    <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
      {documents.map((doc) => (
        <Card key={doc.id} className='hover:shadow-md transition-shadow'>
          <CardHeader className='pb-3'>
            <div className='flex items-start justify-between'>
              <div className='flex-1 min-w-0'>
                <CardTitle className='text-lg line-clamp-2 mb-1'>
                  {doc.title}
                </CardTitle>
                <CardDescription className='flex items-center text-sm'>
                  <FileText className='h-4 w-4 mr-1' />
                  {doc.type?.toUpperCase() || 'DOCUMENT'}
                </CardDescription>
              </div>
              <Badge variant='secondary' className='ml-2 text-xs'>
                {doc.pages || '1'} pages
              </Badge>
            </div>
          </CardHeader>

          <CardContent className='space-y-4'>
            {/* Content Preview */}
            {doc.content && (
              <div className='bg-muted/50 p-3 rounded-md'>
                <p className='text-sm text-muted-foreground line-clamp-3'>
                  {doc.content.slice(0, 150)}...
                </p>
              </div>
            )}

            {/* Stats Row */}
            <div className='flex justify-between items-center text-sm text-muted-foreground'>
              <div className='flex items-center'>
                <Clock className='h-4 w-4 mr-1' />
                {new Date(doc.createdAt).toLocaleDateString()}
              </div>
              <div className='flex items-center'>
                <BarChart3 className='h-4 w-4 mr-1' />
                {doc.quizzes?.length || 0} quizzes
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2'>
              <Button
                onClick={() => handleGenerateQuiz(doc.id)}
                disabled={generatingQuiz === doc.id}
                className='flex-1'
              >
                {generatingQuiz === doc.id ? (
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

              {doc.quizzes && doc.quizzes.length > 0 && (
                <Button variant='outline' size='sm' asChild>
                  <Link to="/quiz-history">
                    <PlayCircle className='h-4 w-4' />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}