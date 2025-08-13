import { useState, useEffect, useRef } from 'react'
import { useQuery } from 'wasp/client/operations'
import { getBeefChallenge } from 'wasp/client/operations'

interface UseRealtimeChallengeOptions {
  challengeId: number
  enabled?: boolean
  pollInterval?: number
}

interface RealtimeState {
  isConnected: boolean
  lastUpdate: Date | null
  participants: any[]
  status: string
  currentRound?: number
}

/**
 * Custom hook for real-time beef challenge updates
 * Uses optimized polling with automatic backoff and reconnection
 */
export function useRealtimeChallenge({ 
  challengeId, 
  enabled = true, 
  pollInterval = 2000 
}: UseRealtimeChallengeOptions) {
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isConnected: false,
    lastUpdate: null,
    participants: [],
    status: 'WAITING'
  })

  const pollIntervalRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Primary query for challenge data
  const { 
    data: challenge, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    getBeefChallenge, 
    { challengeId },
    { 
      enabled: enabled && challengeId > 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true
    }
  )

  // Enhanced polling with exponential backoff
  const startPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    const poll = async () => {
      try {
        const result = await refetch()
        
        if (result.data) {
          setRealtimeState(prev => ({
            ...prev,
            isConnected: true,
            lastUpdate: new Date(),
            participants: result.data.participants || [],
            status: result.data.status,
            currentRound: getCurrentRound(result.data)
          }))

          // Reset reconnect attempts on successful poll
          reconnectAttemptsRef.current = 0
        }
      } catch (error) {
        console.error('Polling error:', error)
        
        // Increment reconnect attempts
        reconnectAttemptsRef.current += 1
        
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setRealtimeState(prev => ({
            ...prev,
            isConnected: false
          }))
          stopPolling()
          return
        }

        // Exponential backoff for reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        setTimeout(() => {
          if (enabled) {
            startPolling()
          }
        }, backoffDelay)
      }
    }

    // Initial poll
    poll()

    // Set up interval with adaptive timing based on challenge status
    const getAdaptiveInterval = () => {
      if (challenge?.status === 'IN_PROGRESS') {
        return 1000 // 1 second during active challenge
      } else if (challenge?.status === 'STARTING') {
        return 500 // 0.5 seconds during countdown
      } else {
        return pollInterval // Default interval for waiting/completed
      }
    }

    pollIntervalRef.current = setInterval(poll, getAdaptiveInterval())
  }

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = undefined
    }
  }

  // Determine current round from challenge data
  const getCurrentRound = (challengeData: any): number | undefined => {
    if (!challengeData?.rounds) return undefined
    
    const activeRound = challengeData.rounds.find((round: any) => 
      round.startedAt && !round.endedAt
    )
    
    return activeRound?.roundNumber || 1
  }

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled && challengeId > 0) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, challengeId, challenge?.status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  // Manual refresh function
  const refresh = async () => {
    try {
      const result = await refetch()
      setRealtimeState(prev => ({
        ...prev,
        lastUpdate: new Date()
      }))
      return result
    } catch (error) {
      console.error('Manual refresh error:', error)
      throw error
    }
  }

  // Connection status indicators
  const connectionStatus = {
    isConnected: realtimeState.isConnected,
    isReconnecting: reconnectAttemptsRef.current > 0 && reconnectAttemptsRef.current < maxReconnectAttempts,
    hasConnectionError: reconnectAttemptsRef.current >= maxReconnectAttempts,
    lastUpdate: realtimeState.lastUpdate
  }

  // Enhanced participant tracking
  const participantUpdates = {
    totalParticipants: realtimeState.participants.length,
    readyParticipants: realtimeState.participants.filter((p: any) => p.isReady).length,
    allReady: realtimeState.participants.length > 0 && realtimeState.participants.every((p: any) => p.isReady),
    leaderboard: [...realtimeState.participants].sort((a: any, b: any) => b.finalScore - a.finalScore)
  }

  // Round and timing information
  const roundInfo = {
    currentRound: realtimeState.currentRound,
    totalRounds: challenge?.questionCount || 0,
    isLastRound: realtimeState.currentRound === challenge?.questionCount,
    progress: realtimeState.currentRound ? (realtimeState.currentRound / (challenge?.questionCount || 1)) * 100 : 0
  }

  return {
    // Core data
    challenge,
    isLoading,
    error,
    
    // Real-time state
    realtimeState,
    connectionStatus,
    participantUpdates,
    roundInfo,
    
    // Actions
    refresh,
    startPolling,
    stopPolling
  }
}
