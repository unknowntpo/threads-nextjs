'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

export async function authenticate(
  provider: string,
  formData?: FormData
): Promise<{ success?: boolean; error?: { message: string } }> {
  try {
    await signIn(provider, formData)
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: {
          message: error.message || 'Authentication failed',
        },
      }
    }
    // Re-throw if it's a redirect (successful OAuth flow)
    throw error
  }
}
