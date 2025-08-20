import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getUserProfile, createBeef, getStatsOverview, getUserAchievements, getQuizHistory, getCurrentUser, getUserQuizzes } from 'wasp/client/operations'
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
  Shield,
  Award,
  Users
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
  qlo?: number  // v1.7: QLO rating system
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
  // Resolve target user id: route param or current user as fallback
  const parsedRouteId = userId ? parseInt(userId) : NaN
  const { data: current } = useQuery(getCurrentUser, undefined, { retry: 0 })
  const targetUserId = Number.isFinite(parsedRouteId) && parsedRouteId > 0 ? parsedRouteId : (current?.id || user?.id || 0)
  const { data: profile, isLoading, error } = useQuery(getUserProfile, { userId: targetUserId }, { enabled: !!targetUserId })
  const { data: userQuizzes } = useQuery(getUserQuizzes, { userId: targetUserId, limit: 30, offset: 0 })
  
  // v1.7: Get additional data for Trophy Case layout
  const { data: stats } = useQuery(getStatsOverview, { range: 30 })
  const { data: achievementsResp } = useQuery(getUserAchievements, {})
  const { data: recentActivityResp } = useQuery(getQuizHistory, { page: 1, pageSize: 10 })
  
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
  const achievements = (achievementsResp as any)?.achievements || []
  const earnedAchievements = (achievements || []).filter((a: any) => a?.isUnlocked || a?.isCompleted)
  const allPossibleAchievements = achievements || []
  const getAchName = (a: any) => (a?.achievement?.name ?? a?.name ?? 'Achievement')
  const getAchDesc = (a: any) => (a?.achievement?.description ?? a?.description ?? '')

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

        {/* Unified snapshot banner: same visual style, single row */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-7">
          {/* Followers */}
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="text-2xl font-semibold">{(profileData?.stats as any)?.followers ?? 0}</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          {/* Following */}
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Following</p>
                <p className="text-2xl font-semibold">{(profileData?.stats as any)?.following ?? 0}</p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          {/* Rivals */}
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rivals</p>
                <p className="text-2xl font-semibold">{stats?.rivalsCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {(profileData as any)?.profileSnapshot?.rivalsSummary
                    ? `${(profileData as any).profileSnapshot.rivalsSummary.outstanding} outstanding · ${(profileData as any).profileSnapshot.rivalsSummary.avenged} avenged`
                    : null}
                </p>
              </div>
              <span className="text-lg">🥷</span>
            </CardContent>
          </Card>
          {/* QLO */}
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">QLO</p>
                <p className="text-2xl font-semibold">{profileData.qlo ?? 100}</p>
                <p className="text-xs text-muted-foreground">Avg 30d: {(profileData as any)?.profileSnapshot?.avgQlo30d ?? (profileData.qlo ?? 100)}</p>
              </div>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          {/* Streak */}
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-semibold">{stats?.streak || 0}</p>
                <p className="text-xs text-muted-foreground">Avg 30d: {(profileData as any)?.profileSnapshot?.avgStreak30d ?? 0}</p>
              </div>
              <Flame className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          {/* Medals (clickable) */}
          <Card className="bg-white cursor-pointer" onClick={() => navigate(`/user/${profileData.id}/medals`)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medals</p>
                <p className="text-2xl font-semibold">{stats?.medalsCount || 0}</p>
              </div>
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
          {/* Quizzes */}
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quizzes</p>
                <p className="text-2xl font-semibold">{stats?.totals?.totalQuizzes || 0}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Medals banner removed per request */}

        {/* Recent Activity intentionally removed per request */}

        {/* Masonry-like feed of user's published quizzes (Pinterest style) */}
        <div className="space-y-2">
          {/* Masonry column container shim (keeps columns balanced) */}
          {Array.isArray(userQuizzes?.items) && userQuizzes.items.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]"></div>
          ) : null}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {Array.isArray(userQuizzes?.items) && userQuizzes.items.length > 0 ? (
              userQuizzes.items.map((q: any) => {
                const category = q.category || 'General'
                const rawTags = Array.isArray(q.tags) ? q.tags : []
                const tags = [category, ...rawTags].filter(Boolean).slice(0, 5)
                const description = (q.description || '').slice(0, 140)
                return (
                  <div key={q.id} className="mb-4 break-inside-avoid rounded-md border bg-white p-4 shadow-sm hover:shadow transition">
                    <div className="text-xs text-muted-foreground mb-1">{category}</div>
                    <div className="font-medium mb-1 line-clamp-2">{q.title}</div>
                    <div className="text-sm text-muted-foreground mb-2 line-clamp-3 min-h-[3.25rem]">{description || ' '}</div>
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[1.5rem]">
                      {tags.map((t: string, i: number) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">#{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-4">
                        <span title="Likes">❤ {(q.likeCount ?? 0)}</span>
                        <span title="Comments">💬 {(q.commentCount ?? 0)}</span>
                        <button className="text-primary hover:underline" onClick={() => navigator.share ? navigator.share({ title: 'QuizBeef Quiz', text: q.title, url: `/quiz/${q.id}/settings` }).catch(()=>{}) : window.open(`/quiz/${q.id}/settings`, '_blank')}>Share</button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">No quizzes yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
