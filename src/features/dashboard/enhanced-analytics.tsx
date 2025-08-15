import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getUserAnalytics, getLearningProgress, getPerformanceTrends, getUserAchievements, getLeaderboard, getCategoryMetrics, getOptimalLearningTime, getEnrichedAnalytics, getQuizHistory, startQuiz, getEloHistory } from 'wasp/client/operations'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

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
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: analytics, isLoading: analyticsLoading } = useQuery(getUserAnalytics)
  const { data: progressData, isLoading: progressLoading } = useQuery(getLearningProgress)
  const { data: performanceData, isLoading: performanceLoading } = useQuery(getPerformanceTrends)
  const { data: achievementsData, isLoading: achievementsLoading } = useQuery(getUserAchievements)
  const { data: categoryData, isLoading: categoryLoading } = useQuery(getCategoryMetrics)
  const { data: optimalTimeData, isLoading: optimalTimeLoading } = useQuery(getOptimalLearningTime)
  const { data: enriched, isLoading: enrichedLoading } = useQuery(getEnrichedAnalytics)
  const [leaderboardFilter, setLeaderboardFilter] = React.useState({
    country: 'all',
    county: 'all',
    city: 'all'
  })
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(getLeaderboard, leaderboardFilter)
  const { data: historyData, isLoading: historyLoading } = useQuery(getQuizHistory)
  const [retakeLoadingId, setRetakeLoadingId] = React.useState<number | null>(null)
  const { data: eloSeries } = useQuery(getEloHistory)


  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Please log in to view analytics</h1>
      </div>
    )
  }

  const isLoading = analyticsLoading || progressLoading || performanceLoading || achievementsLoading || categoryLoading || optimalTimeLoading || enrichedLoading || leaderboardLoading || historyLoading

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

  // Compute Category Depth (overall average) to mirror Category Breadth style
  const avgCategoryDepth = (() => {
    const metrics: any[] | undefined = (categoryData as any)?.metrics || (enriched as any)?.depth
    if (Array.isArray(metrics) && metrics.length > 0) {
      const total = metrics.reduce((sum, m: any) => sum + (m.depth || 0), 0)
      return Math.round(total / metrics.length)
    }
    return 0
  })()

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="history">Quiz History</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Medal Case at top */}
          <Card className="relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Medal Case
              </CardTitle>
              <CardDescription>Your 5 most prestigious achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {topAchievements.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {topAchievements.map((achievement: any, index: number) => {
                    const IconComponent = iconMap[achievement.iconName] || Award
                    const color = rarityColors[achievement.rarity] || '#6B7280'
                    return (
                      <div key={achievement.id} className="group relative flex flex-col items-center text-center">
                        <div 
                          className="h-16 w-16 rounded-full flex items-center justify-center shadow-md ring-2 ring-offset-2"
                          style={{ backgroundColor: color + '20', color, borderColor: color }}
                        >
                          <IconComponent className="h-7 w-7" />
                        </div>
                        <div className="mt-2 text-xs font-medium line-clamp-2">{achievement.name}</div>
                        <Badge 
                          variant="outline" 
                          className="mt-1"
                          style={{ borderColor: color, color }}
                        >
                          {achievement.rarity}
                        </Badge>
                        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-yellow-400 text-white text-xs font-bold flex items-center justify-center shadow">
                          {index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No achievements yet</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                <div className="text-2xl font-bold">{enriched?.breadth ?? categoryData?.breadth ?? 0} Topics</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Category Depth</CardTitle>
                <Brain className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgCategoryDepth}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Learning Speed</CardTitle>
                <Clock className="h-4 w-4 text-teal-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(enriched?.averageLearningSpeed ?? analytics?.averageLearningSpeed ?? 0).toFixed ? (enriched?.averageLearningSpeed ?? analytics?.averageLearningSpeed ?? 0).toFixed(2) : (enriched?.averageLearningSpeed ?? analytics?.averageLearningSpeed ?? 0)}s / Q</div>
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

          {/* Achievements Section: Progress (left) • Gallery (right) */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Achievement Progress (left) */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Progress</CardTitle>
                <CardDescription>Your overall progress towards unlocking all achievements</CardDescription>
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

            {/* Achievements Gallery (right) */}
            <Card>
              <CardHeader>
                <CardTitle>All Achievements</CardTitle>
                <CardDescription>Unlocked and locked achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {(achievementsData?.achievements || []).map((a: any) => {
                    const IconComponent = iconMap[a.iconName] || Award
                    const color = rarityColors[a.rarity] || '#6B7280'
                    return (
                      <div key={a.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            className="h-8 w-8 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: color + '20', color }}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{a.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                          </div>
                        </div>
                        <Badge variant={a.isUnlocked ? 'default' : 'outline'}>
                          {a.isUnlocked ? 'Unlocked' : 'Locked'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Depth and Optimal Learning Time moved from Statistics */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Coach's Corner (replaces Category Performance card) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Coach's Corner
                </CardTitle>
                <CardDescription>Personalized tips based on your recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  {(() => {
                    const tips: string[] = []
                    // Optimal hour insight
                    if (enriched?.optimalHour !== undefined && enriched?.optimalHour !== -1) {
                      const h = enriched.optimalHour as number
                      const fmt = (hh: number) => {
                        if (hh === 0) return '12 AM'
                        if (hh < 12) return `${hh} AM`
                        if (hh === 12) return '12 PM'
                        return `${hh - 12} PM`
                      }
                      tips.push(`You're sharpest around ${fmt(h)}. Schedule a 20–30 min sprint then.`)
                    }
                    // Breadth insight
                    if ((enriched?.breadth ?? categoryData?.breadth ?? 0) < 3) {
                      tips.push('Broaden your topics this week to strengthen category breadth.')
                    } else {
                      tips.push('Nice breadth across topics. Consider deepening weaker areas for higher gains.')
                    }
                    // Learning speed insight
                    const speed = (enriched?.averageLearningSpeed ?? analytics?.averageLearningSpeed ?? 0) as number
                    if (speed && speed > 30000) {
                      tips.push('Your average time per question is high. Try Rapid Fire for speed practice.')
                    } else if (speed && speed < 12000) {
                      tips.push('Great pace! Consider Precision mode to push accuracy even higher.')
                    }
                    return tips.map((t, i) => <li key={i}>{t}</li>)
                  })()}
                </ul>
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
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {/* (Category Depth, Optimal Learning, Medal Case moved to Overview tab) */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Drill-down stats and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">More detailed analytics will appear here.</p>
            </CardContent>
          </Card>
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
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleDateString()} type="number" domain={['dataMin', 'dataMax']} scale="time" />
                      <YAxis />
                      <Tooltip labelFormatter={(v) => new Date(v as number).toLocaleString()} />
                      {/* Current user series */}
                      {eloSeries?.currentUserId && eloSeries?.series?.[eloSeries.currentUserId] && (
                        <Line dataKey="elo" data={eloSeries.series[eloSeries.currentUserId]} name="You" stroke="#3B82F6" dot={false} />
                      )}
                      {/* Top users average (simple average across series per timestamp if aligned) */}
                      {(() => {
                        if (!eloSeries?.series) return null
                        const others = Object.entries(eloSeries.series).filter(([uid]) => Number(uid) !== eloSeries.currentUserId)
                        if (others.length === 0) return null
                        // Flatten and group by timestamp (coarse by day)
                        const points: Record<string, number[]> = {}
                        for (const [, arr] of others) {
                          for (const p of arr as any[]) {
                            const day = new Date(p.t).toISOString().split('T')[0]
                            if (!points[day]) points[day] = []
                            points[day].push(p.elo)
                          }
                        }
                        const avg = Object.entries(points).map(([day, list]) => ({ t: new Date(day).getTime(), elo: Math.round(list.reduce((a, b) => a + b, 0) / list.length) }))
                        return <Line dataKey="elo" data={avg} name="Top Avg" stroke="#10B981" dot={false} />
                      })()}
                    </LineChart>
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
                      {u.id ? (
                        <span
                          onClick={() => navigate(`/user/${u.id}`)}
                          className="font-medium hover:underline cursor-pointer"
                        >
                          {u.handle ?? `User ${i + 1}`}
                        </span>
                      ) : (
                        <span className="font-medium">{u.handle ?? `User ${i + 1}`}</span>
                      )}
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

        {/* Quiz History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quiz History</CardTitle>
                  <CardDescription>Your recent completed quizzes</CardDescription>
                </div>
                <Button variant="outline" onClick={() => (window.location.href = '/quiz-history')}>View Full History</Button>
              </div>
            </CardHeader>
            <CardContent>
              {(!historyData || historyData.length === 0) ? (
                <div className="text-center text-muted-foreground py-12">No quiz history yet.</div>
              ) : (
                <div className="w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Questions</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(historyData || []).slice(0, 10).map((row: any) => (
                        <TableRow key={row.id} className="hover:bg-muted/50">
                          <TableCell>{row.completedAt ? new Date(row.completedAt).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="truncate max-w-[240px]">{row.documentTitle}</TableCell>
                          <TableCell className="text-right font-medium">{Math.round(row.score)}%</TableCell>
                          <TableCell className="text-right">{row.correctAnswers}/{row.totalQuestions}</TableCell>
                          <TableCell className="text-right">{row.timeSpent}s</TableCell>
                          <TableCell className="text-right space-x-2 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => (window.location.href = `/quiz/${row.id}/results`)}
                            >
                              Review
                            </Button>
                            <Button
                              size="sm"
                              disabled={retakeLoadingId === row.id}
                              onClick={async () => {
                                try {
                                  setRetakeLoadingId(row.id)
                                  const defaultSettings = {
                                    questionCount: 10,
                                    difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
                                  }
                                  const result = await startQuiz({ documentId: row.documentId, settings: defaultSettings })
                                  navigate(`/quiz/${row.documentId}/take?attemptId=${result.quizAttemptId}`)
                                } finally {
                                  setRetakeLoadingId(null)
                                }
                              }}
                            >
                              {retakeLoadingId === row.id ? 'Starting…' : 'Retake'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
