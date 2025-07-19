import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, readFileSync, unlinkSync, existsSync, createReadStream, readdirSync } from 'fs';

// FFmpeg is not supported in Vercel serverless environment
// We'll process video files directly with Whisper API
const ffmpeg = null;
const ffmpegStatic = null;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranscribeRequest {
  blobUrl?: string;
  language?: string;
  targetLanguage?: string;
}

// Extended Whisper response type for verbose_json format
interface WhisperVerboseResponse {
  text: string;
  language: string;
  duration: number;
  segments: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}

// Helper: Download file from Vercel Blob URL
async function downloadFromBlobUrl(blobUrl: string): Promise<Buffer> {
  try {
    console.log('📥 Downloading file from Blob URL...');
    const response = await fetch(blobUrl);

    if (!response.ok) {
      throw new Error(`Failed to download from Blob: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    console.log(`✅ Downloaded: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`);
    return buffer;
  } catch (error) {
    console.error('Blob download error:', error);
    throw new Error(`Blob download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper: Extract audio from video using FFmpeg (fallback to original file if FFmpeg unavailable)
async function extractAudioFromVideo(videoBuffer: Buffer, outputFormat = 'mp3'): Promise<Buffer> {
  // FFmpeg is not available on Vercel serverless, return original buffer
  // Whisper API can handle video files directly
  console.log('🎵 FFmpeg not available in serverless environment, using original file for Whisper processing');
  return Promise.resolve(videoBuffer);
}

// Helper: Transcribe audio with OpenAI Whisper
async function transcribeWithWhisper(audioBuffer: Buffer, language?: string): Promise<WhisperVerboseResponse> {
  try {
    console.log('🎙️ Starting Whisper transcription...');

    // Create temporary file for Whisper API
    const tempAudioPath = join(tmpdir(), `whisper-audio-${Date.now()}.mp3`);
    writeFileSync(tempAudioPath, audioBuffer);

    const transcriptionParams: any = {
      file: createReadStream(tempAudioPath),
      model: 'whisper-1',
      response_format: 'verbose_json',
    };

    // Add language parameter if specified and valid
    if (language && language !== 'auto') {
      const validLanguages = [
        'af', 'ar', 'hy', 'az', 'be', 'bs', 'bg', 'ca', 'zh', 'hr', 'cs', 'da',
        'nl', 'en', 'et', 'fi', 'fr', 'gl', 'de', 'el', 'he', 'hi', 'hu', 'is',
        'id', 'it', 'ja', 'kn', 'kk', 'ko', 'lv', 'lt', 'mk', 'ms', 'ml', 'mt',
        'mi', 'mr', 'ne', 'no', 'fa', 'pl', 'pt', 'ro', 'ru', 'sr', 'sk', 'sl',
        'es', 'sw', 'sv', 'tl', 'ta', 'th', 'tr', 'uk', 'ur', 'vi', 'cy'
      ];

      if (validLanguages.includes(language)) {
        transcriptionParams.language = language;
        console.log(`🌍 Using language: ${language}`);
      }
    }

    const transcription = await openai.audio.transcriptions.create(transcriptionParams) as WhisperVerboseResponse;

    // Cleanup temporary file
    if (existsSync(tempAudioPath)) {
      unlinkSync(tempAudioPath);
    }

    console.log(`✅ Whisper transcription completed: ${transcription.segments?.length || 0} segments`);
    return transcription;

  } catch (error) {
    console.error('❌ Whisper transcription error:', error);
    throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper: Advanced GPT-4o Subtitle Translation with Cultural Intelligence
async function translateWithGPT4o(text: string, targetLanguage: string, context?: { previousSegments?: string[], nextSegments?: string[] }): Promise<{ translation: string, confidence: number, culturalAdaptations?: string[] }> {
  try {
    const languageMap: { [key: string]: string } = {
      'zh': '中文（简体）',
      'zh-TW': '中文（繁體）',
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'ja': '日本語',
      'ko': '한국어',
      'ar': 'العربية',
      'ru': 'Русский',
      'pt': 'Português',
      'it': 'Italiano',
      'hi': 'हिन्दी',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
      'nl': 'Nederlands',
      'sv': 'Svenska',
      'da': 'Dansk',
      'no': 'Norsk',
      'fi': 'Suomi',
      'pl': 'Polski',
      'tr': 'Türkçe',
      'id': 'Bahasa Indonesia',
      'ms': 'Bahasa Melayu',
      'uk': 'Українська',
      'cs': 'Čeština'
    };

    const targetLangName = languageMap[targetLanguage] || targetLanguage;

    // Enhanced system prompt with cultural intelligence
    const systemPrompt = `You are an AI subtitle translation expert specializing in ${targetLangName} with deep cultural and linguistic knowledge. Your mission is to create professional, culturally-aware subtitle translations.

🎯 **Core Translation Principles:**
• Preserve original meaning while adapting to target culture
• Maintain emotional resonance and speaker intent
• Optimize for subtitle reading speed (40-50 characters max per line)
• Use natural, contemporary language patterns
• Consider audience demographics and cultural context

📺 **Subtitle-Specific Requirements:**
• Maximum 2 lines per subtitle block
• Prefer active voice and concise expression
• Synchronize with speech rhythm and pacing
• Avoid overly literal translations that sound unnatural
• Maintain consistent terminology throughout dialogue

🌍 **Cultural Intelligence Guidelines:**
• Adapt idioms, metaphors, and cultural references appropriately
• Use region-specific terminology and expressions
• Consider local humor styles and communication patterns
• Respect cultural sensitivities and social norms
• Maintain character voice and personality traits

🔧 **Technical Excellence:**
• Ensure proper grammar and punctuation for target language
• Use appropriate formality levels based on context
• Maintain consistency in names, titles, and technical terms
• Consider subtitle timing constraints (reading speed ~180 words/minute)

${context?.previousSegments ? `\n🔗 **Context Awareness:**\nPrevious dialogue: "${context.previousSegments.join(' ')}"` : ''}

Please translate this subtitle text to ${targetLangName}:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest GPT-4o model for maximum intelligence
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Text to translate: "${text}"\n\nProvide ONLY the translated text without explanations or formatting.`
        }
      ],
      max_tokens: 400,
      temperature: 0.1, // Very low temperature for consistent, professional translations
      presence_penalty: 0.05,
      frequency_penalty: 0.1,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      console.warn('⚠️ GPT-4o returned empty translation, using original text');
      return { translation: text, confidence: 0.1 };
    }

    // Calculate confidence based on translation quality indicators
    const confidence = calculateTranslationConfidence(text, translatedText, targetLanguage);

    console.log(`🧠 GPT-4o AI Translation [${confidence.toFixed(2)}]: "${text}" → "${translatedText}"`);

    return {
      translation: translatedText,
      confidence,
      culturalAdaptations: detectCulturalAdaptations(text, translatedText)
    };

  } catch (error) {
    console.error('❌ GPT-4o translation error:', error);

    // Intelligent fallback strategy
    try {
      console.log('🔄 Attempting GPT-4 Turbo fallback...');
      const fallbackCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional subtitle translator. Translate the following text to ${targetLanguage}. Keep it natural, concise, and suitable for subtitles. Maximum 2 lines.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 250,
        temperature: 0.2,
      });

      const fallbackTranslation = fallbackCompletion.choices[0]?.message?.content?.trim() || text;
      console.log(`🔄 GPT-4 Turbo fallback: "${text}" → "${fallbackTranslation}"`);

      return {
        translation: fallbackTranslation,
        confidence: 0.7 // Lower confidence for fallback
      };

    } catch (fallbackError) {
      console.error('❌ All AI translation models failed:', fallbackError);
      return {
        translation: text,
        confidence: 0.1 // Very low confidence for no translation
      };
    }
  }
}

// Helper: Calculate translation confidence score
function calculateTranslationConfidence(original: string, translated: string, targetLanguage: string): number {
  let confidence = 0.85; // Base confidence for GPT-4o

  // Length ratio check (good translations should have reasonable length ratios)
  const lengthRatio = translated.length / original.length;
  if (lengthRatio < 0.3 || lengthRatio > 3.0) {
    confidence -= 0.15; // Penalize extreme length differences
  }

  // Check for preserved proper nouns and numbers
  const originalNumbers = original.match(/\d+/g) || [];
  const translatedNumbers = translated.match(/\d+/g) || [];
  if (originalNumbers.length !== translatedNumbers.length) {
    confidence -= 0.05; // Slight penalty for number mismatches
  }

  // Bonus for reasonable subtitle length (40-50 chars per line)
  const lines = translated.split('\n');
  const allLinesGoodLength = lines.every(line => line.length <= 50);
  if (allLinesGoodLength) {
    confidence += 0.05;
  }

  // Ensure confidence is within valid range
  return Math.max(0.1, Math.min(0.99, confidence));
}

// Helper: Detect cultural adaptations made in translation
function detectCulturalAdaptations(original: string, translated: string): string[] {
  const adaptations: string[] = [];

  // This is a simplified version - could be enhanced with more sophisticated analysis
  if (original.length > 0 && translated.length > 0) {
    // Check for cultural reference adaptations
    const culturalMarkers = ['Mr.', 'Mrs.', 'Dr.', '$', '%', 'AM', 'PM'];
    const hasAdaptations = culturalMarkers.some(marker =>
      original.includes(marker) && !translated.includes(marker)
    );

    if (hasAdaptations) {
      adaptations.push('Cultural references adapted');
    }
  }

  return adaptations;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🚀 Starting large video transcription process...');

  try {
    // Check API key configuration
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured on server' },
        { status: 500 }
      );
    }

    // Parse request body
    let requestData: TranscribeRequest;
    let fileBuffer: Buffer;

    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      // Blob URL workflow
      requestData = await request.json();

      if (!requestData.blobUrl) {
        return NextResponse.json(
          { error: 'Blob URL is required for large file processing' },
          { status: 400 }
        );
      }

      // Download file from Vercel Blob
      fileBuffer = await downloadFromBlobUrl(requestData.blobUrl);

    } else if (contentType?.includes('multipart/form-data')) {
      // Direct upload fallback (for smaller files)
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      fileBuffer = Buffer.from(await file.arrayBuffer());
      requestData = {
        language: formData.get('language') as string,
        targetLanguage: formData.get('targetLanguage') as string
      };

      console.log(`📁 Direct upload: ${file.name} (${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Use JSON with blobUrl or multipart/form-data' },
        { status: 400 }
      );
    }

    const fileSizeMB = fileBuffer.length / 1024 / 1024;
    console.log(`📊 Processing file: ${fileSizeMB.toFixed(1)}MB`);

    // Soft limit warning for very large files
    if (fileSizeMB > 100) {
      console.log(`⚠️ Large file detected: ${fileSizeMB.toFixed(1)}MB - Processing may take several minutes`);
    }

    // Step 1: Extract audio from video
    let audioBuffer: Buffer;
    try {
      audioBuffer = await extractAudioFromVideo(fileBuffer);
    } catch (extractionError) {
      console.log('📱 Audio extraction failed, treating as audio file...');
      audioBuffer = fileBuffer; // Assume it's already an audio file
    }

    // Step 2: Transcribe with OpenAI Whisper
    const transcription = await transcribeWithWhisper(audioBuffer, requestData.language);

    // Step 3: Process segments and add translations
    const segments = [];

    if (transcription.segments && transcription.segments.length > 0) {
      console.log(`📝 Processing ${transcription.segments.length} segments...`);

      for (let i = 0; i < transcription.segments.length; i++) {
        const segment = transcription.segments[i];

        if (!segment.text?.trim()) continue; // Skip empty segments

        let translation: string | undefined;
        let translationConfidence: number | undefined;

        // Add intelligent GPT-4o translation if target language is specified
        if (requestData.targetLanguage &&
            requestData.targetLanguage !== requestData.language &&
            requestData.targetLanguage !== 'auto') {

          try {
            console.log(`🧠 GPT-4o translating segment ${i + 1}/${transcription.segments.length}...`);

            // Provide context for better translation
            const context = {
              previousSegments: i > 0 ? [transcription.segments[i-1]?.text] : undefined,
              nextSegments: i < transcription.segments.length - 1 ? [transcription.segments[i+1]?.text] : undefined
            };

            const translationResult = await translateWithGPT4o(segment.text, requestData.targetLanguage, context);
            translation = translationResult.translation;
            translationConfidence = translationResult.confidence;

            if (translationResult.culturalAdaptations && translationResult.culturalAdaptations.length > 0) {
              console.log(`🌍 Cultural adaptations: ${translationResult.culturalAdaptations.join(', ')}`);
            }

          } catch (translationError) {
            console.error(`❌ GPT-4o translation failed for segment ${i}:`, translationError);
            // Continue without translation
          }
        }

        segments.push({
          id: `segment-${i}`,
          text: segment.text.trim(),
          translation,
          translationConfidence,
          startTime: segment.start || 0,
          endTime: segment.end || (segment.start || 0) + 3,
          confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.9
        });
      }
    } else {
      console.log('⚠️ No segments found in transcription');
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Processing completed in ${processingTime}s: ${segments.length} segments generated`);

    return NextResponse.json({
      success: true,
      segments,
      duration: transcription.duration || 0,
      language: transcription.language || requestData.language || 'unknown',
      segmentCount: segments.length,
      processingTimeSeconds: parseFloat(processingTime),
      fileSizeMB: fileSizeMB.toFixed(1)
    });

  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ Transcription failed after ${processingTime}s:`, error);

    // Cleanup any temporary files that might be left
    try {
      const tempFiles = readdirSync(tmpdir())
        .filter((f: string) => f.includes('video-input-') || f.includes('audio-output-') || f.includes('whisper-audio-'));

      tempFiles.forEach((file: string) => {
        try {
          unlinkSync(join(tmpdir(), file));
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError);
        }
      });
    } catch (cleanupError) {
      console.warn('Temp file cleanup failed:', cleanupError);
    }

    return NextResponse.json(
      {
        error: 'Video transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTimeSeconds: parseFloat(processingTime),
        suggestion: 'Try a smaller file or different format. For very large files, ensure stable internet connection.'
      },
      { status: 500 }
    );
  }
}

// Increase timeout for large video processing
export const config = {
  maxDuration: 300, // 5 minutes for very large files
};
