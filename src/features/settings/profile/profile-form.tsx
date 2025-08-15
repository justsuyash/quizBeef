import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useAction } from 'wasp/client/operations'
import { useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, updateUserProfile } from 'wasp/client/operations'
import { useAuth } from 'wasp/client/auth'
import { useEffect, useState } from 'react'
import { toast } from '../../../hooks/use-toast'
import { Button } from '../../../components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Switch } from '../../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'

const profileFormSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores').optional(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  accountType: z.enum(['FREE', 'PREMIUM', 'KIDS', 'KIDS_PREMIUM', 'FAMILY']).default('FREE'),
  bio: z.string().max(160).optional(),
  location: z.string().max(50).optional(),
  website: z.string().url().optional().or(z.literal('')),
  favoriteSubject: z.string().max(50).optional(),
  isPublicProfile: z.boolean().default(true),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileForm() {
  const { data: user } = useAuth()
  const { data: userData, error: userDataError, isLoading: userDataLoading } = useQuery(getCurrentUser, undefined, {
    enabled: !!user
  })
  const updateProfileFn = useAction(updateUserProfile)
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      handle: '',
      email: '',
      accountType: 'FREE' as const,
      bio: '',
      location: '',
      website: '',
      favoriteSubject: '',
      isPublicProfile: true,
    },
  })

  // Update form when user data loads
  useEffect(() => {
    if (userData) {
      try {
        form.reset({
          handle: userData.handle || userData.username || '',
          email: userData.email || '',
          accountType: userData.accountType || 'FREE',
          bio: userData.bio || '',
          location: userData.location || '',
          website: userData.website || '',
          favoriteSubject: userData.favoriteSubject || '',
          isPublicProfile: userData.isPublicProfile ?? true,
        })
      } catch (error) {
        console.error('Error updating form with user data:', error)
        // Set default values if there's an error
        form.reset({
          handle: '',
          email: '',
          accountType: 'FREE' as const,
          bio: '',
          location: '',
          website: '',
          favoriteSubject: '',
          isPublicProfile: true,
        })
      }
    }
  }, [userData, form])

  async function onSubmit(data: ProfileFormValues) {
    console.log('Submitting profile form with data:', data)
    try {
      const result = await updateProfileFn({
        handle: data.handle || undefined,
        email: data.email || undefined,
        accountType: data.accountType,
        bio: data.bio || undefined,
        location: data.location || undefined,
        website: data.website || undefined,
        favoriteSubject: data.favoriteSubject || undefined,
        isPublicProfile: data.isPublicProfile,
      })

      console.log('Profile update result:', result)

      // Invalidate and refetch the getCurrentUser query to update the UI
      await queryClient.invalidateQueries({ queryKey: ['getCurrentUser'] })
      // Also force a refetch to ensure immediate update
      await queryClient.refetchQueries({ queryKey: ['getCurrentUser'] })
      
      toast({
        title: 'Profile updated successfully!',
        description: 'Your profile information has been saved.',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  // Show error state if there's an error loading user data
  if (userDataError) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Profile</h3>
          <p className="text-sm text-red-600 mb-4">
            {userDataError instanceof Error ? userDataError.message : 'Failed to load profile data'}
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Show loading state
  if (userDataLoading || !userData) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
        </div>
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <div className="p-4 border rounded-lg bg-muted/30">
        <h3 className="font-semibold mb-2">Profile Overview</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Handle:</span>
            <p className="font-medium">@{userData.handle || userData.username || 'Not set'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Account Type:</span>
            <p className="font-medium">{userData.accountType?.replace('_', ' ') || 'Free'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Total Score:</span>
            <p className="font-medium">{(userData.totalScore || 0).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Quiz Count:</span>
            <p className="font-medium">{userData.totalQuizzes || 0}</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log('Form validation errors:', errors)
          toast({
            title: 'Form validation failed',
            description: 'Please check your inputs and try again.',
            variant: 'destructive',
          })
        })} className='space-y-8'>
          <FormField
            control={form.control}
            name='handle'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Handle</FormLabel>
                <FormControl>
                  <Input
                    placeholder='your_unique_handle'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your unique identifier on Quiz Beef. Can only contain letters, numbers, and underscores.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='your.email@example.com'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your email address (optional). Used for notifications and account recovery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='accountType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="KIDS">Kids</SelectItem>
                    <SelectItem value="KIDS_PREMIUM">Kids Premium</SelectItem>
                    <SelectItem value="FAMILY">Family</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose your account type to access different features and content.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='bio'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Tell others about yourself...'
                    className='resize-none'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A brief description about yourself. This will be shown on your public profile.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='location'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder='City, Country' {...field} />
                </FormControl>
                <FormDescription>
                  Your location (optional). This helps other users find local study partners.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='website'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input placeholder='https://yourwebsite.com' {...field} />
                </FormControl>
                <FormDescription>
                  Your personal website, blog, or social media profile.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='favoriteSubject'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Favorite Subject</FormLabel>
                <FormControl>
                  <Input placeholder='Mathematics, Science, History...' {...field} />
                </FormControl>
                <FormDescription>
                  Your favorite subject or area of expertise. This will be shown on leaderboards.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='isPublicProfile'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>Public Profile</FormLabel>
                  <FormDescription>
                    Make your profile visible to other users. When disabled, your profile 
                    will be private and won't appear on leaderboards.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </Form>
    </div>
  )
}