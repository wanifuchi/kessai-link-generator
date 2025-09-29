#!/usr/bin/env tsx

/**
 * API設定データ移行スクリプト
 *
 * 目的: ApiSettingsテーブルの既存データをUserPaymentConfigに移行
 * - 既存の平文データを暗号化
 * - 新しいテーブル構造に対応
 * - 段階的移行でデータ損失を防止
 */

import { PrismaClient } from '@prisma/client'
import { encryptData, decryptData } from '../src/lib/encryption'

const prisma = new PrismaClient()

interface EncryptedPaymentConfig {
  publishableKey?: string
  secretKey: string
  webhookUrl?: string
  environment: 'sandbox' | 'production'
  isTestMode: boolean
}

async function migrateApiSettings() {
  console.log('🔄 API設定データ移行を開始します...')

  try {
    // 既存のApiSettingsデータを取得
    const existingSettings = await prisma.apiSettings.findMany({
      where: {
        userId: { not: null }
      },
      include: {
        user: true
      }
    })

    console.log(`📊 移行対象: ${existingSettings.length}件のAPI設定`)

    if (existingSettings.length === 0) {
      console.log('✅ 移行対象のデータがありません')
      return
    }

    let successCount = 0
    let errorCount = 0

    // 各設定を新しい形式に移行
    for (const setting of existingSettings) {
      try {
        console.log(`🔄 移行中: ${setting.service} (${setting.environment}) - User: ${setting.user?.email}`)

        // 既にUserPaymentConfigに存在するかチェック
        const existingConfig = await prisma.userPaymentConfig.findFirst({
          where: {
            userId: setting.userId!,
            provider: setting.service,
            displayName: `${setting.service.toUpperCase()} ${setting.environment}`
          }
        })

        if (existingConfig) {
          console.log(`⏭️  スキップ: 既に移行済み`)
          continue
        }

        // 暗号化用の設定データを準備
        const configData: EncryptedPaymentConfig = {
          secretKey: setting.secretKey,
          environment: setting.environment,
          isTestMode: setting.environment === 'sandbox'
        }

        if (setting.publishableKey) {
          configData.publishableKey = setting.publishableKey
        }

        if (setting.webhookUrl) {
          configData.webhookUrl = setting.webhookUrl
        }

        // 設定データを暗号化
        const encryptedConfig = encryptData(JSON.stringify(configData))

        // UserPaymentConfigに新しいレコードを作成
        await prisma.userPaymentConfig.create({
          data: {
            userId: setting.userId!,
            provider: setting.service,
            displayName: `${setting.service.toUpperCase()} ${setting.environment}`,
            encryptedConfig: encryptedConfig,
            isTestMode: setting.environment === 'sandbox',
            isActive: setting.isActive,
            createdAt: setting.createdAt,
            updatedAt: setting.updatedAt
          }
        })

        successCount++
        console.log(`✅ 移行完了: ${setting.service} (${setting.environment})`)

      } catch (error) {
        errorCount++
        console.error(`❌ 移行エラー: ${setting.service} (${setting.environment})`, error)
      }
    }

    console.log('\n📊 移行結果:')
    console.log(`✅ 成功: ${successCount}件`)
    console.log(`❌ エラー: ${errorCount}件`)

    if (errorCount === 0) {
      console.log('\n🎉 すべてのデータが正常に移行されました！')
      console.log('\n⚠️  次のステップ:')
      console.log('1. アプリケーションで新しいUserPaymentConfigが正常に動作することを確認')
      console.log('2. 確認後、古いApiSettingsデータを削除してください')
      console.log('   npm run migrate:cleanup-old-settings')
    }

  } catch (error) {
    console.error('❌ 移行処理中にエラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function verifyMigration() {
  console.log('\n🔍 移行結果を検証中...')

  try {
    const originalCount = await prisma.apiSettings.count({
      where: { userId: { not: null } }
    })

    const migratedCount = await prisma.userPaymentConfig.count()

    console.log(`📊 移行前: ${originalCount}件`)
    console.log(`📊 移行後: ${migratedCount}件`)

    // サンプルデータで暗号化/復号化をテスト
    const sampleConfig = await prisma.userPaymentConfig.findFirst()
    if (sampleConfig) {
      try {
        const decryptedData = decryptData<EncryptedPaymentConfig>(sampleConfig.encryptedConfig)
        console.log('✅ 暗号化/復号化テスト: 成功')
        console.log(`   復号化サンプル: ${JSON.stringify(decryptedData, null, 2)}`)
      } catch (error) {
        console.error('❌ 暗号化/復号化テスト: 失敗', error)
      }
    }

  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error)
  }
}

// メイン実行
async function main() {
  console.log('🚀 API設定データ移行スクリプト開始\n')

  await migrateApiSettings()
  await verifyMigration()

  console.log('\n🏁 移行スクリプト完了')
}

// スクリプトが直接実行された場合のみmainを実行
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 予期しないエラーが発生しました:', error)
    process.exit(1)
  })
}