import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getUserAnalytics, getLearningProgress, getPerformanceTrends, getUserAchievements, getLeaderboard, getCategoryMetrics, getOptimalLearningTime, getEnrichedAnalytics, getQuizHistory, startQuiz, getStatsOverview, startCategoryPractice, getQloHistory, getUserGroups, getGroupLeaderboard } from 'wasp/client/operations'
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
import { Tooltip as UITooltip, TooltipTrigger as UITooltipTrigger, TooltipContent as UITooltipContent, TooltipProvider as UITooltipProvider } from '../../components/ui/tooltip'
import { Button } from '../../components/ui/button'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
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
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import GroupLeaderboardCard from '../profile/components/GroupLeaderboardCard'
import { Checkbox } from '../../components/ui/checkbox'

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

// Shared KPI title with unified tooltip behavior
function KpiTitle({ title, info }: { title: string; info?: string }) {
  return (
    <CardTitle className="text-sm font-medium flex items-center gap-1">
      {title}
      {info ? (
        <UITooltip>
          <UITooltipTrigger asChild>
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted text-[10px] font-semibold cursor-default">i</span>
          </UITooltipTrigger>
          <UITooltipContent>{info}</UITooltipContent>
        </UITooltip>
      ) : null}
    </CardTitle>
  )
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
  // Overview range switcher (7/30/90) with URL persistence
  const [searchParams, setSearchParams] = useSearchParams()
  const chartsRangeParam = Number(searchParams.get('chartsRange') || 30)
  const chartsRange = [7, 30, 90].includes(chartsRangeParam) ? chartsRangeParam : 30
  // Overview KPI selector (7d, 30d, 90d, YTD, all)
  const rawOverviewParam = (searchParams.get('overviewRange') || '30d')
  const periodParam = rawOverviewParam === '1y' ? 'ytd' : rawOverviewParam
  const nowForYtd = new Date()
  const startOfYear = new Date(nowForYtd.getFullYear(), 0, 1)
  const ytdDays = Math.floor((nowForYtd.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const periodDaysMap: Record<string, number | null> = { '7d': 7, '30d': 30, '90d': 90, 'ytd': ytdDays, 'all': null }
  const periodDays = periodDaysMap[periodParam] ?? 30
  const { data: overview, isLoading: overviewLoading } = useQuery(getStatsOverview, { range: chartsRange, periodDays: periodDays ?? undefined })
  const [leaderboardFilter, setLeaderboardFilter] = React.useState({
    country: 'all',
    county: 'all',
    city: 'all'
  })
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(getLeaderboard, leaderboardFilter)
  const { data: historyData, isLoading: historyLoading } = useQuery(getQuizHistory)
  const [retakeLoadingId, setRetakeLoadingId] = React.useState<number | null>(null)
  const { data: qloSeries } = useQuery(getQloHistory)
  // Group leaderboard wiring
  const [selectedGroupId, setSelectedGroupId] = React.useState<number | null>(null)
  const [selectedGroupMetric, setSelectedGroupMetric] = React.useState<'qlo'|'quiz_score'|'beef_wins'|'accuracy'|'total_quizzes'>('qlo')
  const { data: myGroups } = useQuery(getUserGroups)
  const { data: groupLeaderboard } = useQuery(
    getGroupLeaderboard,
    selectedGroupId ? { groupId: selectedGroupId, type: selectedGroupMetric } : undefined,
    { enabled: !!selectedGroupId }
  )
  React.useEffect(() => {
    if (myGroups && myGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(myGroups[0].id)
    }
  }, [myGroups, selectedGroupId])
  // Keep active tab stable when query params change (e.g., chart range buttons)
  const [tab, setTab] = React.useState('overview')
  // Legend toggles for Statistics charts
  const [showQuizzesCurrent, setShowQuizzesCurrent] = React.useState(true)
  const [showQuizzesPrev, setShowQuizzesPrev] = React.useState(true)
  const [showTopicsCurrent, setShowTopicsCurrent] = React.useState(true)
  const [showTopicsPrev, setShowTopicsPrev] = React.useState(true)


  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Please log in to view analytics</h1>
      </div>
    )
  }

  const isLoading = analyticsLoading || progressLoading || performanceLoading || achievementsLoading || categoryLoading || optimalTimeLoading || enrichedLoading || leaderboardLoading || historyLoading || overviewLoading

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
  const chartData = (() => {
    if (overview?.series?.quizzesOverTime) {
      return overview.series.quizzesOverTime.map((p: any, idx: number) => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: p.count,
        prev: overview.series.quizzesOverTimePrev?.[idx] ?? null
      }))
    }
    return []
  })()

  const eloChartData = (() => {
    if (overview?.series?.eloOverTime) {
      return overview.series.eloOverTime.map((p: any) => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: p.value
      }))
    }
    return []
  })()

  const topicsChartData = (() => {
    if (overview?.series?.topicsOverTime) {
      return overview.series.topicsOverTime.map((p: any, idx: number) => ({
        date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: p.count,
        prev: overview.series.topicsOverTimePrev?.[idx] ?? null
      }))
    }
    return []
  })()

  // KPI delta (charts-only): Quizzes vs previous period
  const quizzesCurr = chartData.reduce((s: number, p: any) => s + (p.count || 0), 0)
  const quizzesPrev = chartData.reduce((s: number, p: any) => s + (p.prev || 0), 0)
  // Colors for deltas
  const deltaGreen = '#228B22' // forest green
  const deltaRed = '#800000'   // maroon

  const renderDelta = (curr: number, prev: number | undefined | null, label: string) => {
    const previous = typeof prev === 'number' ? prev : 0
    if (previous === 0) {
      if (curr === 0) return <div className="text-xs mt-1 text-gray-500">--</div>
      // Baseline case: show absolute improvement when no previous data
      return <div className="text-xs mt-1" style={{ color: deltaGreen }}>{`▲ +${Math.round(curr)} vs prev 0`}</div>
    }
    const delta = Math.round(((curr - previous) / previous) * 100)
    if (delta === 0) return <div className="text-xs mt-1 text-gray-500">--</div>
    const color = delta > 0 ? deltaGreen : deltaRed
    const content = `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}% vs prev ${periodParam}`
    return <div className="text-xs mt-1" style={{ color }}>{content}</div>
  }

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

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
          <TabsTrigger value="history">Quiz History</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Range switcher moved into each chart header (charts-only) */}
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
          {/* Overview period selector (applies to KPI deltas only) */}
          <div className="flex items-center gap-2">
            {['7d','30d','90d','ytd','all'].map((key) => (
              <Button key={key} size="sm" variant={periodParam === key ? 'default' : 'outline'} onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('overviewRange', key); return p })}>
                {key.toUpperCase()}
              </Button>
            ))}
          </div>

          <UITooltipProvider>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <KpiTitle title="Total Quizzes" info="Delta compares current period to the immediately previous equal window." />
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQuizAttempts || 0}</div>
                {periodParam !== 'all' && renderDelta(overview?.kpi?.quizzes || 0, overview?.kpiPrev?.quizzes, 'quizzes')}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <KpiTitle title="Accuracy" info="Percentage of correct answers; delta vs previous window." />
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics?.accuracyRate || 0)}%</div>
                {periodParam !== 'all' && renderDelta(overview?.kpi?.accuracy || 0, overview?.kpiPrev?.accuracy, 'accuracy')}
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
                <KpiTitle title="Questions" info="Total questions answered; delta vs previous window." />
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQuestionsAnswered || 0}</div>
                {periodParam !== 'all' && renderDelta(overview?.kpi?.questions || 0, overview?.kpiPrev?.questions, 'questions')}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <KpiTitle title="Category Breadth" info="Unique topics covered in the period; delta vs previous window." />
                <Brain className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enriched?.breadth ?? categoryData?.breadth ?? 0} Topics</div>
                {periodParam !== 'all' && renderDelta(overview?.kpi?.breadth || 0, overview?.kpiPrev?.breadth, 'breadth')}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <KpiTitle title="Category Depth" info="Average mastery depth across topics; informational metric." />
                <Brain className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgCategoryDepth}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <KpiTitle title="Avg. Learning Speed" info="Questions per minute (derived from avg time per question); delta vs previous window." />
                <Clock className="h-4 w-4 text-teal-500" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const avgMs: number = (enriched?.averageLearningSpeed ?? analytics?.averageLearningSpeed ?? 0) as number
                  const qpm = avgMs > 0 ? 60000 / avgMs : 0
                  return <div className="text-2xl font-bold">{qpm.toFixed(1)} Q/Min</div>
                })()}
                {periodParam !== 'all' && (() => {
                  const currMs: number = (overview?.kpi?.avgTimePerQ || 0) as number
                  const prevMs: number | undefined = (overview?.kpiPrev?.avgTimePerQ || 0) as number
                  const currQpm = currMs > 0 ? 60000 / currMs : 0
                  const prevQpm = prevMs && prevMs > 0 ? 60000 / prevMs : 0
                  return renderDelta(currQpm, prevQpm, 'qpm')
                })()}
              </CardContent>
            </Card>
          </div>
          </UITooltipProvider>

          {/* Charts moved to Statistics tab */}

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
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Science','History','Math','Geography'].map((cat) => (
                    <Button key={cat} size="sm" variant="outline" onClick={async () => {
                      try {
                        const defaultSettings = { questionCount: 10, difficultyDistribution: { easy: 40, medium: 40, hard: 20 } }
                        const res = await startCategoryPractice({ category: cat })
                        if (res?.quizAttemptId) {
                          navigate(`/quiz/${res.documentId ?? ''}/take?attemptId=${res.quizAttemptId}`)
                        }
                      } catch (e) {
                        console.warn('startCategoryPractice failed', e)
                      }
                    }}>
                      Practice {cat}
                    </Button>
                  ))}
                </div>
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quizzes Over Time</CardTitle>
                    <CardDescription>Last {chartsRange} days</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 mr-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={showQuizzesCurrent} onCheckedChange={(v) => setShowQuizzesCurrent(v === true)} />
                        Quizzes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={showQuizzesPrev} onCheckedChange={(v) => setShowQuizzesPrev(v === true)} />
                        Previous
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      {[7, 30, 90].map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={chartsRange === r ? 'default' : 'outline'}
                          onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('chartsRange', String(r)); return p })}
                        >
                          {r}d
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    {showQuizzesCurrent && (
                      <Line type="monotone" dataKey="count" name="Quizzes" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    )}
                    {showQuizzesPrev && (
                      <Line type="monotone" dataKey="prev" name="Previous" stroke="#9CA3AF" strokeDasharray="4 4" dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>QLO Over Time</CardTitle>
                    <CardDescription>Last {chartsRange} days</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {[7, 30, 90].map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={chartsRange === r ? 'default' : 'outline'}
                        onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('chartsRange', String(r)); return p })}
                      >
                        {r}d
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={eloChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="value" name="QLO" stroke="#8B5CF6" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Topics Over Time</CardTitle>
                    <CardDescription>Last {chartsRange} days</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 mr-2">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={showTopicsCurrent} onCheckedChange={(v) => setShowTopicsCurrent(v === true)} />
                        Topics
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={showTopicsPrev} onCheckedChange={(v) => setShowTopicsPrev(v === true)} />
                        Previous
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      {[7, 30, 90].map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={chartsRange === r ? 'default' : 'outline'}
                          onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('chartsRange', String(r)); return p })}
                        >
                          {r}d
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {topicsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={topicsChartData}>
                      <defs>
                        <linearGradient id="topicsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      {showTopicsCurrent && (
                        <Area type="monotone" dataKey="count" name="Topics" stroke="#10B981" fill="url(#topicsGrad)" />
                      )}
                      {showTopicsPrev && (
                        <Line type="monotone" dataKey="prev" name="Previous" stroke="#9CA3AF" strokeDasharray="4 4" dot={false} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    No topic activity in the selected range.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Accuracy Over Time</CardTitle>
                    <CardDescription>Rolling daily accuracy (past {chartsRange} days)</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {[7, 30, 90].map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={chartsRange === r ? 'default' : 'outline'}
                        onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('chartsRange', String(r)); return p })}
                      >
                        {r}d
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={(overview?.series?.accuracyOverTime || [])}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0,100]} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="acc" name="Accuracy %" stroke="#16A34A" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Questions Per Minute</CardTitle>
                    <CardDescription>Estimated from average time per question</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {[7, 30, 90].map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={chartsRange === r ? 'default' : 'outline'}
                        onClick={() => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('chartsRange', String(r)); return p })}
                      >
                        {r}d
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={(overview?.series?.qpmOverTime || [])}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="qpm" name="Q/Min" stroke="#0EA5E9" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
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
              <CardHeader className="flex items-center justify-between">
                  <CardTitle>QLO Comparison</CardTitle>
                  {qloSeries && (
                    <div className="text-sm text-muted-foreground">
                      Your QLO: <span className="font-semibold">{qloSeries.currentQlo}</span> • Rank <span className="font-semibold">#{qloSeries.rank}</span> • Percentile <span className="font-semibold">{qloSeries.percentile}%</span>
                    </div>
                  )}
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleDateString()} type="number" domain={['dataMin', 'dataMax']} scale="time" />
                      <YAxis />
                      <RechartsTooltip labelFormatter={(v) => new Date(v as number).toLocaleString()} />
                      {/* Current user series */}
                      {qloSeries?.currentUserId && qloSeries?.series?.[qloSeries.currentUserId] && (
                        <Line dataKey="qlo" data={qloSeries.series[qloSeries.currentUserId]} name="You" stroke="#3B82F6" dot={false} />
                      )}
                      {/* Top users average (simple average across series per timestamp if aligned) */}
                      {(() => {
                        return null
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
            {/* Group Leaderboard (9+1) */}
            <GroupLeaderboardCard />
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
