'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PaymentServiceSelector from '@/components/PaymentServiceSelector';
import CredentialsForm from '@/components/CredentialsForm';
import PaymentInfoForm from '@/components/PaymentInfoForm';
import PaymentLinkResult from '@/components/PaymentLinkResult';
import { usePaymentStore, useCurrentStep } from '@/store/payment-store';
import { ChevronRight, CreditCard, Key, FileText, ExternalLink } from 'lucide-react';

export default function HomePage() {
  const currentStep = useCurrentStep();
  const { selectedService, credentials, paymentRequest, generatedLink, reset } = usePaymentStore();

  // ステップインジケーター
  const steps = [
    { id: 1, name: 'サービス選択', icon: CreditCard, description: '決済サービスを選択' },
    { id: 2, name: 'API設定', icon: Key, description: 'API認証情報を入力' },
    { id: 3, name: '決済情報', icon: FileText, description: '金額・商品情報を入力' },
    { id: 4, name: 'リンク生成', icon: ExternalLink, description: '決済リンクを生成' },
  ];

  const handleReset = () => {
    reset();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          <span className="text-gradient">ユニバーサル</span>決済リンクジェネレーター
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Stripe、PayPal、Square、PayPay、LINE Pay、fincode - 
          複数の決済サービスに対応した決済リンクを簡単に生成
        </p>
        <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            セキュア
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            高速
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            無料
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${currentStep >= step.id 
                      ? 'bg-primary border-primary text-white' 
                      : currentStep === step.id - 1
                        ? 'border-primary text-primary'
                        : 'border-gray-300 text-gray-400'
                    }
                  `}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-primary' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className={`w-5 h-5 mx-4 ${
                    currentStep > step.id ? 'text-primary' : 'text-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      {currentStep > 1 && (
        <div className="mb-6 flex justify-end">
          <Button 
            onClick={handleReset} 
            variant="outline" 
            className="text-sm"
          >
            最初からやり直す
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-8">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-primary" />
                決済サービスを選択
              </CardTitle>
              <CardDescription>
                利用したい決済サービスを選択してください。各サービスの特徴と手数料を比較できます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentServiceSelector />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Credentials */}
        {currentStep === 2 && selectedService && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-6 h-6 mr-2 text-primary" />
                API認証情報を入力
              </CardTitle>
              <CardDescription>
                {selectedService === 'stripe' && 'Stripe Dashboard から API キーを取得して入力してください。'}
                {selectedService === 'paypal' && 'PayPal Developer から Client ID と Secret を取得して入力してください。'}
                {selectedService === 'square' && 'Square Developer Dashboard から認証情報を取得して入力してください。'}
                すべての認証情報は暗号化されて安全に処理されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CredentialsForm />
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment Information */}
        {currentStep === 3 && credentials && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-6 h-6 mr-2 text-primary" />
                決済情報を入力
              </CardTitle>
              <CardDescription>
                金額、商品名、その他の決済情報を入力してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentInfoForm />
            </CardContent>
          </Card>
        )}

        {/* Step 4: Generated Link */}
        {currentStep >= 4 && paymentRequest && (
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ExternalLink className="w-6 h-6 mr-2 text-primary" />
                決済リンク生成結果
              </CardTitle>
              <CardDescription>
                生成された決済リンクとQRコードです。お客様と共有してご利用ください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentLinkResult />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Features Section */}
      {currentStep === 1 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            主な機能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">セキュア</h3>
                <p className="text-gray-600 text-sm">
                  AES-256暗号化により、API認証情報を安全に保護します。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">高速生成</h3>
                <p className="text-gray-600 text-sm">
                  数秒で決済リンクとQRコードを同時生成できます。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">マルチサービス</h3>
                <p className="text-gray-600 text-sm">
                  6つの主要決済サービスに対応し、一元管理が可能です。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}