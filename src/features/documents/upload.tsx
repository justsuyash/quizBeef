import React, { useState, useEffect } from 'react'
import { useAction } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
import { processContent } from 'wasp/client/operations'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { toast } from '../../hooks/use-toast'
import { Upload, FileText, Youtube, Globe, Type, Edit2, Check, X, Sparkles, RefreshCw, Wand2 } from 'lucide-react'
import { AITitlePreview } from './components/ai-title-preview'



export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showTitlePreview, setShowTitlePreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    generatedTitle: string
    sourceType: string
    content: string
    originalTitle?: string
  } | null>(null)
  
  const { data: user, isLoading } = useAuth()
  const processContentFn = useAction(processContent)

  const generateAITitle = async (content: string, sourceType: string): Promise<string> => {
    // This is a simple client-side title generation for preview
    // In a real implementation, you might want a separate API endpoint
    const contentPreview = content.slice(0, 500).trim()
    
    // Simple heuristic-based title generation for immediate feedback
    if (!contentPreview) {
      return `${sourceType} Document`
    }

    // Look for key terms and create a title
    const sentences = contentPreview.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim()
    
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 100) {
      return firstSentence.length > 50 
        ? firstSentence.substring(0, 47) + '...'
        : firstSentence
    }
    
    // Extract key words for title
    const words = contentPreview.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const commonWords = new Set(['this', 'that', 'with', 'have', 'they', 'will', 'been', 'from', 'were', 'said', 'each', 'which', 'their', 'time', 'about'])
    const keyWords = words.filter(word => !commonWords.has(word)).slice(0, 4)
    
    if (keyWords.length > 0) {
      return keyWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }
    
    return `${sourceType} Document - ${new Date().toLocaleDateString()}`
  }

  // Show loading while checking auth
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Show welcome message if not authenticated
  if (!user) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex-1">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Upload Content</h1>
              <p className="text-muted-foreground">Transform your study materials into interactive quizzes</p>
            </div>
            
            <Card className="p-8 text-center">
              <CardContent className="space-y-4">
                <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                <h2 className="text-2xl font-bold">Start Uploading</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Sign in to upload PDFs, YouTube videos, web articles, or paste text directly to generate AI-powered quizzes.
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
        </div>
      </main>
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

  const handleTextSubmit = async (text: string, title?: string) => {
    if (!text.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter some text content',
        variant: 'destructive',
      })
      return
    }

    // If title is provided, process directly (skip preview)
    if (title) {
      await processDocument('TEXT_INPUT', text.trim(), title)
      return
    }

    // Generate AI title and show preview
    setIsUploading(true)
    try {
      const generatedTitle = await generateAITitle(text.trim(), 'Text Input')
      setPreviewData({
        generatedTitle,
        sourceType: 'TEXT_INPUT',
        content: text.trim()
      })
      setShowTitlePreview(true)
    } catch (error) {
      console.error('Title generation error:', error)
      // Fallback to direct processing
      await processDocument('TEXT_INPUT', text.trim(), 'Text Content')
    } finally {
      setIsUploading(false)
    }
  }

  const processDocument = async (sourceType: string, content: string, title: string) => {
    setIsUploading(true)
    try {
      const result = await processContentFn({
        sourceType: sourceType as any,
        content,
        title,
      })

      toast({
        title: 'Success!',
        description: `Document processed successfully. ${result.wordCount} words extracted.`,
      })

      // Reset states
      setShowTitlePreview(false)
      setPreviewData(null)
      
    } catch (error) {
      console.error('Processing error:', error)
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Failed to process content',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleTitleConfirm = (finalTitle: string) => {
    if (previewData) {
      processDocument(previewData.sourceType, previewData.content, finalTitle)
    }
  }

  const handleTitleCancel = () => {
    setShowTitlePreview(false)
    setPreviewData(null)
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

  // Show AI title preview if active
  if (showTitlePreview && previewData) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Review Generated Title</h1>
          <p className="text-muted-foreground">
            AI has analyzed your content and generated a title. You can edit it or proceed.
          </p>
        </div>
        
        <AITitlePreview
          generatedTitle={previewData.generatedTitle}
          sourceType={previewData.sourceType}
          onConfirm={handleTitleConfirm}
          onCancel={handleTitleCancel}
          isProcessing={isUploading}
        />
      </main>
    )
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
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
    </main>
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

// Text Input Component with Enhanced Title System
function TextInputCard({ 
  onTextSubmit, 
  isUploading 
}: {
  onTextSubmit: (text: string, title?: string) => void
  isUploading: boolean
}) {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false)
  const [showTitleSection, setShowTitleSection] = useState(false)
  const [hasGeneratedTitles, setHasGeneratedTitles] = useState(false)

  const generateMultipleAITitles = async (content: string): Promise<string[]> => {
    const contentPreview = content.slice(0, 500).trim()
    
    if (!contentPreview) {
      return ['Text Document', 'My Document', 'Study Material']
    }

    const titles: string[] = []
    
    // Strategy 1: First meaningful sentence
    const sentences = contentPreview.split(/[.!?]+/)
    const firstSentence = sentences[0]?.trim()
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 80) {
      titles.push(firstSentence.length > 50 
        ? firstSentence.substring(0, 47) + '...'
        : firstSentence)
    }
    
    // Strategy 2: Key terms combination
    const words = contentPreview.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
    const commonWords = new Set(['this', 'that', 'with', 'have', 'they', 'will', 'been', 'from', 'were', 'said', 'each', 'which', 'their', 'time', 'about', 'when', 'what', 'where', 'would', 'could', 'should'])
    const keyWords = words.filter(word => !commonWords.has(word))
    
    if (keyWords.length >= 2) {
      // Different combinations of key words
      titles.push(keyWords.slice(0, 3).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
      titles.push(keyWords.slice(0, 2).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Guide')
      titles.push('Introduction to ' + keyWords.slice(0, 2).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
    }
    
    // Strategy 3: Topic-based titles
    const topicWords = ['tutorial', 'guide', 'introduction', 'overview', 'basics', 'fundamentals', 'principles', 'theory', 'practice', 'advanced', 'beginner']
    const foundTopics = topicWords.filter(topic => contentPreview.toLowerCase().includes(topic))
    if (foundTopics.length > 0 && keyWords.length > 0) {
      titles.push(`${keyWords[0].charAt(0).toUpperCase() + keyWords[0].slice(1)} ${foundTopics[0].charAt(0).toUpperCase() + foundTopics[0].slice(1)}`)
    }
    
    // Strategy 4: Subject detection
    const subjects = ['math', 'science', 'history', 'english', 'physics', 'chemistry', 'biology', 'literature', 'programming', 'computer', 'algebra', 'geometry', 'calculus']
    const foundSubjects = subjects.filter(subject => contentPreview.toLowerCase().includes(subject))
    if (foundSubjects.length > 0) {
      titles.push(`${foundSubjects[0].charAt(0).toUpperCase() + foundSubjects[0].slice(1)} Study Material`)
      titles.push(`${foundSubjects[0].charAt(0).toUpperCase() + foundSubjects[0].slice(1)} Notes`)
    }
    
    // Fallback titles
    if (titles.length === 0) {
      titles.push('Study Material', 'Course Notes', 'Learning Guide')
    }
    
    // Remove duplicates and limit to 5 suggestions
    const uniqueTitles = [...new Set(titles)].slice(0, 5)
    
    // Ensure we always have at least 3 suggestions
    while (uniqueTitles.length < 3) {
      uniqueTitles.push(`Document ${uniqueTitles.length + 1}`)
    }
    
    return uniqueTitles
  }

  const handleGenerateTitles = async () => {
    if (text.length < 50) return
    
    setIsGeneratingTitles(true)
    try {
      const suggestions = await generateMultipleAITitles(text.trim())
      setTitleSuggestions(suggestions)
      setCurrentSuggestionIndex(0)
      
      // Auto-fill title if empty
      if (!title.trim()) {
        setTitle(suggestions[0])
      }
      
      setShowTitleSection(true)
      setHasGeneratedTitles(true)
    } catch (error) {
      console.error('Title generation error:', error)
      const fallbackSuggestions = ['Text Document', 'Study Material', 'Course Notes']
      setTitleSuggestions(fallbackSuggestions)
      setCurrentSuggestionIndex(0)
      
      if (!title.trim()) {
        setTitle(fallbackSuggestions[0])
      }
      
      setShowTitleSection(true)
      setHasGeneratedTitles(true)
    } finally {
      setIsGeneratingTitles(false)
    }
  }

  const handleCycleTitles = () => {
    if (titleSuggestions.length === 0) return
    
    const nextIndex = (currentSuggestionIndex + 1) % titleSuggestions.length
    setCurrentSuggestionIndex(nextIndex)
    setTitle(titleSuggestions[nextIndex])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: 'Title Required',
        description: 'Please enter a title or generate AI suggestions',
        variant: 'destructive',
      })
      return
    }
    
    onTextSubmit(text, title.trim())
    
    // Reset form
    setText('')
    setTitle('')
    setTitleSuggestions([])
    setCurrentSuggestionIndex(0)
    setShowTitleSection(false)
    setHasGeneratedTitles(false)
  }

  // Auto-show title section when user starts typing
  useEffect(() => {
    if (text.length > 0 && !showTitleSection) {
      setShowTitleSection(true)
    }
  }, [text.length, showTitleSection])

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Type className='h-5 w-5' />
          Direct Text Input
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {/* Document Title - Always at Top */}
          <div className='space-y-3'>
            <Label htmlFor='title' className='text-sm font-medium'>
              Document Title
            </Label>
            
            {/* Modern Title Input with Pencil */}
            <div className='relative group'>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={showTitleSection ? 'Enter document title or use AI suggestions...' : 'Enter document title...'}
                disabled={isUploading}
                className='w-full text-lg font-medium bg-transparent border-0 border-b-2 border-muted-foreground/20 focus:border-primary focus:outline-none transition-colors pb-2 pr-10 focus-visible:ring-0'
              />
              <Edit2 className='absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors' />
            </div>
          </div>

          {/* Content Section */}
          <div className='space-y-2'>
            <Label htmlFor='content'>Content</Label>
            <Textarea
              id='content'
              placeholder='Paste your text content here... AI will help generate a title once you have 50+ characters'
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

          {/* Action Buttons - Always Visible */}
          <div className='flex items-center gap-3'>
            {/* Create Document Button */}
            <Button 
              onClick={handleSubmit}
              disabled={isUploading || !title.trim() || text.length < 50}
              className='flex-1'
            >
              {isUploading ? (
                <>
                  <Upload className='h-4 w-4 mr-2 animate-pulse' />
                  Processing Document...
                </>
              ) : (
                <>
                  <Upload className='h-4 w-4 mr-2' />
                  Create Document
                </>
              )}
            </Button>

            {/* Circular AI Button */}
            {!hasGeneratedTitles ? (
              <Button 
                onClick={handleGenerateTitles}
                disabled={isGeneratingTitles || text.length < 50}
                variant="outline"
                size="icon"
                className='rounded-full h-10 w-10 flex-shrink-0'
                title="Generate AI title suggestions"
              >
                {isGeneratingTitles ? (
                  <Sparkles className='h-4 w-4 animate-spin' />
                ) : (
                  <Sparkles className='h-4 w-4' />
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleCycleTitles}
                disabled={isUploading || titleSuggestions.length === 0}
                variant="outline"
                size="icon"
                className='rounded-full h-10 w-10 flex-shrink-0'
                title="Cycle through AI suggestions"
              >
                <RefreshCw className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
