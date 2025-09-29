/**
 * パフォーマンス監視ユーティリティ
 * Core Web Vitalsとカスタムメトリクスを監視
 */

interface PerformanceMetrics {
  fcp?: number;    // First Contentful Paint
  lcp?: number;    // Largest Contentful Paint
  cls?: number;    // Cumulative Layout Shift
  fid?: number;    // First Input Delay
  ttfb?: number;   // Time to First Byte
  custom?: { [key: string]: number };
}

/**
 * パフォーマンスメトリクスを取得
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  if (typeof window === 'undefined') {
    return {};
  }

  const metrics: PerformanceMetrics = {
    custom: {}
  };

  try {
    // Web Vitals API対応（Performance Observer）
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.lcp = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          metrics.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        metrics.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Navigation Timing API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.ttfb = navigation.responseStart - navigation.requestStart;
      metrics.fcp = navigation.loadEventEnd - navigation.loadEventStart;
    }

  } catch (error) {
    console.warn('Performance metrics collection failed:', error);
  }

  return metrics;
}

/**
 * カスタムパフォーマンス測定開始
 */
export function startPerformanceMeasure(name: string): void {
  if (typeof window !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`);
  }
}

/**
 * カスタムパフォーマンス測定終了
 */
export function endPerformanceMeasure(name: string): number | null {
  if (typeof window === 'undefined' || !performance.mark || !performance.measure) {
    return null;
  }

  try {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    const measure = performance.getEntriesByName(name, 'measure')[0];
    return measure ? measure.duration : null;
  } catch (error) {
    console.warn(`Performance measurement failed for ${name}:`, error);
    return null;
  }
}

/**
 * QRコード生成パフォーマンス測定
 */
export async function measureQRCodeGeneration<T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number | null }> {
  startPerformanceMeasure('qr-generation');

  try {
    const result = await operation();
    const duration = endPerformanceMeasure('qr-generation');

    // パフォーマンスログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development' && duration) {
      console.log(`QRコード生成時間: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  } catch (error) {
    endPerformanceMeasure('qr-generation');
    throw error;
  }
}

/**
 * パフォーマンス閾値チェック
 */
export function checkPerformanceThresholds(metrics: PerformanceMetrics): {
  lcp: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  fid: 'good' | 'needs-improvement' | 'poor' | 'unknown';
  cls: 'good' | 'needs-improvement' | 'poor' | 'unknown';
} {
  return {
    lcp: metrics.lcp
      ? metrics.lcp <= 2500 ? 'good'
      : metrics.lcp <= 4000 ? 'needs-improvement'
      : 'poor'
      : 'unknown',
    fid: metrics.fid
      ? metrics.fid <= 100 ? 'good'
      : metrics.fid <= 300 ? 'needs-improvement'
      : 'poor'
      : 'unknown',
    cls: metrics.cls
      ? metrics.cls <= 0.1 ? 'good'
      : metrics.cls <= 0.25 ? 'needs-improvement'
      : 'poor'
      : 'unknown'
  };
}

/**
 * パフォーマンスログ出力（開発環境のみ）
 */
export function logPerformanceMetrics(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  setTimeout(() => {
    const metrics = getPerformanceMetrics();
    const thresholds = checkPerformanceThresholds(metrics);

    console.group('🚀 Performance Metrics');
    console.log('LCP (Largest Contentful Paint):', metrics.lcp, `(${thresholds.lcp})`);
    console.log('FID (First Input Delay):', metrics.fid, `(${thresholds.fid})`);
    console.log('CLS (Cumulative Layout Shift):', metrics.cls, `(${thresholds.cls})`);
    console.log('TTFB (Time to First Byte):', metrics.ttfb);
    console.log('FCP (First Contentful Paint):', metrics.fcp);
    console.groupEnd();
  }, 3000); // 3秒後に測定（ページ読み込み完了後）
}