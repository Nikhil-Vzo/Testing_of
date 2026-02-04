export interface UserProfile {
  id: string;
  anonymousId: string;
  realName: string;
  gender: string;
  university: string; // <--- Added this required field
  universityEmail: string;
  branch: string;
  year: string;
  interests: string[];
  bio: string;
  dob: string;
  isVerified: boolean;
  avatar?: string;
  isPremium?: boolean;
}

export interface MatchProfile extends Omit<UserProfile, 'universityEmail'> {
  matchPercentage: number;
  distance: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ChatSession {
  matchId: string;
  userA: string;
  userB: string;
  messages: Message[];
  lastUpdated: number;
  isRevealed: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'match' | 'message' | 'system' | 'like';
  fromUserId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Confession {
  id: string;
  userId: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  likes: number;
  reactions?: Record<string, number>;
  comments: Comment[];
  university: string;
  type?: 'text' | 'poll';
  pollOptions?: PollOption[];
  userVote?: string;
}

export enum AppView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  MATCHES = 'MATCHES',
  CHAT = 'CHAT',
  VIRTUAL_DATE = 'VIRTUAL_DATE',
  PROFILE = 'PROFILE',
  NOTIFICATIONS = 'NOTIFICATIONS'
}

export enum CallType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}