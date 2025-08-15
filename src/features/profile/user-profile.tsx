import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getUserProfile, createBeef, getStatsOverview, getUserAchievements, getQuizHistory } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Separator } from '../../components/ui/separator'
import { Progress } from '../../components/ui/progress'
import { useToast } from '../../hooks/use-toast'
import { cn } from '../../lib/cn'
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  MapPin, 
  Globe, 
  Edit3, 
  Zap, 
  Crown,
  TrendingUp,
  BarChart3,
  Flame,
  Clock,
  Star,
  Medal,
  ArrowLeft,
  MessageCircle,
  Lock,
  CheckCircle,
  Shield,
  Award
} from 'lucide-react'

const topNav = [
  { title: 'Dashboard', href: '/', isActive: false },
  { title: 'Documents', href: '/documents', isActive: false },
  { title: 'Leaderboard', href: '/leaderboard', isActive: true },
]

interface UserProfile {
  id: number
  handle?: string
  profileType: string
  bio?: string
  location?: string
  website?: string
  avatarUrl?: string  // v1.7: Added for profile pictures
  eloRating?: number  // v1.7: Added for Elo rating system
  joinedAt: string
  totalScore: number
  totalQuizzes: number
  totalBeefWins: number
  winStreak: number
  longestWinStreak: number
  averageAccuracy?: number
  favoriteSubject?: string
  isPublicProfile: boolean
  totalBeefParticipations: number
  beefWins: number
  beefWinRate: number
  averageQuizScore: number
  recentDocuments: any[]
  recentQuizAttempts: any[]
  recentBeefWins: any[]
  stats: {
    totalDocuments: number
    totalQuizAttempts: number
    totalBeefChallengesCreated: number
    totalBeefParticipations: number
  }
  isOwnProfile: boolean
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: profile, isLoading, error } = useQuery(getUserProfile, { 
    userId: parseInt(userId || '0') 
  })
  
  // v1.7: Get additional data for Trophy Case layout
  const { data: stats } = useQuery(getStatsOverview, { range: 30 })
  const { data: achievements } = useQuery(getUserAchievements, {})
  const { data: recentActivity } = useQuery(getQuizHistory, { limit: 10 })
  
  const createBeefFn = useAction(createBeef)
  const { toast } = useToast()

  const [isChallengeDialogOpen, setIsChallengeDialogOpen] = useState(false)

  const handleChallengeUser = async () => {
    if (!profile || !user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to create challenges',
        variant: 'destructive'
      })
      return
    }

    // For now, navigate to documents to create a challenge
    // In a full implementation, you could show a document selector here
    toast({
      title: 'Create a Challenge',
      description: 'Choose a document from your library to create a beef challenge'
    })
    navigate('/documents')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'text-gray-500'
    if (accuracy >= 90) return 'text-green-600'
    if (accuracy >= 80) return 'text-blue-600'
    if (accuracy >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 2:
      case 3:
        return <Medal className="h-4 w-4 text-gray-400" />
      default:
        return <Star className="h-4 w-4 text-blue-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">
              This user profile doesn't exist or is set to private.
            </p>
            <Button onClick={() => navigate('/analytics')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const profileData = profile as UserProfile

  // Get earned and locked achievements
  const earnedAchievements = achievements?.filter(a => a.isCompleted) || []
  const allPossibleAchievements = achievements || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/analytics')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analytics
        </Button>
          
        {/* v1.7: Identity Header */}
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24 ring-2 ring-blue-500/20">
                  <AvatarImage 
                    src={profileData.avatarUrl || `/avatars/user-${profileData.id}.jpg`} 
                    alt={`@${profileData.handle}`} 
                  />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {(profileData.handle || 'U').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    @{profileData.handle || `user${profileData.id}`}
                    {profileData.profileType === 'KID' && (
                      <Badge variant="secondary" className="text-xs">
                        Kid
                      </Badge>
                    )}
                  </h1>
                  {profileData.bio && (
                    <p className="text-muted-foreground mt-2 max-w-md">{profileData.bio}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatJoinDate(profileData.joinedAt)}</span>
                    </div>
                    {profileData.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profileData.location}</span>
                      </div>
                    )}
                    {profileData.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={profileData.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {!profileData.isOwnProfile && user && (
                  <>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm" onClick={handleChallengeUser}>
                      <Flame className="h-4 w-4 mr-2 text-orange-500" />
                      Challenge
                    </Button>
                  </>
                )}
                
                {profileData.isOwnProfile && (
                  <Button variant="outline" onClick={() => navigate('/settings')}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* v1.7: Core Stats Row */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Streak</p>
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {stats?.streak || 0}
                  </p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Elo</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {profileData.eloRating || 1200}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Medals</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {stats?.medalsCount || 0}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Quizzes</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {stats?.totals?.totalQuizzes || 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Accuracy</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {stats?.accuracy?.toFixed(1) || 0}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* v1.7: Achievements Grid */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Trophy Case
            </CardTitle>
            <CardDescription>
              {earnedAchievements.length} of {allPossibleAchievements.length} achievements unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {/* Earned Achievements */}
              {earnedAchievements.slice(0, 8).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500 rounded-full">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-yellow-800 dark:text-yellow-200">
                        {achievement.achievement.name}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        {achievement.achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Locked Achievements (show a few) */}
              {allPossibleAchievements
                .filter(a => !a.isCompleted)
                .slice(0, 4 - Math.min(earnedAchievements.length, 4))
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-400 rounded-full">
                        <Lock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                          {achievement.achievement.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Locked
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            
            {allPossibleAchievements.length > 8 && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => navigate('/achievements')}>
                  View All Achievements
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* v1.7: Recent Activity */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest 10 quiz attempts and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        activity.score >= 80 ? "bg-green-500" : 
                        activity.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                      )}>
                        {activity.score >= 80 ? 
                          <CheckCircle className="h-4 w-4 text-white" /> :
                          activity.score >= 60 ?
                          <Clock className="h-4 w-4 text-white" /> :
                          <Target className="h-4 w-4 text-white" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {activity.document?.title || 'Quiz'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-semibold text-sm">{activity.score}%</div>
                      <div className="text-xs text-muted-foreground">
                        {activity.correctAnswers}/{activity.totalQuestions}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
