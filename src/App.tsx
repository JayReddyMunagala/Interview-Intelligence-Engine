import React, { useState } from 'react';
import Header from './components/Header';
import EnhancedRecordInterview from './components/EnhancedRecordInterview';
import AnalysisDashboard from './components/AnalysisDashboard';
import OnboardingWalkthrough from './components/OnboardingWalkthrough';
import PrivacyDisclosure from './components/PrivacyDisclosure';
import { analyzeInterview } from './utils/analysisEngine';
import { enhancedProgressService } from './services/enhancedProgressService';
import { openaiClient } from './services/openaiClient';
import { isConfigured } from './config/aiConfig';

interface AnalysisData {
  transcript: string;
  duration: number;
  userName?: string;
  targetRole?: string;
  metrics: {
    wordsPerMinute: number;
    fillerWords: number;
    confidenceScore: number;
    clarityScore: number;
    professionalismScore: number;
    relevanceScore: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  aiPowered?: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState('record');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [lastAnalysisInput, setLastAnalysisInput] = useState<{ transcript: string; duration: number; questionType?: string; userName?: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding for new users
    return !localStorage.getItem('interview_intelligence_onboarding_seen');
  });

  const handleAnalyze = async (audioData: { file?: File; duration?: number; transcript?: string; questionType?: string; userName?: string }) => {
    console.log('🎤 Starting interview analysis...');
    console.log('📊 AI Configured:', isConfigured());
    
    const transcript = audioData.transcript || '';
    const duration = audioData.duration || 0;
    
    // Store the input for re-analysis
    setLastAnalysisInput({ transcript, duration, questionType: audioData.questionType, userName: audioData.userName });
    
    try {
      const analysisResult = await analyzeInterview(transcript, duration, audioData.questionType);
      console.log('✅ Analysis complete:', { aiPowered: analysisResult.aiPowered });

      // Calculate overall score for progress tracking
      const overallScore = Math.round(
        (analysisResult.metrics.confidenceScore + 
         analysisResult.metrics.clarityScore + 
         analysisResult.metrics.professionalismScore + 
         analysisResult.metrics.relevanceScore) / 4
      );

      // Save to enhanced progress history
      enhancedProgressService.saveDetailedSession({
        duration: analysisResult.duration,
        transcript: analysisResult.transcript,
        questionType: audioData.questionType || 'General',
        overallScore,
        detailedMetrics: {
          ...analysisResult.metrics,
          emotionalIntelligence: 75, // Will be enhanced with AI
          structureScore: 70
        },
        feedback: analysisResult.feedback,
        detailedAnalysis: {
          speechPattern: 'Analysis in progress...',
          contentQuality: 'Analysis in progress...',
          professionalPresence: 'Analysis in progress...',
          improvementPlan: []
        },
        aiPowered: analysisResult.aiPowered
      });

      // Update progress stats

      setAnalysisData({
        ...analysisResult,
        userName: audioData.userName,
        targetRole: audioData.questionType,
        aiPowered: analysisResult.aiPowered
      });
      setActiveTab('analyze');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      // Show error state or fallback
    }
  };

  const handleReanalyze = async () => {
    if (!lastAnalysisInput) {
      console.error('No previous analysis data to re-analyze');
      return;
    }
    
    console.log('🔄 Re-analyzing interview...');
    await handleAnalyze({
      transcript: lastAnalysisInput.transcript,
      duration: lastAnalysisInput.duration,
      questionType: lastAnalysisInput.questionType,
      userName: lastAnalysisInput.userName
    });
  };


  const handleCloseOnboarding = () => {
    localStorage.setItem('interview_intelligence_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'record':
        return <EnhancedRecordInterview onAnalyze={handleAnalyze} />;
      case 'analyze':
        return analysisData ? (
          <AnalysisDashboard 
            analysisData={analysisData} 
            onReanalyze={lastAnalysisInput ? handleReanalyze : undefined}
          />
        ) : (
          <div className="max-w-4xl mx-auto p-6 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Analysis Available</h3>
              <p className="text-gray-600 mb-6">
                Record or upload an interview to see detailed AI-powered analysis and feedback.
              </p>
              <button
                onClick={() => setActiveTab('record')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Recording
              </button>
            </div>
          </div>
        );
      default:
        return <EnhancedRecordInterview onAnalyze={handleAnalyze} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-cyan-50">
      <OnboardingWalkthrough 
        isOpen={showOnboarding} 
        onClose={handleCloseOnboarding} 
      />
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pb-8">
        {renderContent()}
      </main>
      <PrivacyDisclosure />
    </div>
  );
}

export default App;