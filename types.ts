
export type Mood = '😊' | '😭' | '😌' | '🤯' | '🥰' | '😔' | '😡' | '🤔';

export type AiStyle = 'humorous' | 'warm' | 'cute' | 'cool';

export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface AiFan {
  id: string;
  name: string;
  avatar: string;
  style: AiStyle;
  isActive: boolean;
}

export interface AiComment {
  fanId: string;
  fanName: string;
  fanAvatar: string;
  style: AiStyle;
  content: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AiConfig {
  name: string;
  avatar: string;
}

export interface UserConfig {
  name: string;
  avatar: string;
  isWeb3Connected: boolean;
  walletAddress?: string;
  points: number;
  subscriptionTier: SubscriptionTier;
  dailyPostsCount: number;
  dailyFlowCount: number;
  lastResetDate: string; // ISO date string YYYY-MM-DD
}

export interface DiaryEntry {
  id: string;
  content: string;
  mood: Mood;
  timestamp: number;
  aiComments: AiComment[]; 
  deepChat: Record<string, ChatMessage[]>; // Key is fanId, 'default' for the main Large friend
  imageUrl?: string;
  voiceData?: string;
  privacy: 'private' | 'friends' | 'anonymous';
}

export interface MoodDataPoint {
  date: string;
  score: number;
  mood: Mood;
}

export interface InsightTrigger {
  theme: string;
  moodImpact: 'positive' | 'negative';
  description: string;
}

export interface ActionableAdvice {
  category: string;
  tip: string;
  action: string;
}

export interface InsightData {
  summary: string;
  patterns: string[];
  triggers: InsightTrigger[];
  growthAdvice: ActionableAdvice[];
  topTopics: string[];
  period: 'weekly' | 'monthly';
}

export interface DecisionSuggestion {
  label: string;
  content: string;
  icon: string;
}