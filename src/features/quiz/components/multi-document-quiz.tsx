import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { useNavigate } from 'react-router-dom'
import { getMyDocuments, getSuggestedQuestionCount, generateQuizFromFolder, generateQuestionsForDocument, generateQuestionsForMultipleDocuments } from 'wasp/client/operations'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Checkbox } from '../../../components/ui/checkbox'
import { Badge } from '../../../components/ui/badge'
import { Slider } from '../../../components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useToast } from '../../../hooks/use-toast'
import { 
  Brain, 
  FileText, 
  PlayCircle, 
  Zap,
  Clock,
  Target,
  BookOpen,
  TrendingUp,
  Sparkles,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface DocumentData {
  id: number
  title: string
  questionCount: number
  wordCount?: number
  folderId?: number | null
}

interface FolderData {
  id: number
  name: string
  color?: string
  sampleQuestion?: string
  _count: {
    documents: number
  }
}

interface MultiDocumentQuizProps {
  folderId?: number
  folder?: FolderData
  trigger?: React.ReactNode
}

const quizModes = [
  { id: 'PRACTICE', name: 'Practice Mode', icon: BookOpen, description: 'No time pressure, learn at your pace' },
  { id: 'RAPID_FIRE', name: 'Rapid Fire', icon: Zap, description: 'Quick questions, test your speed' },
  { id: 'TIME_ATTACK', name: 'Time Attack', icon: Clock, description: 'Race against the clock' },
  { id: 'PRECISION', name: 'Precision Mode', icon: Target, description: 'Accuracy over speed' },
  { id: 'FLASHCARD_FRENZY', name: 'Flashcard Frenzy', icon: Brain, description: 'Confidence-based scoring' }
]

export function MultiDocumentQuiz({ folderId, folder, trigger }: MultiDocumentQuizProps) {
  const { data: documents } = useQuery(getMyDocuments)
  const getSuggestedCountFn = useAction(getSuggestedQuestionCount)
  const generateQuizFn = useAction(generateQuizFromFolder)
  const generateQuestionsFn = useAction(generateQuestionsForDocument)
  const generateMultipleQuestionsFn = useAction(generateQuestionsForMultipleDocuments)
  const { toast } = useToast()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState([10])
  const [quizMode, setQuizMode] = useState('PRACTICE')
  const [isGenerating, setIsGenerating] = useState(false)
  const [documentProgress, setDocumentProgress] = useState<Record<number, 'pending' | 'generating' | 'completed' | 'error'>>({})
  const [overallProgress, setOverallProgress] = useState(0)
  const [suggestions, setSuggestions] = useState<{
    suggested: number
    min: number
    max: number
    totalQuestions: number
  } | null>(null)

  // Filter documents by folder if specified
  const availableDocuments = React.useMemo(() => {
    if (!documents) return []
    
    return documents
      .filter(doc => {
        // If folderId is specified, only show documents in that folder
        if (folderId !== undefined) {
          return doc.folderId === folderId
        }
        // Otherwise show all documents with questions
        return doc.questionCount > 0
      })
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        questionCount: doc.questionCount,
        wordCount: doc.wordCount,
        folderId: doc.folderId
      }))
  }, [documents, folderId])

  React.useEffect(() => {
    if (selectedDocuments.length > 0) {
      getSuggestedCountFn({ documentIds: selectedDocuments })
        .then(result => {
          setSuggestions(result)
          setQuestionCount([result.suggested])
        })
        .catch(error => {
          console.error('Error getting suggestions:', error)
        })
    } else {
      setSuggestions(null)
    }
  }, [selectedDocuments])

  const handleDocumentToggle = async (documentId: number) => {
    const isCurrentlySelected = selectedDocuments.includes(documentId)
    
    if (isCurrentlySelected) {
      // Deselecting - remove from selection and stop generation if ongoing
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
      setDocumentProgress(prev => ({ ...prev, [documentId]: 'pending' }))
    } else {
      // Selecting - add to selection and start generation if needed
      setSelectedDocuments(prev => [...prev, documentId])
      
      const document = availableDocuments.find(doc => doc.id === documentId)
      if (document && document.questionCount === 0) {
        // Start generating questions automatically
        setDocumentProgress(prev => ({ ...prev, [documentId]: 'generating' }))
        
        try {
          const result = await generateQuestionsFn({ documentId })
          setDocumentProgress(prev => ({ ...prev, [documentId]: 'completed' }))
          
          // Update document data (simplified - in real app we'd refetch)
          setTimeout(() => {
            window.location.reload()
          }, 1000)
          
        } catch (error) {
          console.error('Error generating questions:', error)
          setDocumentProgress(prev => ({ ...prev, [documentId]: 'error' }))
          toast({
            title: 'Generation Failed',
            description: `Failed to generate questions for ${document.title}`,
            variant: 'destructive'
          })
        }
      } else {
        // Document already has questions
        setDocumentProgress(prev => ({ ...prev, [documentId]: 'completed' }))
      }
    }
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === availableDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(availableDocuments.map(doc => doc.id))
    }
  }



  const handleGenerateQuiz = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one document',
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateQuizFn({
        documentIds: selectedDocuments,
        folderId: folderId,
        questionCount: questionCount[0],
        quizMode: quizMode
      })

      toast({
        title: 'Quiz Generated!',
        description: `Created quiz with ${result.questionCount} questions`
      })

      // Navigate to the quiz
      navigate(`/quiz/${result.quizAttemptId}`)
      setIsOpen(false)
    } catch (error) {
      console.error('Error generating quiz:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate quiz. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Calculate overall progress
  React.useEffect(() => {
    if (selectedDocuments.length === 0) {
      setOverallProgress(0)
      return
    }
    
    const completed = selectedDocuments.filter(id => {
      const doc = availableDocuments.find(d => d.id === id)
      const progress = documentProgress[id]
      return progress === 'completed' || (doc && doc.questionCount > 0)
    })
    
    setOverallProgress((completed.length / selectedDocuments.length) * 100)
  }, [selectedDocuments, documentProgress, availableDocuments])

  const documentsWithQuestions = availableDocuments.filter(doc => doc.questionCount > 0)
  const allSelectedHaveQuestions = selectedDocuments.every(id => {
    const doc = availableDocuments.find(d => d.id === id)
    const progress = documentProgress[id]
    return progress === 'completed' || (doc && doc.questionCount > 0)
  })
  
  if (availableDocuments.length === 0) {
    return null // Don't show the component if no documents available
  }

  // Circular Progress Component
  const CircularProgress = ({ size = 20, progress = 0, isCompleted = false, isError = false }) => {
    const radius = (size - 4) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    if (isCompleted) {
      return <CheckCircle className={`h-${size/4} w-${size/4} text-green-500`} />
    }

    if (isError) {
      return <div className={`h-${size/4} w-${size/4} rounded-full bg-red-500 flex items-center justify-center text-white text-xs`}>✕</div>
    }

    return (
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-blue-500 transition-all duration-300"
          />
        </svg>
        {progress > 0 && progress < 100 && (
          <Loader2 className="absolute inset-0 h-5 w-5 animate-spin text-blue-500" />
        )}
      </div>
    )
  }

  const selectedModeInfo = quizModes.find(mode => mode.id === quizMode)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlayCircle className="h-4 w-4 mr-2" />
            Generate Quiz
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <DialogTitle>
                Generate Multi-Document Quiz
                {folder && (
                  <Badge variant="outline" className="ml-2" style={{ backgroundColor: folder.color + '20', borderColor: folder.color }}>
                    {folder.name}
                  </Badge>
                )}
              </DialogTitle>
            </div>
            
            {/* Quiz Mode in top-right corner */}
            <div className="flex items-center gap-2">
              <Label htmlFor="quiz-mode" className="text-sm">Mode:</Label>
              <Select value={quizMode} onValueChange={setQuizMode}>
                <SelectTrigger id="quiz-mode" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quizModes.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id}>
                      <div className="flex items-center gap-2">
                        <mode.icon className="h-4 w-4" />
                        {mode.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogDescription>
            Select documents to create your custom quiz
            {folder?.sampleQuestion && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <strong>Style Guide:</strong> {folder.sampleQuestion}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Progress Bar */}
          {selectedDocuments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {selectedDocuments.length} document(s) selected
                </span>
                <span className="text-muted-foreground">
                  {Math.round(overallProgress)}% ready
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Document Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Select Documents</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedDocuments.length === availableDocuments.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {availableDocuments.map((doc) => {
                const progress = documentProgress[doc.id] || 'pending'
                const isSelected = selectedDocuments.includes(doc.id)
                const hasQuestions = doc.questionCount > 0
                
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg transition-all cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleDocumentToggle(doc.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleDocumentToggle(doc.id)}
                      disabled={progress === 'generating'}
                    />
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {hasQuestions ? `${doc.questionCount} questions` : 'No questions yet'}
                        {doc.wordCount && ` • ${doc.wordCount} words`}
                      </div>
                    </div>
                    
                    {/* Circular Progress Indicator */}
                    <div className="flex-shrink-0">
                      {!isSelected ? (
                        <div className="w-5 h-5" /> // Empty space when not selected
                      ) : hasQuestions || progress === 'completed' ? (
                        <CircularProgress size={20} isCompleted={true} />
                      ) : progress === 'generating' ? (
                        <CircularProgress size={20} progress={50} />
                      ) : progress === 'error' ? (
                        <CircularProgress size={20} isError={true} />
                      ) : (
                        <CircularProgress size={20} progress={0} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
          </div>

          {/* Question Count */}
          {suggestions && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Number of Questions</Label>
                <div className="text-sm text-muted-foreground">
                  {questionCount[0]} questions
                </div>
              </div>
              
              <Slider
                value={questionCount}
                onValueChange={setQuestionCount}
                max={suggestions.max}
                min={suggestions.min}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: {suggestions.min}</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggested: {suggestions.suggested}
                </span>
                <span>Max: {suggestions.max}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Available questions: {suggestions.totalQuestions}
              </div>
            </div>
          )}

          {/* Smart Generate Quiz Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleGenerateQuiz}
              disabled={selectedDocuments.length === 0 || !allSelectedHaveQuestions || isGenerating}
              className={`flex-1 transition-all duration-300 ${
                allSelectedHaveQuestions && selectedDocuments.length > 0 
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg' 
                  : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Quiz...
                </>
              ) : allSelectedHaveQuestions && selectedDocuments.length > 0 ? (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  🎯 Start Quiz ({questionCount[0]} questions)
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Generate Quiz ({questionCount[0]} questions)
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
