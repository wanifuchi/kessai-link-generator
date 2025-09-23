// 環境変数の検証とエラーハンドリング

interface EnvConfig {
  // データベース
  DATABASE_URL: string;

  // セキュリティ
  ENCRYPTION_SECRET: string;
  SESSION_SECRET: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;

  // Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;

  // PayPal (将来実装)
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_SECRET?: string;

  // アプリケーション設定
  NODE_ENV: 'development' | 'production' | 'test';
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: Partial<EnvConfig>;
}

// 必須環境変数
const REQUIRED_VARS = [
  'DATABASE_URL',
  'ENCRYPTION_SECRET',
  'SESSION_SECRET',
  'NEXTAUTH_SECRET',
] as const;

// 本番環境で必須の変数
const PRODUCTION_REQUIRED_VARS = [
  'NEXTAUTH_URL',
] as const;

// 環境変数の検証ルール
const VALIDATION_RULES = {
  DATABASE_URL: (value: string) => {
    if (!value.startsWith('postgresql://')) {
      return 'DATABASE_URL must be a valid PostgreSQL connection string';
    }
    return null;
  },

  ENCRYPTION_SECRET: (value: string) => {
    if (value.length < 32) {
      return 'ENCRYPTION_SECRET must be at least 32 characters long';
    }
    return null;
  },

  SESSION_SECRET: (value: string) => {
    if (value.length < 32) {
      return 'SESSION_SECRET must be at least 32 characters long';
    }
    return null;
  },

  NEXTAUTH_SECRET: (value: string) => {
    if (value.length < 32) {
      return 'NEXTAUTH_SECRET must be at least 32 characters long';
    }
    return null;
  },

  NEXTAUTH_URL: (value: string) => {
    if (process.env.NODE_ENV === 'production' && !value.startsWith('https://')) {
      return 'NEXTAUTH_URL must use HTTPS in production';
    }
    try {
      new URL(value);
      return null;
    } catch {
      return 'NEXTAUTH_URL must be a valid URL';
    }
  },

  STRIPE_SECRET_KEY: (value: string) => {
    if (!value.startsWith('sk_test_') && !value.startsWith('sk_live_')) {
      return 'STRIPE_SECRET_KEY must be a valid Stripe secret key';
    }
    return null;
  },

  STRIPE_WEBHOOK_SECRET: (value: string) => {
    if (!value.startsWith('whsec_')) {
      return 'STRIPE_WEBHOOK_SECRET must be a valid Stripe webhook secret';
    }
    return null;
  },

  PAYPAL_CLIENT_ID: (value: string) => {
    if (value.length < 20) {
      return 'PAYPAL_CLIENT_ID appears to be invalid';
    }
    // Test用とLive用のClient IDの形式チェック
    if (!value.match(/^[A-Za-z0-9_-]+$/)) {
      return 'PAYPAL_CLIENT_ID has invalid format';
    }
    return null;
  },

  PAYPAL_CLIENT_SECRET: (value: string) => {
    if (value.length < 20) {
      return 'PAYPAL_CLIENT_SECRET appears to be invalid';
    }
    // Client Secretの形式チェック
    if (!value.match(/^[A-Za-z0-9_-]+$/)) {
      return 'PAYPAL_CLIENT_SECRET has invalid format';
    }
    return null;
  },

  PAYPAL_WEBHOOK_SECRET: (value: string) => {
    if (value.length < 10) {
      return 'PAYPAL_WEBHOOK_SECRET appears to be too short';
    }
    return null;
  },

  NODE_ENV: (value: string) => {
    if (!['development', 'production', 'test'].includes(value)) {
      return 'NODE_ENV must be development, production, or test';
    }
    return null;
  },
} as const;

