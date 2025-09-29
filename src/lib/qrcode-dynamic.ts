/**
 * 動的インポート対応QRコード生成ユーティリティ
 * パフォーマンス向上のため、必要時のみQRCodeライブラリを読み込み
 */

/**
 * QRコード生成オプション
 */
interface QRCodeOptions {
  size?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * QRCodeライブラリの動的インポート
 */
async function importQRCode() {
  try {
    const QRCode = await import('qrcode')
    return QRCode.default
  } catch (error) {
    console.error('QRCodeライブラリの読み込みに失敗しました:', error)
    throw new Error('QRCodeライブラリを読み込めませんでした')
  }
}

/**
 * QRコードをData URL形式で生成（動的インポート版）
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const QRCode = await importQRCode()

  const defaultOptions = {
    width: options.size || 256,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
  }

  try {
    return await QRCode.toDataURL(text, defaultOptions)
  } catch (error) {
    console.error('QRコード生成エラー:', error)
    throw new Error('QRコードの生成に失敗しました')
  }
}

/**
 * QRコードをSVG形式で生成（動的インポート版）
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const QRCode = await importQRCode()

  const defaultOptions = {
    width: options.size || 256,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M' as const
  }

  try {
    return await QRCode.toString(text, {
      ...defaultOptions,
      type: 'svg'
    })
  } catch (error) {
    console.error('QRコード（SVG）生成エラー:', error)
    throw new Error('QRコード（SVG）の生成に失敗しました')
  }
}

/**
 * 決済リンク用QRコード生成（動的インポート版）
 */
export async function generatePaymentQRCode(
  paymentUrl: string,
  options: QRCodeOptions = {}
): Promise<{
  dataUrl: string
  svg: string
}> {
  const qrOptions = {
    size: 256,
    margin: 2,
    errorCorrectionLevel: 'M' as const,
    ...options
  }

  try {
    const [dataUrl, svg] = await Promise.all([
      generateQRCode(paymentUrl, qrOptions),
      generateQRCodeSVG(paymentUrl, qrOptions)
    ])

    return { dataUrl, svg }
  } catch (error) {
    console.error('決済QRコード生成エラー:', error)
    throw new Error('決済QRコードの生成に失敗しました')
  }
}

/**
 * QRコード機能が利用可能かチェック
 */
export function isQRCodeSupported(): boolean {
  try {
    // 基本的なブラウザ機能チェック
    return typeof window !== 'undefined' &&
           typeof document !== 'undefined' &&
           'Promise' in window
  } catch {
    return false
  }
}

/**
 * QRコードライブラリのプリロード（オプション）
 * 必要な場面で事前に呼び出してライブラリをキャッシュ
 */
export async function preloadQRCode(): Promise<void> {
  try {
    await importQRCode()
    console.log('QRCodeライブラリをプリロードしました')
  } catch (error) {
    console.warn('QRCodeライブラリのプリロードに失敗:', error)
  }
}