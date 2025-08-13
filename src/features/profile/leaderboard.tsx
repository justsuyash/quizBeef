import React, { useState } from 'react'
import { useQuery } from 'wasp/client/operations'
import { getLeaderboard } from 'wasp/client/operations'
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
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Star, 
  Target, 
  Flame, 
  TrendingUp,
  Users,
  BarChart3,
  Zap
} from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Leaderboard', href: '/leaderboard', isActive: true },
]

interface LeaderboardUser {
  id: number
  handle?: string
  profileType: string
  totalScore: number
  totalQuizzes: number
  totalBeefWins: number
  averageAccuracy?: number
  winStreak: number
  longestWinStreak: number
  joinedAt: string
  favoriteSubject?: string
  rank: number
  beefWinRate: number
  _count: {
    beefParticipations: number
  }
}

export default function LeaderboardPage() {
  const { data: user } = useAuth()
  const [selectedTab, setSelectedTab] = useState('total_score')
  
  const { data: leaderboard, isLoading, error } = useQuery(getLeaderboard, {
    type: selectedTab as any,
    limit: 100
  })

  const getPositionIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getPositionBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
    }
    
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
      case 2:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800'
      case 3:
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
      default:
        return 'hover:bg-muted/50'
    }
  }

  const getTabTitle = (tabValue: string) => {
    switch (tabValue) {
      case 'total_score':
        return 'Total Score'
      case 'beef_wins':
        return 'Beef Wins'
      case 'accuracy':
        return 'Accuracy'
      case 'total_quizzes':
        return 'Quiz Count'
      default:
        return 'Leaderboard'
    }
  }

  const getTabIcon = (tabValue: string) => {
    switch (tabValue) {
      case 'total_score':
        return <Trophy className="h-4 w-4" />
      case 'beef_wins':
        return <Flame className="h-4 w-4" />
      case 'accuracy':
        return <Target className="h-4 w-4" />
      case 'total_quizzes':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Trophy className="h-4 w-4" />
    }
  }

  const getMetricValue = (user: LeaderboardUser, metric: string) => {
    switch (metric) {
      case 'total_score':
        return user.totalScore.toLocaleString()
      case 'beef_wins':
        return user.totalBeefWins.toString()
      case 'accuracy':
        return user.averageAccuracy ? `${user.averageAccuracy.toFixed(1)}%` : '0%'
      case 'total_quizzes':
        return user.totalQuizzes.toString()
      default:
        return user.totalScore.toLocaleString()
    }
  }

  const getMetricSubtext = (user: LeaderboardUser, metric: string) => {
    switch (metric) {
      case 'total_score':
        return `${user.totalQuizzes} quizzes`
      case 'beef_wins':
        return `${user.beefWinRate.toFixed(1)}% win rate`
      case 'accuracy':
        return `${user.totalQuizzes} quizzes`
      case 'total_quizzes':
        return `Avg: ${user.totalQuizzes > 0 ? (user.totalScore / user.totalQuizzes).toFixed(0) : 0} pts`
      default:
        return ''
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
            <p className='text-muted-foreground'>Loading leaderboard...</p>
          </div>
        </Main>
      </>
    )
  }

  if (error || !leaderboard) {
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
            <Trophy className='h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50' />
            <h3 className='text-lg font-medium mb-2'>Leaderboard Unavailable</h3>
            <p className='text-muted-foreground mb-4'>
              Unable to load leaderboard data at this time.
            </p>
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
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3 mb-2'>
            <Trophy className='h-8 w-8 text-yellow-500' />
            Quiz Beef Leaderboard
          </h1>
          <p className='text-muted-foreground'>
            Compete with the best quiz masters and beef champions
          </p>
        </div>

        {/* Summary Stats */}
        <div className='grid gap-4 md:grid-cols-4 mb-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Players</CardTitle>
              <Users className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{leaderboard.length}</div>
              <p className='text-xs text-muted-foreground'>
                Active competitors
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Top Score</CardTitle>
              <Crown className='h-4 w-4 text-yellow-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {leaderboard.length > 0 ? leaderboard[0].totalScore.toLocaleString() : '0'}
              </div>
              <p className='text-xs text-muted-foreground'>
                {leaderboard.length > 0 ? `by @${leaderboard[0].handle}` : 'No data'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Beef Champion</CardTitle>
              <Flame className='h-4 w-4 text-orange-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {leaderboard.length > 0 
                  ? Math.max(...leaderboard.map(u => u.totalBeefWins))
                  : '0'
                }W
              </div>
              <p className='text-xs text-muted-foreground'>
                Most beef wins
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Best Accuracy</CardTitle>
              <Target className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {leaderboard.length > 0 
                  ? Math.max(...leaderboard.map(u => u.averageAccuracy || 0)).toFixed(1)
                  : '0'
                }%
              </div>
              <p className='text-xs text-muted-foreground'>
                Top accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {getTabIcon(selectedTab)}
              {getTabTitle(selectedTab)} Leaderboard
            </CardTitle>
            <CardDescription>
              Click on any username to view their profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="total_score" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span className="hidden sm:inline">Total Score</span>
                  <span className="sm:hidden">Score</span>
                </TabsTrigger>
                <TabsTrigger value="beef_wins" className="flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  <span className="hidden sm:inline">Beef Wins</span>
                  <span className="sm:hidden">Wins</span>
                </TabsTrigger>
                <TabsTrigger value="accuracy" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Accuracy</span>
                  <span className="sm:hidden">Acc</span>
                </TabsTrigger>
                <TabsTrigger value="total_quizzes" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Quiz Count</span>
                  <span className="sm:hidden">Quizzes</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-6">
                <div className='space-y-2'>
                  {(leaderboard as LeaderboardUser[]).map((leaderboardUser) => {
                    const isCurrentUser = user?.id === leaderboardUser.id
                    
                    return (
                      <div
                        key={leaderboardUser.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all cursor-pointer ${getPositionBg(leaderboardUser.rank, isCurrentUser)}`}
                        onClick={() => window.location.href = `/user/${leaderboardUser.id}`}
                      >
                        <div className='flex items-center gap-4'>
                          <div className='flex items-center justify-center w-10 h-10'>
                            {getPositionIcon(leaderboardUser.rank)}
                          </div>
                          
                          <Avatar className='h-10 w-10'>
                            <AvatarImage 
                              src={`/avatars/user-${leaderboardUser.id}.jpg`} 
                              alt={`@${leaderboardUser.handle}`} 
                            />
                            <AvatarFallback>
                              {(leaderboardUser.handle || 'U').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className='flex items-center gap-2'>
                              <span className={`font-semibold ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                @{leaderboardUser.handle || `user${leaderboardUser.id}`}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="secondary" className='text-xs'>You</Badge>
                              )}
                              {leaderboardUser.profileType === 'KID' && (
                                <Badge variant="outline" className='text-xs'>Kid</Badge>
                              )}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {getMetricSubtext(leaderboardUser, selectedTab)}
                              {leaderboardUser.favoriteSubject && (
                                <span className='ml-2'>• {leaderboardUser.favoriteSubject}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className='text-right'>
                          <div className='text-2xl font-bold'>
                            {getMetricValue(leaderboardUser, selectedTab)}
                          </div>
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            {leaderboardUser.winStreak > 0 && (
                              <div className='flex items-center gap-1'>
                                <TrendingUp className='h-3 w-3' />
                                <span>{leaderboardUser.winStreak}</span>
                              </div>
                            )}
                            {leaderboardUser.longestWinStreak >= 5 && (
                              <div className='flex items-center gap-1'>
                                <Zap className='h-3 w-3 text-yellow-500' />
                                <span>{leaderboardUser.longestWinStreak}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {leaderboard.length === 0 && (
                    <div className='text-center py-12'>
                      <Trophy className='h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50' />
                      <h3 className='text-lg font-medium mb-2'>No Rankings Yet</h3>
                      <p className='text-muted-foreground mb-4'>
                        Be the first to appear on the leaderboard by taking quizzes!
                      </p>
                      <Button onClick={() => window.location.href = '/documents'}>
                        Start Learning
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Call to Action */}
        {user && leaderboard.length > 0 && (
          <Card className='mt-6'>
            <CardContent className='pt-6'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold mb-2'>Ready to Climb the Rankings?</h3>
                <p className='text-muted-foreground mb-4'>
                  Upload documents, take quizzes, and challenge others to beef matches!
                </p>
                <div className='flex gap-2 justify-center'>
                  <Button onClick={() => window.location.href = '/documents'}>
                    Start Learning
                  </Button>
                  <Button variant="outline" onClick={() => window.location.href = '/beef'}>
                    <Flame className='h-4 w-4 mr-2' />
                    Join Beef Challenges
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </Main>
    </>
  )
}
