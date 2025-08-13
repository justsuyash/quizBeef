import React, { useState } from 'react'
import { useQuery, useAction } from 'wasp/client/operations'
import { getUserFolders, createFolder, updateFolder, deleteFolder } from 'wasp/client/operations'
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
  FileText
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'

interface FolderData {
  id: number
  name: string
  color?: string
  description?: string
  _count: {
    documents: number
  }
}

export function FolderManagement() {
  const { data: folders, isLoading, error } = useQuery(getUserFolders)
  const createFolderFn = useAction(createFolder)
  const updateFolderFn = useAction(updateFolder)
  const deleteFolderFn = useAction(deleteFolder)
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
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
        description: formData.description.trim() || undefined
      })

      toast({
        title: 'Success',
        description: `Folder "${formData.name}" created successfully`
      })

      setIsCreateDialogOpen(false)
      setFormData({ name: '', color: '#3B82F6', description: '' })
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
        description: formData.description.trim() || undefined
      })

      toast({
        title: 'Success',
        description: `Folder "${formData.name}" updated successfully`
      })

      setEditingFolder(null)
      setFormData({ name: '', color: '#3B82F6', description: '' })
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
      description: folder.description || ''
    })
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    {folder._count.documents} documents
                  </Badge>
                </div>
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
