import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getEnvironmentStatus, checkServiceConfiguration } from '@/lib/env-validation';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 基本的な健康状態チェック
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkStripeConnection(),
      checkPayPalConnection(),
      checkEnvironmentVariables(),
      checkSystemResources(),
    ]);

    const [databaseCheck, stripeCheck, paypalCheck, envCheck, systemCheck] = checks;

    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: getCheckResult(databaseCheck),
        stripe: getCheckResult(stripeCheck),
        paypal: getCheckResult(paypalCheck),
        environment: getCheckResult(envCheck),
        system: getCheckResult(systemCheck),
      },
      details: {
        database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : { error: databaseCheck.reason },
        stripe: stripeCheck.status === 'fulfilled' ? stripeCheck.value : { error: stripeCheck.reason },
        paypal: paypalCheck.status === 'fulfilled' ? paypalCheck.value : { error: paypalCheck.reason },
        environment: envCheck.status === 'fulfilled' ? envCheck.value : { error: envCheck.reason },
        system: systemCheck.status === 'fulfilled' ? systemCheck.value : { error: systemCheck.reason },
      },
    };

    // 全体的な健康状態を判定
    const unhealthyServices = Object.values(health.services).filter(service => service === 'unhealthy').length;
    const degradedServices = Object.values(health.services).filter(service => service === 'degraded').length;

    if (unhealthyServices > 0) {
      health.status = 'unhealthy';
    } else if (degradedServices > 0) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 207 : 503;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'unknown',
        stripe: 'unknown',
        paypal: 'unknown',
        environment: 'unknown',
        system: 'unknown',
      },
    }, { status: 503 });
  }
}

// データベース接続チェック
async function checkDatabase() {
  const startTime = Date.now();

  try {
    // 簡単なクエリでデータベース接続をテスト
    await prisma.$queryRaw`SELECT 1`;

    // 統計情報の取得（パフォーマンステスト）
    const [paymentLinksCount, transactionsCount] = await Promise.all([
      prisma.paymentLink.count(),
      prisma.transaction.count(),
    ]);

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      details: {
        connection: 'active',
        paymentLinksCount,
        transactionsCount,
        performanceStatus: responseTime < 1000 ? 'good' : responseTime < 3000 ? 'acceptable' : 'slow',
      },
    };

  } catch (error) {
    console.error('Database health check failed:', error);

    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database connection failed',
      details: {
        connection: 'failed',
      },
    };
  }
}

// PayPal接続チェック
async function checkPayPalConnection() {
  const startTime = Date.now();

  try {
    // PayPal設定の確認
    const hasPayPalConfig = checkServiceConfiguration('paypal');

    if (!hasPayPalConfig) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          configured: false,
          message: 'PayPal configuration not found',
        },
      };
    }

    // PayPal設定の詳細確認
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET;

    const isSandbox = process.env.NODE_ENV !== 'production';

    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        configured: true,
        hasClientId: !!paypalClientId,
        hasClientSecret: !!paypalClientSecret,
        hasWebhookSecret: !!webhookSecret,
        environment: isSandbox ? 'sandbox' : 'production',
      },
    };

  } catch (error) {
    console.error('PayPal health check failed:', error);

    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'PayPal check failed',
    };
  }
}

// Stripe接続チェック
async function checkStripeConnection() {
  const startTime = Date.now();

  try {
    // Stripe設定の確認
    const hasStripeConfig = checkServiceConfiguration('stripe');

    if (!hasStripeConfig) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          configured: false,
          message: 'Stripe configuration not found',
        },
      };
    }

    // Stripe API接続テスト（オプション）
    // 実際のAPI呼び出しは避けて、設定のみチェック
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const isTestMode = stripeSecretKey?.startsWith('sk_test_');
    const isLiveMode = stripeSecretKey?.startsWith('sk_live_');

    return {
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        configured: true,
        hasSecretKey: !!stripeSecretKey,
        hasWebhookSecret: !!webhookSecret,
        environment: isTestMode ? 'test' : isLiveMode ? 'live' : 'unknown',
      },
    };

  } catch (error) {
    console.error('Stripe health check failed:', error);

    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Stripe check failed',
    };
  }
}

// 環境変数チェック
async function checkEnvironmentVariables() {
  const startTime = Date.now();

  try {
    const envStatus = getEnvironmentStatus();

    const status = envStatus.overall === 'healthy' ? 'healthy' :
                  envStatus.warnings.length > 0 ? 'degraded' : 'unhealthy';

    return {
      status,
      responseTime: Date.now() - startTime,
      details: {
        ...envStatus,
        configurationScore: calculateConfigurationScore(envStatus),
      },
    };

  } catch (error) {
    console.error('Environment variables check failed:', error);

    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Environment check failed',
    };
  }
}

// システムリソースチェック
async function checkSystemResources() {
  const startTime = Date.now();

  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // メモリ使用量の評価（MB単位）
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const memoryUsagePercentage = (heapUsedMB / heapTotalMB) * 100;

    // パフォーマンススコアの計算
    let performanceScore = 100;
    if (memoryUsagePercentage > 80) performanceScore -= 30;
    else if (memoryUsagePercentage > 60) performanceScore -= 15;

    const status = performanceScore >= 80 ? 'healthy' :
                  performanceScore >= 60 ? 'degraded' : 'unhealthy';

    return {
      status,
      responseTime: Date.now() - startTime,
      details: {
        memory: {
          heapUsedMB: Math.round(heapUsedMB * 100) / 100,
          heapTotalMB: Math.round(heapTotalMB * 100) / 100,
          usagePercentage: Math.round(memoryUsagePercentage * 100) / 100,
          external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
        },
        process: {
          uptime: process.uptime(),
          pid: process.pid,
          nodeVersion: process.version,
        },
        performanceScore,
      },
    };

  } catch (error) {
    console.error('System resources check failed:', error);

    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'System check failed',
    };
  }
}

// チェック結果のステータス抽出
function getCheckResult(check: PromiseSettledResult<any>): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
  if (check.status === 'rejected') {
    return 'unhealthy';
  }
  return check.value?.status || 'unknown';
}

// 設定スコアの計算
function calculateConfigurationScore(envStatus: any): number {
  let score = 0;
  const maxScore = 100;

  // 基本設定 (40点)
  if (envStatus.services.database) score += 20;
  if (envStatus.security.encryptionConfigured) score += 10;
  if (envStatus.security.sessionConfigured) score += 10;

  // 認証設定 (20点)
  if (envStatus.security.authConfigured) score += 20;

  // 決済サービス設定 (30点)
  if (envStatus.services.stripe) score += 20;
  if (envStatus.services.paypal) score += 10;

  // 警告・エラーによる減点 (10点)
  score -= envStatus.warnings.length * 2;
  score -= envStatus.errors.length * 5;

  return Math.max(0, Math.min(maxScore, score));
}

// POST, PUT, DELETE メソッドは許可しない
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}