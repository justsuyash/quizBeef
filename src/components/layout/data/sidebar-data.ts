import {
  IconBarrierBlock,
  IconBrowserCheck,
  IconBug,
  IconChecklist,
  IconError404,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
  IconChartLine,
  IconTrophy,
  IconPlayerPlay,
  IconBrain,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Quiz Beef 🔥',
      logo: Command,
      plan: 'Brain Gym',
    },
    {
      name: 'Study Group Alpha',
      logo: GalleryVerticalEnd,
      plan: 'Competitive',
    },
    {
      name: 'Learning Squad',
      logo: AudioWaveform,
      plan: 'Active Recall',
    },
  ],
  navGroups: [
    {
      title: 'Learning',
      items: [
        {
          title: 'Play',
          url: '/play',
          icon: IconPlayerPlay,
        },
        {
          title: 'Nalanda',
          url: '/nalanda',
          icon: IconBrain,
        },
        {
          title: 'My Documents',
          url: '/documents',
          icon: IconChecklist,
        },
        {
          title: 'Beef Challenges',
          url: '/beef',
          badge: 'LIVE',
          icon: IconMessages,
        },
        {
          title: 'Analytics',
          url: '/analytics',
          icon: IconChartLine,
        },
        {
          title: 'Achievements',
          url: '/achievements',
          icon: IconTrophy,
        },
        {
          title: 'Leaderboard',
          icon: IconUsers,
          items: [
            {
              title: 'Global Rankings',
              url: '/leaderboard',
            },
            {
              title: 'Group Rankings',
              url: '/leaderboard/groups',
            },
          ],
        },
      ],
    },
    {
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: IconLockAccess,
          items: [
            {
              title: 'Sign In',
              url: '/login',
            },
            // {
            //   title: 'Sign In (2 Col)',
            //   url: '/sign-in-2',
            // },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            // {
            //   title: 'Forgot Password',
            //   url: '/forgot-password',
            // },
            // {
            //   title: 'OTP',
            //   url: '/otp',
            // },
          ],
        },
        // {
        //   title: 'Errors',
        //   icon: IconBug,
        //   items: [
        //     {
        //       title: 'Unauthorized',
        //       url: '/401',
        //       icon: IconLock,
        //     },
        //     {
        //       title: 'Forbidden',
        //       url: '/403',
        //       icon: IconUserOff,
        //     },
        //     {
        //       title: 'Not Found',
        //       url: '/404',
        //       icon: IconError404,
        //     },
        //     {
        //       title: 'Internal Server Error',
        //       url: '/500',
        //       icon: IconServerOff,
        //     },
        //     {
        //       title: 'Maintenance Error',
        //       url: '/503',
        //       icon: IconBarrierBlock,
        //     },
        //   ],
        // },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: IconSettings,
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}
