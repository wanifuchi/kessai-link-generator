import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { z } from 'zod';
import prisma, { withSession } from '@/lib/prisma';
import { encryptData, decryptData } from '@/lib/encryption';

// Dynamic server usage for authentication
export const dynamic = 'force-dynamic';

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

// GET - API設定一覧取得（ユーザー固有）
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

    return await withSession(
      request,
      authOptions,
      async (req, session) => {
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
            environment: true,
            publishableKey: true,
            // 秘密キーは除外してセキュリティを確保
            webhookUrl: true,
            description: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
          }
        });

        // 公開キーのみ復号化（秘密キーは含まれていない）
        const decryptedSettings = settings.map(setting => ({
          ...setting,
          publishableKey: setting.publishableKey
            ? decryptData<string>(setting.publishableKey)
            : null
        }));

        // セッション情報はwithSessionから取得済み

        return NextResponse.json({
          success: true,
          data: decryptedSettings,
          user: {
            id: session?.user?.id,
            email: session?.user?.email
          }
        });
      }
    );

  } catch (error) {
    console.error('API設定取得エラー:', error);
    console.error('DATABASE_URL status:', process.env.DATABASE_URL ? 'SET' : 'NOT_SET');

    // データベース接続エラーの場合は一時的に空のリストを返す
    if (error instanceof Error && (
      error.message.includes('connect') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('Can\'t reach database server')
    )) {
      console.warn('データベース接続エラーが発生しました:', error.message);
      return NextResponse.json({
        success: true,
        data: [],
        warning: 'データベース接続エラー - 一時的に設定を読み込めません',
        details: error.message,
        recovery: 'しばらく待ってから再試行してください'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'API設定の取得に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - 新しいAPI設定作成（ユーザー固有）
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

    return await withSession(
      request,
      authOptions,
      async (req, session) => {
        body = await request.json();
        console.log('API設定作成リクエスト:', body);

        const validatedData = apiSettingsSchema.parse(body);

        // 暗号化実装
        const encryptedSecretKey = encryptData(validatedData.secretKey);
        const encryptedPublishableKey = validatedData.publishableKey
          ? encryptData(validatedData.publishableKey)
          : null;

        let existingSetting = null;
        let apiSetting = null;

        try {
          // 同じサービス・環境の組み合わせが既に存在するかチェック（userIdフィルタリングは自動適用される）
          existingSetting = await prisma.apiSettings.findFirst({
            where: {
              service: validatedData.service,
              environment: validatedData.environment,
            }
          });

          if (existingSetting) {
            return NextResponse.json({
              success: false,
              error: '同じサービス・環境の設定が既に存在します',
              details: `${validatedData.service} - ${validatedData.environment}`
            }, { status: 409 });
          }

          apiSetting = await prisma.apiSettings.create({
            data: {
              service: validatedData.service,
              environment: validatedData.environment,
              publishableKey: encryptedPublishableKey,
              secretKey: encryptedSecretKey,
              webhookUrl: validatedData.webhookUrl,
              description: validatedData.description,
              isActive: validatedData.isActive,
              // userIdは自動で設定される
            },
            select: {
              id: true,
              environment: true,
              publishableKey: true,
              // 秘密キーは返さない
              webhookUrl: true,
              description: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
              userId: true,
            }
          });
    } catch (dbError) {
      console.error('データベース操作エラー:', dbError);

      // データベース接続エラーの場合
      if (dbError instanceof Error && (
        dbError.message.includes('Environment variable not found: DATABASE_URL') ||
        dbError.message.includes('connect') ||
        dbError.message.includes('timeout') ||
        dbError.message.includes('ECONNREFUSED') ||
        dbError.message.includes('Can\'t reach database server')
      )) {
        console.warn('データベース接続エラーが発生しました:', dbError.message);

        // DATABASE_URL未設定の場合
        if (dbError.message.includes('Environment variable not found: DATABASE_URL')) {
          return NextResponse.json({
            success: false,
            error: 'データベース接続が設定されていません',
            details: 'DATABASE_URL環境変数を設定してください',
            recovery: '環境変数を設定後、サーバーを再起動してください',
            debugInfo: {
              errorMessage: dbError.message,
              validatedData: { ...validatedData, secretKey: '[MASKED]' }
            }
          }, { status: 503 });
        }

        // その他の接続エラー
        return NextResponse.json({
          success: false,
          error: 'データベース接続エラー',
          details: 'データベースに接続できません',
          recovery: 'しばらく待ってから再試行してください',
          debugInfo: {
            errorType: 'CONNECTION_ERROR',
            errorMessage: dbError.message,
            validatedData: { ...validatedData, secretKey: '[MASKED]' }
          }
        }, { status: 503 });
      }

      // その他のデータベースエラー
      throw dbError;
    }

        return NextResponse.json({
          success: true,
          data: apiSetting
        }, { status: 201 });
      }
    );

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