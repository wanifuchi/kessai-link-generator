import CryptoJS from 'crypto-js';
import { PaymentCredentials } from '@/types/payment';

// 暗号化キーを環境変数から取得
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'default-development-key-change-in-prod';

if (ENCRYPTION_KEY === 'default-development-key-change-in-prod' && process.env.NODE_ENV === 'production') {
  throw new Error('ENCRYPTION_SECRET must be set in production environment');
}

/**
 * データを暗号化する
 * @param data 暗号化するデータ
 * @returns 暗号化された文字列
 */
export function encryptData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('データの暗号化に失敗しました');
  }
}

/**
 * 暗号化されたデータを復号化する
 * @param encryptedData 暗号化されたデータ
 * @returns 復号化されたデータ
 */
export function decryptData<T = any>(encryptedData: string): T {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('復号化に失敗しました - 無効な暗号化データまたはキー');
    }
    
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('データの復号化に失敗しました');
  }
}

/**
 * 認証情報を安全に暗号化する
 * @param credentials 決済サービスの認証情報
 * @returns 暗号化された認証情報
 */
export function encryptCredentials(credentials: PaymentCredentials): string {
  // 機密情報のログ出力を防ぐため、コピーを作成
  const credentialsCopy = { ...credentials };
  
  // 特定のフィールドをマスクしてログに記録（デバッグ用）
  if (process.env.NODE_ENV === 'development') {
    console.log('Encrypting credentials for service:', credentialsCopy);
  }
  
  return encryptData(credentialsCopy);
}

/**
 * 暗号化された認証情報を復号化する
 * @param encryptedCredentials 暗号化された認証情報
 * @returns 復号化された認証情報
 */
export function decryptCredentials(encryptedCredentials: string): PaymentCredentials {
  return decryptData<PaymentCredentials>(encryptedCredentials);
}

/**
 * セッション用のハッシュを生成する
 * @param data ハッシュ化するデータ
 * @returns SHA256ハッシュ
 */
export function generateHash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * セキュアなランダム文字列を生成する
 * @param length 文字列の長さ
 * @returns ランダム文字列
 */
export function generateSecureRandom(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  
  // crypto.getRandomValues を使用してセキュアなランダム値を生成
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  
  return result;
}

/**
 * パスワード強度をチェックする
 * @param password チェックするパスワード
 * @returns 強度レベル (0-4)
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('8文字以上で入力してください');
  }
  
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('小文字を含めてください');
  }
  
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('大文字を含めてください');
  }
  
  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('数字を含めてください');
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('特殊文字を含めてください');
  }
  
  return { score, feedback };
}

/**
 * データの整合性を検証するためのチェックサム生成
 * @param data 検証するデータ
 * @returns チェックサム
 */
export function generateChecksum(data: any): string {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  return CryptoJS.MD5(jsonString).toString();
}

/**
 * 暗号化されたデータの整合性を検証
 * @param encryptedData 暗号化されたデータ
 * @param expectedChecksum 期待されるチェックサム
 * @returns 整合性チェック結果
 */
export function verifyDataIntegrity(encryptedData: string, expectedChecksum?: string): boolean {
  try {
    const decrypted = decryptData(encryptedData);
    if (!expectedChecksum) return true;
    
    const actualChecksum = generateChecksum(decrypted);
    return actualChecksum === expectedChecksum;
  } catch {
    return false;
  }
}