import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getUserGroups, getGroupLeaderboard } from 'wasp/client/operations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Trophy } from 'lucide-react'

type Metric = 'qlo' | 'quiz_score' | 'beef_wins' | 'accuracy' | 'total_quizzes'

export default function GroupLeaderboardCard({ defaultMetric = 'qlo' }: { defaultMetric?: Metric }) {
  const [selectedGroupId, setSelectedGroupId] = React.useState<number | null>(null)
  const [metric, setMetric] = React.useState<Metric>(defaultMetric)

  const { data: myGroups, isLoading: groupsLoading } = useQuery(getUserGroups)
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery(
    getGroupLeaderboard,
    selectedGroupId ? { groupId: selectedGroupId, type: metric } : undefined,
    { enabled: !!selectedGroupId }
  )

  React.useEffect(() => {
    if (myGroups && myGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(myGroups[0].id)
    }
  }, [myGroups, selectedGroupId])

  const computeValue = (p: any): number => {
    switch (metric) {
      case 'qlo':
        return p.qlo ?? 0
      case 'quiz_score':
        return p.totalScore ?? 0
      case 'beef_wins':
        return p.totalBeefWins ?? 0
      case 'accuracy':
        return Math.round((p.averageAccuracy ?? 0) * 100)
      case 'total_quizzes':
        return p.totalQuizzes ?? 0
    }
  }

  const max = leaderboardData?.leaderboard?.length
    ? Math.max(...leaderboardData.leaderboard.map((x: any) => computeValue(x))) || 1
    : 1

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Group Rankings</CardTitle>
        <div className="flex gap-2">
          <Select value={selectedGroupId?.toString()} onValueChange={(v)=>setSelectedGroupId(parseInt(v))}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Group" /></SelectTrigger>
            <SelectContent>
              {(myGroups||[]).map((g:any)=> (
                <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={(v:any)=>setMetric(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="qlo">QLO</SelectItem>
              <SelectItem value="quiz_score">Total Score</SelectItem>
              <SelectItem value="beef_wins">Beef Wins</SelectItem>
              <SelectItem value="accuracy">Accuracy</SelectItem>
              <SelectItem value="total_quizzes">Total Quizzes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {groupsLoading || leaderboardLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : leaderboardData && leaderboardData.leaderboard?.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="font-medium">{leaderboardData.group?.name}</span>
              </div>
              <Badge variant="outline">{leaderboardData.totalMembers} total members</Badge>
            </div>
            {leaderboardData.leaderboard.map((p:any, idx:number)=>{
              const value = computeValue(p)
              const pct = Math.max(5,(value/max)*100)
              return (
                <div key={p.id} className={`relative overflow-hidden rounded-md border ${p.isCurrentUser? 'bg-primary/5 border-primary/30' : ''}`}>
                  <div className="absolute inset-0 bg-muted/50" style={{width: pct+'%'}} />
                  <div className="relative z-10 flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-semibold">#{p.rank}</span>
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback>{(p.handle||'U').slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium truncate max-w-[140px]">{p.handle || `User ${idx+1}`}{p.isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}</div>
                    </div>
                    <div className="text-sm font-semibold">{value}</div>
                  </div>
                </div>
              )
            })}
            {leaderboardData.currentUserRank > 10 && (
              <div className="text-center text-xs text-muted-foreground">Your rank: #{leaderboardData.currentUserRank} of {leaderboardData.totalMembers}</div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">No group data yet.</div>
        )}
      </CardContent>
    </Card>
  )
}


