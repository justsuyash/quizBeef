import React from 'react'
import GroupLeaderboardCard from './components/GroupLeaderboardCard'
import { BarChart3 } from 'lucide-react'

interface GroupLeaderboardUser {
  id: number
  handle?: string
  profileType: string
  totalScore: number
  totalQuizzes: number
  totalBeefWins: number
  averageAccuracy?: number
  winStreak: number
  longestWinStreak: number
  qlo: number
  avatarUrl?: string
  rank: number
  displayIndex: number
  beefWinRate: number
  isCurrentUser: boolean
}

interface GroupInfo {
  id: number
  name: string
  description?: string
  _count: {
    memberships: number
  }
}

export default function GroupLeaderboardPage() {
  // All logic lives inside GroupLeaderboardCard

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
          <BarChart3 className='h-8 w-8 text-blue-500' />
          Group Leaderboards
        </h1>
        <p className='text-muted-foreground mt-2'>
          Compete with your group members and see how you rank
        </p>
      </div>

      <GroupLeaderboardCard />
    </main>
  )
}
