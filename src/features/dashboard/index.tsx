import { Link } from 'wasp/client/router'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs'

import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { QuizStats } from './components/quiz-stats'
import { LearningProgressChart } from './components/learning-progress-chart'
import { PerformanceTrends } from './components/performance-trends'

export default function Dashboard() {
  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Welcome to Quiz Beef 🔥</h1>
            <p className='text-muted-foreground'>Transform any content into active recall challenges. Ready to beef up your brain?</p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button asChild>
              <Link to='/upload'>Upload Document</Link>
            </Button>
            <Button variant="outline" disabled>Start a Beef</Button>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='analytics'>
                Analytics
              </TabsTrigger>
              <TabsTrigger value='progress'>
                Progress
              </TabsTrigger>
              <TabsTrigger value='performance'>
                Performance
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <QuizStats />
          </TabsContent>
          
          <TabsContent value='analytics' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Learning Overview</CardTitle>
                  <CardDescription>Your quiz performance and progress trends</CardDescription>
                </CardHeader>
                <CardContent className='pl-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Quiz Activity</CardTitle>
                  <CardDescription>
                    Your latest quiz completions and scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='progress' className='space-y-4'>
            <LearningProgressChart />
          </TabsContent>

          <TabsContent value='performance' className='space-y-4'>
            <PerformanceTrends />
          </TabsContent>
        </Tabs>
    </main>
  )
}


