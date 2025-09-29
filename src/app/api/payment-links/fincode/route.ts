import { NextRequest, NextResponse } from 'next/server';
import { getFincodeService } from '@/lib/fincode';
import prisma, { withSession } from '@/lib/prisma';
import {
  createStandardPaymentLink,
  createSuccessResponse,
  createErrorResponse,
  mapToPaymentStatus,
  findPaymentLinkByIdentifier,
  type StandardizedPaymentLinkData
} from '@/lib/payment-utils';
import { PaymentService } from '@prisma/client';

export async function POST(request: NextRequest) {
  return withSession(request, async (req, session) => {
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse('認証が必要です', PaymentService.fincode),
        { status: 401 }
      );
    }

    try {
      const body = await req.json();
      const {
        title,
        amount,
        currency = 'JPY',
        description,
        paymentMethod = 'card', // card, konbini, bank_transfer, virtual_account
        metadata = {}
      } = body;

      // バリデーション
      if (!title || !amount || amount <= 0) {
        return NextResponse.json(
          createErrorResponse('タイトルと有効な金額が必要です', PaymentService.fincode),
          { status: 400 }
        );
      }

      // Fincodeは日本円のみ対応
      if (currency.toUpperCase() !== 'JPY') {
        return NextResponse.json(
          createErrorResponse('Fincodeは日本円（JPY）のみ対応しています', PaymentService.fincode),
          { status: 400 }
        );
      }

      // サポートされている決済方法かチェック
      const supportedMethods = ['card', 'konbini', 'bank_transfer', 'virtual_account'];
      if (!supportedMethods.includes(paymentMethod)) {
        return NextResponse.json(
          createErrorResponse(`サポートされていない決済方法です: ${paymentMethod}`, PaymentService.fincode),
          { status: 400 }
        );
      }

      // Fincode設定を取得
      const fincodeConfig = await prisma.userPaymentConfig.findFirst({
        where: {
          userId: session.user.id,
          service: PaymentService.fincode,
          isActive: true,
        },
      });

      if (!fincodeConfig) {
        return NextResponse.json(
          createErrorResponse('Fincode設定が見つかりません', PaymentService.fincode),
          { status: 400 }
        );
      }

      // 注文IDを生成
      const orderId = `fincode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Fincode決済を作成
      const fincodeService = getFincodeService();
      const fincodeResult = await fincodeService.createPayment({
        amount: Number(amount),
        currency: 'JPY',
        orderId,
        description: description || title,
        paymentMethod,
        metadata: {
          ...metadata,
          title,
          paymentMethod,
        },
      });

      if (!fincodeResult.success) {
        return NextResponse.json(
          createErrorResponse(fincodeResult.error || 'Fincode決済の作成に失敗しました', PaymentService.fincode),
          { status: 400 }
        );
      }

      // 標準化されたデータ構造で決済リンクを作成
      const paymentLinkData: StandardizedPaymentLinkData = {
        id: orderId,
        userId: session.user.id,
        userPaymentConfigId: fincodeConfig.id,
        amount: Number(amount),
        currency: 'JPY',
        description: title,
        status: 'pending',
        linkUrl: fincodeResult.paymentUrl || '',
        stripePaymentIntentId: fincodeResult.paymentId || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日間（コンビニ決済等を考慮）
        metadata: metadata ? {
          ...metadata,
          paymentMethod: fincodeResult.paymentMethod,
          title,
        } : {
          paymentMethod: fincodeResult.paymentMethod,
          title,
        }
      };

      const paymentLink = await createStandardPaymentLink(paymentLinkData);

      return NextResponse.json(
        createSuccessResponse(paymentLink, PaymentService.fincode, {
          paymentMethod: fincodeResult.paymentMethod,
          supportedMethods: {
            card: 'クレジットカード決済',
            konbini: 'コンビニ決済',
            bank_transfer: '銀行振込',
            virtual_account: 'バーチャル口座',
          },
        })
      );

    } catch (error) {
      console.error('Fincode決済リンク作成エラー:', error);
      return NextResponse.json(
        createErrorResponse(
          error instanceof Error ? error.message : 'Fincode決済リンクの作成に失敗しました',
          PaymentService.fincode
        ),
        { status: 500 }
      );
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        createErrorResponse('orderIdまたはpaymentIdが必要です', PaymentService.fincode),
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await findPaymentLinkByIdentifier(paymentId, PaymentService.fincode);
    }

    if (!paymentLink) {
      return NextResponse.json(
        createErrorResponse('決済リンクが見つかりません', PaymentService.fincode),
        { status: 404 }
      );
    }

    // Fincode決済の最新ステータスを取得
    if (paymentLink.stripePaymentIntentId && paymentLink.status === 'pending') {
      try {
        const fincodeService = getFincodeService();
        const fincodeStatus = await fincodeService.getPaymentStatus(paymentLink.stripePaymentIntentId);

        // ステータスが変更されている場合は更新
        if (fincodeStatus.status !== 'pending') {
          const newStatus = mapToPaymentStatus(fincodeStatus.status, PaymentService.fincode);
          paymentLink = await prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: { status: newStatus },
          });
        }
      } catch (error) {
        console.error('Fincode決済ステータス更新エラー:', error);
      }
    }

    // メタデータから決済方法を取得
    const metadata = paymentLink.metadata as any;
    const paymentMethod = metadata?.paymentMethod;

    return NextResponse.json({
      success: true,
      data: {
        id: paymentLink.id,
        title: paymentLink.description,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        service: PaymentService.fincode,
        status: paymentLink.status,
        paymentUrl: paymentLink.linkUrl,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.linkUrl)}`,
        paymentMethod,
        description: paymentLink.description,
        metadata: paymentLink.metadata,
        createdAt: paymentLink.createdAt,
        expiresAt: paymentLink.expiresAt,
      },
    });

  } catch (error) {
    console.error('Fincode決済リンク取得エラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Fincode決済リンクの取得に失敗しました',
        PaymentService.fincode
      ),
      { status: 500 }
    );
  }
}

// Fincode決済のキャンセル
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        createErrorResponse('orderIdまたはpaymentIdが必要です', PaymentService.fincode),
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await findPaymentLinkByIdentifier(paymentId, PaymentService.fincode);
    }

    if (!paymentLink) {
      return NextResponse.json(
        createErrorResponse('決済リンクが見つかりません', PaymentService.fincode),
        { status: 404 }
      );
    }

    if (paymentLink.status === 'succeeded') {
      return NextResponse.json(
        createErrorResponse('完了済みの決済はキャンセルできません', PaymentService.fincode),
        { status: 400 }
      );
    }

    // Fincode決済をキャンセル
    if (paymentLink.stripePaymentIntentId) {
      const fincodeService = getFincodeService();
      const cancelResult = await fincodeService.cancelPayment(paymentLink.stripePaymentIntentId);

      if (!cancelResult) {
        return NextResponse.json(
          createErrorResponse('Fincode決済のキャンセルに失敗しました', PaymentService.fincode),
          { status: 400 }
        );
      }
    }

    // データベースを更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      message: 'Fincode決済がキャンセルされました',
    });

  } catch (error) {
    console.error('Fincode決済キャンセルエラー:', error);
    return NextResponse.json(
      createErrorResponse(
        error instanceof Error ? error.message : 'Fincode決済のキャンセルに失敗しました',
        PaymentService.fincode
      ),
      { status: 500 }
    );
  }
}