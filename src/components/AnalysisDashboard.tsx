import React from 'react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, MessageSquare, Award, Download, RefreshCw, Brain, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { exportService } from '../services/exportService';

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

interface AnalysisDashboardProps {
  analysisData: AnalysisData;
  onReanalyze?: () => void;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysisData, onReanalyze }) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [reanalyzeLoading, setReanalyzeLoading] = useState(false);

  const scoreData = [
    { name: 'Confidence', value: analysisData.metrics.confidenceScore, color: '#3B82F6' },
    { name: 'Clarity', value: analysisData.metrics.clarityScore, color: '#10B981' },
    { name: 'Professionalism', value: analysisData.metrics.professionalismScore, color: '#8B5CF6' },
    { name: 'Relevance', value: analysisData.metrics.relevanceScore, color: '#F59E0B' },
  ];

  const fillerWordData = [
    { word: 'Um', count: 12 },
    { word: 'Uh', count: 8 },
    { word: 'Like', count: 15 },
    { word: 'You know', count: 6 },
    { word: 'So', count: 10 },
  ];

  const overallScore = Math.round(
    (analysisData.metrics.confidenceScore + 
     analysisData.metrics.clarityScore + 
     analysisData.metrics.professionalismScore + 
     analysisData.metrics.relevanceScore) / 4
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const exportReport = () => {
    setExportLoading(true);
    const reportData = {
      title: 'Interview Analysis Report',
      date: new Date().toISOString().split('T')[0],
      userName: analysisData.userName,
      targetRole: analysisData.targetRole,
      analysisType: analysisData.aiPowered ? 'AI-Powered Analysis (OpenAI GPT-4)' : 'Basic Rule-Based Analysis',
      overallScore,
      duration: `${Math.floor(analysisData.duration / 60)}:${(analysisData.duration % 60).toString().padStart(2, '0')}`,
      metrics: analysisData.metrics,
      feedback: analysisData.feedback,
      transcript: analysisData.transcript
    };
    
    // Export as JSON
    exportService.exportToJSON(reportData);
    
    setExportLoading(false);
    setExportSuccess('JSON report exported successfully!');
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const exportToPDF = async () => {
    setExportLoading(true);
    const reportData = {
      title: 'Interview Analysis Report',
      date: new Date().toISOString().split('T')[0],
      userName: analysisData.userName,
      targetRole: analysisData.targetRole,
      analysisType: analysisData.aiPowered ? 'AI-Powered Analysis (OpenAI GPT-4)' : 'Basic Rule-Based Analysis',
      overallScore,
      duration: `${Math.floor(analysisData.duration / 60)}:${(analysisData.duration % 60).toString().padStart(2, '0')}`,
      metrics: analysisData.metrics,
      feedback: analysisData.feedback,
      transcript: analysisData.transcript
    };
    
    // Find the first chart element for inclusion in PDF
    const chartElement = document.querySelector('.recharts-responsive-container') as HTMLElement;
    
    try {
      await exportService.exportToPDF(reportData, chartElement);
      setExportSuccess('PDF report exported successfully!');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleReanalyze = () => {
    if (onReanalyze) {
      setReanalyzeLoading(true);
      onReanalyze();
      // Reset loading state after a delay (will be handled by parent component)
      setTimeout(() => setReanalyzeLoading(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Interview Analysis</h2>
              {(analysisData.userName || analysisData.targetRole) && (
                <div className="flex items-center space-x-4 mt-1">
                  {analysisData.userName && (
                    <span className="text-sm text-gray-600">
                      <strong>Candidate:</strong> {analysisData.userName}
                    </span>
                  )}
                  {analysisData.targetRole && (
                    <span className="text-sm text-gray-600">
                      <strong>Role:</strong> {analysisData.targetRole}
                    </span>
                  )}
                </div>
              )}
            </div>
            {analysisData.aiPowered ? (
              <div className="flex items-center space-x-1 bg-green-100 px-3 py-1 rounded-full">
                <Brain className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">AI Powered</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">Basic Analysis</span>
              </div>
            )}
          </div>
          <p className="text-lg text-gray-600">
            {analysisData.aiPowered ? 'AI-powered insights using OpenAI GPT-4' : 'Basic rule-based analysis - configure AI for advanced insights'}
          </p>
        </div>
        <div className="flex space-x-3">
          {/* Success notification */}
          {exportSuccess && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 px-3 py-2 rounded-xl border-2 border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{exportSuccess}</span>
            </div>
          )}
          
          <button 
            onClick={exportReport}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-emerald-500/25"
            disabled={exportLoading}
          >
            {exportLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{exportLoading ? 'Exporting...' : 'Export JSON'}</span>
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-violet-500/25"
            disabled={exportLoading}
          >
            {exportLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{exportLoading ? 'Generating...' : 'Export PDF'}</span>
          </button>
          <button 
            onClick={handleReanalyze}
            disabled={!onReanalyze || reanalyzeLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-slate-600 to-gray-600 text-white px-4 py-2 rounded-xl hover:from-slate-700 hover:to-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-500/25"
          >
            {reanalyzeLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{reanalyzeLoading ? 'Re-analyzing...' : 'Re-analyze'}</span>
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className={`bg-white rounded-2xl shadow-lg p-6 border ${getScoreBg(overallScore)}`}>
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Award className="w-8 h-8 text-gray-600" />
            <h3 className="text-2xl font-bold text-gray-900">Overall Score</h3>
          </div>
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </div>
          <p className="text-lg text-gray-600">
            {overallScore >= 80 ? 'Excellent Performance!' : 
             overallScore >= 60 ? 'Good Performance' : 
             'Room for Improvement'}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Speaking Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analysisData.metrics.wordsPerMinute}</p>
              <p className="text-xs text-gray-500">words/min</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Filler Words</p>
              <p className="text-2xl font-bold text-gray-900">{analysisData.metrics.fillerWords}</p>
              <p className="text-xs text-gray-500">total count</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(analysisData.duration / 60)}:{(analysisData.duration % 60).toString().padStart(2, '0')}</p>
              <p className="text-xs text-gray-500">minutes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{analysisData.metrics.confidenceScore}%</p>
              <p className="text-xs text-gray-500">score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Scores */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filler Words */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Filler Words Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fillerWordData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="word" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feedback Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Strengths */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-green-600 mb-4">✓ Strengths</h3>
          <ul className="space-y-3">
            {analysisData.feedback.strengths.map((strength, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{strength}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-orange-600 mb-4">⚠ Areas for Improvement</h3>
          <ul className="space-y-3">
            {analysisData.feedback.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{improvement}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">💡 Suggestions</h3>
          <ul className="space-y-3">
            {analysisData.feedback.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{suggestion}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Interview Transcript</h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {analysisData.transcript}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;