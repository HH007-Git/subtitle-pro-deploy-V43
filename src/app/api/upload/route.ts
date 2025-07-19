import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // This endpoint handles Vercel Blob client upload tokens, not direct file uploads
    console.log('🔐 Handling Vercel Blob upload token request');

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log('🔐 Generating upload token for:', pathname);

        // Validate file type from pathname
        const allowedExtensions = [
          '.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.flv',
          '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'
        ];

        const fileExtension = pathname.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
          throw new Error(`Unsupported file type: .${fileExtension}`);
        }

        return {
          allowedContentTypes: [
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
            'video/x-ms-wmv', 'video/x-flv',
            'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg',
            'audio/x-m4a', 'audio/x-ms-wma'
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB limit
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Vercel Blob upload completed:', blob.url);
        console.log('📊 Blob pathname:', blob.pathname);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    console.error('❌ Vercel Blob upload handler error:', error);

    if (error instanceof Error) {
      if (error.message.includes('token') || error.message.includes('auth')) {
        return Response.json(
          {
            error: 'Blob storage authentication failed',
            details: 'Vercel Blob storage is not properly configured.'
          },
          { status: 503 }
        );
      }

      if (error.message.includes('Unsupported file type')) {
        return Response.json(
          {
            error: error.message,
            details: 'Please upload video (MP4, AVI, MOV, etc.) or audio (MP3, WAV, FLAC, etc.) files only.'
          },
          { status: 400 }
        );
      }
    }

    return Response.json(
      {
        error: 'Upload token generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
