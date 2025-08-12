'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePaymentActions } from '@/store/payment-store';
import { getAllServices, SERVICE_USE_CASES } from '@/lib/payment-services';
import { PaymentService, PaymentServiceInfo } from '@/types/payment';
import { Check, Info, Globe, Zap, Shield } from 'lucide-react';

export default function PaymentServiceSelector() {
  const [selectedServiceId, setSelectedServiceId] = useState<PaymentService | null>(null);
  const [showDetails, setShowDetails] = useState<PaymentService | null>(null);
  const { setSelectedService } = usePaymentActions();

  const services = getAllServices();

  const handleServiceSelect = (serviceId: PaymentService) => {
    setSelectedServiceId(serviceId);
  };

  const handleConfirm = () => {
    if (selectedServiceId) {
      setSelectedService(selectedServiceId);
    }
  };

  const toggleDetails = (serviceId: PaymentService) => {
    setShowDetails(showDetails === serviceId ? null : serviceId);
  };

  const getServiceLogo = (serviceName: string) => {
    // 実際のプロダクションではサービスロゴを使用
    const logoMap: Record<string, string> = {
      stripe: '🔷',
      paypal: '💙',
      square: '⬜',
      paypay: '📱',
      linepay: '🟢',
      fincode: '🏦',
    };
    return logoMap[serviceName] || '💳';
  };

  return (
    <div className="space-y-6">
      {/* Service Grid */}
      <div className="service-grid">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;
          const useCases = SERVICE_USE_CASES[service.id];

          return (
            <Card
              key={service.id}
              className={`payment-service-card cursor-pointer transition-all duration-200 ${
                isSelected ? 'selected' : ''
              }`}
              onClick={() => handleServiceSelect(service.id)}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getServiceLogo(service.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {service.displayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        手数料: <span className="font-medium">{service.feeRate}</span>
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {service.description}
                </p>

                {/* Key Features */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-2 text-blue-500" />
                    <span>
                      {service.supportedCountries.length > 3 
                        ? `${service.supportedCountries.slice(0, 3).join(', ')}など`
                        : service.supportedCountries.join(', ')
                      } で利用可能
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    <span>
                      {service.supportedCurrencies.length > 3
                        ? `${service.supportedCurrencies.slice(0, 3).join(', ')}など`
                        : service.supportedCurrencies.join(', ')
                      } 対応
                    </span>
                  </div>
                </div>

                {/* Best For Badges */}
                {useCases && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {useCases.bestFor.slice(0, 2).map((useCase, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toggle Details Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDetails(service.id);
                  }}
                  className="w-full justify-center text-xs"
                >
                  <Info className="w-3 h-3 mr-1" />
                  {showDetails === service.id ? '詳細を閉じる' : '詳細を見る'}
                </Button>

                {/* Detailed Information */}
                {showDetails === service.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {/* Pros */}
                    <div>
                      <h4 className="text-xs font-medium text-green-700 mb-1">
                        ✅ メリット
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {useCases.pros.map((pro, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons */}
                    <div>
                      <h4 className="text-xs font-medium text-orange-700 mb-1">
                        ⚠️ 注意点
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {useCases.cons.map((con, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Supported Features */}
                    <div>
                      <h4 className="text-xs font-medium text-blue-700 mb-1">
                        🔧 対応機能
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {service.features.slice(0, 4).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {service.features.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.features.length - 4}その他
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedServiceId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    {services.find(s => s.id === selectedServiceId)?.displayName} を選択中
                  </p>
                  <p className="text-sm text-blue-700">
                    次のステップでAPI認証情報を入力してください
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleConfirm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                次へ進む
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Info className="w-4 h-4 mr-2 text-gray-600" />
            サービス選択のヒント
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium mb-1">🌍 グローバル展開なら:</p>
              <p>Stripe, PayPalがおすすめ</p>
            </div>
            <div>
              <p className="font-medium mb-1">🇯🇵 日本国内メインなら:</p>
              <p>PayPay, LINE Pay, fincodeがおすすめ</p>
            </div>
            <div>
              <p className="font-medium mb-1">💼 小規模事業なら:</p>
              <p>Square, PayPalがシンプルで使いやすい</p>
            </div>
            <div>
              <p className="font-medium mb-1">🔧 高機能・カスタマイズ重視なら:</p>
              <p>Stripe, fincodeが豊富な機能を提供</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Badge コンポーネントが不足している場合の簡易実装
const Badge = ({ children, variant = 'default', className = '', ...props }: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}) => {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};