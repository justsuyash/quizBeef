import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getMyDocuments, getDocumentQuestions, startQuiz } from 'wasp/client/operations'
import { Header } from '../../components/layout/header'
import { Main } from '../../components/layout/main'
import { TopNav } from '../../components/layout/top-nav'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Search } from '../../components/search'
import { ThemeSwitch } from '../../components/theme-switch'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Slider } from '../../components/ui/slider'
import { Label } from '../../components/ui/label'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { toast } from '../../hooks/use-toast'
import { Settings2, Clock, Target, BarChart3, PlayCircle, ArrowLeft } from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Quiz Settings', href: '#', isActive: true },
]

export default function QuizSettingsPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const [isStartingQuiz, setIsStartingQuiz] = useState(false)

  // Quiz settings state
  const [questionCount, setQuestionCount] = useState(10)
  const [easyPercentage, setEasyPercentage] = useState(30)
  const [mediumPercentage, setMediumPercentage] = useState(50)
  const [hardPercentage, setHardPercentage] = useState(20)
  const [timeLimit, setTimeLimit] = useState<number | null>(null)
  const [hasTimeLimit, setHasTimeLimit] = useState(false)

  const startQuizFn = useAction(startQuiz)

  // Fetch document and questions data
  const { data: documents } = useQuery(getMyDocuments)
  const { data: questionsData } = useQuery(getDocumentQuestions, 
    { documentId: parseInt(documentId || '0') },
    { enabled: !!documentId }
  )

  const document = documents?.find(d => d.id === parseInt(documentId || '0'))
  const questions = questionsData?.questions || []

  // Count questions by difficulty
  const questionsByDifficulty = {
    easy: questions.filter(q => q.difficulty === 'EASY').length,
    medium: questions.filter(q => q.difficulty === 'MEDIUM').length,
    hard: questions.filter(q => q.difficulty === 'HARD').length,
    total: questions.length
  }

  // Auto-adjust percentages to ensure they sum to 100
  useEffect(() => {
    const total = easyPercentage + mediumPercentage + hardPercentage
    if (total !== 100 && total > 0) {
      const factor = 100 / total
      setEasyPercentage(Math.round(easyPercentage * factor))
      setMediumPercentage(Math.round(mediumPercentage * factor))
      setHardPercentage(100 - Math.round(easyPercentage * factor) - Math.round(mediumPercentage * factor))
    }
  }, [easyPercentage, mediumPercentage, hardPercentage])

  // Calculate expected question distribution
  const expectedDistribution = {
    easy: Math.round((easyPercentage / 100) * questionCount),
    medium: Math.round((mediumPercentage / 100) * questionCount),
    hard: Math.round((hardPercentage / 100) * questionCount)
  }

  const handleStartQuiz = async () => {
    if (!documentId) {
      toast({
        title: 'Error',
        description: 'Document not found',
        variant: 'destructive',
      })
      return
    }

    if (questions.length === 0) {
      toast({
        title: 'No Questions Available',
        description: 'Please generate questions for this document first.',
        variant: 'destructive',
      })
      return
    }

    setIsStartingQuiz(true)
    try {
      const settings = {
        questionCount,
        difficultyDistribution: {
          easy: easyPercentage,
          medium: mediumPercentage,
          hard: hardPercentage
        },
        timeLimit: hasTimeLimit && timeLimit ? timeLimit : undefined
      }

      const result = await startQuizFn({
        documentId: parseInt(documentId || '0'),
        settings
      })

      if (result.success) {
        toast({
          title: 'Quiz Started!',
          description: `Starting quiz with ${result.questionCount} questions`,
        })
        
        // Navigate to quiz taking page
        navigate(`/quiz/${documentId}/take?attemptId=${result.quizAttemptId}`)
      }
    } catch (error) {
      console.error('Quiz start error:', error)
      toast({
        title: 'Failed to Start Quiz',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsStartingQuiz(false)
    }
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Document Not Found</h2>
          <p className="text-muted-foreground">The requested document could not be found.</p>
          <Button onClick={() => navigate('/documents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
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
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/documents')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
            </div>
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
              <Settings2 className="h-8 w-8" />
              Quiz Settings
            </h1>
            <p className='text-muted-foreground'>
              Customize your quiz experience for "{document.title}"
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Document Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Document</div>
                <div className="font-medium">{document.title}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available Questions</div>
                <div className="font-medium">{questionsByDifficulty.total} questions</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Easy:</span>
                  <Badge variant="secondary">{questionsByDifficulty.easy}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Medium:</span>
                  <Badge variant="secondary">{questionsByDifficulty.medium}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Hard:</span>
                  <Badge variant="secondary">{questionsByDifficulty.hard}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Quiz Configuration
              </CardTitle>
              <CardDescription>
                Customize the difficulty distribution and quiz parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Count */}
              <div className="space-y-2">
                <Label htmlFor="question-count">Number of Questions</Label>
                <div className="flex items-center space-x-4">
                  <Slider
                    id="question-count"
                    min={1}
                    max={Math.min(questionsByDifficulty.total, 50)}
                    step={1}
                    value={[questionCount]}
                    onValueChange={(value) => setQuestionCount(value[0])}
                    className="flex-1"
                  />
                  <div className="w-16 text-center font-medium">
                    {questionCount}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Difficulty Distribution */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Difficulty Distribution</Label>
                  <p className="text-sm text-muted-foreground">
                    Adjust the percentage of questions for each difficulty level
                  </p>
                </div>

                {/* Easy Questions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="easy-slider">Easy Questions</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{expectedDistribution.easy} questions</Badge>
                      <div className="w-12 text-center text-sm font-medium">{easyPercentage}%</div>
                    </div>
                  </div>
                  <Slider
                    id="easy-slider"
                    min={0}
                    max={100}
                    step={5}
                    value={[easyPercentage]}
                    onValueChange={(value) => setEasyPercentage(value[0])}
                    className="w-full"
                  />
                </div>

                {/* Medium Questions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="medium-slider">Medium Questions</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{expectedDistribution.medium} questions</Badge>
                      <div className="w-12 text-center text-sm font-medium">{mediumPercentage}%</div>
                    </div>
                  </div>
                  <Slider
                    id="medium-slider"
                    min={0}
                    max={100}
                    step={5}
                    value={[mediumPercentage]}
                    onValueChange={(value) => setMediumPercentage(value[0])}
                    className="w-full"
                  />
                </div>

                {/* Hard Questions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="hard-slider">Hard Questions</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{expectedDistribution.hard} questions</Badge>
                      <div className="w-12 text-center text-sm font-medium">{hardPercentage}%</div>
                    </div>
                  </div>
                  <Slider
                    id="hard-slider"
                    min={0}
                    max={100}
                    step={5}
                    value={[hardPercentage]}
                    onValueChange={(value) => setHardPercentage(value[0])}
                    className="w-full"
                  />
                </div>

                {/* Distribution Summary */}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Quiz Preview:</div>
                  <div className="text-sm text-muted-foreground">
                    {expectedDistribution.easy} easy + {expectedDistribution.medium} medium + {expectedDistribution.hard} hard = {questionCount} total questions
                  </div>
                  {(easyPercentage + mediumPercentage + hardPercentage) !== 100 && (
                    <div className="text-xs text-amber-600 mt-1">
                      ⚠️ Percentages will be automatically adjusted to sum to 100%
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Time Limit */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="time-limit" className="text-base font-medium">Time Limit</Label>
                    <p className="text-sm text-muted-foreground">
                      Optional time limit for the entire quiz
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has-time-limit"
                      checked={hasTimeLimit}
                      onChange={(e) => setHasTimeLimit(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="has-time-limit" className="text-sm">Enable</Label>
                  </div>
                </div>

                {hasTimeLimit && (
                  <div className="flex items-center space-x-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={timeLimit || ''}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value) || null)}
                      placeholder="Minutes"
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Start Quiz Button */}
              <div className="pt-4">
                <Button
                  onClick={handleStartQuiz}
                  disabled={isStartingQuiz || questionsByDifficulty.total === 0}
                  size="lg"
                  className="w-full"
                >
                  {isStartingQuiz ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Quiz...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start Quiz ({questionCount} questions)
                    </>
                  )}
                </Button>

                {questionsByDifficulty.total === 0 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    No questions available. Please generate questions for this document first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}
