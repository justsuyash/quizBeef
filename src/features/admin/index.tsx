import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Loader2, Database, Users, FileText, Trophy, Brain } from 'lucide-react'
import { seedDatabase } from 'wasp/client/operations'

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true)
      setError(null)
      setSeedResult(null)
      
      console.log('🌱 Starting database seeding from admin panel...')
      const result = await seedDatabase({})
      
      setSeedResult(result)
      console.log('Seeding result:', result)
      
    } catch (err: any) {
      console.error('Seeding error:', err)
      setError(err.message || 'Failed to seed database')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage Quiz Beef database and system operations
        </p>
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
