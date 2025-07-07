import React, { useState, useRef } from 'react';
import { Upload, Mic, MicOff, Play, Pause, Square, FileAudio, X, AlertCircle, Brain, Key } from 'lucide-react';
import { speechService } from '../services/speechService';
import { isConfigured } from '../config/aiConfig';

interface RecordInterviewProps {
  onAnalyze: (audioData: { file?: File; duration?: number; transcript?: string }) => void;
}

const RecordInterview: React.FC<RecordInterviewProps> = ({ onAnalyze }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const aiConfigured = isConfigured();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up MediaRecorder for audio recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Set up Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        let finalTranscript = '';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart + ' ';
            } else {
              interimTranscript += transcriptPart;
            }
          }
          
          setTranscript(finalTranscript + interimTranscript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
        };
        
        recognition.start();
      } else {
        setError('Speech recognition not supported in this browser');
      }
      
      mediaRecorder.start(1000); // Record in 1 second chunks
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setTranscript('');
      
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const pauseRecording = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  };

  const resumeRecording = () => {
    setIsPaused(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
    
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'interview-recording.wav', { type: 'audio/wav' });
        
        // Analyze the recorded audio with transcript
        onAnalyze({ 
          file: audioFile, 
          duration: recordingTime, 
          transcript: transcript || 'No transcript available - speech recognition may not be supported'
        });
      };
    } else {
      // Fallback if no recording
      onAnalyze({ 
        duration: recordingTime, 
        transcript: transcript || 'No transcript available - speech recognition may not be supported'
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
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
      setIsTranscribing(true);
      setError(null);
      
      // Try to use AI speech-to-text service
      speechService.transcribeAudio(uploadedFile)
        .then((transcript) => {
          setIsTranscribing(false);
          onAnalyze({ 
            file: uploadedFile, 
            transcript: transcript
          });
        })
        .catch((error) => {
          console.warn('AI transcription failed:', error);
          setIsTranscribing(false);
          // Fallback to basic analysis
          onAnalyze({ 
            file: uploadedFile, 
            transcript: `Audio file "${uploadedFile.name}" uploaded. ${aiConfigured ? 'AI transcription failed - using basic analysis.' : 'Configure AI services for automatic transcription.'}`
          });
        });
    }
  };

  const renderAIStatus = () => (
    <div className={`mb-6 p-4 rounded-lg border ${aiConfigured ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center space-x-3">
        {aiConfigured ? (
          <>
            <Brain className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">AI Analysis Active</p>
              <p className="text-xs text-green-600">Using OpenAI GPT-4 for advanced interview analysis</p>
            </div>
          </>
        ) : (
          <>
            <Key className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">AI Configuration Required</p>
              <p className="text-xs text-yellow-600">Add VITE_OPENAI_API_KEY to .env file for advanced AI analysis</p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Record Your Interview</h2>
        <p className="text-lg text-gray-600">
          Upload an audio file or record a new interview for {aiConfigured ? 'AI-powered' : 'basic'} analysis
        </p>
      </div>

      {renderAIStatus()}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recording Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="text-center space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center relative">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-20"></div>
              )}
              <Mic className="w-16 h-16 text-white" />
            </div>
            
            {transcript && (
              <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Live Transcript:</h4>
                <p className="text-sm text-gray-600 text-left">{transcript}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="text-2xl font-mono font-bold text-gray-900">
                {formatTime(recordingTime)}
              </div>
              
              <div className="flex justify-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button
                      onClick={stopRecording}
                      className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Square className="w-4 h-4" />
                      <span>Stop</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">Upload Audio File</h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your audio file here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports MP3, WAV, M4A files
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                <button
                  onClick={analyzeUploadedFile}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  disabled={isTranscribing}
                >
                  {isTranscribing ? 'Processing Audio...' : 'Analyze Interview'}
                </button>
              </div>
            )}
            
            {isTranscribing && (
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm">Transcribing audio...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordInterview;