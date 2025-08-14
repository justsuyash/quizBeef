import React from 'react'
import { Trophy } from 'lucide-react'
import { toast } from '../../hooks/use-toast'

export type AchievementToastData = {
  name: string
  description?: string
  points?: number
}

export function showAchievementToast(data: AchievementToastData) {
  toast({
    title: `🏆 Achievement Unlocked: ${data.name}`,
    description: data.points && data.points > 0
      ? `${data.description || ''} +${data.points} points`
      : data.description || undefined,
  })
}


