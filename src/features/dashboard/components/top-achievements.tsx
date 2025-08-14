import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getUserAchievements } from 'wasp/client/operations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { 
  Trophy, 
  Star, 
  Award, 
  Crown, 
  Flame,
  Zap,
  Calendar,
  Sparkles,
  BookOpen,
  Upload,
  Folder
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
  'crown': Crown,
  'upload': Upload,
  'folder': Folder
}

const rarityColors: Record<string, string> = {
  'COMMON': '#6B7280',
  'UNCOMMON': '#10B981', 
  'RARE': '#3B82F6',
  'EPIC': '#8B5CF6',
  'LEGENDARY': '#F59E0B'
}

export function TopAchievements() {
  const { data: achievementsData, isLoading } = useQuery(getUserAchievements)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Top Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border">
                <div className="h-10 w-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get top 5 hardest/most amazing achievements (by rarity)
  const topAchievements = achievementsData?.achievements
    ?.filter((achievement: any) => achievement.isUnlocked)
    ?.sort((a: any, b: any) => {
      // Sort by rarity (LEGENDARY > EPIC > RARE > UNCOMMON > COMMON)
      const rarityOrder = { LEGENDARY: 5, EPIC: 4, RARE: 3, UNCOMMON: 2, COMMON: 1 }
      return (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0)
    })
    ?.slice(0, 5) || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Top Achievements
        </CardTitle>
        <CardDescription>
          Your most impressive accomplishments (by rarity)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topAchievements.length > 0 ? (
          <>
            {topAchievements.map((achievement: any, index: number) => {
              const IconComponent = iconMap[achievement.iconName] || Award
              return (
                <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="flex-shrink-0">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: achievement.iconColor + '20',
                        color: achievement.iconColor
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{achievement.name}</h4>
                      <Badge 
                        variant="outline"
                        className="text-xs"
                        style={{ 
                          backgroundColor: rarityColors[achievement.rarity] + '20',
                          borderColor: rarityColors[achievement.rarity],
                          color: rarityColors[achievement.rarity]
                        }}
                      >
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {achievement.description}
                    </p>
                    {achievement.pointsReward > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        +{achievement.pointsReward} points
                      </p>
                    )}
                  </div>
                  <div className="text-lg font-bold text-yellow-500">
                    #{index + 1}
                  </div>
                </div>
              )
            })}
            
            {/* Achievement Progress */}
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>
                  {achievementsData?.unlockedCount || 0} / {achievementsData?.totalCount || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((achievementsData?.unlockedCount || 0) / (achievementsData?.totalCount || 1)) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(((achievementsData?.unlockedCount || 0) / (achievementsData?.totalCount || 1)) * 100)}% complete
              </p>
            </div>

            {/* View All Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.href = '/achievements'}
            >
              View All Achievements
            </Button>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No achievements unlocked yet</p>
            <p className="text-xs">Complete quizzes to start earning badges!</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => window.location.href = '/achievements'}
            >
              View All Achievements
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
