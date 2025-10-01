import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma, { withSession } from '@/lib/prisma'
import { generatePaymentQRCode } from '@/lib/qrcode'

/**
 * 決済リンク詳細取得 API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params
    const { searchParams } = new URL(request.url)
    const includeQR = searchParams.get('qr') === 'true'

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'リンクIDが必要です' },
        { status: 400 }
      )
    }

    // 決済リンクを取得
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { id },
      include: {
        userPaymentConfig: {
          select: {
            id: true,
            provider: true,
            displayName: true,
            isTestMode: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: '決済リンクが見つかりません' },
        { status: 404 }
      )
    }

    // 所有者以外のアクセスでの制限チェック
    const isOwner = session?.user?.id === paymentLink.userId

    if (!isOwner) {
      // 有効期限チェック
      if (paymentLink.expiresAt && paymentLink.expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: '決済リンクの有効期限が切れています' },
          { status: 400 }
        )
      }

      // 決済状態チェック
      if (paymentLink.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: '決済は既に処理されています' },
          { status: 400 }
        )
      }
    }

    // QRコード生成
    let qrCode = null
    if (includeQR) {
      try {
        qrCode = await generatePaymentQRCode(paymentLink.linkUrl, {
          size: 256,
          errorCorrectionLevel: 'M'
        })
      } catch (error) {
        console.error('QRコード生成失敗:', error)
        // QRコード生成失敗時も決済リンクは表示
      }
    }

    // レスポンスデータの構築
    const responseData = {
      id: paymentLink.id,
      userId: paymentLink.userId,
      userPaymentConfigId: paymentLink.userPaymentConfigId,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      description: paymentLink.description,
      status: paymentLink.status,
      stripePaymentIntentId: paymentLink.stripePaymentIntentId,
      linkUrl: paymentLink.linkUrl,
      expiresAt: paymentLink.expiresAt,
      completedAt: paymentLink.completedAt,
      createdAt: paymentLink.createdAt,
      updatedAt: paymentLink.updatedAt,
      userPaymentConfig: paymentLink.userPaymentConfig,
      qrCode,
    }

    // 所有者の場合は追加情報を含める
    if (isOwner) {
      Object.assign(responseData, {
        user: {
          name: paymentLink.user.name,
          email: paymentLink.user.email,
        },
        analytics: {
          // 将来的に分析データを追加
          views: 0,
          clicks: 0,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })

  } catch (error) {
    console.error('決済リンク取得エラー:', error)
    return NextResponse.json(
      { success: false, error: '決済リンクの取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 決済リンク更新 API
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    return await withSession(
      request,
      authOptions,
      async (req, session) => {
        const { id } = params

        if (!id) {
          return NextResponse.json(
            { success: false, error: '決済リンクIDが必要です' },
            { status: 400 }
          )
        }

        const body = await request.json()
        const { description, status } = body

        // 決済リンクの所有者確認（userIdフィルタリングは自動適用される）
        const existingLink = await prisma.paymentLink.findFirst({
          where: { id },
        })

        if (!existingLink) {
          return NextResponse.json(
            { success: false, error: '決済リンクが見つからないか、編集権限がありません' },
            { status: 404 }
          )
        }

        // 更新可能なフィールドのみを抽出
        const updateData: any = {}

        if (description !== undefined) {
          updateData.description = description
        }

        if (status !== undefined && ['pending', 'cancelled'].includes(status)) {
          updateData.status = status
        }

        if (Object.keys(updateData).length === 0) {
          return NextResponse.json(
            { success: false, error: '更新するデータがありません' },
            { status: 400 }
          )
        }

        updateData.updatedAt = new Date()

        // 決済リンクを更新（userIdフィルタリングが自動適用される）
        const updatedLink = await prisma.paymentLink.update({
          where: { id },
          data: updateData,
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

        return NextResponse.json({
          success: true,
          data: {
            id: updatedLink.id,
            linkUrl: updatedLink.linkUrl,
            amount: updatedLink.amount,
            currency: updatedLink.currency,
            description: updatedLink.description,
            status: updatedLink.status,
            expiresAt: updatedLink.expiresAt,
            completedAt: updatedLink.completedAt,
            createdAt: updatedLink.createdAt,
            updatedAt: updatedLink.updatedAt,
            paymentConfig: {
              displayName: updatedLink.userPaymentConfig.displayName,
              provider: updatedLink.userPaymentConfig.provider,
              isTestMode: updatedLink.userPaymentConfig.isTestMode,
            },
          },
        })
      }
    )
  } catch (error) {
    console.error('決済リンク更新エラー:', error)
    return NextResponse.json(
      { success: false, error: '決済リンクの更新に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * 決済リンク削除 API
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    return await withSession(
      request,
      authOptions,
      async (req, session) => {
        const { id } = params

        if (!id) {
          return NextResponse.json(
            { success: false, error: '決済リンクIDが必要です' },
            { status: 400 }
          )
        }

        // 決済リンクの所有者確認（userIdフィルタリングは自動適用される）
        const existingLink = await prisma.paymentLink.findFirst({
          where: { id },
        })

        if (!existingLink) {
          return NextResponse.json(
            { success: false, error: '決済リンクが見つからないか、削除権限がありません' },
            { status: 404 }
          )
        }

        // 完了済みの決済リンクは削除できない
        if (existingLink.status === 'succeeded') {
          return NextResponse.json(
            { success: false, error: '完了済みの決済リンクは削除できません' },
            { status: 400 }
          )
        }

        // 決済リンクを削除（userIdフィルタリングが自動適用される）
        await prisma.paymentLink.delete({
          where: { id },
        })

        return NextResponse.json({
          success: true,
          message: '決済リンクが削除されました',
        })
      }
    )
  } catch (error) {
    console.error('決済リンク削除エラー:', error)
    return NextResponse.json(
      { success: false, error: '決済リンクの削除に失敗しました' },
      { status: 500 }
    )
  }
}