import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getLearningProgress } from 'wasp/client/operations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { CalendarDays, TrendingUp, Target } from 'lucide-react'

interface LearningProgressData {
  date: string
  quizzes: number
  averageScore: number
  accuracy: number
  questionsCorrect: number
  questionsTotal: number
  easyCorrect: number
  mediumCorrect: number
  hardCorrect: number
  easyTotal: number
  mediumTotal: number
  hardTotal: number
}

export function LearningProgressChart() {
  const { data: progressData, isLoading, error } = useQuery(getLearningProgress)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>Your quiz performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Loading progress data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !progressData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
          <CardDescription>Your quiz performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">No progress data available</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const data = progressData as LearningProgressData[]
  
  // Calculate recent performance metrics
  const recentData = data.slice(-7) // Last 7 days
  const totalQuizzes = recentData.reduce((sum, day) => sum + day.quizzes, 0)
  const avgScore = recentData.length > 0 
    ? recentData.reduce((sum, day) => sum + day.averageScore * day.quizzes, 0) / totalQuizzes || 0
    : 0
  const avgAccuracy = recentData.length > 0
    ? recentData.reduce((sum, day) => sum + day.accuracy * day.quizzes, 0) / totalQuizzes || 0
    : 0

  // Create a simple visual representation
  const maxQuizzes = Math.max(...data.map(d => d.quizzes))
  const maxScore = Math.max(...data.map(d => d.averageScore))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Learning Progress
        </CardTitle>
        <CardDescription>Your quiz performance over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalQuizzes}</div>
            <div className="text-sm text-muted-foreground">Quizzes (7d)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{avgScore.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{avgAccuracy.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>

        {/* Simple Activity Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Daily Activity
          </h4>
          <div className="grid grid-cols-7 gap-1">
            {data.slice(-21).map((day, index) => {
              const intensity = maxQuizzes > 0 ? (day.quizzes / maxQuizzes) : 0
              const opacity = Math.max(0.1, intensity)
              
              return (
                <div
                  key={day.date}
                  className="aspect-square rounded-sm border"
                  style={{
                    backgroundColor: day.quizzes > 0 ? `rgba(34, 197, 94, ${opacity})` : 'transparent'
                  }}
                  title={`${new Date(day.date).toLocaleDateString()}: ${day.quizzes} quizzes, ${day.averageScore.toFixed(1)}% avg score`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 weeks ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Difficulty Breakdown for Recent Performance */}
        {recentData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recent Performance by Difficulty
            </h4>
            <div className="space-y-2">
              {['Easy', 'Medium', 'Hard'].map((difficulty) => {
                const totalCorrect = recentData.reduce((sum, day) => {
                  if (difficulty === 'Easy') return sum + day.easyCorrect
                  if (difficulty === 'Medium') return sum + day.mediumCorrect
                  return sum + day.hardCorrect
                }, 0)
                
                const totalQuestions = recentData.reduce((sum, day) => {
                  if (difficulty === 'Easy') return sum + day.easyTotal
                  if (difficulty === 'Medium') return sum + day.mediumTotal
                  return sum + day.hardTotal
                }, 0)
                
                const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0
                
                if (totalQuestions === 0) return null
                
                return (
                  <div key={difficulty} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={difficulty === 'Easy' ? 'secondary' : difficulty === 'Medium' ? 'default' : 'destructive'}
                        className="w-16 justify-center"
                      >
                        {difficulty}
                      </Badge>
                      <span className="text-sm">{totalCorrect}/{totalQuestions}</span>
                    </div>
                    <div className="text-sm font-medium">
                      {accuracy.toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
