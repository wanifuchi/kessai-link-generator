import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export interface AuthenticatedUser {
  id: string
  email: string
  name?: string
  createdAt: string
}

// JWTトークンまたはNextAuth.jsセッションから認証ユーザー情報を取得
export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  try {
    // まずNextAuth.jsセッションを確認
    const session = await getServerSession(authOptions)
    if (session?.user) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true, createdAt: true }
      })

      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          createdAt: user.createdAt.toISOString()
        }
      }
    }

    // NextAuth.jsセッションがない場合は従来のJWT認証を確認
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, createdAt: true }
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      createdAt: user.createdAt.toISOString()
    }
  } catch (error) {
    return null
  }
}

// API認証必須チェック
export async function requireAuth(request?: NextRequest): Promise<{ user: AuthenticatedUser } | { error: Response }> {
  const user = await getAuthUser()

  if (!user) {
    return {
      error: NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
  }

  return { user }
}

// ユーザー登録
export async function signUp(email: string, password: string, name?: string) {
  try {
    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています')
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10)

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      },
      select: { id: true, email: true, name: true, createdAt: true }
    })

    // JWTトークン生成
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt.toISOString()
      },
      token
    }
  } catch (error) {
    throw error
  }
}

// ユーザーログイン
export async function signIn(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, createdAt: true }
    })

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    const isValidPassword = await bcrypt.compare(password, user.password || '')

    if (!isValidPassword) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    // JWTトークン生成
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET)

    return {
      user: { id: user.id, email: user.email, name: user.name || undefined, createdAt: user.createdAt.toISOString() },
      token
    }
  } catch (error) {
    throw error
  }
}

// 所有者確認
export function verifyOwnership(userId: string, resourceUserId: string | null): boolean {
  return userId === resourceUserId
}

// 所有者確認エラーレスポンス
export function createOwnershipError(): Response {
  return NextResponse.json(
    { error: 'このリソースへのアクセス権限がありません' },
    { status: 403 }
  )
}

// Google認証ユーザーの作成または更新
export async function createOrUpdateGoogleUser(profile: any) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.email }
    })

    if (existingUser) {
      // 既存ユーザーにGoogle認証を紐付け
      return await prisma.user.update({
        where: { email: profile.email },
        data: {
          googleId: profile.sub,
          provider: 'google',
          avatar: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
          name: profile.name || existingUser.name,
        }
      })
    } else {
      // 新規Google認証ユーザーの作成
      return await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          googleId: profile.sub,
          provider: 'google',
          avatar: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        }
      })
    }
  } catch (error) {
    console.error('Google user creation error:', error)
    throw error
  }
}

// NextAuth.jsセッションユーザーかJWTユーザーかを判定
export async function getUserAuthMethod(userId: string): Promise<'google' | 'email' | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { provider: true, googleId: true }
    })

    if (!user) return null

    if (user.googleId && user.provider === 'google') {
      return 'google'
    } else {
      return 'email'
    }
  } catch (error) {
    return null
  }
}