import { useState, useCallback, useRef } from 'react'
import { generatePaymentQRCode } from '@/lib/qrcode-dynamic'
import { measureQRCodeGeneration } from '@/lib/performance'

interface QRCodeOptions {
  size?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

interface QRCodeResult {
  dataUrl: string
  svg: string
}

interface UseQRCodeReturn {
  qrCode: QRCodeResult | null
  isGenerating: boolean
  error: string | null
  generateQR: (url: string, options?: QRCodeOptions) => Promise<void>
  clearQR: () => void
  preloadLibrary: () => Promise<void>
}

/**
 * QRコード生成用カスタムフック（動的インポート対応）
 *
 * @example
 * ```tsx
 * const { qrCode, isGenerating, error, generateQR } = useQRCode()
 *
 * // QRコード生成
 * await generateQR('https://example.com')
 *
 * // 表示
 * {qrCode && <img src={qrCode.dataUrl} alt="QR Code" />}
 * ```
 */
export function useQRCode(): UseQRCodeReturn {
  const [qrCode, setQrCode] = useState<QRCodeResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generateQR = useCallback(async (url: string, options?: QRCodeOptions) => {
    // 前回のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 新しいAbortControllerを作成
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsGenerating(true)
    setError(null)

    try {
      // 動的インポートでQRコードを生成（パフォーマンス監視付き）
      const { result, duration } = await measureQRCodeGeneration(() =>
        generatePaymentQRCode(url, options)
      )

      // パフォーマンスログ（開発環境のみ）
      if (process.env.NODE_ENV === 'development' && duration) {
        console.log(`QRコード生成完了: ${duration.toFixed(2)}ms`)
      }

      // リクエストがキャンセルされていないかチェック
      if (!abortController.signal.aborted) {
        setQrCode(result)
      }
    } catch (err) {
      // リクエストがキャンセルされていない場合のみエラーを設定
      if (!abortController.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'QRコードの生成に失敗しました'
        setError(errorMessage)
        console.error('QRコード生成エラー:', err)
      }
    } finally {
      // リクエストがキャンセルされていない場合のみローディング状態を解除
      if (!abortController.signal.aborted) {
        setIsGenerating(false)
      }
    }
  }, [])

  const clearQR = useCallback(() => {
    // 進行中のリクエストをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setQrCode(null)
    setError(null)
    setIsGenerating(false)
  }, [])

  const preloadLibrary = useCallback(async (req, session) => {
    try {
      // QRCodeライブラリを事前にロード
      await import('qrcode')
      console.log('QRCodeライブラリをプリロードしました')
    } catch (error) {
      console.warn('QRCodeライブラリのプリロードに失敗:', error)
    }
  }, [])

  return {
    qrCode,
    isGenerating,
    error,
    generateQR,
    clearQR,
    preloadLibrary
  }
}

/**
 * QRコード表示用コンポーネントのプロップス型
 */
export interface QRCodeDisplayProps {
  qrCode: QRCodeResult | null
  isGenerating: boolean
  error: string | null
  className?: string
  size?: number
  alt?: string
}

/**
 * QRコード状態の型ガード
 */
export function isQRCodeReady(qrCode: QRCodeResult | null): qrCode is QRCodeResult {
  return qrCode !== null && Boolean(qrCode.dataUrl) && Boolean(qrCode.svg)
}