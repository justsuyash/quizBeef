import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { getUserFolders, createFolder, updateFolder, deleteFolder, updateDocumentFolder } from 'wasp/client/operations'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { useToast } from '../../../hooks/use-toast'
import { 
  Folder, 
  FolderPlus, 
  Edit, 
  Trash2, 
  MoreVertical,
  FileText,
  PlayCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { MultiDocumentQuiz } from '../../quiz/components/multi-document-quiz'

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

export function FolderManagement() {
  const { data: folders, isLoading, error } = useQuery(getUserFolders)
  const createFolderFn = useAction(createFolder)
  const updateFolderFn = useAction(updateFolder)
  const deleteFolderFn = useAction(deleteFolder)
  const updateDocumentFolderFn = useAction(updateDocumentFolder)
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
    sampleQuestion: ''
  })

  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ]

  const handleCreateFolder = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      await createFolderFn({
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim() || undefined,
        sampleQuestion: formData.sampleQuestion.trim() || undefined
      })

      toast({
        title: 'Success',
        description: `Folder "${formData.name}" created successfully`
      })

      setIsCreateDialogOpen(false)
      setFormData({ name: '', color: '#3B82F6', description: '', sampleQuestion: '' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create folder',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      await updateFolderFn({
        id: editingFolder.id,
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim() || undefined,
        sampleQuestion: formData.sampleQuestion.trim() || undefined
      })

      toast({
        title: 'Success',
        description: `Folder "${formData.name}" updated successfully`
      })

      setEditingFolder(null)
      setFormData({ name: '', color: '#3B82F6', description: '', sampleQuestion: '' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update folder',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteFolder = async (folder: FolderData) => {
    if (folder._count.documents > 0) {
      const confirmed = window.confirm(
        `This folder contains ${folder._count.documents} document(s). Deleting the folder will move these documents to "Unfiled". Continue?`
      )
      if (!confirmed) return
    }

    try {
      await deleteFolderFn({ id: folder.id })
      
      toast({
        title: 'Success',
        description: `Folder "${folder.name}" deleted successfully`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete folder',
        variant: 'destructive'
      })
    }
  }

  const openEditDialog = (folder: FolderData) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      color: folder.color || '#3B82F6',
      description: folder.description || '',
      sampleQuestion: folder.sampleQuestion || ''
    })
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, folderId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolder(folderId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear if we're leaving the folder area completely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverFolder(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, folderId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverFolder(null)

    try {
      const documentData = e.dataTransfer.getData('application/json')
      if (!documentData) return

      const document = JSON.parse(documentData)
      
      await updateDocumentFolderFn({
        documentId: document.id,
        folderId: folderId
      })

      toast({
        title: 'Success',
        description: `"${document.title}" moved to folder successfully`
      })
    } catch (error) {
      console.error('Drop error:', error)
      toast({
        title: 'Error',
        description: 'Failed to move document to folder',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Folders</CardTitle>
          <CardDescription>Organize your documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading folders...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Folders</CardTitle>
          <CardDescription>Organize your documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Failed to load folders
          </div>
        </CardContent>
      </Card>
    )
  }

  const folderList = folders as FolderData[]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Folders
            </CardTitle>
            <CardDescription>Organize your documents into folders</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Create a new folder to organize your documents
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Folder Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter folder name"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
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
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter folder description"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sampleQuestion">Sample Question (Optional)</Label>
                  <Textarea
                    id="sampleQuestion"
                    value={formData.sampleQuestion}
                    onChange={(e) => setFormData({ ...formData, sampleQuestion: e.target.value })}
                    placeholder="Example: What is the main concept discussed in this material?"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will guide the AI when generating questions from documents in this folder
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false)
                    setFormData({ name: '', color: '#3B82F6', description: '', sampleQuestion: '' })
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFolder}>
                    Create Folder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {folderList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No folders yet</p>
            <p className="text-sm">Create your first folder to organize documents</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {folderList.map((folder) => (
              <div
                key={folder.id}
                className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                  dragOverFolder === folder.id 
                    ? 'border-primary bg-primary/10 border-2 shadow-lg' 
                    : 'border-border hover:bg-muted/50 hover:shadow-md'
                }`}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                onClick={() => window.location.href = `/documents/folder/${folder.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: folder.color || '#3B82F6' }}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{folder.name}</h4>
                      {folder.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteFolder(folder)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {folder._count.documents} documents
                  </Badge>
                  
                  {folder._count.documents > 0 && (
                    <MultiDocumentQuiz
                      folderId={folder.id}
                      folder={folder}
                      trigger={
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <PlayCircle className="h-3 w-3 mr-1" />
                          Quiz
                        </Button>
                      }
                    />
                  )}
                </div>
                
                {/* Drop Zone Indicator */}
                {dragOverFolder === folder.id && (
                  <div className="mt-3 p-3 border-2 border-dashed border-primary bg-primary/5 rounded-lg text-center">
                    <p className="text-sm text-primary font-medium">Drop document here</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Folder Dialog */}
        <Dialog open={!!editingFolder} onOpenChange={(open) => !open && setEditingFolder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Folder</DialogTitle>
              <DialogDescription>
                Update folder details
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
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter folder description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sampleQuestion">Sample Question (Optional)</Label>
                <Textarea
                  id="edit-sampleQuestion"
                  value={formData.sampleQuestion}
                  onChange={(e) => setFormData({ ...formData, sampleQuestion: e.target.value })}
                  placeholder="Example: What is the main concept discussed in this material?"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  This will guide the AI when generating questions from documents in this folder
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingFolder(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateFolder}>
                  Update Folder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
