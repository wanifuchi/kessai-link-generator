import { NextRequest, NextResponse } from 'next/server';
import { getFincodeService } from '@/lib/fincode';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
        { success: false, error: 'タイトルと有効な金額が必要です' },
        { status: 400 }
      );
    }

    // Fincodeは日本円のみ対応
    if (currency.toUpperCase() !== 'JPY') {
      return NextResponse.json(
        { success: false, error: 'Fincodeは日本円（JPY）のみ対応しています' },
        { status: 400 }
      );
    }

    // サポートされている決済方法かチェック
    const supportedMethods = ['card', 'konbini', 'bank_transfer', 'virtual_account'];
    if (!supportedMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: `サポートされていない決済方法です: ${paymentMethod}` },
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
        { success: false, error: fincodeResult.error },
        { status: 400 }
      );
    }

    // データベースに保存
    const paymentLink = await prisma.paymentLink.create({
      data: {
        id: orderId,
        userId: 'temp-user-id', // FIXME: 実際のユーザーIDが必要
        userPaymentConfigId: 'temp-config-id', // FIXME: 実際の設定IDが必要
        description: title || description,
        amount: Number(amount),
        currency: 'JPY',
        status: 'pending',
        linkUrl: fincodeResult.paymentUrl || '',
        metadata: metadata ? JSON.stringify({
          ...metadata,
          paymentMethod: fincodeResult.paymentMethod,
          title,
        }) : JSON.stringify({
          paymentMethod: fincodeResult.paymentMethod,
          title,
        }),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日間（コンビニ決済等を考慮）
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: paymentLink.id,
        paymentUrl: paymentLink.linkUrl,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.linkUrl)}`,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        service: 'fincode',
        title: paymentLink.description,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        status: paymentLink.status,
        paymentMethod: fincodeResult.paymentMethod,
        expiresAt: paymentLink.expiresAt,
        supportedMethods: {
          card: 'クレジットカード決済',
          konbini: 'コンビニ決済',
          bank_transfer: '銀行振込',
          virtual_account: 'バーチャル口座',
        },
      },
    });

  } catch (error) {
    console.error('Fincode決済リンク作成エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Fincode決済リンクの作成に失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const paymentId = searchParams.get('paymentId');

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { success: false, error: 'orderIdまたはpaymentIdが必要です' },
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await prisma.paymentLink.findFirst({
        where: { serviceId: paymentId },
      });
    }

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: '決済リンクが見つかりません' },
        { status: 404 }
      );
    }

    // Fincode決済の最新ステータスを取得
    if (paymentLink.serviceId && paymentLink.status === 'pending') {
      try {
        const fincodeService = getFincodeService();
        const fincodeStatus = await fincodeService.getPaymentStatus(paymentLink.serviceId);

        // ステータスが変更されている場合は更新
        if (fincodeStatus.status !== 'pending') {
          paymentLink = await prisma.paymentLink.update({
            where: { id: paymentLink.id },
            data: {
              status: fincodeStatus.status,
            },
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
        title: paymentLink.title,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        service: paymentLink.service,
        status: paymentLink.status,
        paymentUrl: paymentLink.paymentUrl,
        shareUrl: `${process.env.NEXTAUTH_URL}/p/${paymentLink.id}`,
        qrCodeUrl: `/api/qr-code?url=${encodeURIComponent(paymentLink.paymentUrl)}`,
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
      {
        success: false,
        error: error instanceof Error ? error.message : 'Fincode決済リンクの取得に失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
        { success: false, error: 'orderIdまたはpaymentIdが必要です' },
        { status: 400 }
      );
    }

    let paymentLink;

    if (orderId) {
      paymentLink = await prisma.paymentLink.findUnique({
        where: { id: orderId },
      });
    } else if (paymentId) {
      paymentLink = await prisma.paymentLink.findFirst({
        where: { serviceId: paymentId },
      });
    }

    if (!paymentLink) {
      return NextResponse.json(
        { success: false, error: '決済リンクが見つかりません' },
        { status: 404 }
      );
    }

    if (paymentLink.status === 'completed') {
      return NextResponse.json(
        { success: false, error: '完了済みの決済はキャンセルできません' },
        { status: 400 }
      );
    }

    // Fincode決済をキャンセル
    if (paymentLink.serviceId) {
      const fincodeService = getFincodeService();
      const cancelResult = await fincodeService.cancelPayment(paymentLink.serviceId);

      if (!cancelResult) {
        return NextResponse.json(
          { success: false, error: 'Fincode決済のキャンセルに失敗しました' },
          { status: 400 }
        );
      }
    }

    // データベースを更新
    await prisma.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'canceled',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Fincode決済がキャンセルされました',
    });

  } catch (error) {
    console.error('Fincode決済キャンセルエラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Fincode決済のキャンセルに失敗しました'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}