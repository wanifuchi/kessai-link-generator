import { PaymentService } from '@prisma/client'
import { encryptData, decryptData } from '@/lib/encryption'
import {
  PaymentConfigData,
  PaymentConfigFormData,
  EncryptedPaymentConfig,
  ConfigValidationResult,
  ConnectionTestResult,
  StripeConfig,
  PayPalConfig,
  SquareConfig,
  PayPayConfig,
  FincodeConfig
} from '@/types/paymentConfig'
import prisma, { withUserId } from '@/lib/prisma'

export class PaymentConfigService {
  /**
   * 決済設定を作成
   */
  static async createConfig(
    userId: string,
    formData: PaymentConfigFormData
  ): Promise<EncryptedPaymentConfig> {
    return await withUserId(userId, async () => {
      // 入力値検証
      const validation = this.validateConfig(formData.provider, formData.config)
      if (!validation.isValid) {
        throw new Error(`設定エラー: ${validation.errors.join(', ')}`)
      }

      // 既存の同名設定をチェック（userIdフィルタリングは自動適用される）
      const existing = await prisma.userPaymentConfig.findFirst({
        where: {
          provider: formData.provider,
          displayName: formData.displayName
        }
      })

      if (existing) {
        throw new Error(`設定名「${formData.displayName}」は既に使用されています`)
      }

      // 設定データを暗号化
      const configData: PaymentConfigData = {
        [formData.provider]: formData.config
      }
      const encryptedConfig = encryptData(configData)

      // データベースに保存（userIdは自動で設定される）
      const saved = await prisma.userPaymentConfig.create({
        data: {
          userId,
          provider: formData.provider,
          displayName: formData.displayName,
          encryptedConfig,
          isTestMode: formData.isTestMode,
          isActive: formData.isActive
        }
      })

      return saved as EncryptedPaymentConfig
    })
  }

  /**
   * 決済設定を更新
   */
  static async updateConfig(
    configId: string,
    userId: string,
    formData: Partial<PaymentConfigFormData>
  ): Promise<EncryptedPaymentConfig> {
    return await withUserId(userId, async () => {
      // 設定の存在確認（userIdフィルタリングは自動適用される）
      const existing = await prisma.userPaymentConfig.findFirst({
        where: { id: configId }
      })

      if (!existing) {
        throw new Error('設定が見つからないか、アクセス権限がありません')
      }

      const updateData: any = {}

      // 設定データが提供されている場合は暗号化
      if (formData.config) {
        const validation = this.validateConfig(existing.provider, formData.config)
        if (!validation.isValid) {
          throw new Error(`設定エラー: ${validation.errors.join(', ')}`)
        }

        const configData: PaymentConfigData = {
          [existing.provider]: formData.config
        }
        updateData.encryptedConfig = encryptData(configData)
      }

      // その他のフィールドを更新
      if (formData.displayName !== undefined) updateData.displayName = formData.displayName
      if (formData.isTestMode !== undefined) updateData.isTestMode = formData.isTestMode
      if (formData.isActive !== undefined) updateData.isActive = formData.isActive

      // userIdフィルタリングが自動適用される
      const updated = await prisma.userPaymentConfig.update({
        where: { id: configId },
        data: updateData
      })

      return updated as EncryptedPaymentConfig
    })
  }

  /**
   * 決済設定を取得（復号化済み）
   */
  static async getConfig(configId: string, userId: string): Promise<PaymentConfigFormData | null> {
    return await withUserId(userId, async () => {
      // userIdフィルタリングは自動適用される
      const config = await prisma.userPaymentConfig.findFirst({
        where: { id: configId }
      })

      if (!config) return null

      try {
        const decryptedData = decryptData<PaymentConfigData>(config.encryptedConfig)
        const providerConfig = decryptedData[config.provider]

        return {
          displayName: config.displayName,
          provider: config.provider,
          isTestMode: config.isTestMode,
          isActive: config.isActive,
          config: providerConfig
        }
      } catch (error) {
        console.error('決済設定の復号化エラー:', error)
        throw new Error('設定データの読み込みに失敗しました')
      }
    })
  }

