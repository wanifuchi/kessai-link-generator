import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// API設定のバリデーションスキーマ
const apiSettingsSchema = z.object({
  service: z.enum(['STRIPE', 'PAYPAL', 'SQUARE', 'PAYPAY', 'FINCODE']),
  environment: z.enum(['SANDBOX', 'PRODUCTION']).default('SANDBOX'),
  publicKey: z.string().optional(),
  secretKey: z.string().min(1, '秘密キーは必須です'),
  webhookUrl: z.string().url().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET - API設定一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const environment = searchParams.get('environment');

    const where: any = {};
    if (service) where.service = service.toUpperCase();
    if (environment) where.environment = environment.toUpperCase();

    const settings = await prisma.apiSettings.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        service: true,
        environment: true,
        publicKey: true,
        // 秘密キーは除外してセキュリティを確保
        webhookUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: settings
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

// POST - 新しいAPI設定作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API設定作成リクエスト:', body);

    const validatedData = apiSettingsSchema.parse(body);

    // TODO: 実際の暗号化実装（現在は平文で保存）
    // const encryptedSecretKey = await encrypt(validatedData.secretKey);
    // const encryptedPublicKey = validatedData.publicKey ? await encrypt(validatedData.publicKey) : null;

    // 同一サービス・環境の組み合わせが既に存在するかチェック
    const existingSetting = await prisma.apiSettings.findFirst({
      where: {
        service: validatedData.service,
        environment: validatedData.environment,
        userId: null, // 現在はユーザー機能未実装のためnull
      }
    });

    if (existingSetting) {
      return NextResponse.json({
        success: false,
        error: '同じサービス・環境の設定が既に存在します',
        details: `${validatedData.service} - ${validatedData.environment}`
      }, { status: 409 });
    }

    const apiSetting = await prisma.apiSettings.create({
      data: {
        service: validatedData.service,
        environment: validatedData.environment,
        publicKey: validatedData.publicKey, // TODO: 暗号化
        secretKey: validatedData.secretKey, // TODO: 暗号化
        webhookUrl: validatedData.webhookUrl,
        description: validatedData.description,
        isActive: validatedData.isActive,
        userId: null, // 現在はユーザー機能未実装
      },
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
      data: apiSetting
    }, { status: 201 });

  } catch (error) {
    console.error('API設定作成エラー:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'API設定の作成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}