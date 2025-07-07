import { AI_CONFIG } from '../config/aiConfig';

export interface AIAnalysisResult {
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
}

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = AI_CONFIG.openai.apiKey || '';
  }

  async analyzeInterview(transcript: string, duration: number): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    const wordsPerMinute = this.calculateWPM(transcript, duration);
    const fillerWordCount = this.countFillerWords(transcript);

    const prompt = `
Analyze this interview transcript and provide detailed feedback:

TRANSCRIPT: "${transcript}"
DURATION: ${duration} seconds
WORDS PER MINUTE: ${wordsPerMinute}
FILLER WORDS DETECTED: ${fillerWordCount}

Please analyze this interview response and provide:

1. SCORING (0-100 for each):
   - Confidence Score (based on language certainty, conviction)
   - Clarity Score (based on structure, coherence)
   - Professionalism Score (based on vocabulary, tone)
   - Relevance Score (based on content quality, examples)

2. FEEDBACK:
   - 3-5 specific strengths
   - 3-4 areas for improvement
   - 4-5 actionable suggestions

Return the response in this exact JSON format:
{
  "confidenceScore": <number>,
  "clarityScore": <number>,
  "professionalismScore": <number>,
  "relevanceScore": <number>,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...]
}

Be specific and vary your analysis based on the actual content. Each interview should have unique feedback.
`;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.openai.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert interview coach and AI assistant specializing in analyzing interview performance. Provide detailed, personalized feedback based on the actual content of responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: AI_CONFIG.openai.maxTokens,
          temperature: AI_CONFIG.openai.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from OpenAI API');
      }

      // Parse the JSON response from AI
      const analysisResult = JSON.parse(aiResponse);

      return {
        metrics: {
          wordsPerMinute,
          fillerWords: fillerWordCount,
          confidenceScore: analysisResult.confidenceScore,
          clarityScore: analysisResult.clarityScore,
          professionalismScore: analysisResult.professionalismScore,
          relevanceScore: analysisResult.relevanceScore
        },
        feedback: {
          strengths: analysisResult.strengths,
          improvements: analysisResult.improvements,
          suggestions: analysisResult.suggestions
        }
      };

    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      throw new Error(`AI Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateWPM(transcript: string, duration: number): number {
    const words = transcript.trim().split(/\s+/).filter(word => word.length > 0);
    const durationInMinutes = Math.max(duration / 60, 1);
    return Math.round(words.length / durationInMinutes);
  }

  private countFillerWords(transcript: string): number {
    const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'literally'];
    const words = transcript.toLowerCase().split(/\s+/);
    return words.filter(word => fillerWords.some(filler => word.includes(filler))).length;
  }
}

export const openaiService = new OpenAIService();