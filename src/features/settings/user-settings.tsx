import React, { useState, useEffect } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery, useAction } from 'wasp/client/operations';
import { getCurrentUser, updateUserProfile } from 'wasp/client/operations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '../../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Check } from 'lucide-react';
import { cn } from '../../lib/cn';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  CreditCard,
  Download,
  Trash2,
  Settings as SettingsIcon
} from 'lucide-react';

export default function UserSettings() {
  const { data: user } = useAuth();
  const { data: userData, isLoading: userDataLoading } = useQuery(getCurrentUser, undefined, {
    enabled: !!user
  });
  const updateProfileFn = useAction(updateUserProfile);
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    handle: '',
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    language: '',
    dateOfBirth: null as Date | null,
    accountType: 'FREE' as 'FREE' | 'PREMIUM' | 'KIDS' | 'KIDS_PREMIUM' | 'FAMILY',
    profileType: 'ADULT' as 'ADULT' | 'KID',
    isPublicProfile: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<{display_name: string, lat: string, lon: string}[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Debounce timer for API calls
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Search locations using OpenStreetMap Nominatim API
  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setLocationLoading(true);
    
    try {
      // OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '8',
          countrycodes: '', // Leave empty to search globally
          'accept-language': 'en'
        }),
        {
          headers: {
            'User-Agent': 'QuizBeef-App/1.0 (https://quizbeef.com)' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      
      // Format the results for better display
      const formattedSuggestions = data.map((item: any) => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon
      }));

      setLocationSuggestions(formattedSuggestions);
      setShowLocationSuggestions(formattedSuggestions.length > 0);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Fallback to empty suggestions on error
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    } finally {
      setLocationLoading(false);
    }
  };

  // Debounced search function to avoid too many API calls
  const debouncedLocationSearch = (input: string) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      searchLocations(input);
    }, 300); // Wait 300ms after user stops typing

    setSearchTimeout(timeout);
  };

  // Update form when user data loads
  useEffect(() => {
    if (userData) {
      setFormData({
        handle: userData.handle || userData.username || '',
        name: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || '',
        location: userData.location || '',
        website: userData.website || '',
        language: userData.language || '',
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        accountType: userData.accountType || 'FREE',
        profileType: userData.profileType || 'ADULT',
        isPublicProfile: userData.isPublicProfile ?? true
      });
    }
  }, [userData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle form submission
  const handleSaveChanges = async () => {
    console.log('Submitting simple settings form with data:', formData);
    setIsSubmitting(true);
    
    try {
      const result = await updateProfileFn({
        handle: formData.handle || undefined,
        name: formData.name || undefined,
        email: formData.email || undefined,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        website: formData.website || undefined,
        language: formData.language || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        accountType: formData.accountType,
        isPublicProfile: formData.isPublicProfile,
      });
      
      console.log('Simple settings update result:', result);

      // Invalidate and refetch the getCurrentUser query to update the UI
      await queryClient.invalidateQueries({ queryKey: ['getCurrentUser'] });
      await queryClient.refetchQueries({ queryKey: ['getCurrentUser'] });
      
      toast({
        title: 'Settings updated successfully!',
        description: 'Your account settings have been saved.',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error updating settings',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to access settings.</p>
        </div>
      </div>
    );
  }

  if (userDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 pt-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Update your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-id">User ID</Label>
                    <Input id="user-id" value={`#${user.id}`} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-type">Account Type</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Free Account</Badge>
                      <Button variant="link" size="sm">Upgrade to Pro</Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name (Handle)</Label>
                    <Input 
                      id="display-name" 
                      placeholder="your_username" 
                      value={formData.handle}
                      onChange={(e) => setFormData({...formData, handle: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    <Input 
                      id="full-name" 
                      placeholder="Your full name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your.email@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={formData.language} 
                      onValueChange={(value) => setFormData({...formData, language: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Popover open={showLocationSuggestions} onOpenChange={setShowLocationSuggestions}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="location"
                            placeholder="Enter your location (country, city, or specific address)"
                            value={formData.location}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData({...formData, location: value});
                              debouncedLocationSearch(value);
                            }}
                            onFocus={(e) => {
                              if (e.target.value.length >= 2) {
                                debouncedLocationSearch(e.target.value);
                              }
                            }}
                            onBlur={() => {
                              // Delay hiding to allow for selection
                              setTimeout(() => setShowLocationSuggestions(false), 200);
                            }}
                            className="pl-10"
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandList>
                            {locationLoading ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                  Searching locations...
                                </div>
                              </div>
                            ) : locationSuggestions.length === 0 ? (
                              <CommandEmpty>
                                {formData.location.length < 2 
                                  ? "Type at least 2 characters to search" 
                                  : "No locations found. Try a different search term."
                                }
                              </CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {locationSuggestions.map((location, index) => (
                                  <CommandItem
                                    key={index}
                                    value={location.display_name}
                                    onSelect={() => {
                                      setFormData({...formData, location: location.display_name});
                                      setShowLocationSuggestions(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm">{location.display_name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can be as specific or general as you want: "United States", "California", "San Francisco", or "123 Main St, San Francisco, CA"
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    type="url" 
                    placeholder="https://yourwebsite.com" 
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell others about yourself..." 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth || undefined}
                        onSelect={(date) => setFormData({...formData, dateOfBirth: date || null})}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile visible to other users and appear on leaderboards
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublicProfile}
                    onCheckedChange={(checked) => setFormData({...formData, isPublicProfile: checked})}
                  />
                </div>

                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Subscription & Billing
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Current Plan</h4>
                    <p className="text-sm text-muted-foreground">Free • Limited features</p>
                  </div>
                  <Badge variant="outline">Free</Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Usage This Month</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quizzes Created</span>
                      <span>3 / 10</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>

                <Button className="w-full">Upgrade to Pro - $9.99/month</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive quiz reminders and updates via email
                      </p>
                    </div>
                    <Switch />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Achievement Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you unlock new achievements
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Quiz Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Daily reminders to practice with your uploaded content
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Beef Challenge Invites</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications when someone challenges you to a beef
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize how Quiz Beef looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">Theme</Label>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      Light
                    </Button>
                    <Button variant="outline" size="sm">
                      Dark
                    </Button>
                    <Button variant="default" size="sm">
                      System
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label className="text-base">Font Size</Label>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">Small</Button>
                    <Button variant="default" size="sm">Medium</Button>
                    <Button variant="outline" size="sm">Large</Button>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Reduced Motion</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce animations and transitions
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>
                  Manage your account security and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" placeholder="Enter current password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" placeholder="Enter new password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                  </div>
                  
                  <Button>Update Password</Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Data Management</h4>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h5 className="font-medium">Export Data</h5>
                      <p className="text-sm text-muted-foreground">Download all your quiz data and progress</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                    <div>
                      <h5 className="font-medium text-destructive">Delete Account</h5>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
