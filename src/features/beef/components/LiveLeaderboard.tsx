import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { 
  Trophy, 
  Crown, 
  Zap, 
  Target,
  Timer,
  TrendingUp,
  Medal,
  Star
} from 'lucide-react'

interface Participant {
  id: number
  finalScore: number
  totalTimeSpent: number
  position?: number
  user: {
    id: number
    handle?: string
  }
  answers?: Array<{
    pointsEarned: number
    timeSpent: number
    isCorrect: boolean
    round: {
      roundNumber: number
    }
  }>
}

interface LiveLeaderboardProps {
  participants: Participant[]
  currentUserId?: number
  challenge?: {
    status: string
    questionCount: number
    timeLimit: number
  }
  roundInfo?: {
    currentRound?: number
    totalRounds: number
  }
  compact?: boolean
}

export function LiveLeaderboard({ 
  participants, 
  currentUserId, 
  challenge,
  roundInfo,
  compact = false 
}: LiveLeaderboardProps) {
  // Sort participants by score (descending)
  const sortedParticipants = [...participants].sort((a, b) => b.finalScore - a.finalScore)

  // Calculate rankings and stats
  const leaderboardData = sortedParticipants.map((participant, index) => {
    const position = index + 1
    const isCurrentUser = participant.user.id === currentUserId
    const correctAnswers = participant.answers?.filter(a => a.isCorrect).length || 0
    const totalAnswers = participant.answers?.length || 0
    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
    const avgTimePerQuestion = totalAnswers > 0 ? participant.totalTimeSpent / totalAnswers / 1000 : 0

    return {
      ...participant,
      position,
      isCurrentUser,
      correctAnswers,
      totalAnswers,
      accuracy,
      avgTimePerQuestion
    }
  })

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{position}</span>
    }
  }

  const getPositionColor = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
    }
    
    switch (position) {
      case 1:
        return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
      case 2:
        return 'border-l-gray-400 bg-gray-50/50 dark:bg-gray-950/20'
      case 3:
        return 'border-l-amber-600 bg-amber-50/50 dark:bg-amber-950/20'
      default:
        return 'border-l-muted'
    }
  }

  const maxScore = Math.max(...leaderboardData.map(p => p.finalScore), 1)

  if (compact) {
    return (
      <div className="space-y-2">
        {leaderboardData.slice(0, 3).map((participant) => (
          <div
            key={participant.id}
            className={`flex items-center justify-between p-3 border-l-4 rounded-lg ${getPositionColor(participant.position, participant.isCurrentUser)}`}
          >
            <div className="flex items-center gap-3">
              {getPositionIcon(participant.position)}
              <span 
                className={`font-medium cursor-pointer hover:underline ${participant.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/user/${participant.user.id}`
                }}
              >
                @{participant.user.handle || `user${participant.user.id}`}
              </span>
              {participant.isCurrentUser && (
                <Badge variant="secondary" className="text-xs">You</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{participant.finalScore}</span>
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
          </div>
        ))}
        
        {leaderboardData.length > 3 && (
          <div className="text-center text-sm text-muted-foreground">
            +{leaderboardData.length - 3} more participants
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Live Leaderboard
        </CardTitle>
        <CardDescription>
          {challenge?.status === 'IN_PROGRESS' && roundInfo?.currentRound 
            ? `Round ${roundInfo.currentRound} of ${roundInfo.totalRounds}` 
            : 'Final Rankings'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboardData.map((participant) => (
            <div
              key={participant.id}
              className={`p-4 border-l-4 rounded-lg transition-all ${getPositionColor(participant.position, participant.isCurrentUser)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getPositionIcon(participant.position)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span 
                        className={`font-semibold cursor-pointer hover:underline ${participant.isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'hover:text-blue-600'}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/user/${participant.user.id}`
                        }}
                      >
                        @{participant.user.handle || `user${participant.user.id}`}
                      </span>
                      {participant.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                      {participant.position === 1 && challenge?.status === 'COMPLETED' && (
                        <Badge className="text-xs bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                    </div>
                    {challenge?.status === 'IN_PROGRESS' && (
                      <div className="text-xs text-muted-foreground">
                        {participant.correctAnswers}/{participant.totalAnswers} correct • {participant.accuracy.toFixed(0)}% accuracy
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{participant.finalScore}</span>
                    <Zap className="h-5 w-5 text-orange-500" />
                  </div>
                  {participant.avgTimePerQuestion > 0 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {participant.avgTimePerQuestion.toFixed(1)}s avg
                    </div>
                  )}
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="mt-3">
                <Progress 
                  value={(participant.finalScore / maxScore) * 100} 
                  className="h-2"
                />
              </div>

              {/* Performance Indicators for In-Progress Challenges */}
              {challenge?.status === 'IN_PROGRESS' && participant.answers && participant.answers.length > 0 && (
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>{participant.accuracy.toFixed(0)}% accuracy</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      {participant.answers.length > 0 
                        ? (participant.answers[participant.answers.length - 1]?.pointsEarned || 0) + ' pts last'
                        : '0 pts last'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {leaderboardData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No participants yet</p>
            </div>
          )}
        </div>

        {/* Challenge Progress */}
        {challenge?.status === 'IN_PROGRESS' && roundInfo && (
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Challenge Progress</span>
              <span className="text-muted-foreground">
                {roundInfo.currentRound || 0}/{roundInfo.totalRounds} questions
              </span>
            </div>
            <Progress 
              value={roundInfo.currentRound ? (roundInfo.currentRound / roundInfo.totalRounds) * 100 : 0} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
