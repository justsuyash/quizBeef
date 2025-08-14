import React, { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { 
  Settings, 
  CreditCard, 
  Crown, 
  Trophy, 
  Zap, 
  Calendar,
  Mail,
  User,
  Bell,
  Palette,
  Monitor
} from 'lucide-react';

export default function ProfilePage() {
  const { data: user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 pt-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
              Manage your account and subscription
            </p>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>
                  Manage your account settings and preferences
                </DialogDescription>
              </DialogHeader>
              <SettingsModal />
            </DialogContent>
          </Dialog>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {user.id ? user.id.toString().slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  User #{user.id}
                  <Badge variant="secondary">
                    <Crown className="h-3 w-3 mr-1" />
                    Free Plan
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Member since {new Date().toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Upgrade your plan for unlimited access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Plan</span>
                  <Badge variant="outline">Free</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Quizzes This Month</span>
                  <span className="text-sm text-muted-foreground">3 / 10</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Upgrade to Pro</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Unlimited quizzes</li>
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                  <li>• Custom branding</li>
                </ul>
                <Button className="w-full">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro - $9.99/month
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Quick Stats
              </CardTitle>
              <CardDescription>
                Your learning progress overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">Total Quizzes</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold">85%</div>
                  <div className="text-xs text-muted-foreground">Avg Accuracy</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold">7</div>
                  <div className="text-xs text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="text-2xl font-bold">4</div>
                  <div className="text-xs text-muted-foreground">Achievements</div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                <Zap className="h-4 w-4 mr-2" />
                View Full Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest quiz sessions and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center space-x-4 p-3 rounded-lg border">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Completed quiz on Machine Learning</p>
                    <p className="text-xs text-muted-foreground">Score: 92% • 2 hours ago</p>
                  </div>
                  <Badge variant="secondary">+15 pts</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// Settings Modal Component
function SettingsModal() {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" placeholder="Tell us about yourself" />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="account" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Account Type</Label>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Free Account</Badge>
              <Button variant="link" size="sm">Upgrade</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data Export</Label>
            <Button variant="outline" size="sm">
              Export My Data
            </Button>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="notifications" className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive quiz reminders via email</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified about new achievements</p>
            </div>
            <Switch />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="appearance" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">Light</Button>
              <Button variant="outline" size="sm">Dark</Button>
              <Button variant="outline" size="sm">System</Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
