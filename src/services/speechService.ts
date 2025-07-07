import { AI_CONFIG } from '../config/aiConfig';
import { whisperService } from './whisperService';

export class SpeechToTextService {
  private assemblyaiKey: string;

  constructor() {
    this.assemblyaiKey = AI_CONFIG.assemblyai.apiKey || '';
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    // Try Whisper first (more accurate)
    if (AI_CONFIG.openai.apiKey) {
      try {
        console.log('🎙️ Using Whisper API for transcription...');
        return await whisperService.transcribeAudio(audioFile);
      } catch (error) {
        console.warn('Whisper failed, trying AssemblyAI...', error);
      }
    }

    // Fallback to AssemblyAI
    if (!this.assemblyaiKey) {
      throw new Error('No transcription services configured. Please add VITE_OPENAI_API_KEY or VITE_ASSEMBLYAI_API_KEY to your .env file.');
    }

    try {
      // Step 1: Upload audio file
      const uploadResponse = await fetch(`${AI_CONFIG.assemblyai.endpoint}/upload`, {
        method: 'POST',
        headers: {
          'authorization': this.assemblyaiKey,
        },
        body: audioFile
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file');
      }

      const { upload_url } = await uploadResponse.json();

      // Step 2: Request transcription
      const transcriptResponse = await fetch(`${AI_CONFIG.assemblyai.endpoint}/transcript`, {
        method: 'POST',
        headers: {
          'authorization': this.assemblyaiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: upload_url,
          speaker_labels: false,
          auto_highlights: true,
          sentiment_analysis: true
        })
      });

      if (!transcriptResponse.ok) {
        throw new Error('Failed to request transcription');
      }

      const { id } = await transcriptResponse.json();

      // Step 3: Poll for completion
      let transcript;
      while (true) {
        const statusResponse = await fetch(`${AI_CONFIG.assemblyai.endpoint}/transcript/${id}`, {
          headers: {
            'authorization': this.assemblyaiKey,
          }
        });

        transcript = await statusResponse.json();

        if (transcript.status === 'completed') {
          return transcript.text || 'No transcript available';
        } else if (transcript.status === 'error') {
          throw new Error(`Transcription failed: ${transcript.error}`);
        }

        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

    } catch (error) {
      console.error('AssemblyAI transcription error:', error);
      throw error;
    }
  }
}

export const speechService = new SpeechToTextService();