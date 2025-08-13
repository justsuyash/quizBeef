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
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'My Documents',
          url: '/documents',
          icon: IconChecklist,
        },
        {
          title: 'Upload Content',
          url: '/upload',
          icon: IconTool,
        },
        {
          title: 'Quiz History',
          url: '/quiz-history',
          icon: IconPackages,
        },
        {
          title: 'Beef Challenges',
          url: '/beef',
          badge: 'LIVE',
          icon: IconMessages,
        },
        {
          title: 'Leaderboard',
          url: '/leaderboard',
          icon: IconUsers,
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
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
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
