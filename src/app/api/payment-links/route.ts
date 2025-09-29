import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma, { withSession } from '@/lib/prisma'
import { createPaymentIntent } from '@/lib/payment'
import { CreatePaymentLinkRequest } from '@/types/payment'

/**
 * セキュアなIDを生成
 */
function generateSecureId(): string {
  // より安全で予測不可能なIDを生成
  const timestamp = Date.now().toString(36)
  const randomPart1 = Math.random().toString(36).substring(2, 15)
  const randomPart2 = Math.random().toString(36).substring(2, 15)
  const randomPart3 = Math.random().toString(36).substring(2, 10)

  return `${timestamp}${randomPart1}${randomPart2}${randomPart3}`.substring(0, 24)
}

/**
 * 決済リンク作成 API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await withSession(
      request,
      async (req, session) => {
        // 認証チェック
        if (!session?.user?.id) {
          return NextResponse.json(
            { success: false, error: '認証が必要です' },
            { status: 401 }
          )
        }

        const body: CreatePaymentLinkRequest = await request.json()
        const { amount, currency, description, expiresAt, userPaymentConfigId } = body

        // バリデーション
        if (!amount || amount <= 0) {
          return NextResponse.json(
            { success: false, error: '有効な金額を入力してください' },
            { status: 400 }
          )
        }

        if (!currency) {
          return NextResponse.json(
            { success: false, error: '通貨を指定してください' },
            { status: 400 }
          )
        }

        if (!userPaymentConfigId) {
          return NextResponse.json(
            { success: false, error: '決済設定を選択してください' },
            { status: 400 }
          )
        }

        // 決済設定の存在確認（userIdは自動でフィルタリングされる）
        const paymentConfig = await prisma.userPaymentConfig.findFirst({
          where: {
            id: userPaymentConfigId,
            isActive: true,
          },
        })

        if (!paymentConfig) {
          return NextResponse.json(
            { success: false, error: '有効な決済設定が見つかりません' },
            { status: 404 }
          )
        }

        // 決済リンクIDを生成
        const linkId = generateSecureId()
        const linkUrl = `${process.env.NEXTAUTH_URL}/pay/${linkId}`

        // 有効期限の設定（デフォルト: 24時間後）
        const expirationDate = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)

        // 決済リンクをデータベースに作成
        const paymentLink = await prisma.paymentLink.create({
          data: {
            id: linkId,
            userId: session.user.id,
            userPaymentConfigId: userPaymentConfigId,
            amount: Math.round(amount), // セント単位
            currency: currency.toLowerCase(),
            description: description,
            status: 'pending',
            linkUrl: linkUrl,
            expiresAt: expirationDate,
          },
          include: {
            userPaymentConfig: {
              select: {
                provider: true,
                displayName: true,
                isTestMode: true,
              },
            },
          },
        })

        // Payment Intent を作成
        try {
          const paymentIntentResult = await createPaymentIntent({
            linkId: linkId,
            amount: amount,
            currency: currency,
            description: description,
            userPaymentConfigId: userPaymentConfigId,
          })

          // Payment Intent ID を保存（userIdフィルタリングが自動適用される）
          await prisma.paymentLink.update({
            where: { id: linkId },
            data: {
              stripePaymentIntentId: paymentIntentResult.paymentIntentId,
            },
          })

        } catch (error) {
          // Payment Intent作成失敗時は決済リンクも削除（userIdフィルタリングが自動適用される）
          await prisma.paymentLink.delete({
            where: { id: linkId },
          })

          console.error('Payment Intent作成エラー:', error)
          return NextResponse.json(
            { success: false, error: 'Payment Intentの作成に失敗しました' },
            { status: 500 }
          )
        }

        // QRコード生成
        let qrCode = null
        try {
          const { generatePaymentQRCode } = await import('@/lib/qrcode')
          qrCode = await generatePaymentQRCode(paymentLink.linkUrl, {
            size: 256,
            errorCorrectionLevel: 'M'
          })
        } catch (error) {
          console.error('QRコード生成失敗:', error)
          // QRコード生成失敗時も決済リンクは作成成功として返す
        }

        return NextResponse.json({
          success: true,
          data: {
            id: paymentLink.id,
            linkUrl: paymentLink.linkUrl,
            amount: paymentLink.amount,
            currency: paymentLink.currency,
            description: paymentLink.description,
            status: paymentLink.status,
            expiresAt: paymentLink.expiresAt,
            createdAt: paymentLink.createdAt,
            qrCode,
          }
        })
      }
    )
  } catch (error) {
    console.error('決済リンク作成エラー:', error)
    return NextResponse.json(
      { success: false, error: '決済リンクの作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 決済リンク一覧取得 API
 */
export async function GET(request: NextRequest) {
  try {
    return await withSession(
      request,
      async (req, session) => {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')

        const skip = (page - 1) * limit

        const where: any = {}

        if (status) {
          where.status = status
        }

        // userIdフィルタリングは自動で適用される
        const [paymentLinks, total] = await Promise.all([
          prisma.paymentLink.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              userPaymentConfig: {
                select: {
                  provider: true,
                  displayName: true,
                  isTestMode: true,
                },
              },
            },
          }),
          prisma.paymentLink.count({ where }),
        ])

        return NextResponse.json({
          success: true,
          data: {
            paymentLinks: paymentLinks.map((link) => ({
              id: link.id,
              title: link.description || '無題の決済リンク',
              description: link.description,
              amount: link.amount,
              currency: link.currency,
              service: link.userPaymentConfig.provider,
              paymentUrl: link.linkUrl,
              status: link.status,
              expiresAt: link.expiresAt,
              completedAt: link.completedAt,
              createdAt: link.createdAt,
              transactions: [],
              paymentConfig: {
                displayName: link.userPaymentConfig.displayName,
                provider: link.userPaymentConfig.provider,
                isTestMode: link.userPaymentConfig.isTestMode,
              },
            })),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          },
        })
      }
    )
  } catch (error) {
    console.error('決済リンク取得エラー:', error)
    return NextResponse.json(
      { success: false, error: '決済リンクの取得に失敗しました' },
      { status: 500 }
    )
  }
}