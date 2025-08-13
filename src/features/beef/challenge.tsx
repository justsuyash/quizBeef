import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAction } from 'wasp/client/operations'
import { startBeef, submitBeefAnswer, leaveBeef } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { useRealtimeChallenge } from './hooks/useRealtimeChallenge'
import { RealTimeStatus } from './components/RealTimeStatus'
import { LiveLeaderboard } from './components/LiveLeaderboard'
import { Header } from '../../components/layout/header'
import { Main } from '../../components/layout/main'
import { TopNav } from '../../components/layout/top-nav'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Search } from '../../components/search'
import { ThemeSwitch } from '../../components/theme-switch'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Label } from '../../components/ui/label'
import { useToast } from '../../hooks/use-toast'
import { 
  Flame, 
  Users, 
  Clock, 
  Trophy, 
  Target,
  ArrowLeft,
  Crown,
  Timer,
  CheckCircle,
  XCircle,
  Zap,
  Copy,
  Share2
} from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Beef Challenges', href: '/beef', isActive: true },
]

interface BeefChallenge {
  id: number
  challengeCode: string
  title?: string
  status: string
  questionCount: number
  timeLimit: number
  maxParticipants: number
  document: {
    id: number
    title: string
    sourceType: string
  }
  creator: {
    id: number
    handle?: string
  }
  participants: Array<{
    id: number
    isReady: boolean
    finalScore: number
    user: {
      id: number
      handle?: string
    }
  }>
  rounds?: Array<{
    id: number
    roundNumber: number
    startedAt?: string
    question: {
      id: number
      questionText: string
      answers: Array<{
        id: number
        answerText: string
        isCorrect: boolean
      }>
    }
  }>
}