  /**
   * ユーザーの全決済設定を取得（設定データは除外）
   */
  static async getUserConfigs(userId: string): Promise<EncryptedPaymentConfig[]> {
    return await withUserId(userId, async () => {
      // userIdフィルタリングは自動適用される
      const configs = await prisma.userPaymentConfig.findMany({
        orderBy: { createdAt: 'desc' }
      })

      return configs as EncryptedPaymentConfig[]
    })
  }

  /**
   * 決済設定を削除
   */
  static async deleteConfig(configId: string, userId: string): Promise<void> {
    return await withUserId(userId, async () => {
      // userIdフィルタリングが自動適用される
      const deleted = await prisma.userPaymentConfig.deleteMany({
        where: { id: configId }
      })

      if (deleted.count === 0) {
        throw new Error('設定が見つからないか、アクセス権限がありません')
      }
    })
  }

  /**
   * 設定データの妥当性検証
   */
  static validateConfig(provider: PaymentService, config: any): ConfigValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      switch (provider) {
        case PaymentService.stripe:
          this.validateStripeConfig(config as StripeConfig, errors, warnings)
          break
        case PaymentService.paypal:
          this.validatePayPalConfig(config as PayPalConfig, errors, warnings)
          break
        case PaymentService.square:
          this.validateSquareConfig(config as SquareConfig, errors, warnings)
          break
        case PaymentService.paypay:
          this.validatePayPayConfig(config as PayPayConfig, errors, warnings)
          break
        case PaymentService.fincode:
          this.validateFincodeConfig(config as FincodeConfig, errors, warnings)
          break
        default:
          errors.push('サポートされていない決済プロバイダーです')
      }
    } catch (error) {
      errors.push('設定データの形式が正しくありません')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private static validateStripeConfig(config: StripeConfig, errors: string[], warnings: string[]) {
    if (!config.publishableKey) {
      errors.push('Publishable Keyは必須です')
    } else if (!config.publishableKey.startsWith('pk_')) {
      errors.push('Publishable Keyの形式が正しくありません')
    }

    if (!config.secretKey) {
      errors.push('Secret Keyは必須です')
    } else if (!config.secretKey.startsWith('sk_')) {
      errors.push('Secret Keyの形式が正しくありません')
    }

    if (config.webhookSecret && !config.webhookSecret.startsWith('whsec_')) {
      warnings.push('Webhook Secretの形式を確認してください')
    }
  }

  private static validatePayPalConfig(config: PayPalConfig, errors: string[], warnings: string[]) {
    if (!config.clientId) {
      errors.push('Client IDは必須です')
    }

    if (!config.clientSecret) {
      errors.push('Client Secretは必須です')
    }
  }

  private static validateSquareConfig(config: SquareConfig, errors: string[], warnings: string[]) {
    if (!config.applicationId) {
      errors.push('Application IDは必須です')
    }

    if (!config.accessToken) {
      errors.push('Access Tokenは必須です')
    }
  }

  private static validatePayPayConfig(config: PayPayConfig, errors: string[], warnings: string[]) {
    if (!config.merchantId) {
      errors.push('Merchant IDは必須です')
    }

    if (!config.apiKey) {
      errors.push('API Keyは必須です')
    }

    if (!config.apiSecret) {
      errors.push('API Secretは必須です')
    }
  }

  private static validateFincodeConfig(config: FincodeConfig, errors: string[], warnings: string[]) {
    if (!config.shopId) {
      errors.push('Shop IDは必須です')
    }

    if (!config.secretKey) {
      errors.push('Secret Keyは必須です')
    }

    if (!config.publicKey) {
      errors.push('Public Keyは必須です')
    }
  }

  /**
   * 接続テストの結果を更新
   */
  static async updateTestResult(
    configId: string,
    userId: string,
    result: ConnectionTestResult
  ): Promise<void> {
    return await withUserId(userId, async () => {
      // userIdフィルタリングが自動適用される
      await prisma.userPaymentConfig.updateMany({
        where: { id: configId },
        data: {
          lastTestedAt: result.testedAt,
          verifiedAt: result.success ? result.testedAt : null
        }
      })
    })
  }
}