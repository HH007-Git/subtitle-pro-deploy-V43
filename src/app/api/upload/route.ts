import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log('🔐 Generating upload token for:', pathname);

        return {
          allowedContentTypes: [
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
            'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/flac'
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB limit
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('✅ Blob upload completed:', blob.url);
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    console.error('Upload handler error:', error);
    return Response.json(
      { error: 'Upload failed' },
      { status: 400 }
    );
  }
}
