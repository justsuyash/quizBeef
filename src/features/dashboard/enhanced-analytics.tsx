import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getUserAnalytics, getLearningProgress, getPerformanceTrends, getUserAchievements, getLeaderboard, getCategoryMetrics, getOptimalLearningTime } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  Trophy, 
  Star, 
  Award, 
  Crown, 
  Flame,
  Target,
  TrendingUp,
  BookOpen,
  Clock,
  Brain,
  CheckCircle2,
  Zap,
  Calendar,
  Sparkles,
  BarChart3
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

const iconMap: Record<string, any> = {
  'graduation-cap': BookOpen,
  'star': Star,
  'trophy': Trophy,
  'flame': Flame,
  'zap': Zap,
  'calendar': Calendar,
  'sparkles': Sparkles,
  'award': Award,
  'crown': Crown
}

const rarityColors: Record<string, string> = {
  'COMMON': '#6B7280',
  'UNCOMMON': '#10B981', 
  'RARE': '#3B82F6',
  'EPIC': '#8B5CF6',
  'LEGENDARY': '#F59E0B'
}

export default function EnhancedAnalytics() {
  const { data: user } = useAuth()
  const { data: analytics, isLoading: analyticsLoading } = useQuery(getUserAnalytics)
  const { data: progressData, isLoading: progressLoading } = useQuery(getLearningProgress)
  const { data: performanceData, isLoading: performanceLoading } = useQuery(getPerformanceTrends)
  const { data: achievementsData, isLoading: achievementsLoading } = useQuery(getUserAchievements)
  const { data: categoryData, isLoading: categoryLoading } = useQuery(getCategoryMetrics)
  const { data: optimalTimeData, isLoading: optimalTimeLoading } = useQuery(getOptimalLearningTime)
  const [leaderboardFilter, setLeaderboardFilter] = React.useState({
    country: 'all',
    county: 'all',
    city: 'all'
  })
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(getLeaderboard, leaderboardFilter)


  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Please log in to view analytics</h1>
      </div>
    )
  }

  const isLoading = analyticsLoading || progressLoading || performanceLoading || achievementsLoading || categoryLoading || optimalTimeLoading || leaderboardLoading

  if (isLoading) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  // Get top 5 hardest/most amazing achievements
  const topAchievements = achievementsData?.achievements
    ?.filter((achievement: any) => achievement.isUnlocked)
    ?.sort((a: any, b: any) => {
      // Sort by rarity (LEGENDARY > EPIC > RARE > UNCOMMON > COMMON)
      const rarityOrder = { LEGENDARY: 5, EPIC: 4, RARE: 3, UNCOMMON: 2, COMMON: 1 }
      return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0)
    })
    ?.slice(0, 5) || []

  // Prepare chart data
  const chartData = progressData?.dailyProgress?.map((day: any, index: number) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: day.averageScore || 0,
    accuracy: day.accuracy || 0,
    questionsAnswered: day.questionsAnswered || 0,
    timeSpent: Math.round((day.timeSpent || 0) / 60), // Convert to minutes
    streak: day.streak || 0
  })) || []

  const difficultyData = performanceData?.difficultyPerformance?.map((difficulty: any) => ({
    name: difficulty.level,
    accuracy: Math.round(difficulty.accuracy),
    count: difficulty.questionsAnswered,
    avgTime: Math.round(difficulty.averageTime / 1000) // Convert to seconds
  })) || []

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          Analytics
        </h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQuizAttempts || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics?.accuracyRate || 0)}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.currentStreak || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Questions</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQuestionsAnswered || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category Breadth</CardTitle>
                <Brain className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoryData?.breadth || 0} Topics</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Learning Speed</CardTitle>
                <Clock className="h-4 w-4 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.averageLearningSpeed?.toFixed(2) || 0}s / Q</div>
              </CardContent>
            </Card>
          </div>

          {/* Quizzes Over Time / Topics Over Time */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quizzes Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Topics Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="topicsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="questionsAnswered" stroke="#10B981" fill="url(#topicsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div>
            <Button variant="outline" onClick={() => (window.location.href = '/quiz-history')}>Quiz History</Button>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Category Performance (Depth)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryData?.metrics} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="category" type="category" width={80} />
                            <Tooltip />
                            <Bar dataKey="depth" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Optimal Learning Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <p className="text-lg text-muted-foreground">Your peak performance time is:</p>
                        <p className="text-4xl font-bold text-green-500">{optimalTimeData?.optimalTime}</p>
                    </div>
                </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Medal Case</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Top 5 achievements (existing) */}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top 5 Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Your Top Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topAchievements.length > 0 ? (
                  topAchievements.map((achievement: any, index: number) => {
                    const IconComponent = iconMap[achievement.iconName] || Award
                    return (
                      <div key={achievement.id} className="flex items-center gap-4 p-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50">
                        <div className="flex-shrink-0">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ 
                              backgroundColor: achievement.iconColor + '20',
                              color: achievement.iconColor
                            }}
                          >
                            <IconComponent className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{achievement.name}</h4>
                            <Badge 
                              variant="outline"
                              style={{ 
                                backgroundColor: rarityColors[achievement.rarity] + '20',
                                borderColor: rarityColors[achievement.rarity],
                                color: rarityColors[achievement.rarity]
                              }}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-yellow-500">
                          #{index + 1}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>
                      {achievementsData?.unlockedCount || 0} / {achievementsData?.totalCount || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${((achievementsData?.unlockedCount || 0) / (achievementsData?.totalCount || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => (window.location.href = '/achievements')}
                >
                  View All Achievements
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboards Tab */}
        <TabsContent value="leaderboards" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
              <Select onValueChange={(value) => setLeaderboardFilter(prev => ({...prev, country: value, county: 'all', city: 'all'}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {[...new Set(leaderboardData?.map((u: any) => u.country).filter(Boolean))]
                    .map((country: any) => <SelectItem key={country} value={country}>{country}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => setLeaderboardFilter(prev => ({...prev, county: value, city: 'all'}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by County" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {[...new Set(leaderboardData?.filter((u: any) => leaderboardFilter.country === 'all' || u.country === leaderboardFilter.country).map((u: any) => u.county).filter(Boolean))]
                    .map((county: any) => <SelectItem key={county} value={county}>{county}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={(value) => setLeaderboardFilter(prev => ({...prev, city: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                   {[...new Set(leaderboardData?.filter((u: any) => (leaderboardFilter.county === 'all' || u.county === leaderboardFilter.county) && (leaderboardFilter.country === 'all' || u.country === leaderboardFilter.country)).map((u: any) => u.city).filter(Boolean))]
                    .map((city: any) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                  <CardTitle>Elo Rating Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leaderboardData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="username" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="eloRating" fill="#82ca9d" />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Learners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(leaderboardData || []).slice(0, 10).map((u: any, i: number) => (
                  <div key={u.id ?? i} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-semibold">{i + 1}</span>
                      <span className="font-medium">{u.handle ?? `User ${i + 1}`}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {u.totalScore ?? 0} pts • {u.totalQuizzes ?? 0} quizzes
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
         </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
