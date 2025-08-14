import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { getUserAchievements, seedAchievements, checkAchievements } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { useToast } from '../../hooks/use-toast'
import { 
  Trophy, 
  Star, 
  Award, 
  Crown, 
  Sparkles,
  Lock,
  Calendar,
  Zap,
  Upload,
  Folder,
  Sword,
  Flame,
  GraduationCap
} from 'lucide-react'

const iconMap: Record<string, any> = {
  'graduation-cap': GraduationCap,
  'star': Star,
  'trophy': Trophy,
  'sword': Sword,
  'flame': Flame,
  'zap': Zap,
  'calendar': Calendar,
  'upload': Upload,
  'folder': Folder,
  'sparkles': Sparkles,
  'award': Award,
  'crown': Crown
}

const rarityColors: Record<string, string> = {
  'COMMON': 'bg-gray-100 text-gray-800 border-gray-300',
  'UNCOMMON': 'bg-green-100 text-green-800 border-green-300',
  'RARE': 'bg-blue-100 text-blue-800 border-blue-300',
  'EPIC': 'bg-purple-100 text-purple-800 border-purple-300',
  'LEGENDARY': 'bg-yellow-100 text-yellow-800 border-yellow-300'
}

export default function AchievementsPage() {
  const { data: user } = useAuth()
  const { data: achievementsData, isLoading } = useQuery(getUserAchievements)
  const seedAchievementsFn = useAction(seedAchievements)
  const checkAchievementsFn = useAction(checkAchievements)
  const { toast } = useToast()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const handleSeedAchievements = async () => {
    setIsSeeding(true)
    try {
      const result = await seedAchievementsFn({})
      toast({
        title: 'Achievements Seeded!',
        description: `Created ${result.created} new achievements`
      })
      // Refresh the page to show new achievements
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to seed achievements',
        variant: 'destructive'
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCheckAchievements = async () => {
    if (!user) return
    
    setIsChecking(true)
    try {
      const result = await checkAchievementsFn({
        userId: user.id,
        triggerType: 'MANUAL_CHECK'
      })
      
      if (result.achievementsGranted.length > 0) {
        toast({
          title: '🏆 New Achievement(s) Unlocked!',
          description: `You unlocked ${result.achievementsGranted.length} achievement(s)!`
        })
        // Refresh to show new achievements
        window.location.reload()
      } else {
        toast({
          title: 'No New Achievements',
          description: 'You\'re all caught up!'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check achievements',
        variant: 'destructive'
      })
    } finally {
      setIsChecking(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Please log in to view achievements</h1>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold">Loading achievements...</h1>
      </div>
    )
  }

  const achievements = achievementsData?.achievements || []
  const unlockedCount = achievementsData?.unlockedCount || 0
  const totalCount = achievementsData?.totalCount || 0

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc: any, achievement: any) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
    acc[achievement.category].push(achievement)
    return acc
  }, {})

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Your Achievements
            </h1>
            <p className="text-muted-foreground">
              {unlockedCount} of {totalCount} achievements unlocked
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleCheckAchievements}
              disabled={isChecking}
              variant="outline"
            >
              {isChecking ? 'Checking...' : 'Check for New'}
            </Button>
            
            <Button 
              onClick={handleSeedAchievements}
              disabled={isSeeding}
              variant="secondary"
            >
              {isSeeding ? 'Seeding...' : 'Seed Achievements'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Math.round((unlockedCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements by Category */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]: [string, any]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 capitalize">
            {category.toLowerCase().replace('_', ' ')} Achievements
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categoryAchievements.map((achievement: any) => {
              const IconComponent = iconMap[achievement.iconName] || Award
              const isUnlocked = achievement.isUnlocked
              
              return (
                <Card 
                  key={achievement.id}
                  className={`transition-all duration-200 ${
                    isUnlocked 
                      ? 'border-yellow-200 bg-yellow-50 hover:shadow-md' 
                      : 'border-gray-200 bg-gray-50 opacity-75'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`p-2 rounded-lg ${isUnlocked ? '' : 'grayscale'}`}
                          style={{ 
                            backgroundColor: isUnlocked ? achievement.iconColor + '20' : '#f3f4f6',
                            color: isUnlocked ? achievement.iconColor : '#9ca3af'
                          }}
                        >
                          {isUnlocked ? (
                            <IconComponent className="h-6 w-6" />
                          ) : (
                            <Lock className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{achievement.name}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${rarityColors[achievement.rarity]}`}
                          >
                            {achievement.rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <CardDescription className="mb-3">
                      {achievement.description}
                    </CardDescription>
                    
                    {achievement.pointsReward > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reward:</span>
                        <span className="font-medium text-yellow-600">
                          +{achievement.pointsReward} points
                        </span>
                      </div>
                    )}

                    {isUnlocked && achievement.unlockedAt && (
                      <div className="mt-3 text-xs text-green-600">
                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {achievements.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
              <p className="text-muted-foreground mb-4">
                Seed some achievements to get started!
              </p>
              <Button onClick={handleSeedAchievements} disabled={isSeeding}>
                {isSeeding ? 'Seeding...' : 'Seed Achievements'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
