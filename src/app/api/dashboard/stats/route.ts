import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DashboardStats {
  totalLinks: number;
  totalRevenue: number;
  totalTransactions: number;
  conversionRate: number;
  successRate: number;
  averageTransactionValue: number;
  growth: {
    revenueGrowth: number;
    transactionGrowth: number;
    linkGrowth: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
  linksByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  serviceStats: Array<{
    service: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
  currencyStats: Array<{
    currency: string;
    count: number;
    revenue: number;
  }>;
  topPerformingLinks: Array<{
    id: string;
    title: string;
    revenue: number;
    transactions: number;
    conversionRate: number;
  }>;
  recentActivity: Array<{
    type: 'link_created' | 'payment_completed' | 'payment_failed';
    timestamp: string;
    data: any;
  }>;
  dailyStats: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || '30'; // デフォルト30日
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // 前期間の開始日（比較用）
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysAgo);

    // 基本統計を並列で取得
    const [
      totalLinks,
      totalLinksAll,
      paymentLinks,
      allPaymentLinks,
      transactions,
      allTransactions,
      prevTransactions,
      prevLinks,
      recentLinks,
      serviceStats,
      currencyStats
    ] = await Promise.all([
      // 期間内の総決済リンク数
      prisma.paymentLink.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),

      // 全ての決済リンク数
      prisma.paymentLink.count(),

      // 期間内の決済リンク詳細（収益計算用）
      prisma.paymentLink.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          transactions: {
            where: {
              status: 'COMPLETED'
            }
          }
        }
      }),

      // 全ての決済リンク（トップパフォーマンス計算用）
      prisma.paymentLink.findMany({
        include: {
          transactions: {
            where: {
              status: 'COMPLETED',
              paidAt: {
                gte: startDate
              }
            }
          }
        }
      }),

      // 期間内の全取引
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        },
        include: {
          paymentLink: true
        }
      }),

      // 全取引（状態統計用）
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),

      // 前期間の取引（成長率計算用）
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: prevStartDate,
            lt: startDate
          }
        }
      }),

      // 前期間のリンク（成長率計算用）
      prisma.paymentLink.count({
        where: {
          createdAt: {
            gte: prevStartDate,
            lt: startDate
          }
        }
      }),

      // 最近の決済リンク
      prisma.paymentLink.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          transactions: true
        }
      }),

      // サービス別統計
      prisma.transaction.groupBy({
        by: ['service'],
        where: {
          status: 'COMPLETED',
          paidAt: {
            gte: startDate
          }
        },
        _count: {
          _all: true
        },
        _sum: {
          amount: true
        }
      }),

      // 通貨別統計
      prisma.transaction.groupBy({
        by: ['currency'],
        where: {
          status: 'COMPLETED',
          paidAt: {
            gte: startDate
          }
        },
        _count: {
          _all: true
        },
        _sum: {
          amount: true
        }
      })
    ]);

    // 完了した取引
    const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');
    const allCompleted = allTransactions.filter(t => t.status === 'COMPLETED');
    const prevCompleted = prevTransactions.filter(t => t.status === 'COMPLETED');

    // 総収益計算
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const prevRevenue = prevCompleted.reduce((sum, t) => sum + t.amount, 0);

    // 総取引数
    const totalTransactions = completedTransactions.length;
    const prevTotalTransactions = prevCompleted.length;

    // 成功率計算
    const successRate = allTransactions.length > 0 ? (allCompleted.length / allTransactions.length) * 100 : 0;

    // 平均取引額
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // 成長率計算
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const transactionGrowth = prevTotalTransactions > 0 ? ((totalTransactions - prevTotalTransactions) / prevTotalTransactions) * 100 : 0;
    const linkGrowth = prevLinks > 0 ? ((totalLinks - prevLinks) / prevLinks) * 100 : 0;

    // コンバージョン率計算
    const conversionRate = totalLinks > 0 ? (totalTransactions / totalLinks) * 100 : 0;

    // 日別統計
    const dailyStats = getDailyStats(completedTransactions, daysAgo);

    // 月別収益
    const revenueByMonth = getMonthlyRevenue(completedTransactions);

    // ステータス別リンク数（改良版）
    const linksByStatus = getLinksByStatusEnhanced(paymentLinks);

    // サービス別統計の処理
    const totalServiceRevenue = serviceStats.reduce((sum, stat) => sum + (Number(stat._sum.amount) || 0), 0);
    const processedServiceStats = serviceStats.map(stat => ({
      service: stat.service,
      count: stat._count._all,
      revenue: Number(stat._sum.amount) || 0,
      percentage: totalServiceRevenue > 0 ? ((Number(stat._sum.amount) || 0) / totalServiceRevenue) * 100 : 0
    }));

    // 通貨別統計の処理
    const processedCurrencyStats = currencyStats.map(stat => ({
      currency: stat.currency,
      count: stat._count._all,
      revenue: Number(stat._sum.amount) || 0
    }));

    // トップパフォーマンス決済リンク（改良版）
    const topPerformingLinks = getTopPerformingLinksEnhanced(allPaymentLinks);

    // 最近のアクティビティ
    const recentActivity = getRecentActivity(recentLinks, transactions);

    const stats: DashboardStats = {
      totalLinks: totalLinksAll,
      totalRevenue,
      totalTransactions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      averageTransactionValue: Math.round(averageTransactionValue),
      growth: {
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        transactionGrowth: Math.round(transactionGrowth * 100) / 100,
        linkGrowth: Math.round(linkGrowth * 100) / 100
      },
      revenueByMonth,
      linksByStatus,
      serviceStats: processedServiceStats,
      currencyStats: processedCurrencyStats,
      topPerformingLinks,
      recentActivity,
      dailyStats
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
}

