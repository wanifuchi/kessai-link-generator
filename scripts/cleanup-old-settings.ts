#!/usr/bin/env tsx

/**
 * 旧API設定データクリーンアップスクリプト
 *
 * 目的: 移行完了後にApiSettingsテーブルの古いデータを安全に削除
 * - 移行の完了を確認してから削除
 * - バックアップオプション提供
 * - 段階的削除で安全性確保
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function backupOldSettings() {
  console.log('💾 旧API設定データをバックアップ中...')

  try {
    const oldSettings = await prisma.apiSettings.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(process.cwd(), 'backups', `api-settings-backup-${timestamp}.json`)

    // バックアップディレクトリを作成
    const { mkdirSync } = require('fs')
    mkdirSync(join(process.cwd(), 'backups'), { recursive: true })

    // バックアップファイルを作成
    writeFileSync(backupPath, JSON.stringify(oldSettings, null, 2))

    console.log(`✅ バックアップ完了: ${backupPath}`)
    console.log(`📊 バックアップ件数: ${oldSettings.length}件`)

    return backupPath

  } catch (error) {
    console.error('❌ バックアップ中にエラーが発生しました:', error)
    throw error
  }
}

async function verifyMigrationComplete() {
  console.log('🔍 移行完了状況を確認中...')

  try {
    // 旧設定の数を確認
    const oldSettingsCount = await prisma.apiSettings.count({
      where: { userId: { not: null } }
    })

    // 新設定の数を確認
    const newSettingsCount = await prisma.userPaymentConfig.count()

    console.log(`📊 旧設定: ${oldSettingsCount}件`)
    console.log(`📊 新設定: ${newSettingsCount}件`)

    if (oldSettingsCount === 0) {
      console.log('ℹ️  旧設定データは既に削除されています')
      return true
    }

    if (newSettingsCount === 0) {
      console.log('⚠️  新設定データが見つかりません。移行が完了していない可能性があります')
      return false
    }

    // 移行対象の設定がすべて新形式に移行されているかチェック
    const unmigrated = await prisma.apiSettings.findMany({
      where: {
        userId: { not: null }
      },
      include: {
        user: true
      }
    })

    let allMigrated = true
    for (const setting of unmigrated) {
      const migrated = await prisma.userPaymentConfig.findFirst({
        where: {
          userId: setting.userId!,
          provider: setting.service,
          displayName: `${setting.service.toUpperCase()} ${setting.environment}`
        }
      })

      if (!migrated) {
        console.log(`❌ 未移行: ${setting.service} (${setting.environment}) - User: ${setting.user?.email}`)
        allMigrated = false
      }
    }

    if (allMigrated) {
      console.log('✅ すべての設定が正常に移行されています')
    } else {
      console.log('⚠️  一部の設定が未移行です。先に移行スクリプトを実行してください')
    }

    return allMigrated

  } catch (error) {
    console.error('❌ 移行状況確認中にエラーが発生しました:', error)
    throw error
  }
}

async function cleanupOldSettings(force: boolean = false) {
  console.log('🗑️  旧API設定データをクリーンアップ中...')

  try {
    if (!force) {
      const migrationComplete = await verifyMigrationComplete()
      if (!migrationComplete) {
        console.log('❌ 移行が完了していないため、クリーンアップを中止します')
        console.log('   強制実行する場合は --force オプションを使用してください')
        return false
      }
    }

    // バックアップを作成
    const backupPath = await backupOldSettings()

    // 旧設定データを削除
    const deleteResult = await prisma.apiSettings.deleteMany({
      where: { userId: { not: null } }
    })

    console.log(`✅ 削除完了: ${deleteResult.count}件`)
    console.log(`💾 バックアップ: ${backupPath}`)

    return true

  } catch (error) {
    console.error('❌ クリーンアップ中にエラーが発生しました:', error)
    throw error
  }
}

async function showStatus() {
  console.log('📊 現在のデータベース状況:')

  try {
    const oldCount = await prisma.apiSettings.count()
    const oldUserCount = await prisma.apiSettings.count({
      where: { userId: { not: null } }
    })
    const newCount = await prisma.userPaymentConfig.count()

    console.log(`   旧設定 (ApiSettings): ${oldCount}件 (ユーザー紐付き: ${oldUserCount}件)`)
    console.log(`   新設定 (UserPaymentConfig): ${newCount}件`)

    if (oldUserCount > 0 && newCount > 0) {
      console.log('\n💡 推奨アクション:')
      console.log('   1. アプリケーションで新設定が正常動作することを確認')
      console.log('   2. 確認後、クリーンアップスクリプトを実行')
      console.log('      npm run migrate:cleanup-old-settings')
    } else if (oldUserCount === 0) {
      console.log('\n✅ クリーンアップ済み: 旧設定データは削除されています')
    } else if (newCount === 0) {
      console.log('\n⚠️  移行未完了: 先に移行スクリプトを実行してください')
      console.log('      npm run migrate:api-settings')
    }

  } catch (error) {
    console.error('❌ 状況確認中にエラーが発生しました:', error)
  }
}

// メイン実行
async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const statusOnly = args.includes('--status')

  console.log('🧹 旧API設定クリーンアップスクリプト開始\n')

  if (statusOnly) {
    await showStatus()
  } else {
    const success = await cleanupOldSettings(force)
    if (success) {
      console.log('\n🎉 クリーンアップが完了しました！')
      console.log('\n📝 次のステップ:')
      console.log('1. アプリケーションが正常動作することを確認')
      console.log('2. 問題がある場合はバックアップから復元可能です')
    }
  }

  await prisma.$disconnect()
  console.log('\n🏁 クリーンアップスクリプト完了')
}

// スクリプトが直接実行された場合のみmainを実行
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 予期しないエラーが発生しました:', error)
    process.exit(1)
  })
}