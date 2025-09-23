// フォームバリデーションのユーティリティ

interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 共通バリデーションルール
export const validationRules = {
  required: <T>(message: string = 'この項目は必須です'): ValidationRule<T> => ({
    validate: (value) => value !== null && value !== undefined && value !== '',
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => typeof value === 'string' && value.length >= min,
    message: message || `${min}文字以上で入力してください`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => typeof value === 'string' && value.length <= max,
    message: message || `${max}文字以下で入力してください`,
  }),

  email: (message: string = '正しいメールアドレスを入力してください'): ValidationRule<string> => ({
    validate: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value);
    },
    message,
  }),

  url: (message: string = '正しいURLを入力してください'): ValidationRule<string> => ({
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  numeric: (message: string = '数値を入力してください'): ValidationRule<string | number> => ({
    validate: (value) => !isNaN(Number(value)),
    message,
  }),

  positive: (message: string = '正の数値を入力してください'): ValidationRule<string | number> => ({
    validate: (value) => Number(value) > 0,
    message,
  }),

  minValue: (min: number, message?: string): ValidationRule<string | number> => ({
    validate: (value) => Number(value) >= min,
    message: message || `${min}以上の値を入力してください`,
  }),

  maxValue: (max: number, message?: string): ValidationRule<string | number> => ({
    validate: (value) => Number(value) <= max,
    message: message || `${max}以下の値を入力してください`,
  }),

  currency: (message: string = '正しい金額を入力してください'): ValidationRule<string | number> => ({
    validate: (value) => {
      const num = Number(value);
      return !isNaN(num) && num >= 0 && Number.isFinite(num);
    },
    message,
  }),

  apiKey: (message: string = '正しいAPIキーを入力してください'): ValidationRule<string> => ({
    validate: (value) => {
      return typeof value === 'string' && value.length > 10 && !/\s/.test(value);
    },
    message,
  }),

  // Stripe APIキー専用バリデーション
  stripeKey: (type: 'secret' | 'publishable', message?: string): ValidationRule<string> => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      if (type === 'secret') {
        return value.startsWith('sk_test_') || value.startsWith('sk_live_');
      }
      if (type === 'publishable') {
        return value.startsWith('pk_test_') || value.startsWith('pk_live_');
      }
      return false;
    },
    message: message || `正しいStripe ${type === 'secret' ? 'Secret' : 'Publishable'} キーを入力してください`,
  }),

  // PayPal クライアントID バリデーション
  paypalClientId: (message: string = '正しいPayPal Client IDを入力してください'): ValidationRule<string> => ({
    validate: (value) => {
      return typeof value === 'string' && value.length > 20 && /^[A-Za-z0-9_-]+$/.test(value);
    },
    message,
  }),

  // 日本語文字チェック
  containsJapanese: (message: string = '日本語を含めて入力してください'): ValidationRule<string> => ({
    validate: (value) => {
      const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
      return typeof value === 'string' && japaneseRegex.test(value);
    },
    message,
  }),
};

// 複数のバリデーションルールを適用
export function validateField<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// フォーム全体のバリデーション
export function validateForm<T extends Record<string, any>>(
  formData: T,
  fieldRules: Record<keyof T, ValidationRule<any>[]>
): Record<keyof T, ValidationResult> & { isFormValid: boolean } {
  const results = {} as Record<keyof T, ValidationResult>;
  let isFormValid = true;

  for (const [field, rules] of Object.entries(fieldRules)) {
    const value = formData[field as keyof T];
    const result = validateField(value, rules as ValidationRule<any>[]);
    results[field as keyof T] = result;

    if (!result.isValid) {
      isFormValid = false;
    }
  }

  return {
    ...results,
    isFormValid,
  };
}

// 決済リンク生成フォームの特定バリデーション
export const paymentFormValidation = {
  // Stripe認証情報
  stripeCredentials: {
    secretKey: [
      validationRules.required('Secret Keyは必須です'),
      validationRules.stripeKey('secret'),
    ],
    publishableKey: [
      validationRules.required('Publishable Keyは必須です'),
      validationRules.stripeKey('publishable'),
    ],
  },

  // PayPal認証情報
  paypalCredentials: {
    clientId: [
      validationRules.required('Client IDは必須です'),
      validationRules.paypalClientId(),
    ],
    clientSecret: [
      validationRules.required('Client Secretは必須です'),
      validationRules.minLength(20, '20文字以上で入力してください'),
    ],
  },

  // 決済情報
  paymentRequest: {
    productName: [
      validationRules.required('商品名は必須です'),
      validationRules.minLength(1, '商品名を入力してください'),
      validationRules.maxLength(100, '商品名は100文字以下で入力してください'),
    ],
    description: [
      validationRules.maxLength(500, '説明は500文字以下で入力してください'),
    ],
    amount: [
      validationRules.required('金額は必須です'),
      validationRules.numeric(),
      validationRules.positive(),
      validationRules.minValue(1, '1円以上で入力してください'),
      validationRules.maxValue(9999999, '999万円以下で入力してください'),
    ],
    currency: [
      validationRules.required('通貨は必須です'),
    ],
    customerEmail: [
      validationRules.email(),
    ],
    successUrl: [
      validationRules.url(),
    ],
    cancelUrl: [
      validationRules.url(),
    ],
  },
};

// リアルタイムバリデーション用のデバウンス
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// フィールドエラー表示用のヘルパー
export function getFieldError(result: ValidationResult): string | undefined {
  return result.errors.length > 0 ? result.errors[0] : undefined;
}

// フォーム送信前の最終バリデーション
export function validateBeforeSubmit<T extends Record<string, any>>(
  formData: T,
  fieldRules: Record<keyof T, ValidationRule<any>[]>
): { isValid: boolean; errors: Record<string, string> } {
  const validation = validateForm(formData, fieldRules);
  const errors: Record<string, string> = {};

  for (const [field, result] of Object.entries(validation)) {
    if (field !== 'isFormValid' && typeof result === 'object' && !result.isValid) {
      errors[field] = result.errors[0];
    }
  }

  return {
    isValid: validation.isFormValid,
    errors,
  };
}