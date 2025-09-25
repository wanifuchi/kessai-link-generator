import { NextRequest } from 'next/server';
import { getStackServerApp } from '@/lib/stack';

export interface AuthenticatedUser {
  id: string;
  stackUserId: string;
  email: string;
  displayName?: string;
}

/**
 * APIエンドポイントで認証ユーザー情報を取得する
 * @param request Next.js Request オブジェクト
 * @returns 認証ユーザー情報またはnull
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const app = getStackServerApp();
    const user = await app.getUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      stackUserId: user.id,
      email: user.primaryEmail || '',
      displayName: user.displayName || undefined,
    };
  } catch (error) {
    console.error('認証ユーザー取得エラー:', error);
    return null;
  }
}

/**
 * APIエンドポイントで認証が必要かチェックし、未認証の場合はエラーレスポンスを返す
 * @param request Next.js Request オブジェクト
 * @returns 認証ユーザー情報または認証エラーレスポンス
 */
export async function requireAuth(request?: NextRequest): Promise<{ user: AuthenticatedUser } | { error: Response }> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      error: new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          message: 'このAPIエンドポイントにはログインが必要です',
          code: 'UNAUTHORIZED'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    };
  }

  return { user };
}

/**
 * リソースの所有者確認を行う
 * @param userId 認証ユーザーID
 * @param resourceUserId リソースの所有者ID
 * @returns 所有者確認結果
 */
export function verifyOwnership(userId: string, resourceUserId: string | null): boolean {
  return resourceUserId === userId;
}

/**
 * 所有者チェックでエラーレスポンスを生成する
 * @returns 権限不足エラーレスポンス
 */
export function createOwnershipError(): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Access denied',
      message: 'このリソースへのアクセス権限がありません',
      code: 'FORBIDDEN'
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}