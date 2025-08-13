import '../../index.css';
import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { BottomNavigation } from './bottom-navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FontProvider } from '../../context/font-context';
import { ThemeProvider } from '../../context/theme-context';
import { SearchProvider } from '../../context/search-context';
import { Toaster } from '../ui/toaster';
import { routes } from 'wasp/client/router';
import SkipToMain from '../skip-to-main';

export default function MainLayoutV15() {
  const location = useLocation();
  
  // Check if we're on an auth page or landing page
  const isAuthOrLandingPage = useMemo(() => {
    const path = location.pathname;
    const noNavPaths = [routes.LoginRoute.to, routes.SignupRoute.to, routes.LandingRoute.to] as string[];
    return noNavPaths.includes(path);
  }, [location.pathname]);

  return (
    <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
      <FontProvider>
        <SearchProvider>
          <div className="relative min-h-screen bg-background">
            <SkipToMain />
            {/* Navigation - Hide on auth and landing pages */}
            {!isAuthOrLandingPage && <BottomNavigation />}

      {/* Main Content Area */}
      <div className={cn(
        'relative',
        'min-h-screen',
        !isAuthOrLandingPage && 'md:ml-20 lg:ml-64', // Space for desktop side nav
        !isAuthOrLandingPage && 'pb-16 md:pb-0' // Space for mobile bottom nav
      )}>
        {/* Page Transition Wrapper */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
            }}
            className=""
          >
            {/* Content Outlet - Let pages handle their own layout */}
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Global Elements */}
      {/* Background Pattern for Game Feel */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={cn(
          'absolute inset-0',
          'bg-gradient-to-br from-background via-background to-muted/20',
          'opacity-50'
        )} />
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="grid-pattern"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 32V0h32"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.03"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Achievement Notification Container */}
      <div
        id="achievement-portal"
        className="fixed top-4 right-4 z-50 pointer-events-none"
      />

      {/* Global Loading Indicator */}
      <div
        id="global-loader"
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      />
            
            {/* Toaster for notifications */}
            <Toaster />
          </div>
        </SearchProvider>
      </FontProvider>
    </ThemeProvider>
  );
}
