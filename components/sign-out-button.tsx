'use client'

import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSignOut} disabled={isLoading} variant="outline">
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  )
}
