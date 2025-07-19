import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Upload,
  Languages,
  FileText,
  Wand2,
  Globe,
  Clock,
  Download,
  Github,
  Star
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">SubtitlePro</span>
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-slate-600 hover:text-slate-900 transition-colors">
              Docs
            </Link>
            <Link href="/editor">
              <Button variant="outline" size="sm">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Connecting the World
            <br />
            <span className="text-slate-600">Frame by Frame</span>
          </h1>

          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            AI-powered Cinema-grade Bilingual Subtitles & Translation Generation
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/editor">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800">
                <Upload className="w-5 h-5 mr-2" />
                Upload Video
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Play className="w-5 h-5 mr-2" />
              View Demo
            </Button>
          </div>

          <p className="text-sm text-slate-500">
            Free trial • No credit card required • Process up to 15 minutes
          </p>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-75" />
                <p className="text-lg">Demo Video</p>
                <p className="text-sm opacity-75">See bilingual subtitles in action</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Precise Translation, Intelligent Processing
            </h2>
            <p className="text-xl text-slate-600">
              SubtitlePro Makes Videos Globally Accessible
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                  <Languages className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Cultural Localization</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Deliver translations with authentic expressions and cultural nuances for natural, localized content.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">AI-Powered Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Advanced AI models ensure precise transcription and translation with context awareness.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Perfect Timing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Automatically synchronized subtitles with precise timing and optimal reading speed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Multiple Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Export to SRT, VTT, and other popular subtitle formats for maximum compatibility.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                  <Globe className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">Global Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Support for 50+ languages to reach audiences worldwide with professional quality.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-cyan-50 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-cyan-600" />
                </div>
                <CardTitle className="text-xl">Easy Export</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Quick export and download options with batch processing for efficient workflow.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-slate-900">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Make Your Videos Global?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Start creating professional bilingual subtitles in minutes
          </p>
          <Link href="/editor">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              <Upload className="w-5 h-5 mr-2" />
              Start Creating Subtitles
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-white border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">SubtitlePro</span>
            </div>

            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">
                Terms of Service
              </Link>
              <div className="flex items-center space-x-2">
                <Github className="w-5 h-5 text-slate-600" />
                <span className="text-slate-600">Open Source</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-slate-500">
            <p>&copy; 2025 SubtitlePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
