import React, { useState } from 'react'
import { useQuery } from 'wasp/client/operations'
import { getGroupLeaderboard, getUserGroups } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { 
  Trophy, 
  Crown, 
  Medal, 
  Users,
  BarChart3,
  TrendingUp
} from 'lucide-react'

interface GroupLeaderboardUser {
  id: number
  handle?: string
  profileType: string
  totalScore: number
  totalQuizzes: number
  totalBeefWins: number
  averageAccuracy?: number
  winStreak: number
  longestWinStreak: number
  eloRating: number
  avatarUrl?: string
  rank: number
  displayIndex: number
  beefWinRate: number
  isCurrentUser: boolean
}

interface GroupInfo {
  id: number
  name: string
  description?: string
  _count: {
    memberships: number
  }
}

export default function GroupLeaderboardPage() {
  const { data: user } = useAuth()
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'elo_rating' | 'quiz_score' | 'beef_wins' | 'accuracy' | 'total_quizzes'>('elo_rating')

  const { data: userGroups, isLoading: groupsLoading } = useQuery(getUserGroups)
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(
    getGroupLeaderboard, 
    selectedGroupId ? { groupId: selectedGroupId, type: selectedMetric } : undefined,
    { enabled: !!selectedGroupId }
  )

  // Auto-select first group if available
  React.useEffect(() => {
    if (userGroups && userGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(userGroups[0].id)
    }
  }, [userGroups, selectedGroupId])

  const getMetricValue = (user: GroupLeaderboardUser) => {
    switch (selectedMetric) {
      case 'quiz_score':
        return user.totalScore
      case 'beef_wins':
        return user.totalBeefWins
      case 'accuracy':
        return Math.round((user.averageAccuracy || 0) * 100)
      case 'total_quizzes':
        return user.totalQuizzes
      case 'elo_rating':
      default:
        return user.eloRating
    }
  }

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'quiz_score':
        return 'Total Score'
      case 'beef_wins':
        return 'Beef Wins'
      case 'accuracy':
        return 'Accuracy %'
      case 'total_quizzes':
        return 'Total Quizzes'
      case 'elo_rating':
      default:
        return 'Elo Rating'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getUserInitials = (handle?: string) => {
    if (!handle) return 'U'
    return handle.substring(0, 2).toUpperCase()
  }

  if (groupsLoading) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </main>
    )
  }

  if (!userGroups || userGroups.length === 0) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
          <p className="text-muted-foreground mb-6">
            You're not a member of any leaderboard groups yet. Groups are created automatically when you participate in quizzes.
          </p>
        </div>
      </main>
    )
  }

  const maxValue = leaderboardData?.leaderboard ? Math.max(...leaderboardData.leaderboard.map(getMetricValue)) : 1
  const memberCount = leaderboardData?.leaderboard?.length || 0
  
  // Calculate bar thickness based on member count (thicker bars for fewer members)
  const getBarThickness = () => {
    if (memberCount <= 5) return 'h-16'
    if (memberCount <= 8) return 'h-12'
    return 'h-10'
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <BarChart3 className='h-8 w-8 text-blue-500' />
          Group Leaderboards
        </h1>
        <p className='text-muted-foreground mt-2'>
          Compete with your group members and see how you rank
        </p>
      </div>

      {/* Group and Metric Selection */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Select Group</label>
          <Select value={selectedGroupId?.toString()} onValueChange={(value) => setSelectedGroupId(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a group" />
            </SelectTrigger>
            <SelectContent>
              {userGroups.map((group: any) => (
                <SelectItem key={group.id} value={group.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{group.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {group.memberCount} members
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Ranking Metric</label>
          <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="elo_rating">Elo Rating</SelectItem>
              <SelectItem value="quiz_score">Total Score</SelectItem>
              <SelectItem value="beef_wins">Beef Wins</SelectItem>
              <SelectItem value="accuracy">Accuracy</SelectItem>
              <SelectItem value="total_quizzes">Total Quizzes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leaderboard Chart */}
      {leaderboardLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 h-8 bg-muted rounded"></div>
                  <div className="w-16 h-6 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                {leaderboardData.group?.name}
              </span>
              <Badge variant="outline">
                {leaderboardData.totalMembers} total members
              </Badge>
            </CardTitle>
            <CardDescription>
              {leaderboardData.group?.description} • Showing top performers by {getMetricLabel().toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboardData.leaderboard.map((player: any, index: number) => {
                const value = getMetricValue(player)
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
                
                return (
                  <div 
                    key={player.id} 
                    className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${
                      player.isCurrentUser 
                        ? 'bg-primary/5 border-primary/30 shadow-md' 
                        : 'bg-card hover:bg-muted/30'
                    }`}
                  >
                    {/* Background Bar */}
                    <div 
                      className={`absolute inset-0 ${getBarThickness()} bg-gradient-to-r transition-all duration-500 ${
                        player.rank === 1 
                          ? 'from-yellow-200 to-yellow-300 dark:from-yellow-900 dark:to-yellow-800' 
                          : player.rank === 2
                          ? 'from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700'
                          : player.rank === 3
                          ? 'from-amber-200 to-amber-300 dark:from-amber-900 dark:to-amber-800'
                          : player.isCurrentUser
                          ? 'from-primary/20 to-primary/30'
                          : 'from-muted/50 to-muted/70'
                      }`}
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                    
                    {/* Content */}
                    <div className={`relative z-10 flex items-center justify-between p-4 ${getBarThickness()}`}>
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(player.rank)}
                        </div>

                        {/* Avatar */}
                        <Avatar className="w-10 h-10 border-2 border-background">
                          <AvatarImage src={player.avatarUrl} />
                          <AvatarFallback className="text-sm font-semibold">
                            {getUserInitials(player.handle)}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold flex items-center gap-2 truncate">
                            {player.handle || `Player ${player.id}`}
                            {player.isCurrentUser && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                            {player.rank <= 3 && (
                              <Badge className={
                                player.rank === 1 ? 'bg-yellow-500 hover:bg-yellow-600' :
                                player.rank === 2 ? 'bg-gray-400 hover:bg-gray-500' :
                                'bg-amber-600 hover:bg-amber-700'
                              }>
                                {player.rank === 1 ? '👑' : player.rank === 2 ? '🥈' : '🥉'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {player.totalQuizzes} quizzes • {player.totalBeefWins} beef wins
                            {player.winStreak > 0 && (
                              <span className="text-orange-500 font-semibold ml-2">
                                🔥 {player.winStreak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metric Value */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">
                          {value.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getMetricLabel()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Current User Rank Info */}
            {leaderboardData.currentUserRank > 10 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground text-center">
                  Your rank: #{leaderboardData.currentUserRank} out of {leaderboardData.totalMembers} members
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">This group doesn't have any quiz activity yet.</p>
        </Card>
      )}
    </main>
  )
}
