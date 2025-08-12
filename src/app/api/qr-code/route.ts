import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { z } from 'zod';

// リクエストバリデーション
const qrRequestSchema = z.object({
  url: z.string().url('有効なURLを指定してください'),
  size: z.number().min(100).max(1000).default(300),
  margin: z.number().min(0).max(10).default(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    const validatedData = qrRequestSchema.parse(body);
    const { url, size, margin } = validatedData;

    // QRコード生成オプション
    const qrOptions = {
      width: size,
      height: size,
      margin: margin,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
    };

    // QRコードをBase64形式で生成
    const qrCodeDataURL = await QRCode.toDataURL(url, qrOptions);

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        url: url,
        size: size,
        margin: margin,
        format: 'png',
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('QR code generation error:', error);

    // バリデーションエラー
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    // QRCode生成エラー
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: 'QR code generation failed',
        message: error.message
      }, { status: 500 });
    }

    // その他のエラー
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET リクエストでのQRコード生成（URLパラメータ使用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const sizeParam = searchParams.get('size');
    const marginParam = searchParams.get('margin');

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL parameter is required'
      }, { status: 400 });
    }

    // パラメータの変換とデフォルト値
    const size = sizeParam ? parseInt(sizeParam, 10) : 300;
    const margin = marginParam ? parseInt(marginParam, 10) : 2;

    // バリデーション
    const validatedData = qrRequestSchema.parse({ url, size, margin });

    // QRコード生成オプション
    const qrOptions = {
      width: validatedData.size,
      height: validatedData.size,
      margin: validatedData.margin,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
    };

    // QRコードをBase64形式で生成
    const qrCodeDataURL = await QRCode.toDataURL(validatedData.url, qrOptions);

    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        url: validatedData.url,
        size: validatedData.size,
        margin: validatedData.margin,
        format: 'png',
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('QR code generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'QR code generation failed'
    }, { status: 500 });
  }
}

// OPTIONS リクエストへの対応（CORS対応）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}