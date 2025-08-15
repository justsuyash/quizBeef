import { type GetCurrentUser, type UpdateUserProfile } from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

export const getCurrentUser: GetCurrentUser<void, any> = async (args, context) => {
  if (!context.user) {
    throw new Error('User not authenticated')
  }

  try {
    // Access the database through the User entity and use includes to get auth data
    const userWithAuth = await context.entities.User.findUnique({
      where: { id: context.user.id },
      include: {
        auth: {
          include: {
            identities: true
          }
        }
      }
    })

    if (!userWithAuth?.auth) {
      // Fallback: return basic user info if auth not found
      return {
        id: context.user.id,
        username: `user${context.user.id}`,
        email: `user${context.user.id}@example.com`,
        createdAt: userWithAuth?.createdAt || new Date(),
        updatedAt: userWithAuth?.updatedAt || new Date(),
        isActive: userWithAuth?.isActive || true,
        // profile fields
        handle: userWithAuth?.handle || null,
        avatarUrl: userWithAuth?.avatarUrl || null
      }
    }

    // Find the username/password identity
    const usernamePasswordIdentity = userWithAuth.auth.identities.find(
      (identity: any) => identity.providerName === 'username'
    )

    const username = usernamePasswordIdentity?.providerUserId || `user${context.user.id}`
    
    return {
      id: context.user.id,
      username,
      email: userWithAuth.email || null, // From user's profile
      name: userWithAuth.name || null,
      dateOfBirth: userWithAuth.dateOfBirth || null,
      language: userWithAuth.language || null,
      createdAt: userWithAuth.createdAt,
      updatedAt: userWithAuth.updatedAt,
      isActive: userWithAuth.isActive,
      // Profile fields with safe defaults
      handle: userWithAuth.handle || null,
      profileType: userWithAuth.profileType || 'ADULT',
      accountType: userWithAuth.accountType || 'FREE',
      bio: userWithAuth.bio || null,
      location: userWithAuth.location || null,
      website: userWithAuth.website || null,
      favoriteSubject: userWithAuth.favoriteSubject || null,
      isPublicProfile: userWithAuth.isPublicProfile ?? true,
      totalScore: userWithAuth.totalScore || 0,
      totalQuizzes: userWithAuth.totalQuizzes || 0,
      totalBeefWins: userWithAuth.totalBeefWins || 0,
      averageAccuracy: userWithAuth.averageAccuracy || null,
      avatarUrl: userWithAuth.avatarUrl || null
    }
  } catch (error) {
    // Fallback: return basic user info on any error
    console.error('Error in getCurrentUser:', error)
    return {
      id: context.user.id,
      username: `user${context.user.id}`,
      email: null,
      name: null,
      dateOfBirth: null,
      language: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      // Profile fields with defaults
      handle: null,
      profileType: 'ADULT',
      accountType: 'FREE',
      bio: null,
      location: null,
      website: null,
      favoriteSubject: null,
      isPublicProfile: true,
      totalScore: 0,
      totalQuizzes: 0,
      totalBeefWins: 0,
      averageAccuracy: null,
      avatarUrl: null
    }
  }
}

// Phase 1.1: Require City/Country post-signup profile completion
export const updateProfileLocation: UpdateUserProfile<{ city: string; country: string; county?: string }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const city = (args.city || '').trim()
  const country = (args.country || '').trim()
  const county = (args.county || '').trim() || null

  if (!city || !country) {
    throw new HttpError(400, 'City and Country are required')
  }

  const user = await context.entities.User.update({
    where: { id: context.user.id },
    data: { city, country, county }
  })

  return { id: user.id, city: user.city, country: user.country, county: user.county }
}
