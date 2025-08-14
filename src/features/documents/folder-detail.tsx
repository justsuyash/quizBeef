import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useAction } from 'wasp/client/operations'
import { getUserFolders, getMyDocuments, updateDocumentFolder, deleteFolder, updateFolder, deleteDocument } from 'wasp/client/operations'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { useToast } from '../../hooks/use-toast'
import { MultiDocumentQuiz } from '../quiz/components/multi-document-quiz'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Upload, 
  PlayCircle,
  FolderOpen,
  Settings,
  Brain,
  Clock,
  BarChart3,
  Loader2,
  GripVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Link } from 'wasp/client/router'

interface FolderData {
  id: number
  name: string
  color?: string
  description?: string
  sampleQuestion?: string
  _count: {
    documents: number
  }
}

interface DocumentData {
  id: number
  title: string
  sourceType: string
  sourceUrl?: string
  wordCount?: number
  estimatedReadTime?: number
  createdAt: string
  folderId?: number | null
  questionCount: number
  quizCount: number
}

const colors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' }
]

export default function FolderDetailPage() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const { data: folders } = useQuery(getUserFolders)
  const { data: allDocuments } = useQuery(getMyDocuments)
  const updateDocumentFolderFn = useAction(updateDocumentFolder)
  const deleteFolderFn = useAction(deleteFolder)
  const updateFolderFn = useAction(updateFolder)
  const { toast } = useToast()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [dragOverDocument, setDragOverDocument] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
    sampleQuestion: ''
  })

  // Find the current folder
  const folder = folders?.find(f => f.id === parseInt(folderId as string)) as FolderData | undefined

  // Get documents in this folder
  const folderDocuments = allDocuments?.filter(doc => doc.folderId === parseInt(folderId as string)) || []

  // Get documents not in any folder (for moving)
  const unfiledDocuments = allDocuments?.filter(doc => !doc.folderId) || []

  React.useEffect(() => {
    if (folder) {
      setFormData({
        name: folder.name,
        color: folder.color || '#3B82F6',
        description: folder.description || '',
        sampleQuestion: folder.sampleQuestion || ''
      })
    }
  }, [folder])

  if (!folder) {
    return (
      <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Folder not found</h1>
          <Button onClick={() => navigate('/documents')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </main>
    )
  }

  const handleEditFolder = async () => {
    try {
      await updateFolderFn({
        id: folder.id,
        name: formData.name,
        color: formData.color,
        description: formData.description,
        sampleQuestion: formData.sampleQuestion
      })
      
      toast({
        title: 'Folder Updated',
        description: 'Folder details have been updated successfully'
      })
      
      setIsEditDialogOpen(false)
      // Refresh data
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update folder',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteFolder = async () => {
    try {
      await deleteFolderFn({ id: folder.id })
      
      toast({
        title: 'Folder Deleted',
        description: 'Folder and its contents have been removed'
      })
      
      navigate('/documents')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete folder',
        variant: 'destructive'
      })
    }
  }

  const handleDragOver = (e: React.DragEvent, documentId?: number) => {
    e.preventDefault()
    if (documentId) {
      setDragOverDocument(documentId)
    }
  }

  const handleDragLeave = () => {
    setDragOverDocument(null)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverDocument(null)

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      const documentId = data.id

      // Remove document from folder (move to unfiled)
      await updateDocumentFolderFn({
        documentId,
        folderId: undefined
      })

      toast({
        title: 'Document Moved',
        description: `"${data.title}" moved to unfiled documents`
      })

      // Refresh
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to move document',
        variant: 'destructive'
      })
    }
  }

  return (
    <main className="w-full flex flex-col px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/documents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: folder.color || '#3B82F6' }}
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FolderOpen className="h-8 w-8" />
                {folder.name}
              </h1>
              <p className="text-muted-foreground">
                {folderDocuments.length} documents
                {folder.description && ` • ${folder.description}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate Quiz Button */}
          {folderDocuments.length > 0 && (
            <MultiDocumentQuiz
              folderId={folder.id}
              folder={folder}
              trigger={
                <Button>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Generate Quiz
                </Button>
              }
            />
          )}

          {/* Folder Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Folder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild>
            <Link to="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Style Guide Display */}
      {folder.sampleQuestion && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Quiz Style Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{folder.sampleQuestion}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents in Folder */}
      {folderDocuments.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Documents in this folder</h2>
          <DocumentsList documents={folderDocuments} />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">This folder is empty</h3>
              <p className="text-muted-foreground mb-4">
                Upload documents or drag existing documents here to get started
              </p>
              <Button asChild>
                <Link to="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drop Zone for Removing Documents */}
      {folderDocuments.length > 0 && (
        <div
          className="mt-6 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="text-sm text-muted-foreground">
            Drag documents here to remove them from this folder
          </p>
        </div>
      )}

      {/* Edit Folder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update folder details and quiz style guide
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Folder Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this folder's purpose"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-sample-question">Quiz Style Guide</Label>
              <Textarea
                id="edit-sample-question"
                value={formData.sampleQuestion}
                onChange={(e) => setFormData({ ...formData, sampleQuestion: e.target.value })}
                placeholder="Example: Focus on practical applications and step-by-step problem solving"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This guides how AI generates questions from documents in this folder
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleEditFolder} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{folder.name}"? Documents in this folder will be moved to unfiled documents.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button onClick={handleDeleteFolder} variant="destructive" className="flex-1">
              Delete Folder
            </Button>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

// Documents List Component
function DocumentsList({ documents }: { documents: DocumentData[] }) {
  const deleteDocumentFn = useAction(deleteDocument)
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null)

  const handleDeleteDocument = async (documentId: number, documentTitle: string) => {
    try {
      const result = await deleteDocumentFn({ documentId })
      
      toast({
        title: 'Document Deleted',
        description: result.message
      })
      
      setDeleteDialogOpen(null)
      
      // Refresh the page to update the document list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive'
      })
    }
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card 
            key={doc.id} 
            className="hover:shadow-md transition-shadow cursor-move group"
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({
                id: doc.id,
                title: doc.title
              }))
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2 mb-1">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-1" />
                      {doc.sourceType?.toUpperCase() || 'DOCUMENT'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {doc.estimatedReadTime || 1} min read
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteDialogOpen(doc.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats Row */}
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(doc.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  {doc.questionCount} questions
                </div>
              </div>

              {/* Word Count */}
              {doc.wordCount && (
                <div className="text-sm text-muted-foreground">
                  {doc.wordCount} words
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen !== null} onOpenChange={() => setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documents.find(d => d.id === deleteDialogOpen)?.title}"? This action cannot be undone and will also delete all associated quiz questions.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => {
                const doc = documents.find(d => d.id === deleteDialogOpen)
                if (doc) {
                  handleDeleteDocument(doc.id, doc.title)
                }
              }}
              variant="destructive" 
              className="flex-1"
            >
              Delete Document
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
