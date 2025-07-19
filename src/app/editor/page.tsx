"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Download,
  FileText,
  Trash2,
  Plus,
  Mic,
  AlertCircle,
  CheckCircle,
  Globe,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Brain,
  Activity
} from "lucide-react";
import Link from "next/link";

interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
  confidence?: number;
  translationConfidence?: number;
}

// API密钥现在由后端管理，前端不再需要

// 支持的语言列表（简化版）
const SUPPORTED_LANGUAGES = {
  'en': { name: 'English', nativeName: 'English' },
  'zh': { name: 'Chinese', nativeName: '中文' },
  'es': { name: 'Spanish', nativeName: 'Español' },
  'fr': { name: 'French', nativeName: 'Français' },
  'de': { name: 'German', nativeName: 'Deutsch' },
  'ja': { name: 'Japanese', nativeName: '日本語' },
  'ko': { name: 'Korean', nativeName: '한국어' },
  'ar': { name: 'Arabic', nativeName: 'العربية' },
  'ru': { name: 'Russian', nativeName: 'Русский' },
  'pt': { name: 'Portuguese', nativeName: 'Português' },
  'it': { name: 'Italian', nativeName: 'Italiano' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी' }
};

// 扩展的文件格式支持
const SUPPORTED_FORMATS = {
  video: {
    extensions: ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.flv', '.m4v', '.3gp', '.ogv'],
    mimeTypes: [
      'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
      'video/x-matroska', 'video/webm', 'video/x-ms-wmv', 'video/x-flv',
      'video/x-m4v', 'video/3gpp', 'video/ogg'
    ],
    maxSize: 500 * 1024 * 1024, // 500MB
    description: 'Video files (MP4, AVI, MOV, MKV, WebM, WMV, FLV, etc.)'
  },
  audio: {
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.opus', '.aiff'],
    mimeTypes: [
      'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac',
      'audio/ogg', 'audio/x-m4a', 'audio/x-ms-wma', 'audio/opus',
      'audio/aiff', 'audio/x-aiff'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    description: 'Audio files (MP3, WAV, FLAC, AAC, OGG, M4A, etc.)'
  }
};

// 文件验证辅助函数
const validateFile = (file: File): { isValid: boolean; error?: string; type?: 'video' | 'audio' } => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // 检查视频格式
  const isVideoByExtension = SUPPORTED_FORMATS.video.extensions.some(ext => fileName.endsWith(ext));
  const isVideoByMime = SUPPORTED_FORMATS.video.mimeTypes.some(mime => fileType.includes(mime.split('/')[1]));

  if (isVideoByExtension || isVideoByMime) {
    if (file.size > SUPPORTED_FORMATS.video.maxSize) {
      return {
        isValid: false,
        error: `Video file too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 500MB`
      };
    }
    return { isValid: true, type: 'video' };
  }

  // 检查音频格式
  const isAudioByExtension = SUPPORTED_FORMATS.audio.extensions.some(ext => fileName.endsWith(ext));
  const isAudioByMime = SUPPORTED_FORMATS.audio.mimeTypes.some(mime => fileType.includes(mime.split('/')[1]));

  if (isAudioByExtension || isAudioByMime) {
    if (file.size > SUPPORTED_FORMATS.audio.maxSize) {
      return {
        isValid: false,
        error: `Audio file too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: 100MB`
      };
    }
    return { isValid: true, type: 'audio' };
  }

  return {
    isValid: false,
    error: `Unsupported file format: ${fileName}\n\nSupported formats:\n• ${SUPPORTED_FORMATS.video.description}\n• ${SUPPORTED_FORMATS.audio.description}`
  };
};

// Enhanced Whisper Speech Service with Multi-format Support
class WhisperSpeechService {
  async transcribe(
    file: File | string, // File object or blob URL
    options: {
      language?: string;
      targetLanguage?: string;
      fileType?: 'video' | 'audio';
    } = {}
  ) {
    const apiEndpoint = '/api/transcribe';
    let requestBody: FormData | string;
    const headers: HeadersInit = {};

    if (typeof file === 'string') {
      // Blob URL workflow for large files
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify({
        blobUrl: file,
        language: options.language !== 'auto' ? options.language : undefined,
        targetLanguage: options.targetLanguage,
      });
    } else {
      // Direct file upload for smaller files
      const formData = new FormData();
      formData.append('file', file);

      if (options.language && options.language !== 'auto') {
        formData.append('language', options.language);
      }

      if (options.targetLanguage) {
        formData.append('targetLanguage', options.targetLanguage);
      }

      requestBody = formData;
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Create detailed error object
      const error = new Error(errorData.error || `Server error: ${response.status}`);
      (error as any).response = { json: () => Promise.resolve(errorData) };
      (error as any).details = errorData.details;
      (error as any).status = response.status;
      (error as any).suggestion = errorData.suggestion;

      throw error;
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Transcription failed');
    }

    return {
      segments: result.segments || [],
      duration: result.duration || 0,
      language: result.language || 'unknown',
      processingTime: result.processingTimeSeconds || 0,
      fileSizeMB: result.fileSizeMB || 'unknown'
    };
  }
}

// 统一翻译服务 - 生产API版本
class TranslationService {
  async translate(text: string, sourceLanguage: string, targetLanguage: string, provider: 'chatgpt' | 'mymemory' = 'chatgpt') {
    // 直接使用生产API端点
    const apiEndpoint = '/api/translate';

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
        provider
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Translation error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Translation failed');
    }

    return {
      translatedText: result.translatedText,
      confidence: result.confidence,
      provider: result.provider
    };
  }

  async translateBatch(texts: string[], sourceLanguage: string, targetLanguage: string, provider: 'chatgpt' | 'mymemory' = 'chatgpt') {
    // 直接使用生产API端点
    const apiEndpoint = '/api/translate';

    const response = await fetch(apiEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        sourceLanguage,
        targetLanguage,
        provider
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Batch translation error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Batch translation failed');
    }

    return result;
  }
}

export default function EditorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'video' | 'audio' | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [showBilingual, setShowBilingual] = useState(false);
  const [selectedTranslationProvider, setSelectedTranslationProvider] = useState("chatgpt");
  const [apiHealthStatus, setApiHealthStatus] = useState<any>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateFile(file);

    if (!validation.isValid) {
      setRecognitionError(validation.error || 'Invalid file');
      return;
    }

    console.log(`📁 Selected ${validation.type} file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

    setSelectedFile(file);
    setFileType(validation.type || null);
    setSubtitles([]);
    setRecognitionError(null);
    setRecognitionStatus("");
    setUploadProgress(0);

    // For large files, upload to Vercel Blob immediately
    if (file.size > 5 * 1024 * 1024) { // 5MB threshold (Vercel API limit safety)
      try {
        setIsUploading(true);
        setRecognitionStatus(`⬆️ Uploading large ${validation.type} file to cloud storage...`);

        await uploadToBlob(file);

        setRecognitionStatus(`✅ File uploaded successfully! Ready for AI processing.`);
      } catch (error) {
        console.error('Upload failed:', error);
        setRecognitionError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSelectedFile(null);
        setFileType(null);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, []);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  // Vercel Blob upload for large files using @vercel/blob client
  const uploadToBlob = useCallback(async (file: File): Promise<string> => {
    try {
      console.log(`🔄 Starting blob upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

      // Import Vercel Blob client
      const { upload } = await import('@vercel/blob/client');

      // Upload with basic progress simulation
      setUploadProgress(10);
      setRecognitionStatus(`⬆️ Starting upload... (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      setUploadProgress(100);
      setRecognitionStatus(`✅ Upload completed: ${blob.url}`);
      console.log(`✅ Blob upload completed: ${blob.url}`);
      return blob.url;
    } catch (error) {
      console.error('❌ Blob upload error:', error);
      throw new Error(`Blob upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const checkApiHealth = async () => {
    setIsCheckingApi(true);
    try {
      const response = await fetch('/api/debug-health');
      const data = await response.json();
      setApiHealthStatus(data);
    } catch (error) {
      setApiHealthStatus({
        status: 'error',
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsCheckingApi(false);
    }
  };



  const startWhisperRecognition = async () => {
    if (!selectedFile) {
      setRecognitionError("Please upload a video or audio file first");
      return;
    }

    setIsRecognizing(true);
    setRecognitionError(null);
    setSubtitles([]);

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    const isLargeFile = fileSizeMB > 5; // 5MB threshold for Vercel API limit

    try {
      const speechService = new WhisperSpeechService();

      // Set initial status based on file type and size
      if (isLargeFile) {
        setRecognitionStatus(`🧠 Processing large ${fileType} file with GPT-4o AI system...`);
      } else {
        setRecognitionStatus(`🎙️ Using OpenAI Whisper to recognize ${fileType} content...`);
      }

      let fileInput: File | string = selectedFile;

      // For large files, upload to blob first if not already done
      if (isLargeFile && typeof selectedFile === 'object') {
        setRecognitionStatus('⬆️ Uploading large file to cloud storage...');
        try {
          const blobUrl = await uploadToBlob(selectedFile);
          fileInput = blobUrl;
          setRecognitionStatus('✅ Upload complete. Starting AI processing...');
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          throw new Error(`Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      setRecognitionStatus(`🎙️ AI transcription in progress... (File: ${fileSizeMB.toFixed(1)}MB)`);

      const results = await speechService.transcribe(fileInput, {
        language: selectedLanguage === 'auto' ? undefined : selectedLanguage,
        targetLanguage: targetLanguage !== selectedLanguage ? targetLanguage : undefined,
        fileType: fileType || undefined
      });

      const newSubtitles: SubtitleEntry[] = results.segments.map((segment: any, index: number) => ({
        id: segment.id || `segment-${index}`,
        startTime: segment.startTime || 0,
        endTime: segment.endTime || 0,
        text: segment.text || '',
        translation: segment.translation,
        confidence: segment.confidence || 0.9,
        translationConfidence: segment.translationConfidence
      }));

      setSubtitles(newSubtitles);

      // Enhanced success message with processing details
      let successMessage = `✅ AI processing complete! Generated ${newSubtitles.length} subtitle segments`;
      if (results.processingTime) {
        successMessage += ` in ${results.processingTime}s`;
      }
      if (results.language && results.language !== 'unknown') {
        successMessage += ` (Detected: ${results.language})`;
      }

      setRecognitionStatus(successMessage);

      // Check if we have translations
      const hasTranslations = newSubtitles.some(sub => sub.translation);
      if (hasTranslations) {
        setShowBilingual(true);
        setTimeout(() => {
          setRecognitionStatus(`🎉 Complete! ${newSubtitles.length} subtitles with GPT-4o translations ready!`);
        }, 2000);
      }

    } catch (error: any) {
      console.error('❌ AI processing failed:', error);

      // Enhanced error handling with detailed messages
      let errorMessage = "AI processing failed";
      let errorDetails = "";

      if (error?.details) {
        errorDetails = error.details;
      }
      if (error?.suggestion) {
        errorDetails += `\n\nSuggestion: ${error.suggestion}`;
      }

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setRecognitionError(errorMessage + (errorDetails ? `\n\n${errorDetails}` : ""));
      setRecognitionStatus("");
    } finally {
      setIsRecognizing(false);
    }
  };

  const translateAllSubtitles = async (subtitlesToTranslate = subtitles) => {
    if (selectedLanguage === targetLanguage) {
      alert("请选择不同的源语言和目标语言进行翻译。");
      return;
    }

    setIsTranslating(true);
    setTranslationProgress(0);
    setRecognitionStatus(`🌐 正在翻译 ${subtitlesToTranslate.length} 个字幕...`);

    const totalSubtitles = subtitlesToTranslate.length;

    try {
      const translationService = new TranslationService();

      // 尝试批量翻译以提高效率
      const texts = subtitlesToTranslate.map(sub => sub.text);

      try {
        const batchResult = await translationService.translateBatch(
          texts,
          selectedLanguage,
          targetLanguage,
          selectedTranslationProvider as 'chatgpt' | 'mymemory'
        );

        // 处理批量翻译结果
        batchResult.results.forEach((result: any) => {
          const subtitle = subtitlesToTranslate[result.index];
          if (subtitle && result.success) {
            const translatedSubtitle = {
              ...subtitle,
              translation: result.translatedText,
              translationConfidence: result.confidence
            };

            setSubtitles(prev => prev.map(sub =>
              sub.id === subtitle.id ? translatedSubtitle : sub
            ));
          }
        });

        setTranslationProgress(100);

        if (batchResult.errors.length > 0) {
          console.warn(`${batchResult.errors.length} 个字幕翻译失败`);
        }

      } catch (batchError) {
        console.warn('批量翻译失败，改为逐个翻译:', batchError);

        // 如果批量翻译失败，改为逐个翻译
        for (let i = 0; i < subtitlesToTranslate.length; i++) {
          const subtitle = subtitlesToTranslate[i];

          try {
            const result = await translationService.translate(
              subtitle.text,
              selectedLanguage,
              targetLanguage,
              selectedTranslationProvider as 'chatgpt' | 'mymemory'
            );

            const translatedSubtitle = {
              ...subtitle,
              translation: result.translatedText,
              translationConfidence: result.confidence
            };

            setTranslationProgress(((i + 1) / totalSubtitles) * 100);

            setSubtitles(prev => prev.map(sub =>
              sub.id === subtitle.id ? translatedSubtitle : sub
            ));

          } catch (error) {
            console.error(`❌ 字幕翻译失败:`, subtitle.id, error);
          }

          // 在逐个翻译时添加延迟
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

    } catch (error) {
      console.error(`❌ 翻译服务失败:`, error);
      setRecognitionError(error instanceof Error ? error.message : "翻译服务失败");
    } finally {
      setIsTranslating(false);
      setShowBilingual(true);
      setRecognitionStatus(`✅ 翻译完成！`);
    }
  };

  const exportSRT = () => {
    if (subtitles.length === 0) {
      alert("No subtitles to export. Please generate subtitles first.");
      return;
    }

    let srtContent = "";
    subtitles.forEach((sub, index) => {
      const startTime = new Date(sub.startTime * 1000).toISOString().substr(11, 12).replace('.', ',');
      const endTime = new Date(sub.endTime * 1000).toISOString().substr(11, 12).replace('.', ',');

      let content = sub.text;
      if (showBilingual && sub.translation) {
        content = `${sub.text}\n${sub.translation}`;
      } else if (sub.translation && !showBilingual) {
        content = sub.translation;
      }

      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${content}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = showBilingual ? 'bilingual-subtitles.srt' : 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);

    alert("Subtitles exported successfully!");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addSubtitle = () => {
    const newSubtitle: SubtitleEntry = {
      id: Date.now().toString(),
      startTime: 0,
      endTime: 3,
      text: "New subtitle text"
    };
    setSubtitles([...subtitles, newSubtitle]);
  };

  const updateSubtitle = (id: string, field: keyof SubtitleEntry, value: string | number) => {
    setSubtitles(subtitles.map(sub =>
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const deleteSubtitle = (id: string) => {
    setSubtitles(subtitles.filter(sub => sub.id !== id));
  };

  const hasTranslations = subtitles.some(sub => sub.translation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">SubtitlePro</span>
            <Badge variant="secondary" className="ml-2">Core AI</Badge>
          </Link>

          <div className="flex items-center space-x-4">
            {hasTranslations && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBilingual(!showBilingual)}
              >
                {showBilingual ? (
                  <><ToggleRight className="w-4 h-4 mr-2" />Bilingual View</>
                ) : (
                  <><ToggleLeft className="w-4 h-4 mr-2" />Original Only</>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportSRT}>
              <Download className="w-4 h-4 mr-2" />
              Export SRT
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Core Functionality */}


          {/* Core AI System */}
          <Card className="border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-slate-800 flex items-center justify-center">
                <Brain className="w-6 h-6 mr-3 text-blue-600" />
                AI Subtitle Generation
              </CardTitle>
              <CardDescription className="text-slate-600 text-lg">
                OpenAI Whisper • GPT-4o Advanced Translation • Cultural Intelligence • Real-time Processing
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Enhanced Multi-format Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Step 1: Upload Media File</span>
              </CardTitle>
              <CardDescription>
                Upload your video or audio file to begin AI-powered subtitle generation with GPT-4o
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-300 hover:border-slate-400'
                    } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="space-y-4">
                        <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-blue-700">Uploading...</p>
                          <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                          <p className="text-sm text-blue-600">{uploadProgress}% complete</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-slate-400'}`} />
                        <p className="text-lg font-medium text-slate-700 mb-2">
                          Drop your media file here or click to browse
                        </p>
                        <div className="space-y-2 text-sm text-slate-500">
                          <p className="font-medium">Supported Video Formats:</p>
                          <p>MP4, AVI, MOV, MKV, WebM, WMV, FLV (up to 500MB)</p>
                          <p className="font-medium mt-3">Supported Audio Formats:</p>
                          <p>MP3, WAV, FLAC, AAC, OGG, M4A, WMA (up to 100MB)</p>
                          <p className="text-xs text-blue-600 mt-2">
                            💡 Files &gt; 5MB automatically use cloud storage for optimal processing
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={`${SUPPORTED_FORMATS.video.extensions.join(',')},${SUPPORTED_FORMATS.audio.extensions.join(',')}`}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      {fileType === 'video' ? (
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Mic className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{selectedFile.name}</p>
                        <div className="flex items-center space-x-3 text-sm text-slate-600">
                          <span>📁 {fileType?.toUpperCase()} file</span>
                          <span>📏 {(selectedFile.size / 1024 / 1024).toFixed(1)}MB</span>
                          {selectedFile.size > 5 * 1024 * 1024 && (
                            <Badge variant="secondary" className="text-xs">Large File</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileType(null);
                        setSubtitles([]);
                        setRecognitionStatus("");
                        setRecognitionError(null);
                      }}
                    >
                      Change File
                    </Button>
                  </div>

                  {fileType === 'video' && (
                    <video
                      ref={videoRef}
                      src={URL.createObjectURL(selectedFile)}
                      controls
                      className="w-full max-w-2xl mx-auto rounded-lg"
                    />
                  )}

                  {fileType === 'audio' && (
                    <audio
                      src={URL.createObjectURL(selectedFile)}
                      controls
                      className="w-full max-w-2xl mx-auto"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Configuration */}
          {selectedFile && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 2: AI Service Configuration</CardTitle>
                    <CardDescription>
                      Configure your AI services
                    </CardDescription>
                  </div>

                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="speech" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="speech">🎙️ Speech Recognition</TabsTrigger>
                    <TabsTrigger value="translation">🌐 Translation Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="speech" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Audio Language Detection</label>
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Auto-detect or select language" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            <SelectItem value="auto">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Auto-detect</span>
                                <span className="text-xs text-slate-500">(Recommended)</span>
                              </div>
                            </SelectItem>
                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                              <SelectItem key={code} value={code}>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{lang.name}</span>
                                  <span className="text-xs text-slate-500">({lang.nativeName})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-center">
                        <Button
                          onClick={startWhisperRecognition}
                          disabled={isRecognizing || isUploading}
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {isRecognizing ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />AI Processing...</>
                          ) : (
                            <>
                              <Brain className="w-5 h-5 mr-2" />
                              Generate Subtitles with AI
                            </>
                          )}
                        </Button>
                        {selectedFile && (
                          <p className="text-sm text-slate-600 mt-2">
                            Process {fileType} with OpenAI Whisper + GPT-4o translation
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="translation" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">Translation Target Language</label>
                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target language for translation" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                              <SelectItem key={code} value={code}>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{lang.name}</span>
                                  <span className="text-xs text-slate-500">({lang.nativeName})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium block mb-2">AI Translation Provider</label>
                        <Select value={selectedTranslationProvider} onValueChange={setSelectedTranslationProvider}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select translation provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chatgpt">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">GPT-4o Advanced</span>
                                <Badge variant="default" className="text-xs bg-gradient-to-r from-blue-500 to-purple-500">AI+</Badge>
                                <span className="text-xs text-slate-500">(Recommended)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="mymemory">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">MyMemory</span>
                                <Badge variant="secondary" className="text-xs">Free</Badge>
                                <span className="text-xs text-slate-500">(Fallback)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Status Messages */}
                {recognitionStatus && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      <span className="text-green-800">{recognitionStatus}</span>
                    </div>
                  </div>
                )}

                {recognitionError && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 mr-3 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-red-800 font-medium mb-1">处理失败</h4>
                        <div className="text-red-700 text-sm whitespace-pre-line mb-3">
                          {recognitionError}
                        </div>
                        {recognitionError.includes('Server error: 500') && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={checkApiHealth}
                              disabled={isCheckingApi}
                              className="border-red-300 text-red-700 hover:bg-red-100"
                            >
                              {isCheckingApi ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />检查中...</>
                              ) : (
                                <><Activity className="w-4 h-4 mr-2" />检查API状态</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {apiHealthStatus && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    apiHealthStatus.status === 'ok'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start">
                      {apiHealthStatus.status === 'ok' ? (
                        <CheckCircle className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 mr-3 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-medium mb-2 ${
                          apiHealthStatus.status === 'ok' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          API配置状态: {apiHealthStatus.status === 'ok' ? '正常' : '异常'}
                        </h4>
                        <div className="text-sm space-y-1">
                          <div>API密钥: {apiHealthStatus.configuration?.apiKeyExists ? '已配置' : '未配置'}</div>
                          <div>密钥格式: {apiHealthStatus.configuration?.apiKeyFormat || '无效'}</div>
                          {apiHealthStatus.configuration?.isDemo && (
                            <div className="text-red-600 font-medium">⚠️ 使用的是演示密钥，需要配置真实API密钥</div>
                          )}
                        </div>
                        {apiHealthStatus.recommendations?.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-sm font-medium mb-1">解决建议:</h5>
                            <ul className="text-sm space-y-1">
                              {apiHealthStatus.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Translation Status */}
                {isTranslating && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center mb-2">
                      <Globe className="w-5 h-5 mr-2 text-blue-600" />
                      <span className="text-blue-800 font-medium">Translating subtitles...</span>
                    </div>
                    <Progress value={translationProgress} className="w-full" />
                    <p className="text-sm text-blue-700 mt-1">{Math.round(translationProgress)}% complete</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Translation */}
          {subtitles.length > 0 && !hasTranslations && (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Step 3: AI Translation
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Translate your subtitles using advanced AI technology
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">Source:</span>
                      <Badge variant="outline">{SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SUPPORTED_LANGUAGES]?.name || selectedLanguage}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">Target:</span>
                      <Badge variant="default">{SUPPORTED_LANGUAGES[targetLanguage as keyof typeof SUPPORTED_LANGUAGES]?.name || targetLanguage}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-700">Provider:</span>
                      <Badge variant="secondary" className={selectedTranslationProvider === 'chatgpt' ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800' : ''}>
                        {selectedTranslationProvider === 'chatgpt' ? 'GPT-4o Advanced AI' : 'MyMemory'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={() => translateAllSubtitles()}
                    disabled={isTranslating || selectedLanguage === targetLanguage}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {isTranslating ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Translating...</>
                    ) : (
                      <><Globe className="w-5 h-5 mr-2" />Start AI Translation</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subtitle Editor */}
          {subtitles.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Step {hasTranslations ? '4' : '3'}: Review & Export Subtitles</CardTitle>
                  <CardDescription>
                    {subtitles.length} segments generated with AI
                    {hasTranslations && " • Translations available"}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={addSubtitle} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button size="sm" onClick={exportSRT} className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export SRT
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                {subtitles.map((subtitle) => (
                  <div key={subtitle.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="font-mono">{formatTime(subtitle.startTime)}</span>
                        <span>→</span>
                        <span className="font-mono">{formatTime(subtitle.endTime)}</span>
                        {subtitle.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {Math.round(subtitle.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSubtitle(subtitle.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <Textarea
                      value={subtitle.text}
                      onChange={(e) => updateSubtitle(subtitle.id, 'text', e.target.value)}
                      placeholder="Subtitle text..."
                      className="min-h-[60px]"
                    />

                    {subtitle.translation && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">GPT-4o Translation</span>
                          {subtitle.translationConfidence && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                subtitle.translationConfidence > 0.9
                                  ? 'border-green-400 text-green-700 bg-green-50'
                                  : subtitle.translationConfidence > 0.7
                                  ? 'border-blue-400 text-blue-700 bg-blue-50'
                                  : 'border-yellow-400 text-yellow-700 bg-yellow-50'
                              }`}
                            >
                              {Math.round(subtitle.translationConfidence * 100)}% AI Quality
                            </Badge>
                          )}
                        </div>
                        <Textarea
                          value={subtitle.translation}
                          onChange={(e) => updateSubtitle(subtitle.id, 'translation', e.target.value)}
                          placeholder="Translation..."
                          className="min-h-[60px] border-blue-200 bg-blue-50/50"
                        />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={subtitle.startTime}
                        onChange={(e) => updateSubtitle(subtitle.id, 'startTime', parseFloat(e.target.value))}
                        className="w-24 text-sm"
                        placeholder="Start"
                      />
                      <Input
                        type="number"
                        step="0.1"
                        value={subtitle.endTime}
                        onChange={(e) => updateSubtitle(subtitle.id, 'endTime', parseFloat(e.target.value))}
                        className="w-24 text-sm"
                        placeholder="End"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Success Message */}
          {hasTranslations && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-bold text-green-800 mb-2">
                  🎉 AI Subtitle Generation Complete!
                </h3>
                <p className="text-green-700 mb-4">
                  Your {fileType} file has been processed using OpenAI Whisper and intelligently translated with {selectedTranslationProvider === 'chatgpt' ? 'GPT-4o Advanced AI with cultural intelligence' : 'MyMemory'}.
                  Professional-quality subtitles are ready for export!
                </p>
                <div className="flex justify-center space-x-4">
                  <Button onClick={exportSRT} className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export Subtitles
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBilingual(!showBilingual)}
                  >
                    {showBilingual ? "Show Original Only" : "Show Bilingual"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