// 環境変数を読み込んで検証
export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config: Partial<EnvConfig> = {};

  // NODE_ENVを最初に設定
  const nodeEnv = process.env.NODE_ENV || 'development';
  config.NODE_ENV = nodeEnv as EnvConfig['NODE_ENV'];

  // 必須変数のチェック
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    // 検証ルールの適用
    if (varName in VALIDATION_RULES) {
      const rule = VALIDATION_RULES[varName as keyof typeof VALIDATION_RULES];
      const validationError = rule(value);
      if (validationError) {
        errors.push(`${varName}: ${validationError}`);
        continue;
      }
    }

    (config as any)[varName] = value;
  }

  // 本番環境での追加チェック
  if (nodeEnv === 'production') {
    for (const varName of PRODUCTION_REQUIRED_VARS) {
      const value = process.env[varName];
      if (!value) {
        errors.push(`Missing required production environment variable: ${varName}`);
        continue;
      }

      if (varName in VALIDATION_RULES) {
        const rule = VALIDATION_RULES[varName as keyof typeof VALIDATION_RULES];
        const validationError = rule(value);
        if (validationError) {
          errors.push(`${varName}: ${validationError}`);
          continue;
        }
      }

      (config as any)[varName] = value;
    }
  }

  // オプショナル変数のチェック
  const optionalVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_SECRET',
  ] as const;

  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      if (varName in VALIDATION_RULES) {
        const rule = VALIDATION_RULES[varName as keyof typeof VALIDATION_RULES];
        const validationError = rule(value);
        if (validationError) {
          warnings.push(`${varName}: ${validationError}`);
          continue;
        }
      }
      (config as any)[varName] = value;
    }
  }

  // 決済サービスの設定チェック
  const hasStripe = config.STRIPE_SECRET_KEY && config.STRIPE_WEBHOOK_SECRET;
  const hasPayPal = config.PAYPAL_CLIENT_ID && config.PAYPAL_CLIENT_SECRET;

  if (!hasStripe && !hasPayPal) {
    warnings.push('No payment service configured. Please configure at least one payment provider.');
  }

  if (config.STRIPE_SECRET_KEY && !config.STRIPE_WEBHOOK_SECRET) {
    warnings.push('STRIPE_SECRET_KEY is configured but STRIPE_WEBHOOK_SECRET is missing. Webhooks will not work.');
  }

  // 開発環境での警告
  if (nodeEnv === 'development') {
    if (config.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
      warnings.push('Using live Stripe keys in development environment');
    }
  }

  // 本番環境での警告
  if (nodeEnv === 'production') {
    if (config.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push('Using test Stripe keys in production environment');
    }

    if (config.ENCRYPTION_SECRET === 'dev-secure-32-character-key-12345') {
      errors.push('Using default ENCRYPTION_SECRET in production is not secure');
    }

    if (config.SESSION_SECRET === 'dev-session-secret-key-123456789') {
      errors.push('Using default SESSION_SECRET in production is not secure');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config,
  };
}

// アプリケーション起動時の環境変数チェック
export function checkEnvironmentOnStartup(): EnvConfig {
  const result = validateEnvironmentVariables();

  // エラーがある場合は起動を停止
  if (!result.isValid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    } else {
      console.error('\n⚠️  Development mode: continuing with invalid configuration');
    }
  }

  // 警告がある場合は表示
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  // 正常な場合は成功メッセージ
  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }

  return result.config as EnvConfig;
}

// 特定のサービス用の設定チェック
export function checkServiceConfiguration(service: 'stripe' | 'paypal'): boolean {
  const result = validateEnvironmentVariables();

  switch (service) {
    case 'stripe':
      return !!(result.config.STRIPE_SECRET_KEY && result.config.STRIPE_WEBHOOK_SECRET);
    case 'paypal':
      return !!(result.config.PAYPAL_CLIENT_ID && result.config.PAYPAL_CLIENT_SECRET);
    default:
      return false;
  }
}

// 環境変数の状態をダッシュボード表示用に取得
export function getEnvironmentStatus() {
  const result = validateEnvironmentVariables();

  return {
    overall: result.isValid ? 'healthy' : 'error',
    services: {
      database: !!result.config.DATABASE_URL,
      stripe: checkServiceConfiguration('stripe'),
      paypal: checkServiceConfiguration('paypal'),
    },
    security: {
      encryptionConfigured: !!result.config.ENCRYPTION_SECRET,
      sessionConfigured: !!result.config.SESSION_SECRET,
      authConfigured: !!(result.config.NEXTAUTH_SECRET && result.config.NEXTAUTH_URL),
    },
    environment: result.config.NODE_ENV || 'unknown',
    warnings: result.warnings,
    errors: result.errors,
  };
}