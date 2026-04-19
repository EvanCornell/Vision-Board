import { LifeAreaKey } from '../types';

export interface LifeArea {
  key: LifeAreaKey;
  label: string;
  color: string;
  gradient: string;
  textColor: string;
  iconName: string;
}

export const LIFE_AREAS: LifeArea[] = [
  {
    key: 'career',
    label: 'Career',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-blue-700',
    textColor: 'text-blue-400',
    iconName: 'Briefcase',
  },
  {
    key: 'health',
    label: 'Health',
    color: '#f43f5e',
    gradient: 'from-rose-500 to-rose-700',
    textColor: 'text-rose-400',
    iconName: 'Heart',
  },
  {
    key: 'relationships',
    label: 'Relationships',
    color: '#f472b6',
    gradient: 'from-pink-400 to-pink-600',
    textColor: 'text-pink-400',
    iconName: 'Users',
  },
  {
    key: 'finance',
    label: 'Finance',
    color: '#10b981',
    gradient: 'from-emerald-500 to-emerald-700',
    textColor: 'text-emerald-400',
    iconName: 'DollarSign',
  },
  {
    key: 'personal_growth',
    label: 'Personal Growth',
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-violet-700',
    textColor: 'text-violet-400',
    iconName: 'Zap',
  },
  {
    key: 'education',
    label: 'Education',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-indigo-700',
    textColor: 'text-indigo-400',
    iconName: 'BookOpen',
  },
  {
    key: 'travel',
    label: 'Travel',
    color: '#0ea5e9',
    gradient: 'from-sky-500 to-sky-700',
    textColor: 'text-sky-400',
    iconName: 'Plane',
  },
  {
    key: 'creativity',
    label: 'Creativity',
    color: '#f97316',
    gradient: 'from-orange-500 to-orange-700',
    textColor: 'text-orange-400',
    iconName: 'Palette',
  },
];

export function getLifeArea(key: LifeAreaKey): LifeArea {
  return LIFE_AREAS.find((a) => a.key === key) ?? LIFE_AREAS[0];
}
