import axios from 'axios';
import { AI_CONFIG } from '../config/aiConfig';

export interface OpenAIAnalysisResult {
  metrics: {
    wordsPerMinute: number;
    fillerWords: number;
    confidenceScore: number;
    clarityScore: number;
    professionalismScore: number;
    relevanceScore: number;
    emotionalIntelligence: number;
    structureScore: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
    specificTips: string[];
  };
  detailedAnalysis: {
    speechPattern: string;
    contentQuality: string;
    professionalPresence: string;
    improvementPlan: string[];
  };
}

class OpenAIClientService {
  private client: any;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Validate file size (Whisper has a 25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      throw new Error('Audio file too large. Please use files smaller than 25MB.');
    }

    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json');
      formData.append('temperature', '0.2'); // Slightly higher for better accuracy
      formData.append('prompt', 'This is an interview response. Please transcribe accurately including professional terminology.');

      console.log('🎙️ Transcribing audio with Whisper...');
      console.log(`📁 File size: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB`);

      const response = await axios.post(`${this.baseURL}/audio/transcriptions`, formData, {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });

      const transcription = response.data.text || 'No transcription available';
      console.log(`✅ Transcription complete: ${transcription.length} characters`);
      
      // Basic validation of transcription quality
      if (transcription.length < 10) {
        console.warn('⚠️ Short transcription detected - audio may have been unclear');
      }

