import React from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'

export default function SimpleProfileForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Your profile information will be available soon. We're currently setting up the enhanced profile system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Profile System Upgrade
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                We've just upgraded the profile system with new features including:
              </p>
              <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 ml-4 list-disc">
                <li>Enhanced user profiles with bio and location</li>
                <li>Achievement tracking and statistics</li>
                <li>Public/private profile settings</li>
                <li>Leaderboard integration</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = '/leaderboard'}
                variant="outline"
              >
                View Leaderboard
              </Button>
              <Button 
                onClick={() => window.location.href = '/documents'}
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
