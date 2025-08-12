import { useAuth } from 'wasp/client/auth'
import { useQuery } from 'wasp/client/operations'
import { getCurrentUser } from 'wasp/client/operations'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '../../components/ui/sidebar'
import { NavGroup } from '../../components/layout/nav-group'
import { NavUser } from '../../components/layout/nav-user'
import { TeamSwitcher } from '../../components/layout/team-switcher'
import { sidebarData } from './data/sidebar-data'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: authUser } = useAuth()
  const { data: userData } = useQuery(getCurrentUser, undefined, {
    enabled: !!authUser
  })
  
  // Create user object with actual user data
  const currentUser = userData ? {
    name: userData.username,
    email: userData.email,
    avatar: '/avatars/01.png' // Default avatar
  } : sidebarData.user // Fallback to default

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
