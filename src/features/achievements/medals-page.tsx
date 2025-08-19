import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { getUserAchievements } from 'wasp/client/operations'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Award } from 'lucide-react'

export default function MedalsPage() {
  const { userId } = useParams()
  const targetId = userId ? parseInt(userId) : undefined
  const { data, isLoading, error } = useQuery(getUserAchievements, { userId: targetId })

  if (isLoading) return <div className="p-6">Loading medals…</div>
  if (error) return <div className="p-6">Failed to load medals.</div>

  const all = (data as any)?.achievements || []
  const unlocked = all.filter((a: any) => a?.isUnlocked || a?.isCompleted)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Unlocked Medals</CardTitle>
          <CardDescription>Only medals this user has unlocked are shown.</CardDescription>
        </CardHeader>
        <CardContent>
          {unlocked.length === 0 ? (
            <div className="text-muted-foreground">No medals yet.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {unlocked.map((m: any) => (
                <div key={m.id} className="flex items-center p-3 rounded-lg border bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <div className="p-2 bg-yellow-500 rounded-full mr-3">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">{m?.achievement?.name ?? m?.name ?? 'Medal'}</div>
                    <div className="text-xs text-muted-foreground">{m?.achievement?.description ?? m?.description ?? ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


