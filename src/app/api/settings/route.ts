import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// API設定のバリデーションスキーマ
const apiSettingsSchema = z.object({
  service: z.enum(['stripe', 'paypal', 'square', 'paypay', 'fincode']),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  publishableKey: z.string().optional(),
  secretKey: z.string().min(1, '秘密キーは必須です'),
  webhookUrl: z.string().url().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET - API設定一覧取得
export async function GET(request: NextRequest) {
  try {
    // DATABASE_URLが未設定の場合は空の設定リストを返す
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URLが設定されていません - 空のリストを返します');
      return NextResponse.json({
        success: true,
        data: [],
        warning: 'データベース接続が設定されていません'
      });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const environment = searchParams.get('environment');

    const where: any = {};
    if (service) where.service = service.toLowerCase();
    if (environment) where.environment = environment.toLowerCase();

    const settings = await prisma.apiSettings.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        service: true,
        environment: true,
        publishableKey: true,
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
    console.error('DATABASE_URL status:', process.env.DATABASE_URL ? 'SET' : 'NOT_SET');

    // データベース接続エラーの場合は一時的に空のリストを返す
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json({
        success: true,
        data: [],
        warning: 'データベース接続エラー - 空のリストを返します',
        details: error.message
      });
    }

    return NextResponse.json({
      success: false,
      error: 'API設定の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - 新しいAPI設定作成
export async function POST(request: NextRequest) {
  let body; // catchブロックでもアクセス可能にする
  try {
    // DATABASE_URLが未設定の場合はエラーを返す
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URLが設定されていません - API設定作成を拒否');
      return NextResponse.json({
        success: false,
        error: 'データベース接続が設定されていません',
        details: 'DATABASE_URL環境変数を設定してください'
      }, { status: 503 });
    }

    body = await request.json();
    console.log('API設定作成リクエスト:', body);

    const validatedData = apiSettingsSchema.parse(body);

    // TODO: 実際の暗号化実装（現在は平文で保存）
    // const encryptedSecretKey = await encrypt(validatedData.secretKey);
    // const encryptedPublishableKey = validatedData.publishableKey ? await encrypt(validatedData.publishableKey) : null;

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
        publishableKey: validatedData.publishableKey, // TODO: 暗号化
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
      data: apiSetting
    }, { status: 201 });

  } catch (error) {
    console.error('API設定作成エラー:', error);

    if (error instanceof z.ZodError) {
      console.error('Zodバリデーションエラー詳細:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json({
        success: false,
        error: 'リクエストデータが無効です',
        details: error.errors,
        debugInfo: {
          receivedBody: body,
          zodErrors: error.errors
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'API設定の作成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}