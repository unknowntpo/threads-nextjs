import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            accounts: {
              where: { provider: 'credentials' },
            },
          },
        })

        if (!user) {
          // Create new user for credentials signup with hashed password
          const username = (credentials.email as string).split('@')[0]
          const hashedPassword = await bcrypt.hash(credentials.password as string, 10)

          const newUser = await prisma.user.create({
            data: {
              email: credentials.email as string,
              username,
              displayName: username,
              name: username,
            },
          })

          // Create account entry for credentials with hashed password
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: 'credentials',
              provider: 'credentials',
              providerAccountId: newUser.id,
              // Store hashed password in refresh_token field (since we don't have a password field in Account model)
              refresh_token: hashedPassword,
            },
          })

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            image: newUser.image,
          }
        }

        // For existing users, verify password
        const credentialsAccount = user.accounts.find(acc => acc.provider === 'credentials')

        if (!credentialsAccount || !credentialsAccount.refresh_token) {
          // User exists but doesn't have credentials provider
          throw new Error('Invalid email or password')
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          credentialsAccount.refresh_token
        )

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        // Store user data in JWT to avoid DB queries in edge runtime (middleware)
        if (token.username && token.displayName) {
          session.user.username = token.username as string
          session.user.displayName = token.displayName as string
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        // Fetch user data and store in JWT
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true, displayName: true },
        })
        if (dbUser) {
          token.username = dbUser.username
          token.displayName = dbUser.displayName
        }
      }
      return token
    },
  },
}

// Helper function to get session (v5 compatibility wrapper)
export const auth = () => getServerSession(authOptions)
