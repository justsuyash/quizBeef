import React from 'react'
import { useQuery } from 'wasp/client/operations'
import { getRivalsList, getRivalHeadToHead, logRivalsVisit } from 'wasp/client/operations'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export default function RivalsPage() {
  React.useEffect(() => {
    // fire-and-forget telemetry
    try { (logRivalsVisit as any)({ path: '/rivals' }) } catch {}
  }, [])
  const { data: rivals } = useQuery(getRivalsList)
  const PAGE_SIZE = 20
  const [page, setPage] = React.useState(1)
  const [items, setItems] = React.useState<any[]>([])
  const [total, setTotal] = React.useState(0)
  const { data: pageData } = useQuery(getRivalHeadToHead, { page, pageSize: PAGE_SIZE })
  React.useEffect(() => {
    if (!pageData) return
    setItems(prev => (page === 1 ? pageData.items : [...prev, ...pageData.items]))
    setTotal(pageData.total || 0)
  }, [pageData])

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Rivals</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Rivals</CardTitle>
            <CardDescription>Opponents you’ve faced and your record</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {(rivals || []).map((r: any) => (
                <div key={r.opponentId} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium">{r.handle}</div>
                    <div className="text-xs text-muted-foreground">{r.matches} matches • {r.winRate}% WR</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Start Beef</Button>
                  </div>
                </div>
              ))}
              {(rivals || []).length === 0 && (
                <div className="text-center text-muted-foreground col-span-full">No rivals yet.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Head‑to‑Head</CardTitle>
            <CardDescription>Recent matches vs all opponents</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="space-y-2 max-h-[520px] overflow-auto"
              onScroll={(e) => {
                const el = e.currentTarget
                const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
                const hasMore = items.length < total
                if (nearBottom && hasMore) setPage(p => p + 1)
              }}
            >
              {items.map((it: any) => (
                <div key={it.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${it.result === 'W' ? 'bg-green-500' : it.result === 'L' ? 'bg-red-500' : 'bg-gray-400'}`} />
                    <div className="text-sm">{new Date(it.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Review</Button>
                    <Button size="sm">Start Beef</Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center text-muted-foreground py-6">No history yet.</div>
              )}
              {items.length < total && (
                <div className="text-center text-xs text-muted-foreground py-2">Loading more…</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


