import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// API設定更新のバリデーションスキーマ
const updateApiSettingsSchema = z.object({
  publicKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET - 特定のAPI設定取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const setting = await prisma.apiSettings.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        service: true,
        environment: true,
        publicKey: true,
        // 秘密キーは除外
        webhookUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!setting) {
      return NextResponse.json({
        success: false,
        error: 'API設定が見つかりません'
      }, { status: 404 });
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

// PUT - API設定更新
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    console.log('API設定更新リクエスト:', { id: params.id, ...body });

    const validatedData = updateApiSettingsSchema.parse(body);

    // 設定が存在するかチェック
    const existingSetting = await prisma.apiSettings.findUnique({
      where: { id: params.id }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'API設定が見つかりません'
      }, { status: 404 });
    }

    // TODO: 実際の暗号化実装
    const updateData: any = { ...validatedData };
    // if (validatedData.secretKey) {
    //   updateData.secretKey = await encrypt(validatedData.secretKey);
    // }
    // if (validatedData.publicKey) {
    //   updateData.publicKey = await encrypt(validatedData.publicKey);
    // }

    const updatedSetting = await prisma.apiSettings.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        service: true,
        environment: true,
        publicKey: true,
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

// DELETE - API設定削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // 設定が存在するかチェック
    const existingSetting = await prisma.apiSettings.findUnique({
      where: { id: params.id }
    });

    if (!existingSetting) {
      return NextResponse.json({
        success: false,
        error: 'API設定が見つかりません'
      }, { status: 404 });
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