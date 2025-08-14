import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getUserAnalytics, getLearningProgress, getPerformanceTrends, getUserAchievements } from 'wasp/client/operations'
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

  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Please log in to view analytics</h1>
      </div>
    )
  }

  const isLoading = analyticsLoading || progressLoading || performanceLoading || achievementsLoading

  if (isLoading) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Progress</h1>
          <p className="text-muted-foreground">Loading your learning insights...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-8 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-500" />
          Analytics & Progress
        </h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your learning journey and achievements
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview & Stats</TabsTrigger>
          <TabsTrigger value="progress">Progress & Trends</TabsTrigger>
          <TabsTrigger value="achievements">Top Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalQuizAttempts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{analytics?.weeklyQuizzes || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics?.accuracyRate || 0)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.accuracyRate >= 80 ? 'Excellent' : analytics?.accuracyRate >= 60 ? 'Good' : 'Improving'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.currentStreak || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Best: {analytics?.bestStreak || 0} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {achievementsData?.unlockedCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {achievementsData?.totalCount || 0} unlocked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Difficulty Performance Chart */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance by Difficulty</CardTitle>
                <CardDescription>Your accuracy across different question difficulties</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={difficultyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Summary</CardTitle>
                <CardDescription>Overview of your quiz activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Questions Answered</span>
                  <span className="font-medium">{analytics?.totalQuestionsAnswered || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <span className="font-medium">{Math.round(analytics?.averageScore || 0)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Documents Studied</span>
                  <span className="font-medium">{analytics?.totalDocuments || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-medium">{analytics?.weeklyQuestions || 0} questions</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          {/* Progress Line Chart with Area */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress Over Time</CardTitle>
              <CardDescription>Your quiz performance and activity trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#scoreGradient)"
                    name="Score %"
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#accuracyGradient)"
                    name="Accuracy %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Metrics */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Study Time Trends</CardTitle>
                <CardDescription>Daily time spent on quizzes (minutes)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="timeSpent" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Activity</CardTitle>
                <CardDescription>Questions answered per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="questionsAnswered" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top 5 Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Your Top Achievements
                </CardTitle>
                <CardDescription>
                  Your most impressive accomplishments (by rarity)
                </CardDescription>
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
                          <p className="text-sm text-muted-foreground mt-1">
                            {achievement.description}
                          </p>
                          {achievement.pointsReward > 0 && (
                            <p className="text-xs text-yellow-600 mt-1">
                              +{achievement.pointsReward} points
                            </p>
                          )}
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
                    <p>No achievements unlocked yet</p>
                    <p className="text-sm">Complete quizzes to start earning badges!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Progress</CardTitle>
                <CardDescription>Your overall achievement collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(((achievementsData?.unlockedCount || 0) / (achievementsData?.totalCount || 1)) * 100)}% complete
                  </p>
                </div>

                {/* Category Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Categories</h4>
                  {['QUIZ', 'BEEF', 'LEARNING', 'COLLECTION'].map((category) => {
                    const categoryAchievements = achievementsData?.achievements?.filter(
                      (a: any) => a.category === category
                    ) || []
                    const unlockedInCategory = categoryAchievements.filter((a: any) => a.isUnlocked).length
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{category.toLowerCase()}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {unlockedInCategory} / {categoryAchievements.length}
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(unlockedInCategory / Math.max(categoryAchievements.length, 1)) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* View All Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/achievements'}
                >
                  View All Achievements
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
