import React, { useState, useRef, useEffect } from 'react';
import { Upload, Mic, MicOff, Play, Pause, Square, FileAudio, X, AlertCircle, Brain, Key, Settings, Volume2, RotateCcw, User, Trash2, Zap } from 'lucide-react';
import { audioService, AudioRecording } from '../services/audioService';
import { openaiClient } from '../services/openaiClient';
import { isConfigured } from '../config/aiConfig';
import TranscriptEditor from './TranscriptEditor';
import RoleSelector from './RoleSelector';

interface EnhancedRecordInterviewProps {
  onAnalyze: (audioData: { file?: File; duration?: number; transcript?: string; questionType?: string; userName?: string }) => void;
}

const ROLE_QUESTIONS = {
  'Software Engineer': [
    'Walk me through how you would design a scalable system for a high-traffic application.',
    'Describe a challenging bug you encountered and how you debugged it.',
    'How do you approach code reviews and ensure code quality?',
    'Tell me about a time when you had to learn a new technology quickly.'
  ],
  'Data Analyst': [
    'How would you approach analyzing a dataset to identify key business insights?',
    'Describe a time when your analysis influenced an important business decision.',
    'How do you ensure data quality and handle missing or inconsistent data?',
    'Walk me through your process for creating effective data visualizations.'
  ],
  'Product Manager': [
    'How do you prioritize features when you have limited development resources?',
    'Describe a time when you had to make a difficult product decision with incomplete information.',
    'How do you gather and incorporate user feedback into product development?',
    'Tell me about a product launch you managed and what you learned.'
  ],
  'Project Manager': [
    'How do you handle scope creep in a project?',
    'Describe a time when a project was at risk of missing its deadline.',
    'How do you manage stakeholder expectations across different teams?',
    'Tell me about a challenging team dynamic you had to navigate.'
  ],
  'Product Designer': [
    'Walk me through your design process from problem identification to final solution.',
    'How do you approach user research and incorporate findings into your designs?',
    'Describe a time when you had to advocate for a design decision.',
    'How do you balance user needs with business requirements?'
  ],
  'General': [
    'Tell me about yourself and why you\'re interested in this position.',
    'Describe a challenging situation at work and how you handled it.',
    'What are your greatest strengths and how do they relate to this role?',
    'Where do you see yourself in five years?'
  ]
};

