import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function DashboardRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/analytics', { replace: true })
  }, [navigate])
  return null
}


