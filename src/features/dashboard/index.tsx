import { Routes, routes, Link } from 'wasp/client/router'
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
import { Header } from '../../components/layout/header'
import { Main } from '../../components/layout/main'
import { TopNav } from '../../components/layout/top-nav'
import { ProfileDropdown } from '../../components/profile-dropdown'
import { Search } from '../../components/search'
import { ThemeSwitch } from '../../components/theme-switch'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { QuizStats } from './components/quiz-stats'
import { LearningProgressChart } from './components/learning-progress-chart'
import { PerformanceTrends } from './components/performance-trends'

export default function Dashboard() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ml-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
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
      </Main>
    </>
  )
}

type TopNavLink = {
  title: string
  href: Routes['to']
  isActive: boolean
  disabled: boolean
}

const topNav: TopNavLink[] = [
  {
    title: 'Overview',
    href: routes.DashboardRoute.to,
    isActive: true,
    disabled: false,
  },
  {
    title: 'Customers',
    href: routes.DashboardRoute.to,
    isActive: false,
    disabled: true,
  },
  {
    title: 'Products',
    href: routes.DashboardRoute.to,
    isActive: false,
    disabled: true,
  },
  {
    title: 'Settings',
    href: routes.DashboardRoute.to,
    isActive: false,
    disabled: true,
  },
]
