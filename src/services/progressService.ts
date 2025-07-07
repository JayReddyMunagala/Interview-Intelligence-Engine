export interface InterviewSession {
  id: string;
  date: string;
  duration: number;
  transcript: string;
  overallScore: number;
  metrics: {
    wordsPerMinute: number;
    fillerWords: number;
    confidenceScore: number;
    clarityScore: number;
    professionalismScore: number;
    relevanceScore: number;
  };
  aiPowered: boolean;
  questionType?: string;
}

export interface ProgressStats {
  totalSessions: number;
  averageScore: number;
  improvementTrend: number;
  strongestAreas: string[];
  weakestAreas: string[];
  recentSessions: InterviewSession[];
}

class ProgressTrackingService {
  private storageKey = 'interview_progress_data';

  saveSession(session: Omit<InterviewSession, 'id' | 'date'>): void {
    const existingSessions = this.getAllSessions();
    
    const newSession: InterviewSession = {
      ...session,
      id: this.generateId(),
      date: new Date().toISOString()
    };
    
    existingSessions.push(newSession);
    
    // Keep only last 50 sessions to avoid storage bloat
    const limitedSessions = existingSessions.slice(-50);
    
    localStorage.setItem(this.storageKey, JSON.stringify(limitedSessions));
    
    console.log('💾 Interview session saved to progress history');
  }

  getAllSessions(): InterviewSession[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading progress data:', error);
      return [];
    }
  }

  getProgressStats(): ProgressStats {
    const sessions = this.getAllSessions();
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        improvementTrend: 0,
        strongestAreas: [],
        weakestAreas: [],
        recentSessions: []
      };
    }

    const totalSessions = sessions.length;
    const averageScore = sessions.reduce((sum, session) => sum + session.overallScore, 0) / totalSessions;
    
    // Calculate improvement trend (compare first half vs second half)
    const halfPoint = Math.floor(sessions.length / 2);
    const firstHalfAvg = sessions.slice(0, halfPoint).reduce((sum, s) => sum + s.overallScore, 0) / halfPoint || 0;
    const secondHalfAvg = sessions.slice(halfPoint).reduce((sum, s) => sum + s.overallScore, 0) / (sessions.length - halfPoint);
    const improvementTrend = secondHalfAvg - firstHalfAvg;

    // Analyze strongest and weakest areas
    const avgMetrics = {
      confidence: sessions.reduce((sum, s) => sum + s.metrics.confidenceScore, 0) / totalSessions,
      clarity: sessions.reduce((sum, s) => sum + s.metrics.clarityScore, 0) / totalSessions,
      professionalism: sessions.reduce((sum, s) => sum + s.metrics.professionalismScore, 0) / totalSessions,
      relevance: sessions.reduce((sum, s) => sum + s.metrics.relevanceScore, 0) / totalSessions
    };

    const sortedAreas = Object.entries(avgMetrics).sort(([,a], [,b]) => b - a);
    const strongestAreas = sortedAreas.slice(0, 2).map(([area]) => area);
    const weakestAreas = sortedAreas.slice(-2).map(([area]) => area);

    return {
      totalSessions,
      averageScore: Math.round(averageScore),
      improvementTrend: Math.round(improvementTrend),
      strongestAreas,
      weakestAreas,
      recentSessions: sessions.slice(-5).reverse()
    };
  }

  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ All progress data cleared');
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const progressService = new ProgressTrackingService();