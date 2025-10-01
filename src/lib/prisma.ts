import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

declare global {
  var prisma: PrismaClient | undefined
}

// AsyncLocalStorageでuserIdコンテキストを管理
const userIdContext = new AsyncLocalStorage<string>()

// Prismaクライアントの初期化とミドルウェア設定
function createPrismaClient() {
  const client = new PrismaClient()

  // 自動テナント分離ミドルウェア
  client.$use(async (params, next) => {
    const currentUserId = userIdContext.getStore()

    // userIdが設定されている場合のみフィルタリングを適用
    if (currentUserId) {
      // userIdを持つモデルの自動フィルタリング
      const modelsWithUserId = ['paymentLink', 'userPaymentConfig', 'subscription']

      if (modelsWithUserId.includes(params.model || '')) {
        // 読み取り操作（find系）の場合
        if (params.action.startsWith('find') || params.action === 'count' || params.action === 'aggregate') {
          if (!params.args) {
            params.args = {}
          }
          if (!params.args.where) {
            params.args.where = {}
          }

          // 既にuserIdが指定されている場合はそれを優先（管理者機能等での明示的指定対応）
          if (!params.args.where.userId) {
            params.args.where.userId = currentUserId
          }
        }

        // 作成操作の場合
        else if (params.action === 'create') {
          if (!params.args) {
            params.args = {}
          }
          if (!params.args.data) {
            params.args.data = {}
          }

          // userIdが指定されていない場合は自動設定
          if (!params.args.data.userId) {
            params.args.data.userId = currentUserId
          }
        }

        // 更新/削除操作の場合
        else if (params.action === 'update' || params.action === 'delete' ||
                 params.action === 'updateMany' || params.action === 'deleteMany') {
          if (!params.args) {
            params.args = {}
          }
          if (!params.args.where) {
            params.args.where = {}
          }

          // 既にuserIdが指定されている場合はそれを優先
          if (!params.args.where.userId) {
            params.args.where.userId = currentUserId
          }
        }
      }

      // Transactionモデルの場合はPaymentLink経由でuserIdをフィルタ
      else if (params.model === 'Transaction') {
        if (params.action.startsWith('find') || params.action === 'count' || params.action === 'aggregate') {
          if (!params.args) {
            params.args = {}
          }
          if (!params.args.where) {
            params.args.where = {}
          }

          // PaymentLink経由でuserIdフィルタリング
          if (!params.args.where.paymentLink) {
            params.args.where.paymentLink = {}
          }
          if (!params.args.where.paymentLink.userId) {
            params.args.where.paymentLink.userId = currentUserId
          }
        }
      }
    }

    return next(params)
  })

  return client
}

const prisma = globalThis.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// userIdコンテキスト付きでPrisma操作を実行するヘルパー関数
export function withUserId<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return userIdContext.run(userId, fn)
}

// セッション情報からuserIdを取得してPrisma操作を実行するヘルパー関数
// APIルート用のwithSession関数
export async function withSession<T>(
  request: NextRequest,
  authOpts: NextAuthOptions,  // authOptionsを引数として受け取る
  fn: (req: NextRequest, session: any) => Promise<T>
): Promise<T> {
  // NextAuthセッションを取得（authOptionsを渡す）
  const session = await getServerSession(authOpts)

  // セッション情報をコールバックに渡す
  if (session?.user?.id) {
    return withUserId(session.user.id as string, () => fn(request, session))
  } else {
    // セッションがない場合もコールバックを実行（内部で認証チェックする）
    return fn(request, session)
  }
}

// 管理者権限でuserIdフィルタリングを無効化する関数（慎重に使用）
export function withoutTenantIsolation<T>(fn: () => Promise<T>): Promise<T> {
  // この関数は管理者機能やシステム処理でのみ使用すること
  // セキュリティリスクがあるため、使用箇所は必ず監査対象とする
  return fn()
}

export default prisma