import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getPerformanceTrends } from 'wasp/client/operations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { 
  Trophy, 
  AlertTriangle, 
  BarChart3, 
  Clock,
  FileText,
  ArrowRight,
  Target
} from 'lucide-react'

export function PerformanceTrends() {
  const { data: trendsData, isLoading, error } = useQuery(getPerformanceTrends)

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !trendsData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Failed to load performance trends
          </div>
        </CardContent>
      </Card>
    )
  }

  const { difficultyPerformance, topDocuments, practiceRecommendations } = trendsData

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Difficulty Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance by Difficulty
          </CardTitle>
          <CardDescription>Your accuracy across different question types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {difficultyPerformance.length > 0 ? (
            difficultyPerformance.map((perf) => {
              const difficultyColor = {
                'EASY': 'bg-green-500',
                'MEDIUM': 'bg-yellow-500', 
                'HARD': 'bg-red-500'
              }[perf.difficulty] || 'bg-gray-500'

              const difficultyLabel = {
                'EASY': 'Easy',
                'MEDIUM': 'Medium',
                'HARD': 'Hard'
              }[perf.difficulty] || perf.difficulty

              return (
                <div key={perf.difficulty} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${difficultyColor}`} />
                      <span className="font-medium">{difficultyLabel}</span>
                      <Badge variant="outline">{perf.totalQuestions} questions</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{perf.accuracy.toFixed(1)}%</span>
                      {perf.averageTime > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {perf.averageTime.toFixed(1)}s
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${difficultyColor}`}
                      style={{ width: `${Math.min(perf.accuracy, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center text-muted-foreground">
              No performance data available yet. Take some quizzes to see your progress!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Performing Documents
          </CardTitle>
          <CardDescription>Your highest scoring quiz attempts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topDocuments.length > 0 ? (
            topDocuments.map((attempt, index) => (
              <div key={attempt.document.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{attempt.document.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="secondary">{attempt.score.toFixed(1)}%</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              No quiz attempts yet. Start taking quizzes to see your top performances!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Practice Recommendations */}
      {practiceRecommendations.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Recommended Practice
            </CardTitle>
            <CardDescription>
              Documents where you could improve your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {practiceRecommendations.map((doc) => (
                <div key={doc.id} className="p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Avg: {doc.averageScore?.toFixed(1)}% • {doc.attemptCount} attempts
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {doc._count.questions} questions available
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => {
                      // TODO: Navigate to quiz for this document
                      alert(`Navigate to quiz for: ${doc.title}`)
                    }}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    Practice
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
