import { type GetCurrentUser } from 'wasp/server/operations'

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
        isActive: userWithAuth?.isActive || true
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
      email: null, // Wasp username/password auth doesn't collect emails
      createdAt: userWithAuth.createdAt,
      updatedAt: userWithAuth.updatedAt,
      isActive: userWithAuth.isActive
    }
  } catch (error) {
    // Fallback: return basic user info on any error
    console.error('Error in getCurrentUser:', error)
            return {
          id: context.user.id,
          username: `user${context.user.id}`,
          email: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        }
  }
}
