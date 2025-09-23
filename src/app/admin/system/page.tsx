'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  CreditCard,
  Shield,
  Server,
  Activity,
  Clock,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { CardLoading } from '@/components/loading';
import { error, success, info } from '@/hooks/use-toast';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  responseTime: number;
  version: string;
  environment: string;
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    stripe: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    environment: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    system: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  };
  details: {
    database: any;
    stripe: any;
    environment: any;
    system: any;
  };
}

export default function SystemDashboard() {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async (showNotification = false) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();

      setHealthData(data);
      setLastUpdated(new Date());

      if (showNotification) {
        if (data.status === 'healthy') {
          success('システム正常', 'すべてのサービスが正常に動作しています');
        } else if (data.status === 'degraded') {
          info('システム低下', '一部のサービスで問題が発生しています');
        } else {
          error('システム異常', 'サービスに重大な問題が発生しています');
        }
      }

    } catch (err) {
      console.error('Health check failed:', err);
      error('取得エラー', 'システム状態の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000); // 30秒ごとに更新

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />正常</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />低下</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />異常</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />不明</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}日 ${hours}時間 ${minutes}分`;
    } else if (hours > 0) {
      return `${hours}時間 ${minutes}分`;
    } else {
      return `${minutes}分`;
    }
  };

  if (isLoading && !healthData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">システム監視</h1>
          <p className="text-gray-600">システムの健康状態とパフォーマンスを監視</p>
        </div>
        <CardLoading text="システム状態を取得中..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">システム監視</h1>
          <p className="text-gray-600">システムの健康状態とパフォーマンスを監視</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {lastUpdated && `最終更新: ${lastUpdated.toLocaleTimeString('ja-JP')}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-1 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            自動更新: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={() => fetchHealthData(true)}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            更新
          </Button>
        </div>
      </div>

      {healthData && (
        <>
          {/* Overall Status */}
          <div className="mb-8">
            <Card className={`border-2 ${
              healthData.status === 'healthy' ? 'border-green-200 bg-green-50' :
              healthData.status === 'degraded' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthData.status)}
                    <div>
                      <CardTitle className="text-xl">
                        システム全体の状態: {getStatusBadge(healthData.status)}
                      </CardTitle>
                      <CardDescription>
                        レスポンス時間: {healthData.responseTime}ms |
                        稼働時間: {formatUptime(healthData.uptime)} |
                        環境: {healthData.environment} |
                        バージョン: {healthData.version}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Service Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Database */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-sm">データベース</CardTitle>
                  </div>
                  {getStatusBadge(healthData.services.database)}
                </div>
              </CardHeader>
              <CardContent>
                {healthData.details.database && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>接続:</span>
                      <span className="font-medium">{healthData.details.database.details?.connection || 'unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>決済リンク:</span>
                      <span className="font-medium">{healthData.details.database.details?.paymentLinksCount || 0}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span>取引数:</span>
                      <span className="font-medium">{healthData.details.database.details?.transactionsCount || 0}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span>レスポンス:</span>
                      <span className="font-medium">{healthData.details.database.responseTime}ms</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stripe */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-sm">Stripe</CardTitle>
                  </div>
                  {getStatusBadge(healthData.services.stripe)}
                </div>
              </CardHeader>
              <CardContent>
                {healthData.details.stripe && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>設定:</span>
                      <span className="font-medium">{healthData.details.stripe.details?.configured ? '済' : '未'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>環境:</span>
                      <span className="font-medium">{healthData.details.stripe.details?.environment || 'unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Webhook:</span>
                      <span className="font-medium">{healthData.details.stripe.details?.hasWebhookSecret ? '設定済' : '未設定'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environment */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-sm">環境設定</CardTitle>
                  </div>
                  {getStatusBadge(healthData.services.environment)}
                </div>
              </CardHeader>
              <CardContent>
                {healthData.details.environment && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>スコア:</span>
                      <span className="font-medium">{healthData.details.environment.details?.configurationScore || 0}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>警告:</span>
                      <span className="font-medium">{healthData.details.environment.details?.warnings?.length || 0}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span>エラー:</span>
                      <span className="font-medium">{healthData.details.environment.details?.errors?.length || 0}件</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-gray-600" />
                    <CardTitle className="text-sm">システム</CardTitle>
                  </div>
                  {getStatusBadge(healthData.services.system)}
                </div>
              </CardHeader>
              <CardContent>
                {healthData.details.system && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>メモリ使用:</span>
                      <span className="font-medium">{healthData.details.system.details?.memory?.usagePercentage?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heap:</span>
                      <span className="font-medium">{healthData.details.system.details?.memory?.heapUsedMB?.toFixed(1) || 0}MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>スコア:</span>
                      <span className="font-medium">{healthData.details.system.details?.performanceScore || 0}/100</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Environment Details */}
            <Card>
              <CardHeader>
                <CardTitle>環境変数の詳細</CardTitle>
                <CardDescription>設定とセキュリティの状態</CardDescription>
              </CardHeader>
              <CardContent>
                {healthData.details.environment?.details && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">サービス設定</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>データベース:</span>
                            <span className={healthData.details.environment.details.services?.database ? 'text-green-600' : 'text-red-600'}>
                              {healthData.details.environment.details.services?.database ? '設定済' : '未設定'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stripe:</span>
                            <span className={healthData.details.environment.details.services?.stripe ? 'text-green-600' : 'text-red-600'}>
                              {healthData.details.environment.details.services?.stripe ? '設定済' : '未設定'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">セキュリティ</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>暗号化:</span>
                            <span className={healthData.details.environment.details.security?.encryptionConfigured ? 'text-green-600' : 'text-red-600'}>
                              {healthData.details.environment.details.security?.encryptionConfigured ? '設定済' : '未設定'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>認証:</span>
                            <span className={healthData.details.environment.details.security?.authConfigured ? 'text-green-600' : 'text-red-600'}>
                              {healthData.details.environment.details.security?.authConfigured ? '設定済' : '未設定'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warnings and Errors */}
                    {(healthData.details.environment.details.warnings?.length > 0 || healthData.details.environment.details.errors?.length > 0) && (
                      <div className="border-t pt-4">
                        {healthData.details.environment.details.warnings?.length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-sm mb-2 text-yellow-600">警告</h4>
                            <div className="space-y-1">
                              {healthData.details.environment.details.warnings.map((warning: string, index: number) => (
                                <div key={index} className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                                  {warning}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {healthData.details.environment.details.errors?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-red-600">エラー</h4>
                            <div className="space-y-1">
                              {healthData.details.environment.details.errors.map((err: string, index: number) => (
                                <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                                  {err}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>システムパフォーマンス</CardTitle>
                <CardDescription>リソース使用状況とパフォーマンス</CardDescription>
              </CardHeader>
              <CardContent>
                {healthData.details.system?.details && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">メモリ使用量</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>使用中:</span>
                          <span>{healthData.details.system.details.memory?.heapUsedMB?.toFixed(1)}MB</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>総容量:</span>
                          <span>{healthData.details.system.details.memory?.heapTotalMB?.toFixed(1)}MB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              (healthData.details.system.details.memory?.usagePercentage || 0) > 80 ? 'bg-red-500' :
                              (healthData.details.system.details.memory?.usagePercentage || 0) > 60 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${healthData.details.system.details.memory?.usagePercentage || 0}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {healthData.details.system.details.memory?.usagePercentage?.toFixed(1)}% 使用中
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">プロセス情報</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>PID:</span>
                          <span>{healthData.details.system.details.process?.pid}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Node.js:</span>
                          <span>{healthData.details.system.details.process?.nodeVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>稼働時間:</span>
                          <span>{formatUptime(healthData.details.system.details.process?.uptime || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}