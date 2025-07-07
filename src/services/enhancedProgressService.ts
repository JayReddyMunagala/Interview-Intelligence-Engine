import { openaiClient } from './openaiClient';

export interface DetailedSession {
  id: string;
  date: string;
  duration: number;
  transcript: string;
  questionType: string;
  overallScore: number;
  detailedMetrics: {
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
  aiPowered: boolean;
  audioUrl?: string;
}

export interface AdvancedProgressStats {
  totalSessions: number;
  averageScore: number;
  improvementTrend: number;
  skillBreakdown: {
    [key: string]: {
      current: number;
      trend: number;
      sessionHistory: number[];
    };
  };
  recommendedFocus: string[];
  achievementBadges: string[];
  recentSessions: DetailedSession[];
  sessionsByType: { [key: string]: number };
  progressMilestones: {
    reached: string[];
    upcoming: string[];
  };
}

class EnhancedProgressService {
  private storageKey = 'enhanced_interview_progress';
  private maxSessions = 100;

  saveDetailedSession(session: Omit<DetailedSession, 'id' | 'date'>): void {
    const existingSessions = this.getAllSessions();
    
    const newSession: DetailedSession = {
      ...session,
      id: this.generateId(),
      date: new Date().toISOString()
    };
    
    existingSessions.push(newSession);
    
    // Keep only the most recent sessions
    const limitedSessions = existingSessions.slice(-this.maxSessions);
    
    localStorage.setItem(this.storageKey, JSON.stringify(limitedSessions));
    console.log('💾 Enhanced session data saved');
  }

  getAllSessions(): DetailedSession[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading enhanced progress data:', error);
      return [];
    }
  }

  getAdvancedStats(): AdvancedProgressStats {
    const sessions = this.getAllSessions();
    
    if (sessions.length === 0) {
      return this.getEmptyStats();
    }

    const totalSessions = sessions.length;
    const averageScore = this.calculateAverageScore(sessions);
    const improvementTrend = this.calculateImprovementTrend(sessions);
    const skillBreakdown = this.calculateSkillBreakdown(sessions);
    const recommendedFocus = this.getRecommendedFocus(skillBreakdown);
    const achievementBadges = this.calculateAchievements(sessions);
    const sessionsByType = this.getSessionsByType(sessions);
    const progressMilestones = this.getProgressMilestones(sessions);

    return {
      totalSessions,
      averageScore,
      improvementTrend,
      skillBreakdown,
      recommendedFocus,
      achievementBadges,
      recentSessions: sessions.slice(-10).reverse(),
      sessionsByType,
      progressMilestones
    };
  }

  private calculateAverageScore(sessions: DetailedSession[]): number {
    const sum = sessions.reduce((acc, session) => acc + session.overallScore, 0);
    return Math.round(sum / sessions.length);
  }

  private calculateImprovementTrend(sessions: DetailedSession[]): number {
    if (sessions.length < 4) return 0;
    
    const quarterPoint = Math.floor(sessions.length / 4);
    const recentSessions = sessions.slice(-quarterPoint);
    const earlierSessions = sessions.slice(quarterPoint, quarterPoint * 2);
    
    const recentAvg = this.calculateAverageScore(recentSessions);
    const earlierAvg = this.calculateAverageScore(earlierSessions);
    
    return Math.round(recentAvg - earlierAvg);
  }

  private calculateSkillBreakdown(sessions: DetailedSession[]): { [key: string]: { current: number; trend: number; sessionHistory: number[] } } {
    const skills = ['confidenceScore', 'clarityScore', 'professionalismScore', 'relevanceScore', 'emotionalIntelligence', 'structureScore'];
    const breakdown: any = {};

    skills.forEach(skill => {
      const scores = sessions.map(s => s.detailedMetrics[skill as keyof typeof s.detailedMetrics] || 0);
      const current = scores.length > 0 ? scores[scores.length - 1] : 0;
      
      // Calculate trend over last 5 sessions
      const recent = scores.slice(-5);
      const earlier = scores.slice(-10, -5);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length || 0;
      const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length || 0;
      const trend = Math.round(recentAvg - earlierAvg);

      breakdown[skill] = {
        current: Math.round(current),
        trend,
        sessionHistory: scores.slice(-10)
      };
    });

    return breakdown;
  }

