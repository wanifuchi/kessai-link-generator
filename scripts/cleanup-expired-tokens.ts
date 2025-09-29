#!/usr/bin/env tsx

/**
 * 期限切れトークンクリーンアップスクリプト
 *
 * 目的: 期限切れのパスワードリセットトークンを定期的に削除
 * 使用方法: cron ジョブまたは定期実行で使用
 */

import { cleanupExpiredTokens } from '../src/lib/password-reset'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runCleanup() {
  console.log('🧹 期限切れトークンクリーンアップ開始')
  console.log(`📅 実行時刻: ${new Date().toISOString()}`)

  try {
    // 期限切れトークンをクリーンアップ
    const deletedCount = await cleanupExpiredTokens()

    console.log(`✅ クリーンアップ完了: ${deletedCount}件のトークンを削除`)

    // 統計情報を表示
    const remainingTokens = await prisma.passwordResetToken.count()
    const oldestToken = await prisma.passwordResetToken.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, expiresAt: true }
    })

    console.log(`📊 残存トークン: ${remainingTokens}件`)
    if (oldestToken) {
      console.log(`📊 最古トークン: 作成 ${oldestToken.createdAt.toISOString()}, 期限 ${oldestToken.expiresAt.toISOString()}`)
    }

    return {
      success: true,
      deletedCount,
      remainingTokens,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ クリーンアップエラー:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプトが直接実行された場合のみクリーンアップを実行
if (require.main === module) {
  runCleanup()
    .then((result) => {
      console.log(`🎉 クリーンアップ正常終了: ${result.deletedCount}件削除`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 クリーンアップ失敗:', error)
      process.exit(1)
    })
}

export { runCleanup }