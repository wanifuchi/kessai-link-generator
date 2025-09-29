'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert as AlertUI, AlertDescription } from '@/components/ui/alert';
import { useSelectedService, usePaymentActions } from '@/store/payment-store';
import { maskApiKey } from '@/lib/utils';
import { Eye, EyeOff, Shield, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

// Stripe credentials schema
const stripeCredentialsSchema = z.object({
  publishableKey: z.string().min(1, 'Publishable Keyは必須です').refine(
    (key) => key.startsWith('pk_test_') || key.startsWith('pk_live_'),
    'Publishable Keyの形式が正しくありません'
  ),
  secretKey: z.string().min(1, 'Secret Keyは必須です').refine(
    (key) => key.startsWith('sk_test_') || key.startsWith('sk_live_'),
    'Secret Keyの形式が正しくありません'
  ),
  environment: z.enum(['test', 'live'], {
    required_error: '環境を選択してください',
  }),
  webhookSecret: z.string().optional(),
});

// PayPal credentials schema
const paypalCredentialsSchema = z.object({
  clientId: z.string().min(1, 'Client IDは必須です'),
  clientSecret: z.string().min(1, 'Client Secretは必須です'),
  environment: z.enum(['sandbox', 'production'], {
    required_error: '環境を選択してください',
  }),
});

// Square credentials schema
const squareCredentialsSchema = z.object({
  applicationId: z.string().min(1, 'Application IDは必須です'),
  accessToken: z.string().min(1, 'Access Tokenは必須です'),
  environment: z.enum(['sandbox', 'production'], {
    required_error: '環境を選択してください',
  }),
});

type CredentialsFormData = z.infer<typeof stripeCredentialsSchema> | 
                         z.infer<typeof paypalCredentialsSchema> | 
                         z.infer<typeof squareCredentialsSchema>;

export default function CredentialsForm() {
  const selectedService = useSelectedService();
  const { setCredentials } = usePaymentActions();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  // Get schema based on selected service
  const getSchema = () => {
    switch (selectedService) {
      case 'stripe':
        return stripeCredentialsSchema;
      case 'paypal':
        return paypalCredentialsSchema;
      case 'square':
        return squareCredentialsSchema;
      default:
        return stripeCredentialsSchema;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CredentialsFormData>({
    resolver: zodResolver(getSchema() as any) as any,
    mode: 'onChange',
  });

  if (!selectedService) return null;

  const toggleSecret = (fieldName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const validateCredentials = async (data: CredentialsFormData) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/validate-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: selectedService,
          credentials: data,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.isValid) {
        setValidationResult({
          isValid: true,
          message: '認証情報が正常に検証されました',
        });
        return true;
      } else {
        setValidationResult({
          isValid: false,
          message: result.data?.error || '認証情報の検証に失敗しました',
        });
        return false;
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: 'サーバーとの通信に失敗しました',
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const onSubmit = async (data: CredentialsFormData) => {
    const isValid = await validateCredentials(data);
    if (isValid) {
      setCredentials(data);
    }
  };

  const getDocumentationLink = () => {
    const links = {
      stripe: 'https://stripe.com/docs/keys',
      paypal: 'https://developer.paypal.com/api/rest/',
      square: 'https://developer.squareup.com/docs/build-basics/access-tokens',
      paypay: 'https://developer.paypay.ne.jp/',
      fincode: 'https://docs.fincode.jp/api',
    };
    return links[selectedService as keyof typeof links] || '#';
  };

  const getServiceInstructions = () => {
    const instructions = {
      stripe: {
        title: 'Stripe API キーの取得方法',
        steps: [
          'Stripe Dashboard にログイン',
          '「開発者」→「APIキー」を選択',
          'テスト環境または本番環境のキーを取得',
          'Publishable key (pk_) と Secret key (sk_) をコピー'
        ]
      },
      paypal: {
        title: 'PayPal API認証情報の取得方法',
        steps: [
          'PayPal Developer にログイン',
          '「My Apps & Credentials」を選択',
          'Sandboxまたは本番環境のアプリを作成',
          'Client ID と Client Secret をコピー'
        ]
      },
      square: {
        title: 'Square API認証情報の取得方法',
        steps: [
          'Square Developer Dashboard にログイン',
          'アプリケーションを作成または選択',
          'Sandbox または本番環境の認証情報を取得',
          'Application ID と Access Token をコピー'
        ]
      },
      paypay: {
        title: 'PayPay API認証情報の取得方法',
        steps: [
          'PayPay for Developers にアクセス',
          '法人アカウントで審査申請',
          '承認後、API認証情報を取得',
          'Merchant ID、API Key、API Secret をコピー'
        ]
      },
      fincode: {
        title: 'fincode API認証情報の取得方法',
        steps: [
          'GMO fincode にアクセス',
          'アカウント作成・審査申請',
          'テスト環境または本番環境を選択',
          'Shop ID と API Key をコピー'
        ]
      },
    };
    return instructions[selectedService as keyof typeof instructions];
  };

  const instructions = getServiceInstructions();

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">
                {instructions?.title}
              </h4>
              <ol className="text-sm text-blue-700 space-y-1">
                {instructions?.steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 font-medium">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3">
                <a
                  href={getDocumentationLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  公式ドキュメントを見る
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Environment Selection */}
        <div className="space-y-2">
          <Label htmlFor="environment">環境 *</Label>
          <Select
            onValueChange={(value) => setValue('environment' as any, value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="環境を選択" />
            </SelectTrigger>
            <SelectContent>
              {selectedService === 'stripe' && (
                <>
                  <SelectItem value="test">テスト環境 (推奨)</SelectItem>
                  <SelectItem value="live">本番環境</SelectItem>
                </>
              )}
              {selectedService === 'paypal' && (
                <>
                  <SelectItem value="sandbox">Sandbox (推奨)</SelectItem>
                  <SelectItem value="production">本番環境</SelectItem>
                </>
              )}
              {selectedService === 'square' && (
                <>
                  <SelectItem value="sandbox">Sandbox (推奨)</SelectItem>
                  <SelectItem value="production">本番環境</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {(errors as any).environment && (
            <p className="text-sm text-red-600">{(errors as any).environment.message}</p>
          )}
        </div>

        {/* Service-specific fields */}
        {selectedService === 'stripe' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="publishableKey">Publishable Key *</Label>
              <Input
                id="publishableKey"
                {...register('publishableKey' as any)}
                placeholder="pk_test_..."
                className={(errors as any).publishableKey ? 'border-red-500' : ''}
              />
              {(errors as any).publishableKey && (
                <p className="text-sm text-red-600">{(errors as any).publishableKey.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key *</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecrets.secretKey ? 'text' : 'password'}
                  {...register('secretKey' as any)}
                  placeholder="sk_test_..."
                  className={`pr-10 ${(errors as any).secretKey ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => toggleSecret('secretKey')}
                >
                  {showSecrets.secretKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {(errors as any).secretKey && (
                <p className="text-sm text-red-600">{(errors as any).secretKey.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Webhook Secret (オプション)</Label>
              <div className="relative">
                <Input
                  id="webhookSecret"
                  type={showSecrets.webhookSecret ? 'text' : 'password'}
                  {...register('webhookSecret' as any)}
                  placeholder="whsec_..."
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => toggleSecret('webhookSecret')}
                >
                  {showSecrets.webhookSecret ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {selectedService === 'paypal' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                {...register('clientId' as any)}
                placeholder="Client ID"
                className={(errors as any).clientId ? 'border-red-500' : ''}
              />
              {(errors as any).clientId && (
                <p className="text-sm text-red-600">{(errors as any).clientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret *</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showSecrets.clientSecret ? 'text' : 'password'}
                  {...register('clientSecret' as any)}
                  placeholder="Client Secret"
                  className={`pr-10 ${(errors as any).clientSecret ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => toggleSecret('clientSecret')}
                >
                  {showSecrets.clientSecret ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {(errors as any).clientSecret && (
                <p className="text-sm text-red-600">{(errors as any).clientSecret.message}</p>
              )}
            </div>
          </>
        )}

        {selectedService === 'square' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="applicationId">Application ID *</Label>
              <Input
                id="applicationId"
                {...register('applicationId' as any)}
                placeholder="Application ID"
                className={(errors as any).applicationId ? 'border-red-500' : ''}
              />
              {(errors as any).applicationId && (
                <p className="text-sm text-red-600">{(errors as any).applicationId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token *</Label>
              <div className="relative">
                <Input
                  id="accessToken"
                  type={showSecrets.accessToken ? 'text' : 'password'}
                  {...register('accessToken' as any)}
                  placeholder="Access Token"
                  className={`pr-10 ${(errors as any).accessToken ? 'border-red-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => toggleSecret('accessToken')}
                >
                  {showSecrets.accessToken ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {(errors as any).accessToken && (
                <p className="text-sm text-red-600">{(errors as any).accessToken.message}</p>
              )}
            </div>
          </>
        )}

        {/* Validation Result */}
        {validationResult && (
          <AlertUI className={validationResult.isValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            <div className="flex">
              {validationResult.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={`ml-2 ${validationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                {validationResult.message}
              </AlertDescription>
            </div>
          </AlertUI>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Button
            type="submit"
            disabled={isSubmitting || isValidating}
            className="min-w-[120px]"
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                検証中...
              </>
            ) : (
              '認証情報を設定'
            )}
          </Button>
        </div>
      </form>

      {/* Security Notice */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">セキュリティについて</h4>
              <p className="text-sm text-gray-600">
                入力された認証情報は AES-256 暗号化され、セッション中のみメモリに保持されます。
                サーバーに永続的に保存されることはありません。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

