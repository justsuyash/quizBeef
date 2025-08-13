import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getMyDocuments, createBeef } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Header } from '../../components/layout/header'
import { Main } from '../../components/layout/main'
import { TopNav } from '../../components/layout/top-nav'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Search } from '../../components/search'
import { ThemeSwitch } from '../../components/theme-switch'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Slider } from '../../components/ui/slider'
import { Switch } from '../../components/ui/switch'
import { Textarea } from '../../components/ui/textarea'
import { useToast } from '../../hooks/use-toast'
import { 
  Flame, 
  Users, 
  Clock, 
  Target, 
  FileText,
  ArrowLeft,
  Zap,
  Crown,
  Timer
} from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Beef Challenges', href: '/beef', isActive: true },
]

export default function CreateBeefPage() {
  const { documentId } = useParams()
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: documents } = useQuery(getMyDocuments)
  const createBeefFn = useAction(createBeef)
  const { toast } = useToast()

  // Find the specific document
  const document = documents?.find(d => d.id === parseInt(documentId || '0'))

  const [title, setTitle] = useState('')
  const [questionCount, setQuestionCount] = useState([10])
  const [timeLimit, setTimeLimit] = useState([60])
  const [maxParticipants, setMaxParticipants] = useState([2])
  const [isPrivate, setIsPrivate] = useState(false)
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: 30,
    medium: 50,
    hard: 20
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleDifficultyChange = (difficulty: string, value: number[]) => {
    setDifficultyDistribution(prev => ({
      ...prev,
      [difficulty]: value[0]
    }))
  }

  const totalPercentage = difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard

  const handleCreateBeef = async () => {
    if (!document) {
      toast({
        title: 'Document Not Found',
        description: 'The selected document could not be found.',
        variant: 'destructive'
      })
      return
    }

    if (totalPercentage !== 100) {
      toast({
        title: 'Invalid Difficulty Distribution',
        description: 'Difficulty percentages must add up to 100%.',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createBeefFn({
        documentId: document.id,
        title: title.trim() || undefined,
        questionCount: questionCount[0],
        timeLimit: timeLimit[0],
        maxParticipants: maxParticipants[0],
        difficultyDistribution,
        isPrivate
      })

      toast({
        title: 'Beef Challenge Created! 🔥',
        description: `Challenge code: ${result.challengeCode}. Share this code with others to join!`
      })

      // Navigate to the challenge page
      navigate(`/beef/${result.id}`)
    } catch (error) {
      toast({
        title: 'Failed to Create Challenge',
        description: error instanceof Error ? error.message : 'Could not create beef challenge',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!document) {
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
          <div className='text-center py-12'>
            <FileText className='h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50' />
            <h3 className='text-lg font-medium mb-2'>Document Not Found</h3>
            <p className='text-muted-foreground mb-4'>
              The document you're trying to create a beef for could not be found.
            </p>
            <Button onClick={() => navigate('/documents')}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Documents
            </Button>
          </div>
        </Main>
      </>
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
        <div className='mb-6'>
          <div className='flex items-center gap-3 mb-2'>
            <Button variant="ghost" size="sm" onClick={() => navigate('/beef')}>
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
              <Flame className='h-8 w-8 text-orange-500' />
              Create Beef Challenge
            </h1>
          </div>
          <p className='text-muted-foreground'>
            Set up a competitive quiz challenge for "{document.title}"
          </p>
        </div>

        {/* Document Info */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='h-5 w-5' />
              Selected Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-medium'>{document.title}</h3>
                <p className='text-sm text-muted-foreground'>
                  {document.questions?.length || 0} questions available
                </p>
              </div>
              <Badge variant="outline">
                {document.sourceType}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Challenge Settings */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Crown className='h-5 w-5 text-yellow-500' />
                Challenge Settings
              </CardTitle>
              <CardDescription>
                Configure your beef challenge
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <Label htmlFor="title">Challenge Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Quiz Beef: ${document.title}`}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Number of Questions: {questionCount[0]}</Label>
                <Slider
                  value={questionCount}
                  onValueChange={setQuestionCount}
                  max={Math.min(document.questions?.length || 10, 50)}
                  min={5}
                  step={1}
                  className="mt-2"
                />
                <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                  <span>5</span>
                  <span>{Math.min(document.questions?.length || 10, 50)} (max available)</span>
                </div>
              </div>

              <div>
                <Label>Time per Question: {timeLimit[0]} seconds</Label>
                <Slider
                  value={timeLimit}
                  onValueChange={setTimeLimit}
                  max={180}
                  min={15}
                  step={15}
                  className="mt-2"
                />
                <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                  <span>15s</span>
                  <span>180s</span>
                </div>
              </div>

              <div>
                <Label>Max Participants: {maxParticipants[0]}</Label>
                <Slider
                  value={maxParticipants}
                  onValueChange={setMaxParticipants}
                  max={8}
                  min={2}
                  step={1}
                  className="mt-2"
                />
                <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                  <span>2</span>
                  <span>8</span>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor="private">Private Challenge</Label>
                  <p className='text-sm text-muted-foreground'>
                    Only accessible via invite code
                  </p>
                </div>
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5 text-blue-500' />
                Difficulty Distribution
              </CardTitle>
              <CardDescription>
                Set the percentage of each difficulty level
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <Label>Easy Questions</Label>
                  <span className='text-sm font-medium'>{difficultyDistribution.easy}%</span>
                </div>
                <Slider
                  value={[difficultyDistribution.easy]}
                  onValueChange={(value) => handleDifficultyChange('easy', value)}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-1"
                />
              </div>

              <div>
                <div className='flex justify-between items-center mb-2'>
                  <Label>Medium Questions</Label>
                  <span className='text-sm font-medium'>{difficultyDistribution.medium}%</span>
                </div>
                <Slider
                  value={[difficultyDistribution.medium]}
                  onValueChange={(value) => handleDifficultyChange('medium', value)}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-1"
                />
              </div>

              <div>
                <div className='flex justify-between items-center mb-2'>
                  <Label>Hard Questions</Label>
                  <span className='text-sm font-medium'>{difficultyDistribution.hard}%</span>
                </div>
                <Slider
                  value={[difficultyDistribution.hard]}
                  onValueChange={(value) => handleDifficultyChange('hard', value)}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-1"
                />
              </div>

              <div className='p-3 bg-muted rounded-lg'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm font-medium'>Total:</span>
                  <span className={`text-sm font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPercentage}%
                  </span>
                </div>
                {totalPercentage !== 100 && (
                  <p className='text-xs text-destructive mt-1'>
                    Must equal 100%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Button */}
        <Card className='mt-6'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='font-medium'>Ready to Start the Beef? 🔥</h3>
                <p className='text-sm text-muted-foreground'>
                  Your challenge will be created and ready for participants to join
                </p>
              </div>
              <Button 
                onClick={handleCreateBeef}
                disabled={isCreating || totalPercentage !== 100}
                size="lg"
                className='min-w-[120px]'
              >
                {isCreating ? (
                  <>
                    <Timer className='h-4 w-4 mr-2 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className='h-4 w-4 mr-2' />
                    Create Beef
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