  private getRecommendedFocus(skillBreakdown: any): string[] {
    const skills = Object.entries(skillBreakdown)
      .sort(([,a], [,b]) => (a as any).current - (b as any).current)
      .slice(0, 2)
      .map(([skill]) => this.formatSkillName(skill));

    return skills;
  }

  private formatSkillName(skill: string): string {
    const mapping: { [key: string]: string } = {
      confidenceScore: 'Confidence',
      clarityScore: 'Clarity',
      professionalismScore: 'Professionalism',
      relevanceScore: 'Relevance',
      emotionalIntelligence: 'Emotional Intelligence',
      structureScore: 'Response Structure'
    };
    return mapping[skill] || skill;
  }

  private calculateAchievements(sessions: DetailedSession[]): string[] {
    const badges: string[] = [];
    
    if (sessions.length >= 5) badges.push('Committed Practicer');
    if (sessions.length >= 15) badges.push('Interview Master');
    if (sessions.some(s => s.overallScore >= 90)) badges.push('Excellence Achieved');
    if (sessions.slice(-5).every(s => s.overallScore > s.overallScore)) badges.push('Consistent Improver');
    if (sessions.filter(s => s.aiPowered).length >= 10) badges.push('AI-Powered Learner');
    
    return badges;
  }

  private getSessionsByType(sessions: DetailedSession[]): { [key: string]: number } {
    const types: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      const type = session.questionType || 'General';
      types[type] = (types[type] || 0) + 1;
    });
    
    return types;
  }

  private getProgressMilestones(sessions: DetailedSession[]): { reached: string[]; upcoming: string[] } {
    const reached: string[] = [];
    const upcoming: string[] = [];
    
    const avgScore = this.calculateAverageScore(sessions);
    const sessionCount = sessions.length;
    
    // Reached milestones
    if (sessionCount >= 1) reached.push('First Interview Practice');
    if (sessionCount >= 5) reached.push('Regular Practicer');
    if (sessionCount >= 10) reached.push('Dedicated Learner');
    if (avgScore >= 70) reached.push('Competent Interviewer');
    if (avgScore >= 80) reached.push('Strong Interviewer');
    if (avgScore >= 90) reached.push('Expert Interviewer');
    
    // Upcoming milestones
    if (sessionCount < 5) upcoming.push(`Complete ${5 - sessionCount} more sessions`);
    if (sessionCount < 10) upcoming.push(`Reach 10 total sessions`);
    if (avgScore < 70) upcoming.push('Achieve 70% average score');
    if (avgScore < 80) upcoming.push('Achieve 80% average score');
    if (avgScore < 90) upcoming.push('Achieve 90% average score');
    
    return { reached, upcoming };
  }

  private getEmptyStats(): AdvancedProgressStats {
    return {
      totalSessions: 0,
      averageScore: 0,
      improvementTrend: 0,
      skillBreakdown: {},
      recommendedFocus: [],
      achievementBadges: [],
      recentSessions: [],
      sessionsByType: {},
      progressMilestones: { reached: [], upcoming: ['Complete your first interview practice'] }
    };
  }

  clearAllData(): void {
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ All enhanced progress data cleared');
  }

  exportProgressData(): string {
    const sessions = this.getAllSessions();
    const stats = this.getAdvancedStats();
    
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      appName: 'Interview Intelligence',
      version: '1.0.0',
      privacy: 'This data was generated locally and contains no server-stored information',
      summary: stats,
      detailedSessions: sessions
    }, null, 2);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const enhancedProgressService = new EnhancedProgressService();