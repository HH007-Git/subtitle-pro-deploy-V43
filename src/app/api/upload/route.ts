import { put } from '@vercel/blob';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`🔄 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    // Validate file size (500MB limit)
    if (file.size > 500 * 1024 * 1024) {
      return Response.json(
        { error: 'File too large. Maximum size is 500MB.' },
        { status: 413 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac'
    ];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob using server-side API
    const blob = await put(file.name, file, {
      access: 'public',
    });

    console.log(`✅ Blob upload completed: ${blob.url}`);

    return Response.json({
      success: true,
      url: blob.url,
      size: file.size,
      type: file.type,
      filename: file.name
    });

  } catch (error) {
    console.error('❌ Upload handler error:', error);

    // Handle specific Vercel Blob errors
    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('auth')) {
        return Response.json(
          {
            error: 'Blob storage not configured. Please check Vercel Blob settings.',
            details: 'Contact administrator to enable Vercel Blob storage.'
          },
          { status: 503 }
        );
      }
    }

    return Response.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
