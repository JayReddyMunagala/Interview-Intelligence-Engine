import { AI_CONFIG } from '../config/aiConfig';

export class WhisperTranscriptionService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = AI_CONFIG.openai.apiKey || '';
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }

    try {
      console.log('🎙️ Starting Whisper transcription...');
      
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json');
      formData.append('temperature', '0');

      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Whisper API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Whisper transcription complete');
      
      return result.text || 'No transcription available';
    } catch (error) {
      console.error('Whisper transcription error:', error);
      throw error;
    }
  }
}

export const whisperService = new WhisperTranscriptionService();