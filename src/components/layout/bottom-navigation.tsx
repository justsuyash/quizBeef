import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import {
  Home,
  FileText,
  Trophy,
  User,
  Gamepad2,
  BookOpen,
  Medal,
  UserCircle,
  LayoutDashboard,
  Upload,
  History,
  Zap,
  Settings,
  MessageSquare,
  Brain,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from 'wasp/client/auth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  activeIcon: React.ElementType;
  href: string;
  color: string; // Accent color for active state
}

// Mobile Navigation (4 main items)
const mobileNavItems: NavItem[] = [
  {
    id: 'documents',
    label: 'My Documents',
    icon: BookOpen,
    activeIcon: BookOpen,
    href: '/documents',
    color: 'text-primary',
  },
  {
    id: 'upload',
    label: 'Upload Content',
    icon: Upload,
    activeIcon: Upload,
    href: '/upload',
    color: 'text-secondary',
  },
  {
    id: 'quiz-history',
    label: 'Quiz History',
    icon: History,
    activeIcon: History,
    href: '/quiz-history',
    color: 'text-accent',
  },
  {
    id: 'beef',
    label: 'Beef Challenges',
    icon: Zap,
    activeIcon: Zap,
    href: '/beef',
    color: 'text-orange-500',
  },
];

// Desktop Navigation (comprehensive)
const desktopNavItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    activeIcon: Home,
    href: '/home',
    color: 'text-primary',
  },
  {
    id: 'library',
    label: 'Nalanda',
    icon: Brain,
    activeIcon: Brain,
    href: '/library',
    color: 'text-secondary',
  },
  {
    id: 'documents',
    label: 'My Documents',
    icon: BookOpen,
    activeIcon: BookOpen,
    href: '/documents',
    color: 'text-muted-foreground',
  },
  {
    id: 'upload',
    label: 'Upload Content',
    icon: Upload,
    activeIcon: Upload,
    href: '/upload',
    color: 'text-muted-foreground',
  },
  {
    id: 'quiz-history',
    label: 'Quiz History',
    icon: History,
    activeIcon: History,
    href: '/quiz-history',
    color: 'text-muted-foreground',
  },
  {
    id: 'beef',
    label: 'Beef Challenges',
    icon: Zap,
    activeIcon: Zap,
    href: '/beef',
    color: 'text-orange-500',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    activeIcon: Trophy,
    href: '/leaderboard',
    color: 'text-accent',
  },
  {
    id: 'dashboard',
    label: 'Analytics',
    icon: LayoutDashboard,
    activeIcon: LayoutDashboard,
    href: '/dashboard',
    color: 'text-muted-foreground',
  },
];

export function BottomNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: user } = useAuth();

  // Update nav items with dynamic profile URL
  const dynamicMobileNavItems = mobileNavItems.map(item => {
    if (item.id === 'profile') {
      return { ...item, href: user ? `/user/${user.id}` : '/login' };
    }
    return item;
  });

  const dynamicDesktopNavItems = desktopNavItems.map(item => {
    if (item.id === 'profile') {
      return { ...item, href: user ? `/user/${user.id}` : '/login' };
    }
    return item;
  });

  // Determine active item based on current path
  const getActiveItem = () => {
    if (currentPath === '/home') return 'home';
    if (currentPath.startsWith('/play')) return 'home'; // Play is part of home experience
    if (currentPath === '/dashboard') return 'dashboard';
    if (currentPath.startsWith('/library')) return 'library';
    if (currentPath.startsWith('/documents')) return 'documents';
    if (currentPath.startsWith('/upload')) return 'upload';
    if (currentPath.startsWith('/quiz-history')) return 'quiz-history';
    if (currentPath.startsWith('/beef')) return 'beef';
    if (currentPath.startsWith('/leaderboard')) return 'leaderboard';
    if (currentPath.startsWith('/user') || currentPath.startsWith('/settings')) return 'profile';
    return null; // No active item for landing page
  };

  const activeItem = getActiveItem();

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {dynamicMobileNavItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center w-full h-full px-2 py-1',
                  'transition-all duration-200 ease-out',
                  'active:scale-95 touch-manipulation',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  isActive ? item.color : 'text-muted-foreground'
                )}
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 flex items-center justify-center"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  >
                    <div className={cn(
                      'absolute w-12 h-12 rounded-full',
                      'bg-current opacity-10'
                    )} />
                  </motion.div>
                )}

                {/* Icon with Animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="relative"
                >
                  <Icon className={cn(
                    'w-6 h-6 transition-all duration-200',
                    isActive && 'drop-shadow-sm'
                  )} />
                </motion.div>

                {/* Label */}
                <motion.span
                  animate={{
                    scale: isActive ? 1 : 0.9,
                    opacity: isActive ? 1 : 0.7,
                  }}
                  className={cn(
                    'text-xs font-medium mt-1',
                    'transition-all duration-200'
                  )}
                >
                  {item.label}
                </motion.span>

                {/* Active Dot Indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      'absolute -bottom-1 w-1 h-1 rounded-full',
                      'bg-current'
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-20 lg:w-64 bg-background/95 backdrop-blur-lg border-r border-border flex-col items-center lg:items-stretch py-6 z-40">
        {/* App Logo/Brand */}
        <div className="flex items-center justify-center lg:justify-start mb-8 px-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="hidden lg:block ml-3 text-xl font-bold competitive-text-gradient">
            Quiz Beef
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 flex flex-col gap-2 px-3">
          {dynamicDesktopNavItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  'relative flex items-center justify-center lg:justify-start',
                  'px-3 py-3 rounded-xl',
                  'transition-all duration-200 ease-out',
                  'hover:bg-muted/50',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive && 'bg-muted'
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeDesktopNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                <Icon className={cn(
                  'w-6 h-6 flex-shrink-0',
                  'transition-all duration-200',
                  isActive ? item.color : 'text-muted-foreground'
                )} />
                
                <span className={cn(
                  'hidden lg:block ml-3 font-medium',
                  'transition-all duration-200',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>

                {/* Hover Effect */}
                <div className={cn(
                  'absolute inset-0 rounded-xl',
                  'bg-gradient-to-r from-transparent via-muted/20 to-transparent',
                  'opacity-0 hover:opacity-100',
                  'transition-opacity duration-300',
                  'pointer-events-none'
                )} />
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions (Desktop Only) */}
        <div className="hidden lg:flex flex-col gap-2 px-3 mt-auto">
          <div className="h-px bg-border my-2" />
          <Link
            to="/settings"
            className={cn(
              'flex items-center px-3 py-2 rounded-lg',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted/50 transition-colors duration-200'
            )}
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="md:hidden h-16" />
      <div className="hidden md:block w-20 lg:w-64" />
    </>
  );
}
