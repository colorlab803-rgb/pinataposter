import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { upsertUser } from '@/lib/db'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        // Crear o actualizar usuario en la DB
        upsertUser(user.email, {
          name: user.name || '',
          image: user.image || '',
        })
      }
      return true
    },
    async session({ session }) {
      // Inyectar tier del usuario en la sesión
      if (session.user?.email) {
        const { getUser } = await import('@/lib/db')
        const dbUser = getUser(session.user.email)
        if (dbUser) {
          (session.user as Record<string, unknown>).tier = dbUser.tier
          ;(session.user as Record<string, unknown>).upscaleCredits = dbUser.upscaleCredits
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/generator',
  },
})

export { handler as GET, handler as POST }
