import { openaiService } from '../services/openaiService';
import { openaiClient } from '../services/openaiClient';
import { isConfigured } from '../config/aiConfig';

// AI-powered interview analysis engine
export interface AnalysisMetrics {
  wordsPerMinute: number;
  fillerWords: number;
  confidenceScore: number;
  clarityScore: number;
  professionalismScore: number;
  relevanceScore: number;
}

export interface AnalysisFeedback {
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

export interface AnalysisResult {
  transcript: string;
  duration: number;
  metrics: AnalysisMetrics;
  feedback: AnalysisFeedback;
  aiPowered: boolean;
}

export async function analyzeInterview(transcript: string, duration: number, questionType?: string): Promise<AnalysisResult> {
  if (!transcript || transcript.trim().length === 0) {
    return createFallbackAnalysis(duration, questionType);
  }

  // Check if AI services are configured
  if (isConfigured()) {
    try {
      console.log('🤖 Using enhanced OpenAI client for interview analysis...');
      const aiResult = await openaiClient.analyzeInterview(transcript, duration, questionType);
      
      return {
        transcript,
        duration,
        metrics: aiResult.metrics,
        feedback: aiResult.feedback,
        aiPowered: true
      };
    } catch (error) {
      console.error('AI Analysis failed, falling back to basic analysis:', error);
      // Fall back to basic analysis if AI fails
      return createBasicAnalysis(transcript, duration, questionType);
    }
  } else {
    console.warn('⚠️ AI services not configured. Using basic rule-based analysis.');
    return createBasicAnalysis(transcript, duration, questionType);
  }
}

function createBasicAnalysis(transcript: string, duration: number, questionType?: string): AnalysisResult {
  const words = transcript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  const durationInMinutes = Math.max(duration / 60, 1);
  
  // Basic calculations
  const wordsPerMinute = Math.round(words.length / durationInMinutes);
  const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically'];
  const fillerWordCount = words.filter(word => 
    fillerWords.some(filler => word.includes(filler))
  ).length;

  // More sophisticated basic scoring based on content analysis
  const sentenceCount = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = words.length / Math.max(sentenceCount, 1);
  const hasNumbers = /\d/.test(transcript);
  const hasExamples = /example|instance|case|situation|experience/i.test(transcript);
  const hasActionWords = /achieved|accomplished|led|managed|created|improved|developed/i.test(transcript);
  const questionWords = transcript.match(/\b(what|when|where|why|how|who)\b/gi)?.length || 0;
  const complexSentences = transcript.split(/[.!?]+/).filter(s => s.split(',').length > 2).length;
  
  // Calculate scores based on actual content
  let confidenceScore = 50;
  if (hasExamples) confidenceScore += 15;
  if (hasActionWords) confidenceScore += 10;
  if (hasNumbers) confidenceScore += 10;
  if (fillerWordCount < words.length * 0.05) confidenceScore += 15;
  if (avgWordsPerSentence > 8 && avgWordsPerSentence < 20) confidenceScore += 10;
  
  let clarityScore = 50;
  if (sentenceCount > 2) clarityScore += 15;
  if (avgWordsPerSentence > 6 && avgWordsPerSentence < 25) clarityScore += 20;
  if (complexSentences > 0) clarityScore += 10;
  if (fillerWordCount < words.length * 0.08) clarityScore += 15;
  
  let professionalismScore = 60;
  if (transcript.match(/\b(experience|skills|project|team|challenge|solution)\b/gi)) professionalismScore += 15;
  if (hasActionWords) professionalismScore += 15;
  if (!transcript.match(/\b(awesome|cool|stuff|things)\b/gi)) professionalismScore += 10;
  if (hasNumbers) professionalismScore += 5;
  
  let relevanceScore = 50;
  if (hasExamples) relevanceScore += 20;
  if (hasNumbers) relevanceScore += 15;
  if (hasActionWords) relevanceScore += 10;
  if (words.length > 50) relevanceScore += 10;
  if (questionWords === 0) relevanceScore += 5; // No excessive questioning back
  
  // Cap scores at 100
  confidenceScore = Math.min(confidenceScore, 100);
  clarityScore = Math.min(clarityScore, 100);
  professionalismScore = Math.min(professionalismScore, 100);
  relevanceScore = Math.min(relevanceScore, 100);

  return {
    transcript,
    duration,
    metrics: {
      wordsPerMinute,
      fillerWords: fillerWordCount,
      confidenceScore: Math.round(confidenceScore),
      clarityScore: Math.round(clarityScore),
      professionalismScore: Math.round(professionalismScore),
      relevanceScore: Math.round(relevanceScore)
    },
    feedback: {
      strengths: [
        words.length > 100 ? "Comprehensive response with good detail" : "Concise and focused response",
        hasExamples ? "Used specific examples to support points" : "Clear communication style",
        fillerWordCount < words.length * 0.05 ? "Minimal use of filler words" : "Generally clear delivery",
        avgWordsPerSentence > 8 ? "Well-structured sentences" : "Concise expression"
      ],
      improvements: [
        !hasExamples ? "Include more specific examples to illustrate points" : "Continue providing concrete examples",
        fillerWordCount > words.length * 0.08 ? "Reduce filler words for more polished delivery" : "Maintain clear speaking pattern",
        !hasNumbers ? "Add quantifiable results when possible" : "Good use of specific data",
        words.length < 50 ? "Provide more detailed responses" : "Consider organizing longer responses better"
      ],
      suggestions: [
        `Configure AI services (OpenAI API key) for advanced analysis and personalized feedback${questionType ? ` for ${questionType} questions` : ''}`,
        "Practice the STAR method (Situation, Task, Action, Result) for structured responses",
        "Record practice sessions to track improvement over time",
        "Focus on incorporating specific metrics and achievements in your responses"
      ]
    },
    aiPowered: false
  };
}

function createFallbackAnalysis(duration: number, questionType?: string): AnalysisResult {
  return {
    transcript: "No transcript available. Please ensure your microphone is working and speech recognition is enabled.",
    duration,
    metrics: {
      wordsPerMinute: 0,
      fillerWords: 0,
      confidenceScore: 0,
      clarityScore: 0,
      professionalismScore: 0,
      relevanceScore: 0
    },
    feedback: {
      strengths: ["Recording session completed"],
      improvements: [
        "No audio content detected for analysis",
        "Ensure microphone permissions are granted",
        "Check if browser supports speech recognition"
      ],
      suggestions: [
        "Test microphone before recording",
        "Speak clearly and at normal volume",
        "Try recording in a quiet environment",
        `Configure AI services for advanced analysis${questionType ? ` of ${questionType} questions` : ''}`
      ]
    },
    aiPowered: false
  };
}