export default function BeefChallengePage() {
  const { challengeId } = useParams()
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const {
    challenge,
    isLoading,
    error,
    realtimeState,
    connectionStatus,
    participantUpdates,
    roundInfo,
    refresh
  } = useRealtimeChallenge({ 
    challengeId: parseInt(challengeId || '0'),
    enabled: true,
    pollInterval: 2000
  })
  const startBeefFn = useAction(startBeef)
  const submitAnswerFn = useAction(submitBeefAnswer)
  const leaveBeefFn = useAction(leaveBeef)
  const { toast } = useToast()

  const [currentRound, setCurrentRound] = useState(1)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update current round from realtime data
  useEffect(() => {
    if (roundInfo.currentRound) {
      setCurrentRound(roundInfo.currentRound)
    }
  }, [roundInfo.currentRound])

  // Timer countdown
  useEffect(() => {
    if (challenge?.status === 'IN_PROGRESS' && timeRemaining > 0 && !hasAnswered) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [timeRemaining, challenge?.status, hasAnswered])

  const currentParticipant = challenge?.participants?.find(p => p.user.id === user?.id)
  const isCreator = challenge?.creator.id === user?.id
  const canStart = challenge?.status === 'WAITING' && 
                   challenge?.participants?.length >= 2 && 
                   challenge?.participants?.every(p => p.isReady) &&
                   isCreator

  const handleStartChallenge = async () => {
    if (!challenge) return

    try {
      await startBeefFn({ challengeId: challenge.id })
      toast({
        title: 'Challenge Starting! 🔥',
        description: 'Get ready for the beef!'
      })
    } catch (error) {
      toast({
        title: 'Failed to Start',
        description: error instanceof Error ? error.message : 'Could not start challenge',
        variant: 'destructive'
      })
    }
  }

  const handleSubmitAnswer = async () => {
    if (!challenge || !selectedAnswer || hasAnswered) return

    setIsSubmitting(true)
    try {
      const timeSpent = (challenge.timeLimit - timeRemaining) * 1000
      
      await submitAnswerFn({
        challengeId: challenge.id,
        roundNumber: currentRound,
        selectedAnswerId: selectedAnswer,
        timeSpent
      })

      setHasAnswered(true)
      toast({
        title: 'Answer Submitted!',
        description: 'Waiting for other participants...'
      })
    } catch (error) {
      toast({
        title: 'Failed to Submit',
        description: error instanceof Error ? error.message : 'Could not submit answer',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLeaveChallenge = async () => {
    if (!challenge) return

    try {
      await leaveBeefFn({ challengeId: challenge.id })
      toast({
        title: 'Left Challenge',
        description: 'You have left the beef challenge'
      })
      navigate('/beef')
    } catch (error) {
      toast({
        title: 'Failed to Leave',
        description: error instanceof Error ? error.message : 'Could not leave challenge',
        variant: 'destructive'
      })
    }
  }

  const copyInviteCode = () => {
    if (challenge?.challengeCode) {
      navigator.clipboard.writeText(challenge.challengeCode)
      toast({
        title: 'Copied!',
        description: 'Challenge code copied to clipboard'
      })
    }
  }

  if (isLoading) {
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
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading challenge...</p>
          </div>
        </Main>
      </>
    )
  }

  if (error || !challenge) {
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
            <XCircle className='h-16 w-16 mx-auto mb-4 text-destructive opacity-50' />
            <h3 className='text-lg font-medium mb-2'>Challenge Not Found</h3>
            <p className='text-muted-foreground mb-4'>
              The beef challenge could not be found or you don't have access.
            </p>
            <Button onClick={() => navigate('/beef')}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Beef Lobby
            </Button>
          </div>
        </Main>
      </>
    )
  }

  const currentRoundData = challenge.rounds?.find(r => r.roundNumber === currentRound)

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
              Beef Challenge
            </h1>
          </div>
          <div className='flex items-center gap-4'>
            <p className='text-muted-foreground'>
              {challenge.title || challenge.document.title}
            </p>
            <Badge variant="outline" className="font-mono">
              {challenge.challengeCode}
            </Badge>
            <Badge 
              variant={challenge.status === 'WAITING' ? 'secondary' : 
                      challenge.status === 'IN_PROGRESS' ? 'default' : 'outline'}
            >
              {challenge.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Challenge Status Cards */}
        <div className='grid gap-4 md:grid-cols-3 mb-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Participants</CardTitle>
              <Users className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {challenge.participants?.length || 0}/{challenge.maxParticipants}
              </div>
              <p className='text-xs text-muted-foreground'>
                {challenge.status === 'WAITING' ? 'Waiting for players' : 'In battle'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Questions</CardTitle>
              <Target className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{challenge.questionCount}</div>
              <p className='text-xs text-muted-foreground'>
                {challenge.timeLimit}s per question
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Your Score</CardTitle>
              <Trophy className='h-4 w-4 text-yellow-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{currentParticipant?.finalScore || 0}</div>
              <p className='text-xs text-muted-foreground'>
                Points earned
              </p>
            </CardContent>
          </Card>
        </div>

        {challenge.status === 'WAITING' && (
          <div className='grid gap-6 lg:grid-cols-3'>
            {/* Real-Time Status */}
            <RealTimeStatus
              connectionStatus={connectionStatus}
              participantUpdates={participantUpdates}
              onRefresh={refresh}
            />

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {challenge.participants?.map((participant) => (
                    <div key={participant.id} className='flex items-center justify-between p-3 bg-muted rounded-lg'>
                      <div className='flex items-center gap-3'>
                        {participant.user.id === challenge.creator.id && (
                          <Crown className='h-4 w-4 text-yellow-500' />
                        )}
                        <span className='font-medium'>
                          @{participant.user.handle || `user${participant.user.id}`}
                        </span>
                      </div>
                      <Badge variant={participant.isReady ? 'default' : 'secondary'}>
                        {participant.isReady ? 'Ready' : 'Not Ready'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Challenge Info & Controls */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Share2 className='h-5 w-5' />
                  Challenge Info
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='p-3 bg-muted rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>Invite Code</span>
                    <Button variant="ghost" size="sm" onClick={copyInviteCode}>
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                  <p className='text-2xl font-mono font-bold'>{challenge.challengeCode}</p>
                </div>

                <div className='text-sm text-muted-foreground'>
                  <p>📚 Document: {challenge.document.title}</p>
                  <p>⏱️ Time Limit: {challenge.timeLimit}s per question</p>
                  <p>🎯 Questions: {challenge.questionCount}</p>
                </div>

                <div className='flex gap-2'>
                  {isCreator && canStart && (
                    <Button onClick={handleStartChallenge} className='flex-1'>
                      <Zap className='h-4 w-4 mr-2' />
                      Start Beef
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleLeaveChallenge}
                    className={isCreator && canStart ? '' : 'flex-1'}
                  >
                    Leave Challenge
                  </Button>
                </div>

                {challenge.participants?.length < 2 && (
                  <p className='text-sm text-muted-foreground text-center'>
                    Waiting for more participants to join...
                  </p>
                )}

                {challenge.participants?.length >= 2 && !challenge.participants?.every(p => p.isReady) && (
                  <p className='text-sm text-muted-foreground text-center'>
                    Waiting for all participants to be ready...
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {challenge.status === 'IN_PROGRESS' && currentRoundData && (
          <>
            {/* Real-Time Status Bar for Active Challenge */}
            <div className='mb-4'>
              <RealTimeStatus
                connectionStatus={connectionStatus}
                participantUpdates={participantUpdates}
                onRefresh={refresh}
                compact={true}
              />
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
              {/* Live Leaderboard */}
              <LiveLeaderboard
                participants={challenge.participants || []}
                currentUserId={user?.id}
                challenge={challenge}
                roundInfo={roundInfo}
                compact={true}
              />

              {/* Current Question */}
              <Card className='lg:col-span-2'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      <Timer className='h-5 w-5' />
                      Question {currentRound} of {challenge.questionCount}
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-4 w-4' />
                      <span className='font-mono font-bold text-lg'>
                        {Math.max(0, timeRemaining)}s
                      </span>
                    </div>
                  </div>
                  <Progress value={(timeRemaining / challenge.timeLimit) * 100} className="mt-2" />
                </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-4'>
                  {currentRoundData.question.questionText}
                </h3>

                <RadioGroup 
                  value={selectedAnswer?.toString()} 
                  onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                  disabled={hasAnswered}
                >
                  {currentRoundData.question.answers.map((answer) => (
                    <div key={answer.id} className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50'>
                      <RadioGroupItem value={answer.id.toString()} id={`answer-${answer.id}`} />
                      <Label htmlFor={`answer-${answer.id}`} className='flex-1 cursor-pointer'>
                        {answer.answerText}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  {hasAnswered ? (
                    <div className='flex items-center gap-2 text-green-600'>
                      <CheckCircle className='h-4 w-4' />
                      Answer submitted! Waiting for others...
                    </div>
                  ) : (
                    `Select an answer and submit before time runs out!`
                  )}
                </div>

                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || hasAnswered || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Timer className='h-4 w-4 mr-2 animate-spin' />
                      Submitting...
                    </>
                  ) : hasAnswered ? (
                    <>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Submitted
                    </>
                  ) : (
                    <>
                      <Zap className='h-4 w-4 mr-2' />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
              </Card>
            </div>
          </>
        )}

        {challenge.status === 'COMPLETED' && (
          <div className='grid gap-6 lg:grid-cols-2'>
            <LiveLeaderboard
              participants={challenge.participants || []}
              currentUserId={user?.id}
              challenge={challenge}
              roundInfo={roundInfo}
            />

            {/* Challenge Summary */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Trophy className='h-5 w-5 text-yellow-500' />
                  Challenge Summary
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>Total Questions:</span>
                    <p className='font-semibold'>{challenge.questionCount}</p>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Time per Question:</span>
                    <p className='font-semibold'>{challenge.timeLimit}s</p>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Participants:</span>
                    <p className='font-semibold'>{challenge.participants?.length || 0}</p>
                  </div>
                  <div>
                    <span className='text-muted-foreground'>Winner:</span>
                    <p className='font-semibold'>
                      @{challenge.participants?.sort((a, b) => b.finalScore - a.finalScore)[0]?.user.handle || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className='flex gap-2 mt-6'>
                  <Button onClick={() => navigate('/beef')} className='flex-1'>
                    <ArrowLeft className='h-4 w-4 mr-2' />
                    Back to Lobby
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
