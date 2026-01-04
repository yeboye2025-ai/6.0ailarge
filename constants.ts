
import { Mood } from './types';

export const MOODS: Mood[] = ['😊', '🥰', '😌', '🤔', '🤯', '😔', '😭', '😡'];

export const MOOD_SCORES: Record<Mood, number> = {
  '😊': 5,
  '🥰': 5,
  '😌': 4,
  '🤔': 3,
  '🤯': 2,
  '😔': 2,
  '😭': 1,
  '😡': 1
};

export const STORAGE_KEY = 'ai_large_diary_data';