// 日別統計計算
function getDailyStats(transactions: any[], daysAgo: number) {
  const dailyData = new Map<string, { revenue: number; transactions: number }>();

  // 過去N日分の日付を初期化
  for (let i = 0; i < daysAgo; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
    dailyData.set(dateStr, { revenue: 0, transactions: 0 });
  }

  transactions.forEach(transaction => {
    const date = transaction.paidAt ? new Date(transaction.paidAt) : new Date(transaction.createdAt);
    const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const current = dailyData.get(dateStr) || { revenue: 0, transactions: 0 };
    dailyData.set(dateStr, {
      revenue: current.revenue + transaction.amount,
      transactions: current.transactions + 1
    });
  });

  return Array.from(dailyData.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactions: data.transactions
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 月別収益計算
function getMonthlyRevenue(transactions: any[]) {
  const monthlyData = new Map<string, { revenue: number; transactions: number }>();

  transactions.forEach(transaction => {
    const date = transaction.paidAt ? new Date(transaction.paidAt) : new Date(transaction.createdAt);
    const month = date.toISOString().slice(0, 7); // YYYY-MM
    const current = monthlyData.get(month) || { revenue: 0, transactions: 0 };
    monthlyData.set(month, {
      revenue: current.revenue + transaction.amount,
      transactions: current.transactions + 1
    });
  });

  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      transactions: data.transactions
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // 最近6ヶ月
}

// ステータス別リンク数（改良版）
function getLinksByStatusEnhanced(paymentLinks: any[]) {
  const statusCounts = new Map<string, number>();
  const total = paymentLinks.length;

  paymentLinks.forEach(link => {
    const current = statusCounts.get(link.status) || 0;
    statusCounts.set(link.status, current + 1);
  });

  return Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
  }));
}

// トップパフォーマンス決済リンク（改良版）
function getTopPerformingLinksEnhanced(paymentLinks: any[]) {
  return paymentLinks
    .map(link => {
      const completedTransactions = link.transactions.filter((t: any) => t.status === 'COMPLETED');
      const revenue = completedTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalViews = Math.max(completedTransactions.length * 2, 1); // 仮の閲覧数
      const conversionRate = (completedTransactions.length / totalViews) * 100;

      return {
        id: link.id,
        title: link.title,
        revenue,
        transactions: completedTransactions.length,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    })
    .filter(link => link.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

// 最近のアクティビティ
function getRecentActivity(recentLinks: any[], transactions: any[]) {
  const activities: any[] = [];

  // 決済リンク作成アクティビティ
  recentLinks.slice(0, 5).forEach(link => {
    activities.push({
      type: 'link_created',
      timestamp: link.createdAt,
      data: {
        linkId: link.id,
        title: link.title,
        amount: link.amount,
        currency: link.currency
      }
    });
  });

  // 決済完了アクティビティ
  transactions
    .filter(t => t.status === 'COMPLETED')
    .slice(0, 5)
    .forEach(transaction => {
      activities.push({
        type: 'payment_completed',
        timestamp: transaction.paidAt || transaction.createdAt,
        data: {
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          linkTitle: transaction.paymentLink?.title
        }
      });
    });

  // 決済失敗アクティビティ
  transactions
    .filter(t => t.status === 'FAILED')
    .slice(0, 3)
    .forEach(transaction => {
      activities.push({
        type: 'payment_failed',
        timestamp: transaction.createdAt,
        data: {
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          reason: transaction.metadata?.failureReason || 'Unknown error'
        }
      });
    });

  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}