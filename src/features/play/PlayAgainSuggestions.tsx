import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getPlaySuggestions, startRandomQuiz } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useToast } from '../../hooks/use-toast'
import { cn } from '../../lib/cn'
import {
  Play,
  Shuffle,
  FolderOpen,
  FileText,
  Sparkles,
  Clock,
  Star,
  CheckCircle2,
  Loader2,
  TrendingUp
} from 'lucide-react'

interface PlayAgainSuggestionsProps {
  isOpen: boolean
  onClose: () => void
  onPlayAgain: (mode?: string, content?: any) => void
  lastQuizScore?: number
  lastQuizMode?: string
}

export const PlayAgainSuggestions: React.FC<PlayAgainSuggestionsProps> = ({
  isOpen,
  onClose,
  onPlayAgain,
  lastQuizScore,
  lastQuizMode
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isStarting, setIsStarting] = useState(false)
  const [selectedContent, setSelectedContent] = useState<any[]>([])

  // Get smart suggestions
  const { data: suggestions, isLoading } = useQuery(getPlaySuggestions, {}, {
    enabled: isOpen
  })

  const startRandomQuizFn = useAction(startRandomQuiz)

  const handleRandomQuiz = async () => {
    setIsStarting(true)
    try {
      const result = await startRandomQuizFn({ mode: lastQuizMode })
      if (result.success) {
        toast({
          title: "Quiz Started!",
          description: "Get ready for another challenge"
        })
        navigate(`/quiz/take?attemptId=${result.quizAttemptId}`)
        onClose()
      }
    } catch (error) {
      console.error('Failed to start random quiz:', error)
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsStarting(false)
    }
  }

  const handleContentSelect = (content: any) => {
    const isSelected = selectedContent.find(c => c.id === content.id)
    if (isSelected) {
      setSelectedContent(selectedContent.filter(c => c.id !== content.id))
    } else {
      setSelectedContent([...selectedContent, content])
    }
  }

  const handleStartWithSelected = async () => {
    if (selectedContent.length === 0) return
    
    setIsStarting(true)
    try {
      onPlayAgain(lastQuizMode, selectedContent)
      onClose()
    } catch (error) {
      console.error('Failed to start quiz with selected content:', error)
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Play Again?
            {lastQuizScore && (
              <Badge variant="outline" className="ml-2">
                Last Score: {lastQuizScore}%
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Quick Random Option */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-full">
                    <Shuffle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Random Quiz</h3>
                    <p className="text-sm text-muted-foreground">
                      Jump into another random quiz with the same mode
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleRandomQuiz}
                  disabled={isStarting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Play Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Smart Suggestions */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading smart suggestions...</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="folders" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="folders" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Suggested Folders
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Suggested Documents
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Recommended
                </TabsTrigger>
              </TabsList>

              <TabsContent value="folders" className="space-y-4">
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {suggestions?.folders?.map((folder: any) => (
                    <Card 
                      key={folder.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedContent.find(c => c.id === folder.id) && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => handleContentSelect(folder)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: folder.color || '#3B82F6' }}
                            />
                            <div>
                              <h4 className="font-medium">{folder.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {folder._count?.documents || 0} documents
                              </p>
                            </div>
                          </div>
                          {selectedContent.find(c => c.id === folder.id) && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No folder suggestions available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {suggestions?.documents?.map((doc: any) => (
                    <Card 
                      key={doc.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedContent.find(c => c.id === doc.id) && "ring-2 ring-primary bg-primary/5"
                      )}
                      onClick={() => handleContentSelect(doc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{doc.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{doc.sourceType}</span>
                                {doc._count?.questions && (
                                  <span>• {doc._count.questions} questions</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {selectedContent.find(c => c.id === doc.id) && (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No document suggestions available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-8 text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                    <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
                    <p className="text-muted-foreground mb-4">
                      Personalized quiz suggestions powered by Nalanda AI
                    </p>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Coming Soon
                    </Badge>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          {selectedContent.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedContent.length} item{selectedContent.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedContent([])}>
                  Clear Selection
                </Button>
                <Button 
                  onClick={handleStartWithSelected}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
