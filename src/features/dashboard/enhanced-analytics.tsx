import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getUserAnalytics, getLearningProgress, getPerformanceTrends, getUserAchievements, getLeaderboard, getCategoryMetrics, getOptimalLearningTime, getEnrichedAnalytics, getQuizHistory, startQuiz, getStatsOverview, startCategoryPractice, getQloHistory, getUserGroups, getGroupLeaderboard, getRivalsList, getRivalHeadToHead } from 'wasp/client/operations'
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
import QuizHistoryTable from '../quiz/components/QuizHistoryTable'
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

// Discrete slider ticks and positions for docking
const TICKS = ['7d','30d','90d','All'] as const
const TICK_TO_DAYS = [7, 30, 90, Infinity] as const
const TICK_POS = [0, 33, 66, 100] as const // percentages along track
const SNAP_EPS = 4 // percent

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
  // Rivals panel visibility
  const [showRivals, setShowRivals] = React.useState(false)
  const rivalsPanelRef = React.useRef<HTMLDivElement | null>(null)
  // Rivals data (queried regardless; panel uses them when open)
  const { data: rivalsListData } = useQuery(getRivalsList)
  // Head-to-Head infinite scroll state
  const PAGE_SIZE = 20
  const [h2hPage, setH2hPage] = React.useState(1)
  const [h2hItems, setH2hItems] = React.useState<any[]>([])
  const [h2hTotal, setH2hTotal] = React.useState(0)
  const { data: rivalH2HPage } = useQuery(getRivalHeadToHead, { page: h2hPage, pageSize: PAGE_SIZE })
  React.useEffect(() => {
    if (!rivalH2HPage) return
    setH2hItems(prev => (h2hPage === 1 ? rivalH2HPage.items : [...prev, ...rivalH2HPage.items]))
    setH2hTotal(rivalH2HPage.total || 0)
  }, [rivalH2HPage])
  // Reset pagination when panel re-opens
  React.useEffect(() => {
    if (showRivals) {
      setH2hPage(1)
      // when page 1 data arrives, useEffect above will reset items
      // Scroll panel into view when opened
      setTimeout(() => {
        try { rivalsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
      }, 0)
    }
  }, [showRivals])
  // Overview range switcher (7/30/90) with URL persistence
  const [searchParams, setSearchParams] = useSearchParams()
  // Button-based ranges per chart (0=7d,1=30d,2=90d,3=All)
  const [quizRangeIdx, setQuizRangeIdx] = React.useState<number>(1)
  const [qloRangeIdx, setQloRangeIdx] = React.useState<number>(1)
  const [topicsRangeIdx, setTopicsRangeIdx] = React.useState<number>(1)
  const [beefsRangeIdx, setBeefsRangeIdx] = React.useState<number>(1)
  const [rivalsRangeIdx, setRivalsRangeIdx] = React.useState<number>(1)

  const getDaysForIdx = (idx: number) => TICK_TO_DAYS[Math.max(0, Math.min(3, idx))]
  // Server fetch window is max among charts (cap at 90 for perf)
  const chartsRange = (() => {
    const days = Math.max(
      getDaysForIdx(quizRangeIdx) || 0,
      getDaysForIdx(qloRangeIdx) || 0,
      getDaysForIdx(topicsRangeIdx) || 0,
      getDaysForIdx(beefsRangeIdx) || 0,
      getDaysForIdx(rivalsRangeIdx) || 0
    )
    return days === Infinity ? 90 : days
  })()
  // Helper to apply client-side slicing based on both thumbs
  const sliceByRange = React.useCallback(<T,>(rows: T[], accessor: (r: T) => Date, idx: number) => {
    if (!Array.isArray(rows) || rows.length === 0) return rows
    const rightDays = getDaysForIdx(idx)
    const msDay = 24 * 60 * 60 * 1000
    const endTs = rows.reduce((max, row) => Math.max(max, accessor(row).getTime()), 0) // latest point in series
    const rightWindowDays = rightDays === Infinity ? 3650 : rightDays
    const startTs = endTs - rightWindowDays * msDay
    const endVisibleTs = endTs
    return rows.filter((row) => {
      const t = accessor(row).getTime()
      return t >= startTs && t <= endVisibleTs
    })
  }, [])
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())
  // Overview KPI selector (7d, 30d, 90d, YTD, all)
  const rawOverviewParam = (searchParams.get('overviewRange') || '30d')
  const periodParam = rawOverviewParam === '1y' ? 'ytd' : rawOverviewParam
  const nowForYtd = new Date()
  const startOfYear = new Date(nowForYtd.getFullYear(), 0, 1)
  const ytdDays = Math.floor((nowForYtd.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const periodDaysMap: Record<string, number | null> = { '7d': 7, '30d': 30, '90d': 90, 'ytd': ytdDays, 'all': null }
  const periodDays = periodDaysMap[periodParam] ?? 30
  const { data: overview, isLoading: overviewLoading } = useQuery(getStatsOverview, { range: chartsRange, periodDays: periodDays ?? undefined, year: selectedYear })
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

  // Activity heatmap (GitHub-style) helpers
  const activityByDate = React.useMemo(() => {
    const map = new Map<string, number>()
    const list: Array<{ date: string; count: number }> = (overview?.series?.activityHeatmap || [])
    for (const item of list) {
      map.set(item.date, item.count)
    }
    return map
  }, [overview])

  const activityWeeks = React.useMemo(() => {
    if (!overview?.series?.activityHeatmap) return [] as Array<Array<{ date: string; count: number }>>
    const start = new Date(selectedYear, 0, 1)
    start.setHours(0, 0, 0, 0)
    // Always show full year through Dec 31
    const end = new Date(selectedYear, 11, 31)
    end.setHours(23, 59, 59, 999)
    // Align to full weeks (Sun-Sat)
    const startAlign = new Date(start)
    while (startAlign.getDay() !== 0) startAlign.setDate(startAlign.getDate() - 1)
    const endAlign = new Date(end)
    while (endAlign.getDay() !== 6) endAlign.setDate(endAlign.getDate() + 1)

    const weeks: Array<Array<{ date: string; count: number }>> = []
    const cur = new Date(startAlign)
    while (cur <= endAlign) {
      const week: Array<{ date: string; count: number }> = []
      for (let i = 0; i < 7; i++) {
        const key = cur.toISOString().split('T')[0]
        const count = activityByDate.get(key) || 0
        week.push({ date: key, count })
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push(week)
    }
    return weeks
  }, [activityByDate, overview, selectedYear])

  const maxHeat = React.useMemo(() => {
    let m = 0
    activityByDate.forEach((v) => { if (v > m) m = v })
    return m || 1
  }, [activityByDate])

  // Continuous rose color scale for a more professional, smooth look
  const heatColor = React.useCallback((count: number) => {
    const pct = Math.max(0, Math.min(1, count / maxHeat))
    // Rose hue ~345, keep high saturation, vary lightness from 96% (low) to 45% (high)
    const light = 96 - pct * 51
    return `hsl(345 85% ${light}%)`
  }, [maxHeat])

  const heatBorder = React.useCallback((count: number) => {
    const pct = Math.max(0, Math.min(1, count / maxHeat))
    const light = 90 - pct * 50
    return `hsl(345 70% ${light}%)`
  }, [maxHeat])

  const cellStyle = React.useCallback((count: number): React.CSSProperties => ({
    backgroundColor: count > 0 ? heatColor(count) : undefined,
    borderColor: count > 0 ? heatBorder(count) : undefined
  }), [heatColor, heatBorder])

  const monthLabels = React.useMemo(() => {
    const labels: Record<number, string> = {}
    let prevMonth = -1
    const firstOfYear = new Date(selectedYear, 0, 1)
    firstOfYear.setHours(0,0,0,0)
    activityWeeks.forEach((week, wi) => {
      const d = week[0] ? new Date(week[0].date) : null
      if (!d) return
      if (d < firstOfYear) return // avoid showing Dec label before Jan when grid aligns to Sunday
      const m = d.getMonth()
      if (m !== prevMonth) {
        labels[wi] = d.toLocaleString('en-US', { month: 'short' })
        prevMonth = m
      }
    })
    return labels
  }, [activityWeeks, selectedYear])

  const weeksCount = React.useMemo(() => activityWeeks.length, [activityWeeks])
  const todayMidnight = React.useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t }, [])
  React.useEffect(() => {
    if (myGroups && myGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(myGroups[0].id)
    }
  }, [myGroups, selectedGroupId])
  // Keep active tab stable when query params change (e.g., chart range buttons)
  // Tab selection with querystring support
  const initialTab = React.useMemo(() => {
    const p = new URLSearchParams(window.location.search)
    const t = p.get('tab')
    return t === 'leaderboards' || t === 'history' || t === 'statistics' ? t : 'overview'
  }, [])
  const [tab, setTab] = React.useState(initialTab)
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    p.set('tab', tab)
    const url = `${window.location.pathname}?${p.toString()}`
    window.history.replaceState({}, '', url)
  }, [tab])
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
  type QuizPoint = { d: Date; count: number; prev: number | null }
  type QloPoint = { d: Date; value: number }
  type TopicPoint = { d: Date; count: number; prev: number | null }
  const chartData = (() => {
    if (overview?.series?.quizzesOverTime) {
      // Slice by slider thumbs
      const raw: QuizPoint[] = overview.series.quizzesOverTime.map((p: any, idx: number) => ({
        d: new Date(p.date),
        count: p.count,
        prev: overview.series.quizzesOverTimePrev?.[idx] ?? null
      }))
      // If drag-zoom is active, slice by zoom; otherwise by slider
      const sliced = sliceByRange<QuizPoint>(raw, (r) => r.d, quizRangeIdx)
      return sliced.map((r: QuizPoint) => ({
        date: r.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: r.count,
        prev: r.prev
      }))
    }
    return []
  })()

  const eloChartData = (() => {
    if (overview?.series?.eloOverTime) {
      const raw: QloPoint[] = overview.series.eloOverTime.map((p: any) => ({ d: new Date(p.date), value: p.value }))
      const sliced = sliceByRange<QloPoint>(raw, (r) => r.d, qloRangeIdx)
      return sliced.map((r: QloPoint) => ({
        date: r.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: r.value
      }))
    }
    return []
  })()

  const topicsChartData = (() => {
    if (overview?.series?.topicsOverTime) {
      const raw: TopicPoint[] = overview.series.topicsOverTime.map((p: any, idx: number) => ({
        d: new Date(p.date),
        count: p.count,
        prev: overview.series.topicsOverTimePrev?.[idx] ?? null
      }))
      const sliced = sliceByRange<TopicPoint>(raw, (r) => r.d, topicsRangeIdx)
      return sliced.map((r: TopicPoint) => ({
        date: r.d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: r.count,
        prev: r.prev
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
            {/* Small‑multiple AUC minis removed per design choice */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quizzes Over Time</CardTitle>
                    <CardDescription>Last {chartsRange} days</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {['7d','30d','90d','All'].map((lbl, idx) => (
                      <Button key={lbl} size="sm" variant={quizRangeIdx===idx?'default':'outline'} onClick={()=>setQuizRangeIdx(idx)}>{lbl}</Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="quizzesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.24}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.04}/>
                      </linearGradient>
                      <linearGradient id="quizzesPrevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    {showQuizzesPrev && (
                      <Area type="monotone" dataKey="prev" name="Previous" stroke="#9CA3AF" fill="url(#quizzesPrevGrad)" dot={false} />
                    )}
                    {showQuizzesCurrent && (
                      <Area type="monotone" dataKey="count" name="Quizzes" stroke="#3B82F6" fill="url(#quizzesGrad)" dot={false} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
                {/* Full-width slider below chart */}
                {/* Remove slider: drag to zoom */}
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
                    {['7d','30d','90d','All'].map((lbl, idx) => (
                      <Button key={lbl} size="sm" variant={qloRangeIdx===idx?'default':'outline'} onClick={()=>setQloRangeIdx(idx)}>{lbl}</Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={eloChartData}>
                    <defs>
                      <linearGradient id="qloGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.24}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.04}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="value" name="QLO" stroke="#8B5CF6" fill="url(#qloGrad)" dot={false} />
                  </AreaChart>
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
                      {['7d','30d','90d','All'].map((lbl, idx) => (
                        <Button key={lbl} size="sm" variant={topicsRangeIdx===idx?'default':'outline'} onClick={()=>setTopicsRangeIdx(idx)}>{lbl}</Button>
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
                    <CardTitle>Activity Heatmap</CardTitle>
                    <CardDescription>Quiz attempts + beefs per day</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground mr-1">Year</span>
                    <Tabs value={String(selectedYear)} onValueChange={(v)=> setSelectedYear(parseInt(String(v)))}>
                      <TabsList className="h-7">
                        {Array.from({length: 6}).map((_,i)=>{
                          const y = new Date().getFullYear() - i
                          return (
                            <TabsTrigger key={y} value={String(y)} className="px-2 text-xs">
                              {y}
                            </TabsTrigger>
                          )
                        })}
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 overflow-x-auto">
                  {/* Weekday labels (all days) */}
                  <div className="grid grid-rows-7 gap-1 text-[10px] text-muted-foreground mt-4 select-none" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div key={d} className="h-4 md:h-5 flex items-center">{d}</div>
                    ))}
                  </div>
                  {/* Heatmap grid with month labels */}
                  <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${weeksCount}, minmax(0, 1fr))`, columnGap: '0.375rem' }}>
                    {activityWeeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-1.5 md:gap-2">
                        {/* month label above column for first week of month */}
                        <div className="h-3 text-[10px] text-muted-foreground mb-1 select-none text-center">
                          {monthLabels[wi] || ''}
                        </div>
                        {week.map((d, di) => (
                          <div
                            key={`${d.date}-${di}`}
                            className={`h-4 md:h-5 border rounded-[3px]`}
                            style={(new Date(d.date) > todayMidnight ? { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' } : cellStyle(d.count))}
                            title={new Date(d.date) > todayMidnight ? '' : `${new Date(d.date).toLocaleDateString()} • ${d.count} events`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Less</span>
                    <div className="h-2 w-24 md:w-40 rounded-sm" style={{
                      background: 'linear-gradient(90deg, hsl(345 85% 96%) 0%, hsl(345 85% 45%) 100%)'
                    }} />
                    <span>More</span>
                  </div>
                  <div />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beefs Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end mb-2 gap-2">
                  {['7d','30d','90d','All'].map((lbl, idx) => (
                    <Button key={lbl} size="sm" variant={beefsRangeIdx===idx?'default':'outline'} onClick={()=>setBeefsRangeIdx(idx)}>{lbl}</Button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={sliceByRange((overview?.series?.beefsOverTime || []), (r: any)=> new Date(r.date), beefsRangeIdx).map((p: any)=> ({ date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: p.count }))}>
                    <defs>
                      <linearGradient id="beefsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.24}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.04}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="count" name="Beefs" stroke="#F59E0B" fill="url(#beefsGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rivals Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end mb-2 gap-2">
                  {['7d','30d','90d','All'].map((lbl, idx) => (
                    <Button key={lbl} size="sm" variant={rivalsRangeIdx===idx?'default':'outline'} onClick={()=>setRivalsRangeIdx(idx)}>{lbl}</Button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={sliceByRange((overview?.series?.rivalsOverTime || []), (r: any)=> new Date(r.date), rivalsRangeIdx).map((p: any)=> ({ date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: p.count }))}>
                    <defs>
                      <linearGradient id="rivalsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.24}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.04}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="count" name="Rivals" stroke="#EF4444" fill="url(#rivalsGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Mastery</CardTitle>
                <CardDescription>Accuracy by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <RechartsTooltip />
                    <Pie dataKey="value" data={(overview?.series?.categoryDonuts || [])} outerRadius={90} label>
                      {(overview?.series?.categoryDonuts || []).map((_: any, idx: number) => (
                        <Cell key={`cell-${idx}`} fill={["#3B82F6", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6", "#06B6D4"][idx % 6]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sub‑category Comparison</CardTitle>
                <CardDescription>Top tags by accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={(overview?.series?.subCategoryBars || [])}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Bar dataKey="accuracyPct" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rivals Donut</CardTitle>
                    <CardDescription>Outstanding vs Avenged</CardDescription>
                  </div>
                  <div>
                    <Button size="sm" variant="outline" onClick={() => (window.location.href = '/rivals')}>View Rivals</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const data = (overview?.series?.rivalsDonut || []) as Array<{ label: string; value: number }>
                  const total = data.reduce((s, d) => s + (d?.value || 0), 0)
                  const getColor = (label: string) => (label === 'Avenged' ? '#22C55E' : '#EF4444')
                  const handleSliceClick = () => {
                    // Deep-link to analytics with a relevant tab for now
                    setTab('leaderboards')
                  }
                  return (
                    <div className="relative">
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <RechartsTooltip formatter={(val: any, _name: any, ctx: any) => {
                            const pct = total > 0 ? `${Math.round((Number(val) / total) * 100)}%` : '0%'
                            return [`${val} (${pct})`, ctx?.payload?.label]
                          }} />
                          <Pie
                            dataKey="value"
                            data={data}
                            innerRadius={60}
                            outerRadius={90}
                            onClick={handleSliceClick}
                          >
                            {data.map((slice, idx) => (
                              <Cell key={`rd-${idx}`} fill={getColor(slice.label)} cursor="pointer" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center total overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <div className="text-2xl font-semibold">{total}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                      {/* Custom legend */}
                      <div className="mt-3 flex items-center justify-center gap-6 text-sm">
                        {data.map((d) => {
                          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
                          return (
                            <div key={d.label} className="flex items-center gap-2">
                              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: getColor(d.label) }} />
                              <span className="text-muted-foreground">{d.label}</span>
                              <span className="font-medium">{d.value}</span>
                              <span className="text-muted-foreground">({pct}%)</span>
                            </div>
                          )
                        })}
                      </div>
                      {/* View all button removed in favor of top-right button */}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Rivals Panel (inline) */}
            {showRivals && (
              <Card className="lg:col-span-2" ref={rivalsPanelRef as any}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Rivals</CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setShowRivals(false)}>Close</Button>
                  </div>
                  <CardDescription>Your opponents and head‑to‑head history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rivals summary grid */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {(rivalsListData || []).map((r: any) => (
                      <div key={r.opponentId} className="flex items-center justify-between border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden" />
                          <div>
                            <div className="text-sm font-medium">{r.handle}</div>
                            <div className="text-xs text-muted-foreground">{r.matches} matches • {r.winRate}% WR</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => { /* start beef */ }}>Start Beef</Button>
                        </div>
                      </div>
                    ))}
                    {(rivalsListData || []).length === 0 && (
                      <div className="col-span-full text-center text-muted-foreground">No rivals yet.</div>
                    )}
                  </div>

                  {/* Head‑to‑Head list with infinite scroll */}
                  <div>
                    <div className="mb-2 text-sm font-medium">Head‑to‑Head</div>
                    <div
                      className="space-y-2 max-h-[420px] overflow-auto"
                      onScroll={(e) => {
                        const el = e.currentTarget
                        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
                        const loaded = h2hItems.length
                        const hasMore = loaded < h2hTotal
                        if (nearBottom && hasMore) setH2hPage((p) => p + 1)
                      }}
                    >
                      {h2hItems.map((it: any) => (
                        <div key={it.id} className="flex items-center justify-between border rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${it.result === 'W' ? 'bg-green-500' : it.result === 'L' ? 'bg-red-500' : 'bg-gray-400'}`} />
                            <div className="text-sm">{new Date(it.date).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => { /* review */ }}>Review</Button>
                            <Button size="sm" onClick={() => { /* start beef */ }}>Start Beef</Button>
                          </div>
                        </div>
                      ))}
                      {h2hItems.length === 0 && (
                        <div className="text-center text-muted-foreground py-6">No history yet.</div>
                      )}
                      {h2hItems.length < h2hTotal && (
                        <div className="text-center text-xs text-muted-foreground py-2">Loading more…</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
                        if (!qloSeries?.series || !qloSeries.users?.length) return null
                        const allTs = new Set<number>()
                        Object.values(qloSeries.series).forEach((arr: any) => {
                          (arr as any[]).forEach((p: any) => allTs.add(new Date(p.t).getTime()))
                        })
                        const sortedTs = Array.from(allTs).sort((a, b) => a - b)
                        const avgSeries = sortedTs.map((ts) => {
                          let sum = 0
                          let count = 0
                          for (const arr of Object.values(qloSeries.series) as any[]) {
                            const prior = (arr as any[]).filter((p: any) => new Date(p.t).getTime() <= ts)
                            if (prior.length) {
                              const val = prior[prior.length - 1].qlo
                              if (typeof val === 'number') { sum += val; count += 1 }
                            }
                          }
                          return { t: ts, qlo: count ? sum / count : null }
                        }).filter((p: any) => p.qlo !== null)
                        return (
                          <Line dataKey="qlo" data={avgSeries as any} name="Top Avg" stroke="#9CA3AF" strokeDasharray="4 4" dot={false} />
                        )
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Avatar</TableHead>
                        <TableHead>Handle</TableHead>
                        <TableHead>QLO</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(leaderboardData || []).slice(0, 10).map((u: any, i: number) => (
                        <TableRow key={u.id ?? i}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatarUrl || undefined} />
                              <AvatarFallback>{(u.handle || 'U').toString().slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            {u.id ? (
                              <span onClick={() => navigate(`/user/${u.id}`)} className="hover:underline cursor-pointer">@{u.handle ?? `user${i+1}`}</span>
                            ) : (
                              <span>@{u.handle ?? `user${i+1}`}</span>
                            )}
                          </TableCell>
                          <TableCell>{u.qlo ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => navigate(`/user/${u.id}`)}>View Profile</Button>
                              <Button size="sm" onClick={() => navigate('/beef')}>Challenge</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            {/* Group Leaderboard (9+1) */}
            <GroupLeaderboardCard />
         </div>
        </TabsContent>

        {/* Quiz History Tab */}
        <TabsContent value="history" className="space-y-6">
          <QuizHistoryTable />
        </TabsContent>
      </Tabs>
    </main>
  )
}
