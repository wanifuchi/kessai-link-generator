import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, verifyOwnership, createOwnershipError } from '@/lib/auth';

const prisma = new PrismaClient();

// API設定更新のバリデーションスキーマ
const updateApiSettingsSchema = z.object({
  publishableKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET - 特定のAPI設定取得（所有者確認付き）
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const setting = await prisma.apiSettings.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        service: true,
        environment: true,
        publishableKey: true,
        // 秘密キーは除外
        webhookUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      }
    });

    if (!setting) {
      return NextResponse.json({
        success: false,
        error: 'API設定が見つかりません',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    // 所有者確認
    if (!verifyOwnership(user.stackUserId, setting.userId)) {
      return createOwnershipError();
    }

    return NextResponse.json({
      success: true,
      data: setting
    });

  } catch (error) {
    console.error('API設定取得エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'API設定の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - API設定更新（所有者確認付き）
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    const body = await request.json();
    console.log('API設定更新リクエスト:', { id: params.id, ...body });

    const validatedData = updateApiSettingsSchema.parse(body);

    // 設定の存在と所有者確認
    const existingSetting = await prisma.apiSettings.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'API設定が見つかりません',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    if (!verifyOwnership(user.stackUserId, existingSetting.userId)) {
      return createOwnershipError();
    }

    // TODO: 実際の暗号化実装
    const updateData: any = { ...validatedData };
    // if (validatedData.secretKey) {
    //   updateData.secretKey = await encrypt(validatedData.secretKey);
    // }
    // if (validatedData.publishableKey) {
    //   updateData.publishableKey = await encrypt(validatedData.publishableKey);
    // }

    const updatedSetting = await prisma.apiSettings.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        service: true,
        environment: true,
        publishableKey: true,
        // 秘密キーは返さない
        webhookUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSetting
    });

  } catch (error) {
    console.error('API設定更新エラー:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'API設定の更新に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - API設定削除（所有者確認付き）
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // 認証確認
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { user } = authResult;

    // 設定の存在と所有者確認
    const existingSetting = await prisma.apiSettings.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'API設定が見つかりません',
        code: 'NOT_FOUND'
      }, { status: 404 });
    }

    if (!verifyOwnership(user.stackUserId, existingSetting.userId)) {
      return createOwnershipError();
    }

    await prisma.apiSettings.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'API設定を削除しました'
    });

  } catch (error) {
    console.error('API設定削除エラー:', error);
    return NextResponse.json({
      success: false,
      error: 'API設定の削除に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}