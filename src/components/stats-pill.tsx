import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'wasp/client/operations'
import { useToast } from '../hooks/use-toast'
import { getStatsOverview, getCurrentUser, getQloHistory, getNotifications, markNotificationsRead } from 'wasp/client/operations'
import { cn } from '../lib/cn'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { useAuth } from 'wasp/client/auth'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Bell } from 'lucide-react'

interface StatsPillProps {
  className?: string
}

const StatStack: React.FC<{
  icon: string;
  value: number | string;
  bubbleClasses: string;
  pulse?: boolean;
  layout?: 'inside' | 'right' | 'below';
  className?: string;
}> = ({ icon, value, bubbleClasses, pulse, layout = 'right', className }) => (
  <div
    className={cn(
      layout === 'right' ? 'flex items-center gap-1.5' : 'flex flex-col items-center',
      'justify-center min-w-[44px] sm:min-w-[52px]'
    )}
  >
    <div
      className={cn(
        'h-10 sm:h-11 rounded-full flex items-center justify-center text-base sm:text-lg shadow-sm',
        layout === 'inside' ? 'px-2 sm:px-2.5 w-auto' : 'w-10 sm:w-11',
        bubbleClasses,
        pulse && 'ring-2 ring-offset-1 ring-offset-white ring-black/10',
        className
      )}
    >
      {layout === 'inside' ? (
        <div className="flex items-center gap-1 font-semibold">
          <span aria-hidden>{icon}</span>
          <span className="text-[11px] sm:text-sm tabular-nums">{value}</span>
        </div>
      ) : (
        <span aria-hidden>{icon}</span>
      )}
    </div>
    {layout !== 'inside' && (
      <span className={cn(
        'font-semibold tabular-nums',
        layout === 'right' ? 'text-xs sm:text-sm' : 'mt-1 text-[10px] sm:text-xs'
      )}>
        {value}
      </span>
    )}
  </div>
)