const EnhancedRecordInterview: React.FC<EnhancedRecordInterviewProps> = ({ onAnalyze }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingQuality, setRecordingQuality] = useState<'standard' | 'high'>('high');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState('General');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userName, setUserName] = useState('');
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  
  const aiConfigured = isConfigured();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLevelRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioLevelRef.current) clearInterval(audioLevelRef.current);
      audioService.destroy();
    };
  }, []);

  // Update question when role changes
  useEffect(() => {
    const questions = ROLE_QUESTIONS[selectedRole as keyof typeof ROLE_QUESTIONS] || ROLE_QUESTIONS.General;
    setCurrentQuestion(questions[0]);
  }, [selectedRole]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      await audioService.startRecording();
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setTranscript('');
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Simulate audio level monitoring
      audioLevelRef.current = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      
      console.log('🎙️ Enhanced recording started');
    } catch (error: any) {
      console.error('Recording error:', error);
      setError(error.message);
    }
  };

  const pauseRecording = () => {
    audioService.pauseRecording();
    setIsPaused(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (audioLevelRef.current) {
      clearInterval(audioLevelRef.current);
    }
  };

  const resumeRecording = () => {
    audioService.resumeRecording();
    setIsPaused(false);
    
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    audioLevelRef.current = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);
  };

  const stopRecording = async () => {
    try {
      const recording: AudioRecording = await audioService.stopRecording();
      
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioLevelRef.current) clearInterval(audioLevelRef.current);
      
      // Create file from recording
      const audioFile = new File([recording.blob], 'interview-recording.wav', { type: 'audio/wav' });
      
      // Transcribe and analyze
      await transcribeAndAnalyze(audioFile, recording.duration);
      
    } catch (error: any) {
      console.error('Stop recording error:', error);
      setError(error.message);
    }
  };

  const transcribeAndAnalyze = async (audioFile: File, duration?: number) => {
    setIsTranscribing(true);
    setAnalysisLoading(true);
    setError(null);
    setTranscriptionProgress('Starting transcription...');
    
    try {
      console.log('🎯 Starting transcription and analysis...');
      
      setTranscriptionProgress('Transcribing audio with AI...');
      // Transcribe audio using Whisper
      const transcribedText = await openaiClient.transcribeAudio(audioFile);
      setTranscript(transcribedText);
      
      setTranscriptionProgress('Analyzing interview performance...');
      // Analyze the interview
      onAnalyze({ 
        file: audioFile, 
        duration: duration || recordingTime,
        transcript: transcribedText,
        questionType: selectedRole,
        userName: userName.trim() || undefined
      });
      
      setTranscriptionProgress('Analysis complete!');
      setTimeout(() => setTranscriptionProgress(''), 2000);
      
    } catch (error: any) {
      console.error('Transcription/Analysis error:', error);
      setError(`Processing failed: ${error.message}. ${error.message.includes('quota') ? 
        'Please check your OpenAI billing or try again later.' : 
        'Please try again or check your API configuration.'}`);
      
      // Fallback to basic analysis
      onAnalyze({ 
        file: audioFile, 
        duration: duration || recordingTime,
        transcript: 'Transcription failed - using audio analysis',
        questionType: selectedRole,
        userName: userName.trim() || undefined
      });
    } finally {
      setIsTranscribing(false);
      setAnalysisLoading(false);
      setTranscriptionProgress('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    
    if (audioFile) {
      setUploadedFile(audioFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const analyzeUploadedFile = () => {
    if (uploadedFile) {
      transcribeAndAnalyze(uploadedFile, undefined);
    }
  };

  const handleTranscriptChange = (newTranscript: string) => {
    setTranscript(newTranscript);
  };

  const handleReanalyzeWithTranscript = () => {
    if (transcript) {
      onAnalyze({
        duration: recordingTime,
        transcript: transcript,
        questionType: selectedRole,
        userName: userName.trim() || undefined
      });
    }
  };

  const resetSession = () => {
    // Clear all session data
    setTranscript('');
    setUploadedFile(null);
    setError(null);
    setRecordingTime(0);
    setShowTranscriptEditor(false);
    setTranscriptionProgress('');
    setAnalysisLoading(false);
    setIsTranscribing(false);
    setUserName('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log('🧹 Session completely reset');
  };

  const getRandomQuestion = () => {
    const questions = ROLE_QUESTIONS[selectedRole as keyof typeof ROLE_QUESTIONS] || ROLE_QUESTIONS.General;
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIndex]);
  };

  const renderAudioLevelMeter = () => (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div 
        className="bg-green-600 h-2 rounded-full transition-all duration-100"
        style={{ width: `${Math.min(audioLevel, 100)}%` }}
      />
    </div>
  );

  const renderPracticeQuestion = () => (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-blue-800">Practice Question</h4>
        <button
          onClick={getRandomQuestion}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-xs">New Question</span>
        </button>
      </div>
      <p className="text-blue-700 text-sm italic leading-relaxed">"{currentQuestion}"</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            AI-Powered Interview Practice
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Powered by OpenAI GPT-4 & Whisper</span>
            <Zap className="w-5 h-5 text-violet-500" />
          </div>
        </div>
        <p className="text-lg text-gray-600">
          Practice with real interview questions and get {aiConfigured ? 'AI-powered' : 'basic'} feedback
        </p>
      </div>

      {/* AI Status */}
      <div className={`mb-6 p-4 rounded-xl border-2 ${aiConfigured ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300'} shadow-lg`}>
        <div className="flex items-center space-x-3">
          {aiConfigured ? (
            <>
              <Brain className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">🚀 AI Analysis Active</p>
                <p className="text-xs text-emerald-700 font-medium">Using OpenAI Whisper + GPT-4 for advanced analysis</p>
              </div>
            </>
          ) : (
            <>
              <Key className="w-6 h-6 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-800">⚡ Configure AI for Best Results</p>
                <p className="text-xs text-amber-700 font-medium">Add VITE_OPENAI_API_KEY to .env file for transcription and advanced analysis</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* User Information */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-violet-200/50 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name for personalized reports"
                    className="w-full pl-10 pr-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white/80"
                  />
                </div>
              </div>

              {/* Reset Session */}
              <div className="flex items-end space-x-3">
                <button
                  onClick={resetSession}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 px-4 py-2 rounded-lg hover:from-red-200 hover:to-pink-200 transition-all duration-200 border border-red-200"
                >
                  <X className="w-4 h-4" />
                  <span>Clear All Data</span>
                </button>
                <button
                  onClick={resetSession}
                  className="flex items-center space-x-2 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-4 py-2 rounded-lg hover:from-violet-200 hover:to-purple-200 transition-all duration-200 border border-violet-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>New Session</span>
                </button>
              </div>
            </div>

            {/* Role Selector */}
            <RoleSelector
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
              disabled={isRecording || isTranscribing}
            />
          </div>
        </div>

        {/* Enhanced Recording Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-violet-200/50">
          <div className="space-y-6">
            {renderPracticeQuestion()}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Processing Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    {error.includes('quota') && (
                      <div className="mt-2 text-xs text-red-600">
                        <p>• Check your OpenAI billing status</p>
                        <p>• Verify your usage limits</p>
                        <p>• Try again later or use basic analysis mode</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="relative w-40 h-40 mx-auto">
                <div className={`w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center relative shadow-2xl shadow-violet-500/25 ${
                  isRecording ? 'animate-pulse' : ''
                }`}>
                  {isRecording && !isPaused && (
                    <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                  )}
                  {isPaused ? (
                    <Pause className="w-16 h-16 text-white" />
                  ) : isRecording ? (
                    <MicOff className="w-16 h-16 text-white animate-pulse" />
                  ) : (
                    <Mic className="w-16 h-16 text-white" />
                  )}
                </div>
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>

              {/* Audio Level Meter */}
              {isRecording && !isPaused && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500">Audio Level</span>
                  </div>
                  {renderAudioLevelMeter()}
                </div>
              )}
              
              <div className="text-3xl font-mono font-bold text-gray-900">
                {formatTime(recordingTime)}
              </div>
              
              {/* Recording Quality Selector */}
              <div className="flex items-center justify-center space-x-4 text-sm">
                <Settings className="w-4 h-4 text-gray-500" />
                <select 
                  value={recordingQuality}
                  onChange={(e) => setRecordingQuality(e.target.value as 'standard' | 'high')}
                  className="border rounded px-2 py-1 text-xs"
                  disabled={isRecording}
                >
                  <option value="standard">Standard Quality</option>
                  <option value="high">High Quality</option>
                </select>
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-red-500/25"
                    disabled={isTranscribing}
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-2 rounded-xl hover:from-amber-600 hover:to-yellow-600 transition-all duration-200 shadow-lg shadow-amber-500/25"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                      onClick={stopRecording}
                      className="flex items-center space-x-2 bg-gradient-to-r from-slate-600 to-gray-600 text-white px-4 py-2 rounded-xl hover:from-slate-700 hover:to-gray-700 transition-all duration-200 shadow-lg shadow-slate-500/25"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop & Analyze</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Transcript */}
            {transcript && (
              <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto border-l-4 border-green-500">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <h4 className="text-sm font-medium text-gray-700">Live Transcript:</h4>
                </div>
                <p className="text-sm text-gray-600 text-left leading-relaxed">{transcript}</p>
              </div>
            )}

            {/* Progress Indicator */}
            {(isTranscribing || analysisLoading) && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border-2 border-violet-200">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-800">
                      {transcriptionProgress || 'Processing...'}
                    </p>
                    <p className="text-xs text-violet-600 font-medium">
                      This may take 30-60 seconds for AI analysis
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Upload Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-violet-200/50">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">Upload Audio File</h3>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50'
                  : 'border-violet-300 hover:border-violet-400 hover:bg-violet-50/50'
              }`}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your audio file here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports MP3, WAV, M4A, FLAC files up to 25MB
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-violet-500/25"
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {uploadedFile && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileAudio className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Question type selector for uploaded files */}
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">
                    This file will be analyzed for: <strong>{selectedRole}</strong>
                  </p>
                </div>
                
                <button
                  onClick={analyzeUploadedFile}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-2 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                  disabled={isTranscribing}
                >
                  {isTranscribing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Processing Audio...</span>
                    </div>
                  ) : (
                    'Analyze Interview'
                  )}
                </button>
              </div>
            )}
            
            {(isTranscribing || analysisLoading) && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border-2 border-violet-200">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-600 border-t-transparent"></div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-violet-800">
                      {transcriptionProgress || 'Processing uploaded file...'}
                    </p>
                    <p className="text-xs text-violet-600 mt-1 font-medium">
                      AI transcription and analysis in progress
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transcript Editor Section */}
      {transcript && (
        <div className="mt-8">
          <div className="mb-4">
            <button
              onClick={() => setShowTranscriptEditor(!showTranscriptEditor)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>{showTranscriptEditor ? 'Hide' : 'Show'} Transcript Editor</span>
            </button>
          </div>
          
          {showTranscriptEditor && (
            <div className="space-y-4">
              <TranscriptEditor
                transcript={transcript}
                onTranscriptChange={handleTranscriptChange}
                isEditable={true}
              />
              
              <div className="flex justify-center">
                <button
                  onClick={handleReanalyzeWithTranscript}
                  className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-violet-500/25"
                  disabled={isTranscribing || analysisLoading}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Analyze Edited Transcript</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedRecordInterview;