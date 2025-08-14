import type { 
  CreateFolder,
  UpdateFolder,
  DeleteFolder,
  GetUserFolders,
  UpdateDocumentFolder,
  SearchDocuments
} from 'wasp/server/operations'
import { HttpError } from 'wasp/server'

/**
 * Create a new folder for organizing documents
 */
export const createFolder: CreateFolder<
  { name: string; color?: string; description?: string; sampleQuestion?: string },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { name, color, description, sampleQuestion } = args

  try {
    // Check if folder with this name already exists for the user
    const existingFolder = await context.entities.Folder.findFirst({
      where: {
        userId: context.user.id,
        name: name
      }
    })

    if (existingFolder) {
      throw new HttpError(400, `Folder "${name}" already exists`)
    }

    const folder = await context.entities.Folder.create({
      data: {
        name,
        color: color || '#3B82F6', // Default blue color
        description,
        sampleQuestion,
        userId: context.user.id
      }
    })

    // Achievement trigger: first folder created / folder thresholds
    try {
      const { checkAchievements } = await import('../achievements/operations')
      await checkAchievements({
        userId: context.user.id,
        triggerType: 'FOLDER_CREATED',
        triggerData: { folderId: folder.id }
      }, context as any)
    } catch (e) {
      console.warn('Achievement check after folder creation failed:', e)
    }

    return folder
  } catch (error) {
    console.error('Error creating folder:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to create folder')
  }
}

/**
 * Update an existing folder
 */
export const updateFolder: UpdateFolder<
  { id: number; name?: string; color?: string; description?: string; sampleQuestion?: string },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { id, name, color, description, sampleQuestion } = args

  try {
    // Verify folder belongs to user
    const existingFolder = await context.entities.Folder.findFirst({
      where: {
        id,
        userId: context.user.id
      }
    })

    if (!existingFolder) {
      throw new HttpError(404, 'Folder not found')
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingFolder.name) {
      const duplicateFolder = await context.entities.Folder.findFirst({
        where: {
          userId: context.user.id,
          name: name,
          id: { not: id }
        }
      })

      if (duplicateFolder) {
        throw new HttpError(400, `Folder "${name}" already exists`)
      }
    }

    const updatedFolder = await context.entities.Folder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
        ...(sampleQuestion !== undefined && { sampleQuestion })
      }
    })

    return updatedFolder
  } catch (error) {
    console.error('Error updating folder:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to update folder')
  }
}

/**
 * Delete a folder (moves documents to "unfiled")
 */
export const deleteFolder: DeleteFolder<{ id: number }, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { id } = args

  try {
    // Verify folder belongs to user
    const folder = await context.entities.Folder.findFirst({
      where: {
        id,
        userId: context.user.id
      }
    })

    if (!folder) {
      throw new HttpError(404, 'Folder not found')
    }

    // Delete the folder (documents will automatically be set to null due to onDelete: SetNull)
    await context.entities.Folder.delete({
      where: { id }
    })

    return { success: true, message: 'Folder deleted successfully' }
  } catch (error) {
    console.error('Error deleting folder:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to delete folder')
  }
}

/**
 * Get all folders for the authenticated user
 */
export const getUserFolders: GetUserFolders<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  try {
    const folders = await context.entities.Folder.findMany({
      where: {
        userId: context.user.id
      },
      include: {
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return folders
  } catch (error) {
    console.error('Error fetching user folders:', error)
    throw new HttpError(500, 'Failed to fetch folders')
  }
}

/**
 * Move a document to a folder or remove from folder
 */
export const updateDocumentFolder: UpdateDocumentFolder<
  { documentId: number; folderId?: number },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { documentId, folderId } = args

  try {
    // Verify document belongs to user
    const document = await context.entities.Document.findFirst({
      where: {
        id: documentId,
        userId: context.user.id
      }
    })

    if (!document) {
      throw new HttpError(404, 'Document not found')
    }

    // If folderId is provided, verify folder belongs to user
    if (folderId) {
      const folder = await context.entities.Folder.findFirst({
        where: {
          id: folderId,
          userId: context.user.id
        }
      })

      if (!folder) {
        throw new HttpError(404, 'Folder not found')
      }
    }

    // Update document folder
    const updatedDocument = await context.entities.Document.update({
      where: { id: documentId },
      data: {
        folderId: folderId || null
      },
      include: {
        folder: true,
        questions: true,
        _count: {
          select: {
            quizAttempts: true,
            questions: true
          }
        }
      }
    })

    return updatedDocument
  } catch (error) {
    console.error('Error updating document folder:', error)
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to update document folder')
  }
}

/**
 * Search documents by title, content, or tags
 */
export const searchDocuments: SearchDocuments<
  { query: string; folderId?: number; tags?: string[] },
  any
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User must be authenticated')
  }

  const { query, folderId, tags } = args

  try {
    const searchTerms = query.toLowerCase().trim().split(' ').filter(term => term.length > 0)
    
    const documents = await context.entities.Document.findMany({
      where: {
        userId: context.user.id,
        ...(folderId && { folderId }),
        AND: [
          // Search in title
          ...(searchTerms.length > 0 ? [{
            OR: searchTerms.map(term => ({
              title: {
                contains: term,
                mode: 'insensitive' as const
              }
            }))
          }] : []),
          // Filter by tags if provided
          ...(tags && tags.length > 0 ? [{
            tags: {
              hasSome: tags
            }
          }] : [])
        ]
      },
      include: {
        folder: true,
        questions: true,
        _count: {
          select: {
            quizAttempts: true,
            questions: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' }
      ]
    })

    return documents
  } catch (error) {
    console.error('Error searching documents:', error)
    throw new HttpError(500, 'Failed to search documents')
  }
}
