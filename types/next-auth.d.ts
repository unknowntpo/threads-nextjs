import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      username: string
      displayName?: string | null
    }
  }

  interface User {
    username?: string
    displayName?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string
    displayName?: string | null
  }
}