export const StatsPill: React.FC<StatsPillProps> = ({ className }) => {
  const navigate = useNavigate()
  const { data: authUser } = useAuth()
  const { data: currentUser } = useQuery(getCurrentUser, undefined, { retry: 0 })
  const [previousStats, setPreviousStats] = useState<any>(null)
  const [pulseFlags, setPulseFlags] = useState({
    streak: false,
    elo: false,
    medals: false,
    rivals: false
  })

  const { data: stats, isLoading, error, refetch } = useQuery(getStatsOverview, { range: 30 })
  const { data: qloSeries } = useQuery(getQloHistory)
  const { data: notifications, refetch: refetchNotifications } = useQuery(getNotifications, { limit: 10 })
  const { toast } = useToast()

  // SSE subscription for real-time updates (works via Vite proxy in dev)
  useEffect(() => {
    const isDev = typeof window !== 'undefined' && window.location.port === '3000'
    const sseUrl = isDev ? 'http://localhost:3001/api/stats-events' : '/api/stats-events'
    // Note: EventSource withCredentials is widely supported; cast for TS
    const es = new (window as any).EventSource(sseUrl, isDev ? { withCredentials: true } : undefined)
    let timeout: any
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data || '{}')
        if (!payload) return
        // For now, on any stats-related event, trigger a soft pulse and refetch
        setPulseFlags((prev) => ({ ...prev, streak: true, elo: true, medals: true }))
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          // Refetch the overview query to get the latest values
          refetch()
          // Also refetch notifications for the bell
          try { refetchNotifications() } catch {}
          // Friendly toast to simulate live update
          try {
            const message = payload.type === 'achievement_granted' ? 'New achievement unlocked!' : payload.type === 'quiz_completed' ? 'Quiz completed — stats updated.' : 'Stats updated.'
            toast({ description: message })
          } catch {}
          setPulseFlags({ streak: false, elo: false, medals: false, rivals: false })
        }, 300)
      } catch {}
    }
    es.onerror = () => {
      es.close()
    }
    return () => {
      es.close()
      // ensure timers cleared
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = timeout && clearTimeout(timeout)
    }
  }, [])

  // Notifications SSE (for live unread badge/panel refresh)
  useEffect(() => {
    const isDev = typeof window !== 'undefined' && window.location.port === '3000'
    const url = isDev ? 'http://localhost:3001/api/notifications-events' : '/api/notifications-events'
    const es = new (window as any).EventSource(url, isDev ? { withCredentials: true } : undefined)
    es.onmessage = () => {
      try { refetchNotifications() } catch {}
    }
    es.onerror = () => es.close()
    return () => es.close()
  }, [])

  // Micro-animations when values change
  useEffect(() => {
    if (stats && previousStats) {
      const newPulseFlags = {
        streak: stats.streak !== previousStats.streak,
        elo: false, // TODO: Compare elo when implemented
        medals: stats.medalsCount !== previousStats.medalsCount,
        rivals: stats.rivalsCount !== previousStats.rivalsCount
      }

      setPulseFlags(newPulseFlags)

      // Reset pulse flags after animation
      const timeout = setTimeout(() => {
        setPulseFlags({ streak: false, elo: false, medals: false, rivals: false })
      }, 600)

      return () => clearTimeout(timeout)
    }

    if (stats) {
      setPreviousStats(stats)
    }
  }, [stats, previousStats])

  // QLO tick-up animation & pulse on change
  const [displayQlo, setDisplayQlo] = useState<number>(0)
  const prevQloRef = React.useRef<number>(0)
  useEffect(() => {
    const current = qloSeries?.currentQlo ?? 0
    // initialize on first load
    if (prevQloRef.current === 0 && displayQlo === 0) {
      prevQloRef.current = current
      setDisplayQlo(current)
      return
    }
    if (current !== prevQloRef.current) {
      // trigger pulse
      setPulseFlags((p) => ({ ...p, elo: true }))
      const start = prevQloRef.current
      const end = current
      const duration = 500
      const startTs = performance.now()
      let raf: number
      const step = (t: number) => {
        const progress = Math.min(1, (t - startTs) / duration)
        const value = Math.round(start + (end - start) * progress)
        setDisplayQlo(value)
        if (progress < 1) raf = requestAnimationFrame(step)
        else {
          setTimeout(() => setPulseFlags((p) => ({ ...p, elo: false })), 150)
        }
      }
      raf = requestAnimationFrame(step)
      prevQloRef.current = current
      return () => cancelAnimationFrame(raf)
    }
  }, [qloSeries?.currentQlo])

  const handleClick = () => {
    const id = (currentUser as any)?.id || authUser?.id
    if (id) navigate(`/user/${id}`)
    else navigate('/profile')
  }

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center space-x-2 bg-white border border-gray-200 rounded-full px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm',
        className
      )}>
        <div className="flex items-center space-x-2">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return null // Gracefully hide if there's an error
  }

  if (!stats) {
    return null
  }

  // Placeholder for QLO; values not shown in icon-only pill

  // Current QLO from server
  const currentQlo = displayQlo

  return (
    <div
      className={cn(
        'flex items-center bg-white/90 backdrop-blur border border-black/10 rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-sm hover:shadow-md transition-all duration-200',
        'space-x-2 sm:space-x-3',
        className
      )}
    >
      {/* Left metrics with numbers below */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <StatStack icon="🔥" value={stats.streak || 0} bubbleClasses={stats.streak > 0 ? 'bg-orange-100' : 'bg-gray-100'} pulse={pulseFlags.streak} layout="inside" />
        <StatStack icon="♟" value={currentQlo} bubbleClasses="bg-blue-100" pulse={pulseFlags.elo} layout="inside" className="px-3 sm:px-3.5 transition-transform duration-300" />
        <StatStack icon="🏅" value={stats.medalsCount || 0} bubbleClasses={stats.medalsCount > 0 ? 'bg-yellow-100' : 'bg-gray-100'} pulse={pulseFlags.medals} layout="inside" />
        <StatStack icon="🥷" value={stats.rivalsCount || 0} bubbleClasses={stats.rivalsCount > 0 ? 'bg-red-100' : 'bg-gray-100'} pulse={pulseFlags.rivals} layout="inside" />
      </div>

      {/* Bell with unread badge + popover */}
      <Popover>
        <PopoverTrigger asChild>
          {(() => {
            const unread = (notifications?.items?.filter((n: any) => !n.readAt)?.length || 0)
            const hasUnread = unread > 0
            return (
              <button type="button" className={cn(
                'relative h-10 sm:h-11 w-10 sm:w-11 rounded-full flex items-center justify-center shadow-sm transition-colors',
                hasUnread ? 'bg-yellow-100 text-yellow-900 hover:bg-yellow-100/90' : 'bg-gray-100 text-foreground hover:bg-gray-100/80'
              )} aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-red-500 text-white text-[10px] px-1">
                    {Math.min(9, unread)}{unread > 9 ? '+' : ''}
                  </span>
                )}
              </button>
            )
          })()}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end" side="bottom" sideOffset={8}>
          <div className="p-3 border-b text-sm font-medium flex items-center justify-between bg-white">
            <span>Notifications</span>
            <button
              className="text-xs text-primary hover:underline"
              onClick={async () => {
                try {
                  const unreadIds = (notifications?.items || []).filter((n: any) => !n.readAt).map((n: any) => n.id)
                  if (unreadIds.length) {
                    await (markNotificationsRead as any)({ ids: unreadIds })
                    await refetchNotifications()
                  }
                } catch {}
              }}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-72 overflow-auto">
            {(notifications?.items || []).slice(0, 10).map((n: any) => (
              <div key={n.id} className={cn('px-3 py-2 text-sm border-b last:border-b-0', !n.readAt ? 'bg-muted/40' : '')}>
                <div className="font-medium text-xs mb-0.5">{n.type.replace(/_/g, ' ')}</div>
                <div className="text-xs text-muted-foreground">{n.data?.title || n.data?.followerName || JSON.stringify(n.data)}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {(notifications?.items?.length || 0) === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground">You have no notifications.</div>
            )}
          </div>
          <div className="p-2 text-center text-xs">
            <a href="/notifications" className="text-primary hover:underline">View all</a>
          </div>
        </PopoverContent>
      </Popover>

      {/* Avatar on the right - largest pill */}
      <div className="flex items-center justify-center cursor-pointer" onClick={handleClick}>
        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-100 border border-black/10 flex items-center justify-center shadow-sm">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-black/10">
            <AvatarImage src={currentUser?.avatarUrl || undefined} alt="Profile" />
            <AvatarFallback>
              {(currentUser?.handle || currentUser?.username || 'U').toString().slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  )
}
