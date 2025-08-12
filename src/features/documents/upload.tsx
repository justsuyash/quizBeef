import React, { useState } from 'react'
import { useAction } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
import { processContent } from 'wasp/client/operations'
import { Header } from '../../components/layout/header'
import { Main } from '../../components/layout/main'
import { TopNav } from '../../components/layout/top-nav'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Search } from '../../components/search'
import { ThemeSwitch } from '../../components/theme-switch'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { toast } from '../../hooks/use-toast'
import { Upload, FileText, Youtube, Globe, Type } from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Upload', href: '/upload', isActive: true },
]

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  const { data: user, isLoading } = useAuth()
  const processContentFn = useAction(processContent)

  // Show loading while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to upload content.</p>
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

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('')
      const base64Content = btoa(binaryString)

      const result = await processContentFn({
        sourceType: 'PDF',
        content: base64Content,
        title: file.name.replace('.pdf', ''),
      })

      toast({
        title: 'Success!',
        description: `PDF processed successfully. ${result.wordCount} words extracted.`,
      })

      // Could navigate to the document or documents list
      // For now, just reset the form
      
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process PDF',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleTextSubmit = async (text: string, title: string) => {
    if (!text.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some text content',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const result = await processContentFn({
        sourceType: 'TEXT_INPUT',
        content: text.trim(),
        title: title || 'Text Content',
      })

      toast({
        title: 'Success!',
        description: `Text processed successfully. ${result.wordCount} words extracted.`,
      })
      
    } catch (error) {
      console.error('Text processing error:', error)
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process text',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
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
        <div className='mb-8'>
          <h1 className='text-3xl font-bold tracking-tight'>Upload Content 📚</h1>
          <p className='text-muted-foreground'>
            Transform any content into active recall challenges. Upload a PDF, paste a URL, or enter text directly.
          </p>
        </div>

        <div className='max-w-4xl mx-auto'>
          <Tabs defaultValue='pdf' className='space-y-6'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='pdf' className='flex items-center gap-2'>
                <FileText className='h-4 w-4' />
                PDF Upload
              </TabsTrigger>
              <TabsTrigger value='youtube' disabled>
                <Youtube className='h-4 w-4' />
                YouTube
              </TabsTrigger>
              <TabsTrigger value='web' disabled>
                <Globe className='h-4 w-4' />
                Web Article
              </TabsTrigger>
              <TabsTrigger value='text'>
                <Type className='h-4 w-4' />
                Text Input
              </TabsTrigger>
            </TabsList>

            <TabsContent value='pdf'>
              <PDFUploadCard 
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
                dragActive={dragActive}
                onDrag={handleDrag}
                onDrop={handleDrop}
              />
            </TabsContent>

            <TabsContent value='youtube'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Youtube className='h-5 w-5' />
                    YouTube Video Processing
                  </CardTitle>
                  <CardDescription>
                    Extract content from YouTube videos for quiz generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='text-center text-muted-foreground py-8'>
                    🚧 YouTube processing coming soon in Phase 2.2
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='web'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Globe className='h-5 w-5' />
                    Web Article Processing
                  </CardTitle>
                  <CardDescription>
                    Extract content from web articles and blog posts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='text-center text-muted-foreground py-8'>
                    🚧 Web article processing coming soon in Phase 2.2
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='text'>
              <TextInputCard onTextSubmit={handleTextSubmit} isUploading={isUploading} />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}

// PDF Upload Component
function PDFUploadCard({ 
  onFileUpload, 
  isUploading, 
  dragActive, 
  onDrag, 
  onDrop 
}: {
  onFileUpload: (file: File) => void
  isUploading: boolean
  dragActive: boolean
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileText className='h-5 w-5' />
          PDF Document Upload
        </CardTitle>
        <CardDescription>
          Upload a PDF document to extract content and generate quiz questions
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <Upload className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
          <div className='space-y-2'>
            <h3 className='text-lg font-medium'>Drop your PDF here</h3>
            <p className='text-sm text-muted-foreground'>
              or click to browse and select a file
            </p>
          </div>
          <Input
            type='file'
            accept='.pdf'
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileUpload(file)
            }}
            className='mt-4'
            disabled={isUploading}
          />
        </div>
        
        {isUploading && (
          <div className='text-center text-sm text-muted-foreground'>
            🔄 Processing PDF... This may take a few moments.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Text Input Component
function TextInputCard({ 
  onTextSubmit, 
  isUploading 
}: {
  onTextSubmit: (text: string, title: string) => void
  isUploading: boolean
}) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onTextSubmit(text, title)
    setText('')
    setTitle('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Type className='h-5 w-5' />
          Direct Text Input
        </CardTitle>
        <CardDescription>
          Paste or type content directly to generate quiz questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Title (optional)</Label>
            <Input
              id='title'
              placeholder='Give your content a title...'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>
          
          <div className='space-y-2'>
            <Label htmlFor='content'>Content</Label>
            <Textarea
              id='content'
              placeholder='Paste your text content here... (minimum 100 characters for meaningful quiz generation)'
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              disabled={isUploading}
              className='min-h-[200px]'
            />
            <div className='text-xs text-muted-foreground text-right'>
              {text.length} characters
            </div>
          </div>

          <Button 
            type='submit' 
            disabled={isUploading || text.length < 100}
            className='w-full'
          >
            {isUploading ? '🔄 Processing...' : '🚀 Process Content'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
