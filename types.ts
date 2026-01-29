
export interface HealthAnalysis {
  hemoglobinEstimate: string;
  healthStatus: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  observations: string[];
  recommendations: string[];
  description: string;
  timestamp: number;
  isPaid?: boolean;
}

export interface HistoryEntry extends HealthAnalysis {
  id: string;
}

export type AppState = 'HOME' | 'SCANNING' | 'ANALYZING' | 'RESULT' | 'HISTORY' | 'ADMIN';
export type Language = 'hi' | 'en';
