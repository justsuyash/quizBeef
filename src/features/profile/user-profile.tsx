import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getUserProfile, createBeef } from 'wasp/client/operations'
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
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { useToast } from '../../hooks/use-toast'
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  MapPin, 
  Globe, 
  FileText, 
  Zap, 
  Crown,
  TrendingUp,
  BarChart3,
  Flame,
  Clock,
  Star,
  Medal,
  ArrowLeft,
  MessageCircle
} from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Leaderboard', href: '/leaderboard', isActive: true },
]

interface UserProfile {
  id: number
  handle?: string
  profileType: string
  bio?: string
  location?: string
  website?: string
  joinedAt: string
  totalScore: number
  totalQuizzes: number
  totalBeefWins: number
  winStreak: number
  longestWinStreak: number
  averageAccuracy?: number
  favoriteSubject?: string
  isPublicProfile: boolean
  totalBeefParticipations: number
  beefWins: number
  beefWinRate: number
  averageQuizScore: number
  recentDocuments: any[]
  recentQuizAttempts: any[]
  recentBeefWins: any[]
  stats: {
    totalDocuments: number
    totalQuizAttempts: number
    totalBeefChallengesCreated: number
    totalBeefParticipations: number
  }
  isOwnProfile: boolean
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: profile, isLoading, error } = useQuery(getUserProfile, { 
    userId: parseInt(userId || '0') 
  })
  const createBeefFn = useAction(createBeef)
  const { toast } = useToast()

  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false)

  const handleChallengeUser = async () => {
    if (!profile || !user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to create challenges',
        variant: 'destructive'
      })
      return
    }

    // For now, navigate to documents to create a challenge
    // In a full implementation, you could show a document selector here
    toast({
      title: 'Create a Challenge',
      description: 'Choose a document from your library to create a beef challenge'
    })
    navigate('/documents')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'text-gray-500'
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 80) return 'text-blue-600'
    if (accuracy >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 2:
      case 3:
        return <Medal className="h-4 w-4 text-gray-400" />
      default:
        return <Star className="h-4 w-4 text-blue-500" />
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
            <p className='text-muted-foreground'>Loading profile...</p>
          </div>
        </Main>
      </>
    )
  }

  if (error || !profile) {
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
            <User className='h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50' />
            <h3 className='text-lg font-medium mb-2'>Profile Not Found</h3>
            <p className='text-muted-foreground mb-4'>
              This user profile doesn't exist or is set to private.
            </p>
            <Button onClick={() => navigate('/leaderboard')}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Leaderboard
            </Button>
          </div>
        </Main>
      </>
    )
  }

  const profileData = profile as UserProfile

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
          <Button variant="ghost" size="sm" onClick={() => navigate('/leaderboard')} className='mb-4'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Leaderboard
          </Button>
          
          {/* Profile Header */}
          <Card className='mb-6'>
            <CardContent className='pt-6'>
              <div className='flex flex-col md:flex-row items-start md:items-center gap-6'>
                <div className='flex items-center gap-4'>
                  <Avatar className='h-20 w-20'>
                    <AvatarImage src={`/avatars/user-${profileData.id}.jpg`} alt={`@${profileData.handle}`} />
                    <AvatarFallback className='text-2xl'>
                      {(profileData.handle || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h1 className='text-3xl font-bold flex items-center gap-2'>
                      @{profileData.handle || `user${profileData.id}`}
                      {profileData.profileType === 'KID' && (
                        <Badge variant="secondary" className='text-xs'>
                          Kid
                        </Badge>
                      )}
                    </h1>
                    {profileData.bio && (
                      <p className='text-muted-foreground mt-1'>{profileData.bio}</p>
                    )}
                    
                    <div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-4 w-4' />
                        <span>Joined {formatJoinDate(profileData.joinedAt)}</span>
                      </div>
                      {profileData.location && (
                        <div className='flex items-center gap-1'>
                          <MapPin className='h-4 w-4' />
                          <span>{profileData.location}</span>
                        </div>
                      )}
                      {profileData.website && (
                        <div className='flex items-center gap-1'>
                          <Globe className='h-4 w-4' />
                          <a 
                            href={profileData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className='text-blue-600 hover:underline'
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className='ml-auto flex items-center gap-2'>
                  {!profileData.isOwnProfile && user && (
                    <>
                      <Button variant="outline" size="sm">
                        <MessageCircle className='h-4 w-4 mr-2' />
                        Message
                      </Button>
                      <Dialog open={isChallengeDialogOpen} onOpenChange={setIsChallengeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Flame className='h-4 w-4 mr-2 text-orange-500' />
                            Challenge to Beef
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Challenge @{profileData.handle} to a Beef</DialogTitle>
                            <DialogDescription>
                              Create a quiz challenge from one of your documents
                            </DialogDescription>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <p className='text-sm text-muted-foreground'>
                              To challenge this user, you'll need to create a beef from one of your documents. 
                              They can then join using the challenge code.
                            </p>
                            <div className='flex gap-2'>
                              <Button onClick={handleChallengeUser} className='flex-1'>
                                <Flame className='h-4 w-4 mr-2' />
                                Create Challenge
                              </Button>
                              <Button variant="outline" onClick={() => setIsChallengeDialogOpen(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  
                  {profileData.isOwnProfile && (
                    <Button variant="outline" onClick={() => navigate('/settings/profile')}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className='grid gap-4 md:grid-cols-4 mb-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total Score</CardTitle>
                <Trophy className='h-4 w-4 text-yellow-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{profileData.totalScore.toLocaleString()}</div>
                <p className='text-xs text-muted-foreground'>
                  {profileData.totalQuizzes} quizzes taken
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Beef Record</CardTitle>
                <Flame className='h-4 w-4 text-orange-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{profileData.totalBeefWins}W</div>
                <p className='text-xs text-muted-foreground'>
                  {profileData.beefWinRate.toFixed(1)}% win rate
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Accuracy</CardTitle>
                <Target className='h-4 w-4 text-blue-500' />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getAccuracyColor(profileData.averageAccuracy)}`}>
                  {profileData.averageAccuracy?.toFixed(1) || '0'}%
                </div>
                <p className='text-xs text-muted-foreground'>
                  Average accuracy
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Win Streak</CardTitle>
                <TrendingUp className='h-4 w-4 text-green-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{profileData.winStreak}</div>
                <p className='text-xs text-muted-foreground'>
                  Best: {profileData.longestWinStreak}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="quizzes">Recent Quizzes</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className='grid gap-6 md:grid-cols-2'>
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Clock className='h-5 w-5' />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {profileData.recentQuizAttempts.slice(0, 5).map((attempt) => (
                        <div key={attempt.id} className='flex items-center justify-between p-2 bg-muted rounded'>
                          <div>
                            <p className='font-medium text-sm'>{attempt.document.title}</p>
                            <p className='text-xs text-muted-foreground'>
                              {formatDate(attempt.createdAt)}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {attempt.score} pts
                          </Badge>
                        </div>
                      ))}
                      {profileData.recentQuizAttempts.length === 0 && (
                        <p className='text-sm text-muted-foreground text-center py-4'>
                          No recent quiz activity
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Beef Wins */}
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Crown className='h-5 w-5 text-yellow-500' />
                      Recent Beef Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {profileData.recentBeefWins.slice(0, 5).map((win) => (
                        <div key={win.id} className='flex items-center justify-between p-2 bg-muted rounded'>
                          <div>
                            <p className='font-medium text-sm'>
                              {win.challenge.title || win.challenge.document.title}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {formatDate(win.challenge.createdAt)}
                            </p>
                          </div>
                          <Badge className='bg-yellow-500'>
                            1st Place
                          </Badge>
                        </div>
                      ))}
                      {profileData.recentBeefWins.length === 0 && (
                        <p className='text-sm text-muted-foreground text-center py-4'>
                          No beef wins yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' />
                    Recent Documents
                  </CardTitle>
                  <CardDescription>
                    {profileData.isOwnProfile 
                      ? 'Your recent documents' 
                      : `Recent documents by @${profileData.handle}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-4 md:grid-cols-2'>
                    {profileData.recentDocuments.map((doc) => (
                      <Card key={doc.id} className='hover:shadow-md transition-shadow'>
                        <CardContent className='p-4'>
                          <h4 className='font-semibold mb-2'>{doc.title}</h4>
                          <div className='flex items-center justify-between text-sm text-muted-foreground'>
                            <span>{doc.sourceType}</span>
                            <span>{doc._count.questions} questions</span>
                          </div>
                          <p className='text-xs text-muted-foreground mt-1'>
                            {formatDate(doc.createdAt)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    {profileData.recentDocuments.length === 0 && (
                      <p className='text-sm text-muted-foreground text-center py-8 col-span-2'>
                        No documents available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="quizzes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Quiz History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {profileData.recentQuizAttempts.map((attempt) => (
                      <div key={attempt.id} className='flex items-center justify-between p-3 border rounded-lg'>
                        <div>
                          <h4 className='font-medium'>{attempt.document.title}</h4>
                          <p className='text-sm text-muted-foreground'>
                            {formatDate(attempt.createdAt)}
                          </p>
                        </div>
                        <div className='text-right'>
                          <div className='font-bold text-lg'>{attempt.score}</div>
                          <div className='text-xs text-muted-foreground'>points</div>
                        </div>
                      </div>
                    ))}
                    {profileData.recentQuizAttempts.length === 0 && (
                      <p className='text-sm text-muted-foreground text-center py-8'>
                        No quiz history available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="achievements" className="space-y-4">
              <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Trophy className='h-5 w-5 text-yellow-500' />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      {profileData.totalQuizzes >= 10 && (
                        <div className='flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded'>
                          <Trophy className='h-6 w-6 text-yellow-500' />
                          <div>
                            <p className='font-medium'>Quiz Master</p>
                            <p className='text-xs text-muted-foreground'>Completed 10+ quizzes</p>
                          </div>
                        </div>
                      )}
                      
                      {profileData.totalBeefWins >= 5 && (
                        <div className='flex items-center gap-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded'>
                          <Flame className='h-6 w-6 text-orange-500' />
                          <div>
                            <p className='font-medium'>Beef Champion</p>
                            <p className='text-xs text-muted-foreground'>Won 5+ beef challenges</p>
                          </div>
                        </div>
                      )}
                      
                      {(profileData.averageAccuracy || 0) >= 90 && (
                        <div className='flex items-center gap-3 p-2 bg-green-50 dark:bg-green-950/20 rounded'>
                          <Target className='h-6 w-6 text-green-500' />
                          <div>
                            <p className='font-medium'>Accuracy Expert</p>
                            <p className='text-xs text-muted-foreground'>90%+ average accuracy</p>
                          </div>
                        </div>
                      )}
                      
                      {profileData.longestWinStreak >= 5 && (
                        <div className='flex items-center gap-3 p-2 bg-purple-50 dark:bg-purple-950/20 rounded'>
                          <TrendingUp className='h-6 w-6 text-purple-500' />
                          <div>
                            <p className='font-medium'>Streak Master</p>
                            <p className='text-xs text-muted-foreground'>5+ win streak</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Total Documents:</span>
                        <span className='font-medium'>{profileData.stats.totalDocuments}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Total Quiz Attempts:</span>
                        <span className='font-medium'>{profileData.stats.totalQuizAttempts}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Beef Challenges Created:</span>
                        <span className='font-medium'>{profileData.stats.totalBeefChallengesCreated}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Beef Participations:</span>
                        <span className='font-medium'>{profileData.stats.totalBeefParticipations}</span>
                      </div>
                      {profileData.favoriteSubject && (
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>Favorite Subject:</span>
                          <span className='font-medium'>{profileData.favoriteSubject}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
