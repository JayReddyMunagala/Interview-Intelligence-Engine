import RecordRTC from 'recordrtc';

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export class AudioRecordingService {
  private recorder: RecordRTC | null = null;
  private stream: MediaStream | null = null;
  private startTime: number = 0;

  async startRecording(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      this.recorder = new RecordRTC(this.stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000, // Optimal for speech recognition
        bufferSize: 4096,
        audioBitsPerSecond: 128000
      });

      this.startTime = Date.now();
      this.recorder.startRecording();
      console.log('🎙️ Audio recording started with RecordRTC');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Could not access microphone. Please check permissions.');
    }
  }

  pauseRecording(): void {
    if (this.recorder) {
      this.recorder.pauseRecording();
      console.log('⏸️ Recording paused');
    }
  }

  resumeRecording(): void {
    if (this.recorder) {
      this.recorder.resumeRecording();
      console.log('▶️ Recording resumed');
    }
  }

  async stopRecording(): Promise<AudioRecording> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.recorder.stopRecording(() => {
        const blob = this.recorder!.getBlob();
        const url = URL.createObjectURL(blob);
        const duration = Math.floor((Date.now() - this.startTime) / 1000);

        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }

        console.log('⏹️ Recording stopped', { size: blob.size, duration });

        resolve({
          blob,
          url,
          duration
        });
      });
    });
  }

  isRecording(): boolean {
    return this.recorder?.getState() === 'recording';
  }

  isPaused(): boolean {
    return this.recorder?.getState() === 'paused';
  }

  destroy(): void {
    if (this.recorder) {
      this.recorder.destroy();
      this.recorder = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}

export const audioService = new AudioRecordingService();