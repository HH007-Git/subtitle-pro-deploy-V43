import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    const isProduction = process.env.NODE_ENV === 'production';

    // 基本配置验证
    const openaiKeyValid = openaiConfigured && process.env.OPENAI_API_KEY?.startsWith('sk-');

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        api: 'operational',
        openai: openaiConfigured ? (openaiKeyValid ? 'configured' : 'invalid_key') : 'not_configured',
        chatgpt: openaiConfigured ? (openaiKeyValid ? 'configured' : 'invalid_key') : 'not_configured', // ChatGPT使用相同的OpenAI API密钥
        mymemory: 'available' // MyMemory不需要API密钥
      },
      features: {
        speech_recognition: openaiKeyValid ? 'production' : 'test_mode_only',
        translation: {
          chatgpt: openaiKeyValid ? 'available' : 'not_available',
          mymemory: 'available'
        },
        file_upload: 'enabled',
        subtitle_export: 'enabled'
      },
      deployment: {
        platform: 'netlify',
        region: process.env.AWS_REGION || 'unknown',
        build_id: process.env.BUILD_ID || 'unknown'
      },
      configuration: {
        production_ready: isProduction && openaiKeyValid,
        test_mode_available: true,
        max_file_size: '25MB',
        supported_formats: ['MP4', 'WebM', 'AVI', 'MOV', 'MP3', 'WAV']
      }
    };

    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
