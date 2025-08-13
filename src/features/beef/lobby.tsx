import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { getActiveBeefs, joinBeef } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { useToast } from '../../hooks/use-toast'
import { 
  Flame, 
  Users, 
  Clock, 
  Trophy, 
  Plus,
  Zap,
  Target,
  FileText,
  Crown,
  Timer,
  Search as SearchIcon
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
  participantCount: number
  createdAt: string
  expiresAt: string
  document: {
    id: number
    title: string
    sourceType: string
  }
  creator: {
    id: number
    handle?: string
  }
}

export default function BeefLobbyPage() {
  const { data: user } = useAuth()
  const { data: challenges, isLoading, error } = useQuery(getActiveBeefs)
  const joinBeefFn = useAction(joinBeef)
  const { toast } = useToast()

  const [joinCode, setJoinCode] = useState('')
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)

  const handleJoinChallenge = async (challengeCode: string) => {
    try {
      await joinBeefFn({ challengeCode })
      
      toast({
        title: 'Joined Challenge!',
        description: `Successfully joined beef challenge ${challengeCode}`
      })

      // Navigate to challenge page
      window.location.href = `/beef/challenge/${challengeCode}`
    } catch (error) {
      toast({
        title: 'Failed to Join',
        description: error instanceof Error ? error.message : 'Could not join challenge',
        variant: 'destructive'
      })
    }
  }

  const handleQuickJoin = async () => {
    if (!joinCode.trim()) {
      toast({
        title: 'Enter Challenge Code',
        description: 'Please enter a valid challenge code',
        variant: 'destructive'
      })
      return
    }

    await handleJoinChallenge(joinCode.trim().toUpperCase())
    setIsJoinDialogOpen(false)
    setJoinCode('')
  }

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'PDF': return <FileText className='h-4 w-4' />
      case 'TEXT_INPUT': return <FileText className='h-4 w-4' />
      default: return <FileText className='h-4 w-4' />
    }
  }

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'PDF': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'TEXT_INPUT': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    return `${minutes}m`
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
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
                <Flame className='h-8 w-8 text-orange-500' />
                Beef Challenges 🔥
              </h1>
              <p className='text-muted-foreground mt-2'>
                Join real-time quiz battles and prove your knowledge!
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SearchIcon className='h-4 w-4 mr-2' />
                    Join with Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Beef Challenge</DialogTitle>
                    <DialogDescription>
                      Enter a challenge code to join an existing beef
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor="joinCode">Challenge Code</Label>
                      <Input
                        id="joinCode"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="BEEFABC123"
                        className="font-mono"
                        maxLength={10}
                      />
                    </div>
                    <div className='flex justify-end gap-2'>
                      <Button variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleQuickJoin}>
                        <Zap className='h-4 w-4 mr-2' />
                        Join Beef
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button onClick={() => window.location.href = '/documents'}>
                <Plus className='h-4 w-4 mr-2' />
                Create Challenge
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-3 mb-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active Challenges</CardTitle>
              <Flame className='h-4 w-4 text-orange-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{challenges?.length || 0}</div>
              <p className='text-xs text-muted-foreground'>
                Ready to battle
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Your Beef Score</CardTitle>
              <Trophy className='h-4 w-4 text-yellow-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>0</div>
              <p className='text-xs text-muted-foreground'>
                Win challenges to score
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Matches Played</CardTitle>
              <Target className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>0</div>
              <p className='text-xs text-muted-foreground'>
                Start your first beef!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Active Challenges
            </CardTitle>
            <CardDescription>
              Join live challenges or wait for more players
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='text-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
                <p className='text-muted-foreground'>Loading challenges...</p>
              </div>
            ) : error ? (
              <div className='text-center py-8 text-destructive'>
                Failed to load challenges
              </div>
            ) : !challenges || challenges.length === 0 ? (
              <div className='text-center py-12'>
                <Flame className='h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50' />
                <h3 className='text-lg font-medium mb-2'>No Active Challenges</h3>
                <p className='text-muted-foreground mb-4'>
                  Be the first to start a beef challenge!
                </p>
                <Button onClick={() => window.location.href = '/documents'}>
                  <Plus className='h-4 w-4 mr-2' />
                  Create First Challenge
                </Button>
              </div>
            ) : (
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {(challenges as BeefChallenge[]).map((challenge) => (
                  <Card key={challenge.id} className='hover:shadow-md transition-shadow border-l-4 border-l-orange-500'>
                    <CardHeader className='pb-3'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <Crown className='h-4 w-4 text-yellow-500' />
                            <span className='text-sm font-medium'>
                              @{challenge.creator.handle || `user${challenge.creator.id}`}
                            </span>
                          </div>
                          <h4 className='font-semibold truncate'>
                            {challenge.title || challenge.document.title}
                          </h4>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="font-mono text-xs"
                        >
                          {challenge.challengeCode}
                        </Badge>
                      </div>
                      
                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        {getSourceTypeIcon(challenge.document.sourceType)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSourceTypeColor(challenge.document.sourceType)}`}
                        >
                          {challenge.document.sourceType}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className='space-y-3'>
                      <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <Users className='h-4 w-4' />
                          <span>{challenge.participantCount}/{challenge.maxParticipants}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Timer className='h-4 w-4' />
                          <span>{challenge.timeLimit}s/Q</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Target className='h-4 w-4' />
                          <span>{challenge.questionCount}Q</span>
                        </div>
                      </div>
                      
                      <div className='flex items-center justify-between text-xs text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          <span>Expires in {formatTimeRemaining(challenge.expiresAt)}</span>
                        </div>
                        <span>
                          Created {new Date(challenge.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <Button 
                        className='w-full' 
                        size='sm'
                        disabled={challenge.participantCount >= challenge.maxParticipants}
                        onClick={() => handleJoinChallenge(challenge.challengeCode)}
                      >
                        {challenge.participantCount >= challenge.maxParticipants ? (
                          'Challenge Full'
                        ) : (
                          <>
                            <Zap className='h-4 w-4 mr-2' />
                            Join Beef
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How to Play */}
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>How to Beef 🥩</CardTitle>
            <CardDescription>Quick guide to competitive quizzing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='text-center p-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <span className='text-xl font-bold text-blue-600'>1</span>
                </div>
                <h4 className='font-medium mb-2'>Create or Join</h4>
                <p className='text-sm text-muted-foreground'>
                  Start a new challenge from your documents or join an existing one with a code
                </p>
              </div>
              
              <div className='text-center p-4'>
                <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <span className='text-xl font-bold text-orange-600'>2</span>
                </div>
                <h4 className='font-medium mb-2'>Battle Live</h4>
                <p className='text-sm text-muted-foreground'>
                  Answer questions faster than your opponents to earn more points
                </p>
              </div>
              
              <div className='text-center p-4'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <span className='text-xl font-bold text-green-600'>3</span>
                </div>
                <h4 className='font-medium mb-2'>Claim Victory</h4>
                <p className='text-sm text-muted-foreground'>
                  Get the highest score to win the beef and earn bragging rights!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
