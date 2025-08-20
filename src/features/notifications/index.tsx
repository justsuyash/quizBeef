import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useQuery } from 'wasp/client/operations'
import { getNotifications } from 'wasp/client/operations'

type NotificationItem = { id: number; type: string; data: any; createdAt: string; readAt: string | null }

const typeToLabel: Record<string, string> = {
  FOLLOW: 'New follower',
  DOCUMENT_LIKED: 'Your quiz was liked',
  QUIZ_TAKEN: 'Someone took your quiz',
  STREAK_WARNING: 'Streak warning',
}

export default function NotificationsPage() {
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [items, setItems] = useState<NotificationItem[]>([])
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading } = useQuery(getNotifications, { limit: 20, cursor })

  useEffect(() => {
    if (data?.items) {
      setItems((prev) => {
        const merged = [...prev, ...data.items.map((i: any) => ({ ...i, createdAt: i.createdAt as any }))]
        const dedup = new Map(merged.map((i) => [i.id, i]))
        return Array.from(dedup.values())
      })
    }
  }, [data])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (!first.isIntersecting) return
      if (isLoading) return
      if (!data?.nextCursor) return
      setCursor(data.nextCursor)
    })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [data?.nextCursor, isLoading])

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && !isLoading && (
            <div className="text-muted-foreground">You have no notifications yet.</div>
          )}
          {items.map((n) => (
            <div key={n.id} className="rounded border p-3">
              <div className="text-sm font-medium">{typeToLabel[n.type] || n.type}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {n.type === 'STREAK_WARNING' && n.data?.hoursRemaining ? (
                  <>You have {n.data.hoursRemaining} hours left to keep your streak.</>
                ) : n.type === 'FOLLOW' && n.data?.followerName ? (
                  <>{n.data.followerName} started following you.</>
                ) : n.type === 'DOCUMENT_LIKED' && n.data?.title ? (
                  <>Your quiz "{n.data.title}" received a like.</>
                ) : n.type === 'QUIZ_TAKEN' && n.data?.title ? (
                  <>Someone played your quiz "{n.data.title}".</>
                ) : (
                  <>{JSON.stringify(n.data)}</>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
          <div ref={sentinelRef} className="h-6" />
        </CardContent>
      </Card>
    </div>
  )
}


