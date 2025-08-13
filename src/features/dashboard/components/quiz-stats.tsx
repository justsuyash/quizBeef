import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getUserAnalytics } from 'wasp/client/operations'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  Clock,
  Brain,
  Award
} from 'lucide-react'

export function QuizStats() {
  const { data: analytics, isLoading, error } = useQuery(getUserAnalytics)

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Loading data...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Failed to load analytics
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const {
    totalDocuments,
    totalQuizAttempts,
    totalQuestionsAnswered,
    accuracyRate,
    averageScore,
    currentStreak,
    bestStreak,
    weeklyQuizzes,
    weeklyQuestions
  } = analytics

  // Calculate performance level
  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100' }
    if (accuracy >= 80) return { level: 'Advanced', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (accuracy >= 70) return { level: 'Intermediate', color: 'text-green-600', bg: 'bg-green-100' }
    if (accuracy >= 60) return { level: 'Beginner', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    return { level: 'Learning', color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const performance = getPerformanceLevel(accuracyRate)

  const stats = [
    {
      title: 'Documents Studied',
      value: totalDocuments,
      description: `${weeklyQuestions} questions this week`,
      icon: BookOpen,
      color: 'text-blue-600',
      trend: weeklyQuestions > 0 ? '+' + weeklyQuestions : null
    },
    {
      title: 'Questions Mastered',
      value: totalQuestionsAnswered,
      description: `${accuracyRate.toFixed(1)}% accuracy rate`,
      icon: Target,
      color: 'text-green-600',
      trend: accuracyRate >= 80 ? 'Excellent' : accuracyRate >= 70 ? 'Good' : 'Improving'
    },
    {
      title: 'Average Score',
      value: `${averageScore.toFixed(1)}%`,
      description: `${totalQuizAttempts} quizzes completed`,
      icon: TrendingUp,
      color: 'text-purple-600',
      trend: weeklyQuizzes > 0 ? `+${weeklyQuizzes} this week` : 'No activity this week'
    },
    {
      title: 'Current Streak',
      value: currentStreak,
      description: `Best streak: ${bestStreak} days`,
      icon: Flame,
      color: currentStreak > 0 ? 'text-orange-600' : 'text-gray-500',
      trend: currentStreak > 0 ? 'Active' : 'Start studying!'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                {stat.trend && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {stat.trend}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Performance Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Learning Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Performance Level */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${performance.bg}`}>
                <Award className={`h-4 w-4 ${performance.color}`} />
                <span className={`font-medium ${performance.color}`}>
                  {performance.level}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Performance Level</div>
            </div>

            {/* Accuracy Breakdown */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-lg font-bold">{accuracyRate.toFixed(1)}%</span>
              </div>
              <div className="text-xs text-muted-foreground">Overall Accuracy</div>
            </div>

            {/* Activity Level */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-lg font-bold">{weeklyQuizzes}</span>
              </div>
              <div className="text-xs text-muted-foreground">Quizzes This Week</div>
            </div>
          </div>

          {/* Quick insights */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm space-y-1">
              {accuracyRate >= 85 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Excellent accuracy! Keep up the great work.</span>
                </div>
              )}
              {currentStreak >= 7 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <Flame className="h-3 w-3" />
                  <span>Amazing {currentStreak}-day streak! You're on fire!</span>
                </div>
              )}
              {weeklyQuizzes === 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>No quizzes this week. Time to get back to studying!</span>
                </div>
              )}
              {totalQuestionsAnswered >= 100 && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Award className="h-3 w-3" />
                  <span>Milestone achieved: {totalQuestionsAnswered} questions answered!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}