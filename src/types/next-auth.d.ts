import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      provider?: string
      googleId?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    provider?: string
    googleId?: string
    emailVerified?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    provider?: string
    googleId?: string
  }
}