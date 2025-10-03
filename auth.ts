import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          // Create new user for credentials signup
          const username = (credentials.email as string).split('@')[0]

          const newUser = await prisma.user.create({
            data: {
              email: credentials.email as string,
              username,
              displayName: username,
              name: username,
            },
          })

          // Create account entry for credentials
          await prisma.account.create({
            data: {
              userId: newUser.id,
              type: 'credentials',
              provider: 'credentials',
              providerAccountId: newUser.id,
            },
          })

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            image: newUser.image,
          }
        }

        // For existing users, verify they have a credentials account
        const account = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: 'credentials',
          },
        })

        if (account) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        const user = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: { username: true, displayName: true },
        })
        if (user) {
          session.user.username = user.username
          session.user.displayName = user.displayName
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
})
