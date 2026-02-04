
import { MatchProfile, Notification } from './types';

export const MOCK_INTERESTS = [
  "Coding", "Gaming", "Anime", "Music", "Art", "Photography",
  "Reading", "Travel", "Fitness", "Coffee", "Startups", "AI"
];

export const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Willow",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Midnight",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Cyber",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Ghost",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=Neon"
];

export const MOCK_MATCHES: MatchProfile[] = [
  {
    id: 'm1',
    anonymousId: 'User#X92A',
    realName: 'Sarah Chen',
    gender: 'Female',
    branch: 'Computer Science',
    year: 'Junior',
    interests: ['AI', 'Sci-Fi', 'Coffee'],
    bio: 'Looking for a study buddy who loves neural networks.',
    matchPercentage: 95,
    distance: '0.5 miles',
    isVerified: false,
    avatar: AVATAR_PRESETS[0]
  },
  {
    id: 'm2',
    anonymousId: 'User#B44Z',
    realName: 'Marcus Cole',
    gender: 'Male',
    branch: 'Fine Arts',
    year: 'Senior',
    interests: ['Photography', 'Indie Music', 'Travel'],
    bio: 'I capture moments. Let’s find some neon lights.',
    matchPercentage: 88,
    distance: '1.2 miles',
    isVerified: false,
    avatar: AVATAR_PRESETS[4]
  },
  {
    id: 'm3',
    anonymousId: 'User#L88Q',
    realName: 'Alex Rivera',
    gender: 'Male',
    branch: 'Mechanical Eng',
    year: 'Sophomore',
    interests: ['Robotics', 'Formula 1', 'Gym'],
    bio: 'Building things that move fast.',
    matchPercentage: 82,
    distance: 'Campus Dorm A',
    isVerified: false,
    avatar: AVATAR_PRESETS[5]
  },
  {
    id: 'm4',
    anonymousId: 'User#K22P',
    realName: 'Emily Watson',
    gender: 'Female',
    branch: 'Psychology',
    year: 'Freshman',
    interests: ['Reading', 'Meditation', 'Jazz'],
    bio: 'Trying to understand how minds work.',
    matchPercentage: 75,
    distance: 'Library',
    isVerified: false,
    avatar: AVATAR_PRESETS[2]
  },
  {
    id: 'm5',
    anonymousId: 'User#J77T',
    realName: 'Jessica Lee',
    gender: 'Female',
    branch: 'Biology',
    year: 'Senior',
    interests: ['Hiking', 'Photography', 'Sushi'],
    bio: 'Nature lover and science geek.',
    matchPercentage: 90,
    distance: '2.0 miles',
    isVerified: false,
    avatar: AVATAR_PRESETS[1]
  },
  {
    id: 'm6',
    anonymousId: 'User#D99R',
    realName: 'David Kim',
    gender: 'Male',
    branch: 'Economics',
    year: 'Junior',
    interests: ['Finance', 'Basketball', 'Stocks'],
    bio: 'Stonks only go up. Lets hoop.',
    matchPercentage: 85,
    distance: '1.0 miles',
    isVerified: false,
    avatar: AVATAR_PRESETS[6]
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: "It's a Match!",
    message: "You and User#X92A liked each other. Start chatting now!",
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    read: false,
    type: 'match'
  },
  {
    id: 'n2',
    title: "Welcome to Othrhalff",
    message: "Your student profile is active. You can now start swiping.",
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    read: true,
    type: 'system'
  },
  {
    id: 'n3',
    title: "New Feature",
    message: "Video calls are now end-to-end encrypted for your safety.",
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    read: true,
    type: 'system'
  }
];

export const APP_NAME = "Othrhalff";
