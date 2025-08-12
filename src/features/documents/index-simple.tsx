import React from 'react'
import { useAuth } from 'wasp/client/auth'
import { Link } from 'wasp/client/router'
import { Button } from '../../components/ui/button'

export default function DocumentsPageSimple() {
  const { data: user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view your documents.</p>
          <div className="space-x-4">
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
            <Link to="/sign-up">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">My Documents</h1>
      <p className="text-muted-foreground mb-8">
        Manage your uploaded content and generate quizzes.
      </p>
      
      <div className="mb-8">
        <Link to="/upload">
          <Button>Upload New Document</Button>
        </Link>
      </div>

      <div className="text-center py-10">
        <p className="text-lg">Documents will appear here.</p>
        <p className="text-muted-foreground">Start by uploading a new document!</p>
      </div>
    </div>
  )
}
