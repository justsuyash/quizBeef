import React from 'react'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react'

interface RealTimeStatusProps {
  connectionStatus: {
    isConnected: boolean
    isReconnecting: boolean
    hasConnectionError: boolean
    lastUpdate: Date | null
  }
  participantUpdates: {
    totalParticipants: number
    readyParticipants: number
    allReady: boolean
  }
  onRefresh?: () => void
  compact?: boolean
}

export function RealTimeStatus({ 
  connectionStatus, 
  participantUpdates, 
  onRefresh,
  compact = false 
}: RealTimeStatusProps) {
  const { isConnected, isReconnecting, hasConnectionError, lastUpdate } = connectionStatus
  const { totalParticipants, readyParticipants, allReady } = participantUpdates

  const getConnectionBadge = () => {
    if (hasConnectionError) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          {compact ? 'Error' : 'Connection Error'}
        </Badge>
      )
    }

    if (isReconnecting) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {compact ? 'Reconnecting' : 'Reconnecting...'}
        </Badge>
      )
    }

    if (isConnected) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-500">
          <Wifi className="h-3 w-3" />
          {compact ? 'Live' : 'Connected'}
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <WifiOff className="h-3 w-3" />
        {compact ? 'Offline' : 'Disconnected'}
      </Badge>
    )
  }

  const getLastUpdateText = () => {
    if (!lastUpdate) return 'Never'
    
    const now = new Date()
    const diff = now.getTime() - lastUpdate.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 10) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    
    return lastUpdate.toLocaleTimeString()
  }

  const getParticipantStatus = () => {
    if (totalParticipants === 0) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="text-sm">No participants</span>
        </div>
      )
    }

    if (allReady) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">All ready ({totalParticipants})</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <Timer className="h-4 w-4" />
        <span className="text-sm">
          {readyParticipants}/{totalParticipants} ready
        </span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {getConnectionBadge()}
        {getParticipantStatus()}
        {onRefresh && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isReconnecting}
          >
            <RefreshCw className={`h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Real-Time Status
          </h4>
          {getConnectionBadge()}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Participants:</span>
            {getParticipantStatus()}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Update:</span>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{getLastUpdateText()}</span>
            </div>
          </div>

          {hasConnectionError && (
            <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium">Connection Lost</p>
                <p>Unable to get real-time updates. Check your internet connection.</p>
              </div>
            </div>
          )}

          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isReconnecting}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isReconnecting ? 'animate-spin' : ''}`} />
              {isReconnecting ? 'Refreshing...' : 'Refresh Now'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
