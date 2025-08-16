import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Switch } from '../../components/ui/switch'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Loader2, Database, Users, FileText, Trophy, Brain, RefreshCcw, Medal, TrendingUp, BarChart3, Swords, Undo2 } from 'lucide-react'
import { seedDatabase, backfillMyAccount, grantDemoAchievementsAll, seedEloHistoryAll, rebuildLeaderboardStatsAll, getCurrentUser, resetMySeededData, addRandomNinjas } from 'wasp/client/operations'
import { useQuery } from 'wasp/client/operations'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isBackfilling, setIsBackfilling] = useState(false)
  const [isGranting, setIsGranting] = useState(false)
  const [isSeedingElo, setIsSeedingElo] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [seedResult, setSeedResult] = useState<any>(null)
  const [recentBoost, setRecentBoost] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [isAddingNinjas, setIsAddingNinjas] = useState(false)
  const { data: currentUser } = useQuery(getCurrentUser)

  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true)
      setError(null)
      setSeedResult(null)
      
      console.log('🌱 Starting database seeding from admin panel...')
      const result = await seedDatabase({ recentBoost })
      
      setSeedResult(result)
      console.log('Seeding result:', result)
      
    } catch (err: any) {
      console.error('Seeding error:', err)
      setError(err.message || 'Failed to seed database')
    } finally {
      setIsSeeding(false)
    }
  }

  const handleBackfill = async () => {
    try {
      setIsBackfilling(true)
      setError(null)
      console.log('🧪 Backfilling current account...')
      await backfillMyAccount({})
      alert('Backfill complete! Check your Analytics tabs.')
    } catch (err: any) {
      console.error('Backfill error:', err)
      setError(err.message || 'Failed to backfill account')
    } finally {
      setIsBackfilling(false)
    }
  }

  const handleGrantAchievementsAll = async () => {
    try {
      setIsGranting(true)
      setError(null)
      const res = await grantDemoAchievementsAll({})
      alert(`Granted achievements: ${res.count}`)
    } catch (err: any) {
      console.error('Grant error:', err)
      setError(err.message || 'Failed to grant achievements')
    } finally {
      setIsGranting(false)
    }
  }

  const handleSeedEloAll = async () => {
    try {
      setIsSeedingElo(true)
      setError(null)
      await seedEloHistoryAll({})
      alert('Seeded Elo history for all users')
    } catch (err: any) {
      console.error('Seed Elo error:', err)
      setError(err.message || 'Failed to seed Elo history')
    } finally {
      setIsSeedingElo(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage Quiz Beef database and system operations</p>
        </div>
        <div className="shrink-0">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur rounded-full border border-black/10 px-3 py-1.5 shadow-sm">
            <div className="text-sm font-medium hidden sm:block">{currentUser?.handle || currentUser?.username || 'You'}</div>
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gray-100 border border-black/10 flex items-center justify-center">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-black/10">
                <AvatarImage src={currentUser?.avatarUrl || undefined} alt="Profile" />
                <AvatarFallback>{(currentUser?.handle || currentUser?.username || 'U').toString().slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Database Seeding Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Seeding
            </CardTitle>
            <CardDescription>
              Populate the database with realistic demo data for testing and showcasing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-sm font-medium">500 Users</div>
                <div className="text-xs text-muted-foreground">Realistic profiles</div>
              </div>
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-sm font-medium">2,000+ Documents</div>
                <div className="text-xs text-muted-foreground">With questions</div>
              </div>
              <div className="text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-sm font-medium">90-Day History</div>
                <div className="text-xs text-muted-foreground">Quiz attempts</div>
              </div>
              <div className="text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-sm font-medium">Achievements</div>
                <div className="text-xs text-muted-foreground">Pre-awarded</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Seeder Pro Features</h4>
                  <p className="text-sm text-muted-foreground">
                    Creates realistic data with proper geographic distribution, Elo ratings, and 3 months of activity
                  </p>
                </div>
                <div className="flex items-center gap-3 mr-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">Recent Activity Boost</div>
                    <div className="text-xs text-muted-foreground">Bias towards last 30–90 days</div>
                  </div>
                  <Switch checked={recentBoost} onCheckedChange={setRecentBoost} />
                </div>
                <Button 
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  size="lg"
                  className="shrink-0"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Run Seeder Pro
                    </>
                  )}
                </Button>
              </div>
              {/* Note: bulk seeding for all accounts only. Dev utilities live in Backfill section below. */}
            </div>

            {/* Environment Badge */}
            <div className="flex items-center gap-2">
              <Badge variant={process.env.NODE_ENV === 'production' ? 'destructive' : 'secondary'}>
                {process.env.NODE_ENV || 'development'} environment
              </Badge>
              {process.env.NODE_ENV === 'production' && (
                <span className="text-xs text-red-600">Seeding disabled in production</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backfill My Account (Dev-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Backfill My Account (Dev)</CardTitle>
            <CardDescription>
              Populate your user with recent quiz attempts, per-question timings, and Elo history. Remove before production.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
            <Button onClick={handleBackfill} disabled={isBackfilling}>
              {isBackfilling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Backfilling...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Backfill My Account
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleGrantAchievementsAll} disabled={isGranting}>
              {isGranting ? (
                'Granting…'
              ) : (
                <>
                  <Medal className="mr-2 h-4 w-4" />
                  Grant Demo Achievements (All Users)
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleSeedEloAll} disabled={isSeedingElo}>
              {isSeedingElo ? (
                'Seeding…'
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Seed Elo History (All Users)
                </>
              )}
            </Button>
            <Button variant="outline" onClick={async ()=>{ setIsRebuilding(true); setError(null); try { await rebuildLeaderboardStatsAll({}); alert('Recomputed leaderboard stats'); } catch(e:any){ setError(e.message||'Failed to rebuild'); } finally { setIsRebuilding(false); } }} disabled={isRebuilding}>
              {isRebuilding ? (
                'Recomputing…'
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Rebuild Leaderboard Stats
                </>
              )}
            </Button>
            {/* Dev-only utilities targeting the current account */}
            <Button variant="outline" size="sm" onClick={async ()=>{ try{ setIsAddingNinjas(true); const res = await addRandomNinjas({}); alert(`Ninja Seeder added ${res.count} ninja(s) to your account.`); } catch(e:any){ setError(e.message||'Failed to add ninjas'); } finally{ setIsAddingNinjas(false);} }} disabled={isAddingNinjas}>
              {isAddingNinjas ? (
                'Summoning…'
              ) : (
                <>
                  <Swords className="mr-2 h-4 w-4" />
                  Ninja Seeder
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={async ()=>{ try{ setIsResetting(true); await resetMySeededData({}); alert('Your seeded data has been reset.'); } catch(e:any){ setError(e.message||'Reset failed'); } finally{ setIsResetting(false);} }} disabled={isResetting}>
              {isResetting ? (
                'Resetting…'
              ) : (
                <>
                  <Undo2 className="mr-2 h-4 w-4" />
                  Reset My Seeded Data
                </>
              )}
            </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {seedResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Seeding Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{seedResult.message}</p>
              
              {seedResult.stats && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Users</div>
                    <div className="text-muted-foreground">
                      {seedResult.stats.before.userCount} → {seedResult.stats.after.userCount}
                      <span className="ml-2 text-green-600">
                        (+{seedResult.stats.added.users})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Documents</div>
                    <div className="text-muted-foreground">
                      {seedResult.stats.before.documentCount} → {seedResult.stats.after.documentCount}
                      <span className="ml-2 text-green-600">
                        (+{seedResult.stats.added.documents})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Quiz Attempts</div>
                    <div className="text-muted-foreground">
                      {seedResult.stats.before.quizAttemptCount} → {seedResult.stats.after.quizAttemptCount}
                      <span className="ml-2 text-green-600">
                        (+{seedResult.stats.added.quizAttempts})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Safe Operation:</strong> The seeder checks if data already exists and won't duplicate records. It's idempotent and safe to run multiple times.
            </div>
            <div>
              <strong>Realistic Data:</strong> Generated users have proper geographic distribution across 10 countries, realistic Elo ratings (bell curve around 1200), and varied activity patterns.
            </div>
            <div>
              <strong>Performance:</strong> Creates 500 users with 90 days of quiz history each. This may take 2-5 minutes depending on your system.
            </div>
            <div>
              <strong>Production Safety:</strong> Seeding is automatically disabled in production environments.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
