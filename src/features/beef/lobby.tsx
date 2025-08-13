import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { getActiveBeefs, joinBeef } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
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
    title: string
  }
  creator: {
    handle?: string
  }
}

export default function BeefLobbyPage() {
  const { data: user } = useAuth()
  const { data: activeBeefs, isLoading } = useQuery(getActiveBeefs)
  const { toast } = useToast()
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const joinBeefAction = useAction(joinBeef)

  const handleJoinBeef = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a beef code",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      await joinBeefAction({ challengeCode: joinCode.trim() })
      toast({
        title: "Success! 🔥",
        description: "You've joined the beef challenge!",
      })
      setJoinCode('')
    } catch (error: any) {
      toast({
        title: "Failed to join",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary">Waiting for players</Badge>
      case 'active':
        return <Badge variant="destructive"><Flame className="w-3 h-3 mr-1" />Live</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <Zap className='h-8 w-8 text-orange-500' />
          Beef Challenges 🔥
        </h1>
        <p className='text-muted-foreground mt-2'>
          Battle other players in real-time quiz duels. May the smartest win!
        </p>
      </div>

      {/* Quick Actions */}
      <div className='grid md:grid-cols-2 gap-6 mb-8'>
        {/* Join Beef Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5 text-primary' />
              Join a Beef
            </CardTitle>
            <CardDescription>
              Enter a beef code to join an existing challenge
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='beef-code'>Beef Code</Label>
              <Input
                id='beef-code'
                placeholder='Enter 6-digit code...'
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={isJoining}
              />
            </div>
            <Button 
              onClick={handleJoinBeef}
              disabled={isJoining || !joinCode.trim()}
              className='w-full'
            >
              {isJoining ? '🔄 Joining...' : '⚡ Join Beef'}
            </Button>
          </CardContent>
        </Card>

        {/* Create Beef Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Plus className='h-5 w-5 text-accent' />
              Create a Beef
            </CardTitle>
            <CardDescription>
              Start a new challenge from your documents
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              Select a document to create quiz questions and challenge other players.
            </p>
            <Button asChild variant='outline' className='w-full'>
              <Link to='/documents'>
                <FileText className='h-4 w-4 mr-2' />
                Choose Document
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Beefs */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-bold flex items-center gap-2'>
          <Flame className='h-6 w-6 text-orange-500' />
          Active Challenges
        </h2>

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className='animate-pulse'>
                <CardHeader>
                  <div className='h-4 bg-muted rounded w-3/4'></div>
                  <div className='h-3 bg-muted rounded w-1/2'></div>
                </CardHeader>
                <CardContent>
                  <div className='h-20 bg-muted rounded'></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !activeBeefs || activeBeefs.length === 0 ? (
          <Card className='p-12 text-center'>
            <CardContent className='space-y-6'>
              <Zap className='w-24 h-24 mx-auto text-muted-foreground' />
              <div className='space-y-2'>
                <h3 className='text-2xl font-bold'>No active challenges</h3>
                <p className='text-muted-foreground max-w-md mx-auto'>
                  Be the first to create a beef challenge and battle other players!
                </p>
              </div>
              <Button asChild size='lg'>
                <Link to='/documents'>
                  <Plus className='h-5 w-5 mr-2' />
                  Create First Challenge
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {activeBeefs.map((beef) => (
              <Card key={beef.id} className='hover:shadow-lg transition-shadow cursor-pointer'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1 min-w-0'>
                      <CardTitle className='text-lg line-clamp-2'>
                        {beef.title || beef.document?.title || 'Beef Challenge'}
                      </CardTitle>
                      <CardDescription className='mt-1'>
                        by {beef.creator?.handle || 'Anonymous'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(beef.status)}
                  </div>
                </CardHeader>

                <CardContent className='space-y-4'>
                  {/* Challenge Info */}
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='flex items-center text-muted-foreground'>
                      <Users className='h-4 w-4 mr-2' />
                      {beef.participantCount}/{beef.maxParticipants}
                    </div>
                    <div className='flex items-center text-muted-foreground'>
                      <FileText className='h-4 w-4 mr-2' />
                      {beef.questionCount}Q
                    </div>
                    <div className='flex items-center text-muted-foreground'>
                      <Timer className='h-4 w-4 mr-2' />
                      {beef.timeLimit}min
                    </div>
                    <div className='flex items-center text-muted-foreground'>
                      <Crown className='h-4 w-4 mr-2' />
                      {beef.challengeCode}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Players</span>
                      <span>{beef.participantCount}/{beef.maxParticipants}</span>
                    </div>
                    <div className='w-full bg-muted rounded-full h-2'>
                      <div 
                        className='bg-orange-500 h-2 rounded-full transition-all duration-500'
                        style={{ 
                          width: `${(beef.participantCount / beef.maxParticipants) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className='w-full' 
                    variant={beef.status === 'active' ? 'default' : 'outline'}
                    disabled={beef.participantCount >= beef.maxParticipants}
                  >
                    {beef.status === 'active' ? (
                      <>
                        <Flame className='h-4 w-4 mr-2' />
                        Join Battle
                      </>
                    ) : beef.status === 'waiting' ? (
                      <>
                        <Users className='h-4 w-4 mr-2' />
                        Join Queue
                      </>
                    ) : (
                      <>
                        <Trophy className='h-4 w-4 mr-2' />
                        View Results
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}