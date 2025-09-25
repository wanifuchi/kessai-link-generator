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

  console.log('🔍 getStackClientApp 詳細チェック:', {
    projectIdRaw: projectId,
    publishableKeyRaw: publishableClientKey,
    projectIdType: typeof projectId,
    publishableKeyType: typeof publishableClientKey,
    projectIdTrimmed: projectId?.trim(),
    publishableKeyTrimmed: publishableClientKey?.trim(),
  });

  if (!projectId || !publishableClientKey) {
    throw new Error(
      "Stack Auth クライアント環境変数が未設定です。NEXT_PUBLIC_STACK_PROJECT_ID / NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY を設定してください。"
    );
  }

  // 環境変数をトリミングして使用
  const cleanProjectId = projectId.trim();
  const cleanPublishableClientKey = publishableClientKey.trim();

  console.log('🔍 StackClientApp設定:', {
    projectId: cleanProjectId,
    publishableClientKey: cleanPublishableClientKey,
    tokenStore: "nextjs-cookie"
  });

  return new StackClientApp({
    projectId: cleanProjectId,
    publishableClientKey: cleanPublishableClientKey,
    tokenStore: "nextjs-cookie",
  });
}

export function getStackServerApp() {
  const { projectId, publishableClientKey, secretServerKey } = ensureEnv();

  // サーバー側でも環境変数をクリーンアップ
  const cleanProjectId = projectId.trim();
  const cleanPublishableClientKey = publishableClientKey.trim();
  const cleanSecretServerKey = secretServerKey.trim();

  console.log('🔍 StackServerApp設定:', {
    projectId: cleanProjectId,
    publishableClientKey: cleanPublishableClientKey,
    secretServerKey: cleanSecretServerKey.slice(0, 8) + '...',
    tokenStore: "nextjs-cookie"
  });

  return new StackServerApp({
    projectId: cleanProjectId,
    publishableClientKey: cleanPublishableClientKey,
    secretServerKey: cleanSecretServerKey,
    tokenStore: "nextjs-cookie",
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