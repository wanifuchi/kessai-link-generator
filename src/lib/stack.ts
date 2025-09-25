import { StackClientApp, StackServerApp } from "@stackframe/stack";

function ensureEnv() {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableClientKey =
    process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
  const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;

  if (!projectId || !publishableClientKey || !secretServerKey) {
    throw new Error(
      "Stack Auth 環境変数が未設定です。NEXT_PUBLIC_STACK_PROJECT_ID / NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY / STACK_SECRET_SERVER_KEY を設定してください。"
    );
  }
  return { projectId, publishableClientKey, secretServerKey };
}

export function getStackClientApp() {
  // クライアント側ではNEXT_PUBLIC_のみ使用
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

  console.log('🔍 getStackClientApp 最小設定:', {
    projectId: projectId?.slice(0, 8) + '...',
    publishableClientKey: publishableClientKey?.slice(0, 8) + '...',
    hasProjectId: !!projectId,
    hasPublishableKey: !!publishableClientKey
  });

  if (!projectId || !publishableClientKey) {
    throw new Error(
      "Stack Auth クライアント環境変数が未設定です。NEXT_PUBLIC_STACK_PROJECT_ID / NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY を設定してください。"
    );
  }

  console.log('🔍 StackClientApp 最小限設定でインスタンス作成中...');

  // 最小限の設定のみ使用
  return new StackClientApp({
    projectId,
    publishableClientKey,
  });
}

export function getStackServerApp() {
  const { projectId, publishableClientKey, secretServerKey } = ensureEnv();

  console.log('🔍 StackServerApp 最小設定:', {
    projectId: projectId.slice(0, 8) + '...',
    publishableClientKey: publishableClientKey.slice(0, 8) + '...',
    secretServerKey: secretServerKey.slice(0, 8) + '...'
  });

  // 最小限の設定のみ使用
  return new StackServerApp({
    projectId,
    publishableClientKey,
    secretServerKey,
  });
}

export function hasStackEnv() {
  // クライアント側でも使えるように、NEXT_PUBLIC_のみをチェック
  if (typeof window !== 'undefined') {
    // クライアント側
    return Boolean(
      process.env.NEXT_PUBLIC_STACK_PROJECT_ID &&
      process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY
    );
  }
  // サーバー側
  return Boolean(
    process.env.NEXT_PUBLIC_STACK_PROJECT_ID &&
      process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY &&
      process.env.STACK_SECRET_SERVER_KEY
  );
}