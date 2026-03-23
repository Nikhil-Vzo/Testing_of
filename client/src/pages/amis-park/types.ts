export type EventCategory = 'experience' | 'intellectual' | 'cultural' | 'gaming' | 'entertainment' | 'special';
export type Zone = 'A' | 'B' | 'C' | 'D';

import { Ticket, Brain, Palette, Gamepad2, Tent, Flame } from 'lucide-react';


export interface AmisEvent {
  id: string;
  name: string;
  category: EventCategory;
  zone: Zone | null;
  description: string | null;
  tags: string[];
  is_trending: boolean;
  schedule: string | null;
  image_url: string | null;
  created_at: string;
  // Computed from joins
  checkin_count?: number;
  reaction_count?: number;
  post_count?: number;
  user_checked_in?: boolean;
  user_reaction?: string | null;
}

export interface AmisCheckin {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
}

export interface AmisReaction {
  id: string;
  event_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface AmisPost {
  id: string;
  event_id: string;
  user_id: string;
  anonymous_name: string;
  content: string;
  created_at: string;
}

export const CATEGORY_META: Record<EventCategory, { label: string; icon: any; gradient: string; bgGlow: string }> = {
  experience: { label: 'Experience', icon: Ticket, gradient: 'from-rose-500 via-pink-500 to-purple-500', bgGlow: 'rgba(236, 72, 153, 0.3)' },
  intellectual: { label: 'Intellectual', icon: Brain, gradient: 'from-cyan-400 via-blue-500 to-indigo-500', bgGlow: 'rgba(59, 130, 246, 0.3)' },
  cultural: { label: 'Cultural', icon: Palette, gradient: 'from-amber-400 via-orange-400 to-red-400', bgGlow: 'rgba(251, 146, 60, 0.3)' },
  gaming: { label: 'Gaming', icon: Gamepad2, gradient: 'from-emerald-400 via-green-500 to-teal-500', bgGlow: 'rgba(34, 197, 94, 0.3)' },
  entertainment: { label: 'Fun', icon: Tent, gradient: 'from-violet-500 via-purple-500 to-fuchsia-500', bgGlow: 'rgba(168, 85, 247, 0.3)' },
  special: { label: 'Special', icon: Flame, gradient: 'from-red-500 via-orange-500 to-yellow-500', bgGlow: 'rgba(239, 68, 68, 0.3)' },
};

export const REACTION_EMOJIS = ['🔥', '😱', '❤️', '🤯', '💀', '😂'];

export interface AmisPollOption {
  id: string;
  poll_id: string;
  text: string;
  vote_count: number;
}

export interface AmisPoll {
  id: string;
  question: string;
  is_active: boolean;
  user_id?: string | null;
  created_at: string;
  options: AmisPollOption[];
  user_voted_option_id?: string | null;
  block_tag?: string | null;
  event_id?: string | null;
  event_name?: string | null;
}
