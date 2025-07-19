import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TranslationRequest {
  text: string;
  texts?: string[];
  sourceLanguage: string;
  targetLanguage: string;
  provider?: 'chatgpt' | 'mymemory';
}

// Enhanced GPT-4o Translation with Cultural Intelligence
async function translateWithGPT4o(text: string, targetLanguage: string): Promise<{ translation: string, confidence: number, culturalAdaptations?: string[] }> {
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
      'fi': 'Suomi'
    };

    const targetLangName = languageMap[targetLanguage] || targetLanguage;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an elite subtitle translation specialist powered by GPT-4o, equipped with advanced cultural intelligence. Your expertise spans linguistic nuances, cultural adaptation, and subtitle optimization.

🎯 **Elite Translation Standards:**
• Preserve original meaning while ensuring cultural resonance
• Optimize for subtitle readability (40-50 characters per line max)
• Maintain emotional authenticity and speaker personality
• Use contemporary, natural language patterns
• Consider cultural context and audience expectations

📺 **Subtitle Mastery Guidelines:**
• Maximum 2 lines per subtitle segment
• Prioritize clarity and reading speed optimization
• Synchronize with natural speech rhythms
• Avoid literal translations that feel awkward
• Maintain character voice consistency

🌍 **Cultural Intelligence Protocol:**
• Intelligently adapt idioms, metaphors, and cultural references
• Use region-appropriate expressions and terminology
• Respect cultural sensitivities and communication styles
• Preserve humor intent while adapting delivery style
• Consider local social norms and linguistic preferences

🔧 **Technical Excellence:**
• Perfect grammar and punctuation for target language
• Appropriate formality levels based on context
• Consistent terminology throughout content
• Subtitle timing optimization (reading speed ~3 words/second)

Translate this subtitle text to ${targetLangName} with professional excellence:`
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 400,
      temperature: 0.1, // Maximum consistency and quality
      presence_penalty: 0.05,
      frequency_penalty: 0.1,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      console.warn('⚠️ GPT-4o returned empty translation');
      return { translation: text, confidence: 0.1 };
    }

    // Calculate advanced confidence score
    const confidence = calculateAdvancedConfidence(text, translatedText, targetLanguage);

    console.log(`🧠 GPT-4o Elite Translation [${confidence.toFixed(2)}]: "${text}" → "${translatedText}"`);

    return {
      translation: translatedText,
      confidence,
      culturalAdaptations: detectCulturalAdaptations(text, translatedText)
    };

  } catch (error) {
    console.error('❌ GPT-4o translation error:', error);

    // Intelligent fallback to GPT-4 Turbo
    try {
      console.log('🔄 GPT-4 Turbo fallback...');
      const fallbackCompletion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `Translate this subtitle text to ${targetLanguage}. Keep it natural and concise for subtitles.`
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
      return {
        translation: fallbackTranslation,
        confidence: 0.7 // Lower confidence for fallback
      };

    } catch (fallbackError) {
      console.error('❌ All AI models failed:', fallbackError);
      return {
        translation: text,
        confidence: 0.1
      };
    }
  }
}

// Advanced confidence calculation
function calculateAdvancedConfidence(original: string, translated: string, targetLanguage: string): number {
  let confidence = 0.88; // Base confidence for GPT-4o

  // Length ratio analysis
  const lengthRatio = translated.length / original.length;
  if (lengthRatio < 0.3 || lengthRatio > 3.5) {
    confidence -= 0.2;
  } else if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
    confidence += 0.05; // Bonus for reasonable length
  }

  // Number preservation check
  const originalNumbers = original.match(/\d+/g) || [];
  const translatedNumbers = translated.match(/\d+/g) || [];
  if (originalNumbers.length === translatedNumbers.length) {
    confidence += 0.03;
  } else {
    confidence -= 0.08;
  }

  // Subtitle length optimization (ideal: 40-50 chars per line)
  const lines = translated.split('\n');
  const optimalLength = lines.every(line => line.length <= 50 && line.length >= 10);
  if (optimalLength) {
    confidence += 0.05;
  }

  // Punctuation appropriateness
  const hasPunctuation = /[.!?]$/.test(translated.trim());
  const originalHasPunctuation = /[.!?]$/.test(original.trim());
  if (hasPunctuation === originalHasPunctuation) {
    confidence += 0.02;
  }

  return Math.max(0.1, Math.min(0.98, confidence));
}

// Cultural adaptation detection
function detectCulturalAdaptations(original: string, translated: string): string[] {
  const adaptations: string[] = [];

  // Cultural markers that might be adapted
  const culturalMarkers = [
    { pattern: /\b(Mr\.|Mrs\.|Ms\.|Dr\.)\b/g, type: 'Title adaptation' },
    { pattern: /\$\d+/g, type: 'Currency adaptation' },
    { pattern: /\b\d{1,2}:\d{2}\s?(AM|PM)\b/g, type: 'Time format adaptation' },
    { pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, type: 'Date format adaptation' }
  ];

  culturalMarkers.forEach(marker => {
    const originalMatches = original.match(marker.pattern);
    const translatedMatches = translated.match(marker.pattern);

    if (originalMatches && (!translatedMatches || originalMatches.length !== translatedMatches.length)) {
      adaptations.push(marker.type);
    }
  });

  return adaptations;
}

// MyMemory fallback (free service)
async function translateWithMyMemory(text: string, sourceLanguage: string, targetLanguage: string): Promise<{ translation: string, confidence: number }> {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`
    );

    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        translation: data.responseData.translatedText,
        confidence: Math.min(0.7, (data.responseData.match || 0.5))
      };
    }

    throw new Error('MyMemory translation failed');
  } catch (error) {
    console.error('❌ MyMemory translation error:', error);
    return { translation: text, confidence: 0.1 };
  }
}

// Single text translation endpoint
export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, sourceLanguage, targetLanguage, provider = 'chatgpt' } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    let result;

    if (provider === 'chatgpt') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }

      result = await translateWithGPT4o(text, targetLanguage);

      return NextResponse.json({
        success: true,
        translatedText: result.translation,
        confidence: result.confidence,
        culturalAdaptations: result.culturalAdaptations,
        provider: 'GPT-4o Advanced',
        processingTime: 0
      });

    } else if (provider === 'mymemory') {
      result = await translateWithMyMemory(text, sourceLanguage, targetLanguage);

      return NextResponse.json({
        success: true,
        translatedText: result.translation,
        confidence: result.confidence,
        provider: 'MyMemory',
        processingTime: 0
      });
    }

    return NextResponse.json(
      { error: 'Invalid translation provider' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      {
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Batch translation endpoint
export async function PUT(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { texts, sourceLanguage, targetLanguage, provider = 'chatgpt' } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: 'Texts array is required for batch translation' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results: any[] = [];
    const errors: any[] = [];

    if (provider === 'chatgpt') {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }

      // Process in batches for efficiency
      for (let i = 0; i < texts.length; i++) {
        try {
          const result = await translateWithGPT4o(texts[i], targetLanguage);
          results.push({
            index: i,
            success: true,
            translatedText: result.translation,
            confidence: result.confidence,
            culturalAdaptations: result.culturalAdaptations
          });
        } catch (error) {
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Translation failed'
          });
          results.push({
            index: i,
            success: false,
            translatedText: texts[i],
            confidence: 0.1
          });
        }

        // Progress log
        if (i % 10 === 0) {
          console.log(`🔄 GPT-4o batch progress: ${i + 1}/${texts.length}`);
        }
      }

    } else if (provider === 'mymemory') {
      for (let i = 0; i < texts.length; i++) {
        try {
          const result = await translateWithMyMemory(texts[i], sourceLanguage, targetLanguage);
          results.push({
            index: i,
            success: true,
            translatedText: result.translation,
            confidence: result.confidence
          });

          // Rate limiting for free service
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errors.push({
            index: i,
            error: error instanceof Error ? error.message : 'Translation failed'
          });
          results.push({
            index: i,
            success: false,
            translatedText: texts[i],
            confidence: 0.1
          });
        }
      }
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      results,
      errors,
      totalProcessed: texts.length,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length,
      processingTimeMs: processingTime,
      provider: provider === 'chatgpt' ? 'GPT-4o Advanced' : 'MyMemory'
    });

  } catch (error) {
    console.error('Batch translation API error:', error);
    return NextResponse.json(
      {
        error: 'Batch translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
