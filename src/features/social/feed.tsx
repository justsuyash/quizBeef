import React, { useEffect, useState, useRef } from 'react'
import { Users, UserPlus, Sparkles, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useQuery } from 'wasp/client/operations'
import {
  getUserFeed,
  getFollowSuggestions,
  getTrending,
  getRelatedToUserTopics,
  getReviseList,
  searchFeedSuggestions,
  getFeed,
} from 'wasp/client/operations'
import { Input } from '../../components/ui/input'
import { ActivityFeedItem, UserCard } from './components'
import { LikeButton, CommentSection } from '../feedback/components'

export default function SocialFeedPage() {
  const [feedOffset, setFeedOffset] = useState(0)
  const [activities, setActivities] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [quizFeedOffset, setQuizFeedOffset] = useState(0)
  const [quizItems, setQuizItems] = useState<any[]>([])
  const quizSentinelRef = useRef<HTMLDivElement | null>(null)
  const isLoadingMoreQuizzesRef = useRef(false)

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

  const { data: trending, refetch: refetchTrending } = useQuery(getTrending, { range: '7d' })
  const { data: related, refetch: refetchRelated } = useQuery(getRelatedToUserTopics, { limit: 5 })
  const { data: revise, refetch: refetchRevise } = useQuery(getReviseList, { limit: 5 })
  const { data: search } = useQuery(searchFeedSuggestions, { q: debounced, limit: 6 }, { enabled: debounced.length > 1 })
  const { data: quizFeed, isLoading: isQuizFeedLoading } = useQuery(getFeed, { limit: 10, offset: quizFeedOffset })

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

  useEffect(() => {
    if (quizFeed?.items) {
      if (quizFeedOffset === 0) setQuizItems(quizFeed.items)
      else setQuizItems((prev) => [...prev, ...quizFeed.items])
    }
  }, [quizFeed, quizFeedOffset])

  const handleRefresh = async () => {
    setFeedOffset(0)
    setActivities([])
    await Promise.all([refetchFeed(), refetchTrending(), refetchRelated(), refetchRevise()])
  }

  const [isSearchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleLoadMore = () => {
    if (feedData?.hasMore) setFeedOffset((prev) => prev + 10)
  }

  // Infinite scroll for followed creators' public quizzes
  useEffect(() => {
    if (!quizSentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first.isIntersecting) return
        if (isLoadingMoreQuizzesRef.current) return
        if (!quizFeed?.hasMore) return

        isLoadingMoreQuizzesRef.current = true
        setQuizFeedOffset((prev) => prev + 10)
      },
      { root: null, rootMargin: '0px', threshold: 1.0 }
    )

    observer.observe(quizSentinelRef.current)
    return () => observer.disconnect()
  }, [quizFeed?.hasMore])

  useEffect(() => {
    // Reset the loading flag when request state flips
    if (!isQuizFeedLoading) {
      isLoadingMoreQuizzesRef.current = false
    }
  }, [isQuizFeedLoading])

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
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isFeedLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Trending</CardTitle>
            </CardHeader>
            <CardContent>
              {trending && trending.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {trending.map((t: any) => (
                    <div key={t.id} className="p-3 rounded border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{t.title}</div>
                          <div className="text-xs text-muted-foreground">{t.category || 'General'}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Score {Math.round(t.score)}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <LikeButton quizId={t.id} initialLiked={false} initialCount={t.likeCount ?? 0} size="sm" />
                        <span>💬 {t.commentCount ?? 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No trending quizzes yet.</div>
              )}
            </CardContent>
          </Card>

          {/* Related to your topics */}
          <Card>
            <CardHeader>
              <CardTitle>Related to your topics</CardTitle>
            </CardHeader>
            <CardContent>
              {related && related.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {related.map((r: any) => (
                    <div key={r.id} className="p-3 rounded border">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.category || 'General'}</div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <LikeButton quizId={r.id} initialLiked={false} initialCount={r.likeCount ?? 0} size="sm" />
                        <span>💬 {r.commentCount ?? 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No related quizzes yet. Take more quizzes to personalize this.</div>
              )}
            </CardContent>
          </Card>

          {/* Revise */}
          <Card>
            <CardHeader>
              <CardTitle>Revise</CardTitle>
            </CardHeader>
            <CardContent>
              {revise && revise.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {revise.map((r: any) => (
                    <div key={r.attemptId} className="p-3 rounded border">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">Score {Math.round(r.score)} · {new Date(r.createdAt).toLocaleDateString()}</div>
                      {r.quizId ? (
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <LikeButton quizId={r.quizId} initialLiked={r.userHasLiked ?? false} initialCount={r.likeCount ?? 0} size="sm" />
                          <span>💬 {r.commentCount ?? 0}</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No items to revise yet. Complete some quizzes to see suggestions here.</div>
              )}
            </CardContent>
          </Card>

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

              {/* Followed creators' public quizzes (infinite scroll) */}
              <Card>
                <CardHeader>
                  <CardTitle>From creators you follow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {quizItems.map((q: any) => (
                      <div key={q.id} className="p-3 rounded border">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{q.title}</div>
                            <div className="text-xs text-muted-foreground">{q.category || 'General'}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">by {q.user?.name || 'User'}</div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <LikeButton quizId={q.id} initialLiked={q.userHasLiked} initialCount={q.likeCount ?? 0} size="sm" />
                            <span>💬 {q.commentCount ?? 0}</span>
                          </div>
                          <div className="text-[11px]">{new Date(q.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="mt-2">
                          <CommentSection quizId={q.id} initialCommentCount={q.commentCount ?? 0} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Sentinel for infinite scroll */}
                  {quizFeed?.hasMore && (
                    <div ref={quizSentinelRef} className="h-6" />
                  )}
                </CardContent>
              </Card>
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