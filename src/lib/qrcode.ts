import QRCode from 'qrcode'

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
 * QRコードをData URL形式で生成
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
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
 * QRコードをSVG形式で生成
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
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
 * 決済リンク用QRコード生成
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