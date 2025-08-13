import React, { useState } from 'react'
import { useQuery } from 'wasp/client/operations'
import { getLeaderboard } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
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
    beefParticipant: number
  }
}

export default function LeaderboardPage() {
  const { data: user } = useAuth()
  const { data: leaderboard, isLoading } = useQuery(getLeaderboard)
  const [selectedPeriod, setSelectedPeriod] = useState('all-time')

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return (
        <Badge className={
          rank === 1 ? 'bg-yellow-500 hover:bg-yellow-600' :
          rank === 2 ? 'bg-gray-400 hover:bg-gray-500' :
          'bg-amber-600 hover:bg-amber-700'
        }>
          {rank === 1 ? '👑 Champion' : rank === 2 ? '🥈 Runner-up' : '🥉 Third Place'}
        </Badge>
      )
    }
    return <Badge variant="outline">#{rank}</Badge>
  }

  const getUserInitials = (handle?: string) => {
    if (!handle) return 'U'
    return handle.substring(0, 2).toUpperCase()
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <Trophy className='h-8 w-8 text-yellow-500' />
          Leaderboard 🏆
        </h1>
        <p className='text-muted-foreground mt-2'>
          See how you stack up against the best quiz champions
        </p>
      </div>

      {/* Tabs for different time periods */}
      <Tabs defaultValue="all-time" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
          <TabsTrigger value="daily">Today</TabsTrigger>
        </TabsList>

        <TabsContent value="all-time" className="space-y-6">
          {/* Top 3 Podium */}
          {leaderboard && leaderboard.length >= 3 && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Second Place */}
              <Card className="border-2 border-gray-200 dark:border-gray-700">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Medal className="w-12 h-12 text-gray-400" />
                  </div>
                  <CardTitle className="text-lg">{leaderboard[1]?.handle || 'Player 2'}</CardTitle>
                  <Badge variant="secondary">2nd Place</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">{leaderboard[1]?.totalScore || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                  <div className="text-sm">{leaderboard[1]?.totalQuizzes || 0} quizzes</div>
                </CardContent>
              </Card>

              {/* First Place - Bigger */}
              <Card className="border-4 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Crown className="w-16 h-16 text-yellow-500" />
                  </div>
                  <CardTitle className="text-xl">{leaderboard[0]?.handle || 'Champion'}</CardTitle>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">👑 Champion</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-3xl font-bold text-yellow-600">{leaderboard[0]?.totalScore || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                  <div className="text-sm">{leaderboard[0]?.totalQuizzes || 0} quizzes</div>
                  <div className="text-sm text-yellow-600 font-semibold">
                    🔥 {leaderboard[0]?.winStreak || 0} win streak
                  </div>
                </CardContent>
              </Card>

              {/* Third Place */}
              <Card className="border-2 border-amber-200 dark:border-amber-700">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Medal className="w-12 h-12 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">{leaderboard[2]?.handle || 'Player 3'}</CardTitle>
                  <Badge variant="outline" className="border-amber-600 text-amber-600">3rd Place</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">{leaderboard[2]?.totalScore || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                  <div className="text-sm">{leaderboard[2]?.totalQuizzes || 0} quizzes</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Full Rankings
              </CardTitle>
              <CardDescription>
                Complete leaderboard with detailed stats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 animate-pulse">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                      <div className="h-8 w-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : !leaderboard || leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No rankings yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to complete quizzes and claim the top spot!
                  </p>
                  <Button asChild>
                    <Link to="/home">
                      <Zap className="w-4 h-4 mr-2" />
                      Start Playing
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        player.id === user?.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12">
                          {getRankIcon(index + 1)}
                        </div>

                        {/* Avatar & Info */}
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={`/avatars/${player.id}.png`} />
                            <AvatarFallback>{getUserInitials(player.handle)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {player.handle || `Player ${player.id}`}
                              {player.id === user?.id && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {player.totalQuizzes} quizzes • {player.totalBeefWins} beef wins
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right space-y-1">
                        <div className="text-xl font-bold text-primary">
                          {player.totalScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {player.averageAccuracy ? `${player.averageAccuracy}% avg` : 'No data'}
                        </div>
                        {player.winStreak > 0 && (
                          <div className="text-xs text-orange-500 font-semibold">
                            🔥 {player.winStreak} streak
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other time periods - placeholder content */}
        <TabsContent value="monthly">
          <Card className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Monthly Rankings</h3>
            <p className="text-muted-foreground">Coming soon in the next update!</p>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Weekly Rankings</h3>
            <p className="text-muted-foreground">Coming soon in the next update!</p>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <Card className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Daily Rankings</h3>
            <p className="text-muted-foreground">Coming soon in the next update!</p>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}