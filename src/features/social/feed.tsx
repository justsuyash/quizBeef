import React, { useEffect, useState } from 'react'
import { Users, UserPlus, Sparkles, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useQuery } from 'wasp/client/operations'
import { getUserFeed, getFollowSuggestions, getTrending, getRelatedToUserTopics, getReviseList, searchFeedSuggestions } from 'wasp/client/operations'
import { Input } from '../../components/ui/input'
import { ActivityFeedItem, UserCard } from './components'

export default function SocialFeedPage() {
  const [feedOffset, setFeedOffset] = useState(0)
  const [activities, setActivities] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  const {
    data: feedData,
    isLoading: isFeedLoading,
    error: feedError,
    refetch: refetchFeed,
  } = useQuery(getUserFeed, { limit: 10, offset: feedOffset })

  const {
    data: suggestions,
    isLoading: isSuggestionsLoading,
  } = useQuery(getFollowSuggestions, { limit: 6 })

  const { data: trending } = useQuery(getTrending, { range: '7d' })
  const { data: related } = useQuery(getRelatedToUserTopics, { limit: 5 })
  const { data: revise } = useQuery(getReviseList, { limit: 5 })
  const { data: search } = useQuery(searchFeedSuggestions, { q: debounced, limit: 6 }, { enabled: debounced.length > 1 })

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (feedData?.activities) {
      if (feedOffset === 0) setActivities(feedData.activities)
      else setActivities((prev) => [...prev, ...feedData.activities])
    }
  }, [feedData, feedOffset])

  const handleRefresh = async () => {
    setFeedOffset(0)
    setActivities([])
    await refetchFeed()
  }

  const handleLoadMore = () => {
    if (feedData?.hasMore) setFeedOffset((prev) => prev + 10)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Search */}
      <div className="mb-4">
        <Input placeholder="Search followers or quizzes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {debounced && (search?.users?.length || search?.documents?.length) ? (
          <div className="mt-2 grid gap-2 rounded border p-3 bg-background">
            {search?.users?.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Users</div>
                <div className="flex flex-wrap gap-2">
                  {search.users.map((u) => (
                    <span key={u.id} className="px-2 py-1 rounded bg-muted text-sm">{u.handle || u.name}</span>
                  ))}
                </div>
              </div>
            )}
            {search?.documents?.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Quizzes</div>
                <div className="flex flex-wrap gap-2">
                  {search.documents.map((d) => (
                    <span key={d.id} className="px-2 py-1 rounded bg-muted text-sm">{d.title}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Social Feed</h1>
            <p className="text-muted-foreground">Stay connected with the QuizBeef community</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFeedLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed" className="gap-2">
            <Sparkles className="h-4 w-4" /> Activity Feed
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-2">
            <UserPlus className="h-4 w-4" /> Discover People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6 space-y-6">
          {/* Trending */}
          {trending && trending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {trending.map((t: any) => (
                    <div key={t.id} className="p-3 rounded border flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">{t.category || 'General'}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Score {Math.round(t.score)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related to your topics */}
          {related && related.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related to your topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {related.map((r: any) => (
                    <div key={r.id} className="p-3 rounded border">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.category || 'General'}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revise */}
          {revise && revise.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Revise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {revise.map((r: any) => (
                    <div key={r.attemptId} className="p-3 rounded border">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">Score {Math.round(r.score)} · {new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isFeedLoading && activities.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : feedError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p className="font-medium">Failed to load feed</p>
                  <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
                </div>
              </CardContent>
            </Card>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">No activity yet. Follow users to see updates here.</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <ActivityFeedItem key={`${activity.id}-${index}`} activity={activity} />
              ))}

              {feedData?.hasMore && (
                <div className="text-center pt-2">
                  <Button onClick={handleLoadMore} variant="outline" size="sm" disabled={isFeedLoading}>
                    {isFeedLoading ? 'Loading…' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          {isSuggestionsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-24" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suggestions?.map((user: any) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}