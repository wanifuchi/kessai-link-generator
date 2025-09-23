'use client';

import React from 'react';
import { Loader2, Clock, Zap } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<{ size: string; className?: string }> = ({
  size,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2
      className={`animate-spin ${sizeClasses[size as keyof typeof sizeClasses]} ${className}`}
    />
  );
};

const LoadingDots: React.FC<{ size: string; className?: string }> = ({
  size,
  className = ''
}) => {
  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dotSize = dotSizes[size as keyof typeof dotSizes];

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`${dotSize} bg-current rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`${dotSize} bg-current rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`${dotSize} bg-current rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

const LoadingPulse: React.FC<{ size: string; className?: string }> = ({
  size,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`${sizeClasses[size as keyof typeof sizeClasses]} ${className}`}>
      <div className="w-full h-full bg-current rounded-full animate-pulse"></div>
    </div>
  );
};

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className = '',
}) => {
  const renderLoadingIcon = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots size={size} className="text-blue-600" />;
      case 'pulse':
        return <LoadingPulse size={size} className="text-blue-600" />;
      default:
        return <LoadingSpinner size={size} className="text-blue-600" />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderLoadingIcon()}
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// 特定の用途向けのプリセットコンポーネント
export const PageLoading: React.FC<{ text?: string }> = ({ text = "読み込み中..." }) => (
  <Loading
    size="lg"
    variant="spinner"
    text={text}
    fullScreen
    className="text-center"
  />
);

export const ButtonLoading: React.FC<{ text?: string }> = ({ text = "処理中..." }) => (
  <Loading
    size="sm"
    variant="spinner"
    text={text}
    className="text-center py-2"
  />
);

export const CardLoading: React.FC<{ text?: string }> = ({ text = "データを取得中..." }) => (
  <div className="flex items-center justify-center py-8">
    <Loading
      size="md"
      variant="spinner"
      text={text}
      className="text-center"
    />
  </div>
);

export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner size="sm" className="text-blue-600" />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
);

// SkeletonLoader コンポーネント（シマーアニメーション付き）
export const SkeletonLoader: React.FC<{
  width?: string;
  height?: string;
  className?: string;
  lines?: number;
  shimmer?: boolean;
}> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
  lines = 1,
  shimmer = true
}) => {
  const shimmerClass = shimmer
    ? 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 bg-[length:200%_100%] animate-shimmer'
    : 'bg-gray-300 animate-pulse';

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${width} ${height} ${shimmerClass} rounded`}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};

// カードスケルトン
export const CardSkeleton: React.FC = () => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
    <SkeletonLoader width="w-3/4" height="h-5" />
    <SkeletonLoader width="w-full" height="h-4" lines={2} />
    <div className="flex justify-between items-center">
      <SkeletonLoader width="w-1/4" height="h-4" />
      <SkeletonLoader width="w-1/6" height="h-8" />
    </div>
  </div>
);

// テーブルスケルトン
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader
            key={colIndex}
            width="flex-1"
            height="h-4"
            className={`animate-pulse`}
          />
        ))}
      </div>
    ))}
  </div>
);

// ダッシュボード専用の改善されたローディング
export const DashboardLoadingOverlay: React.FC<{
  stage?: string;
  progress?: number;
  onTimeout?: () => void;
}> = ({
  stage = "データを読み込み中...",
  progress,
  onTimeout
}) => {
  const [timeElapsed, setTimeElapsed] = React.useState(0);
  const [currentStage, setCurrentStage] = React.useState(stage);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;

        // ステージに応じてメッセージを変更
        if (newTime >= 3 && newTime < 6) {
          setCurrentStage("決済リンクを取得中...");
        } else if (newTime >= 6 && newTime < 8) {
          setCurrentStage("統計データを計算中...");
        } else if (newTime >= 8) {
          setCurrentStage("最終処理中...");
        }

        // 10秒でタイムアウト
        if (newTime >= 10 && onTimeout) {
          onTimeout();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout]);

  return (
    <div className="dashboard-loading-overlay">
      <div className="text-center space-y-6">
        {/* メインローディングスピナー */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* ステージ表示 */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-800 animate-pulse">
            {currentStage}
          </p>
          <p className="text-sm text-gray-500">
            {timeElapsed}秒経過
            {timeElapsed >= 8 && " - まもなく完了します"}
          </p>
        </div>

        {/* プログレスバー */}
        <div className="loading-progress-bar">
          <div
            className="loading-progress-fill"
            style={{
              animationDuration: `${Math.max(2 - (timeElapsed * 0.1), 0.5)}s`
            }}
          ></div>
        </div>

        {/* 詳細ローディング状況 */}
        <div className="space-y-1 text-xs text-gray-400">
          <div className="flex justify-between items-center">
            <span>サーバー接続</span>
            <span className="text-green-500">✓</span>
          </div>
          <div className="flex justify-between items-center">
            <span>データベース接続</span>
            <span className="text-green-500">✓</span>
          </div>
          <div className="flex justify-between items-center">
            <span>データ取得</span>
            <span className={timeElapsed >= 3 ? "text-green-500" : "text-blue-500 animate-pulse"}>
              {timeElapsed >= 3 ? "✓" : "..."}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>表示準備</span>
            <span className={timeElapsed >= 6 ? "text-green-500" : "text-gray-300"}>
              {timeElapsed >= 6 ? "✓" : "○"}
            </span>
          </div>
        </div>

        {/* タイムアウト警告 */}
        {timeElapsed >= 8 && (
          <div className="text-orange-600 text-sm animate-pulse">
            ⚠ 読み込みに時間がかかっています...
          </div>
        )}
      </div>
    </div>
  );
};

// 改善されたカードスケルトン
export const EnhancedCardSkeleton: React.FC = () => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-3 enhanced-loading">
    <SkeletonLoader width="w-3/4" height="h-5" shimmer={true} />
    <SkeletonLoader width="w-full" height="h-4" lines={2} shimmer={true} />
    <div className="flex justify-between items-center">
      <SkeletonLoader width="w-1/4" height="h-4" shimmer={true} />
      <SkeletonLoader width="w-1/6" height="h-8" shimmer={true} />
    </div>
  </div>
);

export default Loading;