      return transcription;
    } catch (error: any) {
      console.error('Whisper transcription error:', error);
      
      // More specific error messages
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI configuration.');
      } else if (error.response?.data?.error?.message?.includes('quota')) {
        throw new Error('OpenAI quota exceeded. Please check your billing or try again later.');
      } else {
        throw new Error(`Transcription failed: ${error.response?.data?.error?.message || error.message}`);
      }
    }
  }

  async analyzeInterview(transcript: string, duration: number, questionType?: string): Promise<OpenAIAnalysisResult> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const wordsPerMinute = this.calculateWPM(transcript, duration);
    const fillerWordCount = this.countFillerWords(transcript);

    const prompt = this.buildAnalysisPrompt(transcript, duration, wordsPerMinute, fillerWordCount, questionType);

    try {
      console.log('🤖 Analyzing interview with GPT-4...');

      const response = await this.client.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach and communication specialist with 15+ years of experience. You provide detailed, actionable feedback on interview performance focusing on confidence, clarity, professionalism, relevance, emotional intelligence, and response structure. Your analysis is thorough, specific, and helps candidates improve their interview skills.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const aiResponse = response.data.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      const analysisResult = JSON.parse(aiResponse);

      return {
        metrics: {
          wordsPerMinute,
          fillerWords: fillerWordCount,
          confidenceScore: analysisResult.confidenceScore,
          clarityScore: analysisResult.clarityScore,
          professionalismScore: analysisResult.professionalismScore,
          relevanceScore: analysisResult.relevanceScore,
          emotionalIntelligence: analysisResult.emotionalIntelligence || 75,
          structureScore: analysisResult.structureScore || 70
        },
        feedback: {
          strengths: analysisResult.strengths || [],
          improvements: analysisResult.improvements || [],
          suggestions: analysisResult.suggestions || [],
          specificTips: analysisResult.specificTips || []
        },
        detailedAnalysis: {
          speechPattern: analysisResult.speechPattern || 'Analysis unavailable',
          contentQuality: analysisResult.contentQuality || 'Analysis unavailable',
          professionalPresence: analysisResult.professionalPresence || 'Analysis unavailable',
          improvementPlan: analysisResult.improvementPlan || []
        }
      };

    } catch (error: any) {
      console.error('OpenAI analysis error:', error);
      throw new Error(`AI analysis failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private buildAnalysisPrompt(transcript: string, duration: number, wpm: number, fillerWords: number, questionType?: string): string {
    // Role-specific prompt customization
    const roleContext = this.getRoleSpecificContext(questionType);
    
    return `
You are a seasoned interview coach with 15+ years of experience helping candidates excel in ${questionType || 'professional'} interviews. You specialize in providing detailed, actionable feedback that helps candidates improve their performance.

INTERVIEW RESPONSE ANALYSIS:
Response: "${transcript}"
Duration: ${duration} seconds (${Math.round(duration/60)} minutes)
Speaking Rate: ${wpm} words/minute ${this.getWPMFeedback(wpm)}
Filler Words: ${fillerWords} detected ${this.getFillerWordFeedback(fillerWords, transcript.split(' ').length)}

${roleContext}

EVALUATION CRITERIA (Score 0-100 for each):

🎯 CONFIDENCE: Assess conviction, assertiveness, and self-assurance
- Strong: "I successfully led...", "I'm confident in my ability..."
- Weak: "I think maybe...", "I'm not sure but...", excessive hedging

🎯 CLARITY: Evaluate structure, coherence, and ease of understanding  
- Strong: Logical flow, clear transitions, organized thoughts
- Weak: Rambling, jumping topics, unclear connections

🎯 PROFESSIONALISM: Rate language, tone, and business communication
- Strong: Business vocabulary, appropriate tone, industry terms
- Weak: Casual language, slang, inappropriate informality

🎯 RELEVANCE: Judge direct answering and value demonstration
- Strong: Specific examples, quantifiable results, clear value prop
- Weak: Generic responses, no examples, unclear benefits

🎯 EMOTIONAL INTELLIGENCE: Assess self-awareness and interpersonal skills
- Strong: Shows empathy, team awareness, conflict resolution
- Weak: Lack of self-reflection, poor team understanding

🎯 STRUCTURE: Evaluate organization and framework usage
- Strong: STAR method, clear intro/body/conclusion, logical progression  
- Weak: No structure, scattered thoughts, missing components

RESPONSE FORMAT - Return ONLY this JSON structure:
{
  "confidenceScore": <number>,
  "clarityScore": <number>,
  "professionalismScore": <number>,
  "relevanceScore": <number>,
  "emotionalIntelligence": <number>,
  "structureScore": <number>,
  "strengths": ["specific strength based on actual content", "another specific strength", "third strength"],
  "improvements": ["specific area needing work", "another improvement area", "third area"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "specificTips": ["specific tip for this response", "another specific tip", "third tip"],
  "speechPattern": "Analysis of speaking pace, delivery style, and vocal patterns based on transcript length and structure",
  "contentQuality": "Assessment of depth, specificity, and substance of the response content",
  "professionalPresence": "Evaluation of confidence, authority, and executive presence demonstrated",
  "improvementPlan": ["Immediate action item 1", "Practice area 2", "Long-term development 3", "Specific technique 4"]
}

CRITICAL: Make your analysis highly specific to the actual content provided. Reference specific phrases, examples, or patterns from the response. Avoid generic feedback.
`;
  }

  private getRoleSpecificContext(questionType?: string): string {
    const contexts = {
      'Technical': `
TECHNICAL INTERVIEW FOCUS:
- Prioritize logical problem-solving approach and clear explanation of technical concepts
- Look for structured thinking: problem breakdown → solution approach → implementation details
- Assess technical vocabulary usage and ability to explain complex concepts simply
- Value specific examples of technical challenges overcome`,

      'Behavioral': `
BEHAVIORAL INTERVIEW FOCUS: 
- Emphasize STAR method usage (Situation, Task, Action, Result)
- Look for specific, quantifiable results and learning outcomes
- Assess self-awareness, growth mindset, and interpersonal skills
- Value authentic examples that demonstrate core competencies`,

      'Leadership': `
LEADERSHIP INTERVIEW FOCUS:
- Assess ability to inspire, motivate, and guide teams through challenges
- Look for examples of difficult decisions, conflict resolution, and team development
- Evaluate strategic thinking and ability to balance stakeholder needs
- Value demonstrated impact on team performance and organizational goals`,

      'Problem-Solving': `
PROBLEM-SOLVING INTERVIEW FOCUS:
- Evaluate systematic approach to complex challenges
- Look for creative thinking, root cause analysis, and solution evaluation
- Assess ability to handle ambiguity and make decisions with incomplete information
- Value examples showing innovative solutions and measurable outcomes`,

      'Situational': `
SITUATIONAL INTERVIEW FOCUS:
- Assess practical judgment and decision-making process
- Look for consideration of multiple perspectives and potential consequences
- Evaluate communication skills and stakeholder management approach
- Value ethical reasoning and professional maturity`
    };

    return contexts[questionType as keyof typeof contexts] || `
GENERAL INTERVIEW FOCUS:
- Assess overall communication effectiveness and professional presentation
- Look for authentic examples that demonstrate key competencies
- Evaluate cultural fit indicators and growth potential
- Value specific achievements and clear value proposition`;
  }

  private getWPMFeedback(wpm: number): string {
    if (wpm < 120) return '(Slower pace - consider speaking slightly faster)';
    if (wpm > 180) return '(Fast pace - consider slowing down for clarity)';
    return '(Good speaking pace)';
  }

  private getFillerWordFeedback(fillerWords: number, totalWords: number): string {
    const ratio = fillerWords / totalWords;
    if (ratio > 0.1) return '(High usage - focus on reducing filler words)';
    if (ratio > 0.05) return '(Moderate usage - room for improvement)';
    return '(Low usage - excellent!)';
  }

  private calculateWPM(transcript: string, duration: number): number {
    const words = transcript.trim().split(/\s+/).filter(word => word.length > 0);
    const durationInMinutes = Math.max(duration / 60, 1);
    return Math.round(words.length / durationInMinutes);
  }

  private countFillerWords(transcript: string): number {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'literally', 'right', 'okay'];
    const words = transcript.toLowerCase().split(/\s+/);
    return words.filter(word => fillerWords.some(filler => word.includes(filler))).length;
  }
}

export const openaiClient = new OpenAIClientService();