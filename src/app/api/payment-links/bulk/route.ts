import { NextRequest, NextResponse } from 'next/server';
import prisma, { withSession } from '@/lib/prisma';
import { BulkActionRequest } from '@/types/link';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await withSession(
      request,
      async (req, session) => {
        if (!session?.user?.id) {
          return NextResponse.json(
            { success: false, error: '認証が必要です' },
            { status: 401 }
          );
        }

        const body: BulkActionRequest = await request.json();
        const { action, ids, status } = body;

        if (!ids || ids.length === 0) {
          return NextResponse.json(
            { success: false, error: '操作対象のIDを指定してください' },
            { status: 400 }
          );
        }

        let updated = 0;
        let failed = 0;

        try {
          switch (action) {
            case 'delete':
              const deleteResult = await prisma.paymentLink.deleteMany({
                where: {
                  id: { in: ids },
                  userId: session.user.id,
                },
              });
              updated = deleteResult.count;
              break;

            case 'cancel':
              const cancelResult = await prisma.paymentLink.updateMany({
                where: {
                  id: { in: ids },
                  userId: session.user.id,
                  status: { not: 'cancelled' },
                },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date(),
                },
              });
              updated = cancelResult.count;
              break;

            case 'activate':
            case 'deactivate':
              if (!status) {
                return NextResponse.json(
                  { success: false, error: 'ステータスを指定してください' },
                  { status: 400 }
                );
              }
              
              const updateResult = await prisma.paymentLink.updateMany({
                where: {
                  id: { in: ids },
                  userId: session.user.id,
                },
                data: {
                  status: status,
                  updatedAt: new Date(),
                },
              });
              updated = updateResult.count;
              break;

            default:
              return NextResponse.json(
                { success: false, error: '無効なアクションです' },
                { status: 400 }
              );
          }

          failed = ids.length - updated;

          return NextResponse.json({
            success: true,
            data: {
              updated,
              failed,
            },
          });
        } catch (error) {
          console.error('一括操作エラー:', error);
          return NextResponse.json(
            { success: false, error: '一括操作に失敗しました' },
            { status: 500 }
          );
        }
      }
    );
  } catch (error) {
    console.error('一括操作API エラー:', error);
    return NextResponse.json(
      { success: false, error: '一括操作に失敗しました' },
      { status: 500 }
    );
  }
}
