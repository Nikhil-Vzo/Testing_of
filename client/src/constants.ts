import { MatchProfile, Notification } from './types';

export const MOCK_INTERESTS = [
  "Coding", "Gaming", "Anime", "Music", "Art",
  "Reading", "Travel", "Fitness"
];

export const LOOKING_FOR_OPTIONS = [

  "Relationship",
  "Study Partner",
  "Gym Partner",
  "Gaming Partner",
  "Hangout Partner",
  "Fun",
  "Flirt"
];

export const BRANCH_CATEGORIES = [
  "Engineering & Technology",
  "Commerce & Management",
  "Arts & Humanities",
  "Law",
  "Journalism & Media",
  "Medical & Health",
  "Design & Architecture",
  "Other"
];

export const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Postgrad – 1st Year"
];

export const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Felix",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Willow",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Midnight",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Leo",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Cyber",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Ghost",
  "https://api.dicebear.com/9.x/thumbs/svg?seed=Neon"
];

export const CHHATTISGARH_COLLEGES = [
  "Amity University, Raipur",
  "National Institute of Technology (NIT), Raipur",
  "Indian Institute of Management (IIM), Raipur",
  "Indian Institute of Technology (IIT), Bhilai",
  "International Institute of Information Technology (IIIT), Naya Raipur",
  "Hidayatullah National Law University (HNLU), Raipur",
  "All India Institute of Medical Sciences (AIIMS), Raipur",
  "Pt. Ravishankar Shukla University (PRSU), Raipur",
  "Chhattisgarh Swami Vivekanand Technical University (CSVTU), Bhilai",
  "Guru Ghasidas Vishwavidyalaya (GGU), Bilaspur",
  "Kalinga University, Raipur",
  "ITM University, Raipur",
  "MATS University, Raipur",
  "OP Jindal University, Raigarh",
  "Other"
];

export const MOCK_MATCHES: MatchProfile[] = [
  {
    id: 'm1',
    anonymousId: 'User#X92A',
    realName: 'Sarah Chen',
    gender: 'Female',
    university: 'National Institute of Technology (NIT), Raipur',
    branch: 'Computer Science',
    year: 'Junior',
    interests: ['AI', 'Sci-Fi', 'Coffee'],
    bio: 'Looking for a study buddy who loves neural networks.',
    matchPercentage: 0, // Calculated dynamically now
    distance: '0.5 miles',
    isVerified: true,
    avatar: AVATAR_PRESETS[0],
    dob: '2003-05-15'
  },
  {
    id: 'm2',
    anonymousId: 'User#B44Z',
    realName: 'Marcus Cole',
    gender: 'Male',
    university: 'Amity University, Raipur',
    branch: 'Fine Arts',
    year: 'Senior',
    interests: ['Photography', 'Indie Music', 'Travel'],
    bio: 'I capture moments. Let’s find some neon lights.',
    matchPercentage: 0,
    distance: '1.2 miles',
    isVerified: false,
    avatar: AVATAR_PRESETS[4],
    dob: '2002-11-20'
  },
  {
    id: 'm3',
    anonymousId: 'User#L88Q',
    realName: 'Alex Rivera',
    gender: 'Male',
    university: 'Indian Institute of Technology (IIT), Bhilai',
    branch: 'Mechanical Eng',
    year: 'Sophomore',
    interests: ['Robotics', 'Formula 1', 'Gym'],
    bio: 'Building things that move fast.',
    matchPercentage: 0,
    distance: 'Campus Dorm A',
    isVerified: true,
    avatar: AVATAR_PRESETS[5],
    dob: '2004-02-10'
  },
  {
    id: 'm4',
    anonymousId: 'User#K22P',
    realName: 'Emily Watson',
    gender: 'Female',
    university: 'Pt. Ravishankar Shukla University (PRSU), Raipur',
    branch: 'Psychology',
    year: 'Freshman',
    interests: ['Reading', 'Meditation', 'Jazz'],
    bio: 'Trying to understand how minds work.',
    matchPercentage: 0,
    distance: 'Library',
    isVerified: true,
    avatar: AVATAR_PRESETS[2],
    dob: '2005-08-25'
  },
  {
    id: 'm5',
    anonymousId: 'User#J77T',
    realName: 'Jessica Lee',
    gender: 'Female',
    university: 'All India Institute of Medical Sciences (AIIMS), Raipur',
    branch: 'Biology',
    year: 'Senior',
    interests: ['Hiking', 'Photography', 'Sushi'],
    bio: 'Nature lover and science geek.',
    matchPercentage: 0,
    distance: '2.0 miles',
    isVerified: true,
    avatar: AVATAR_PRESETS[1],
    dob: '2001-12-05'
  },
  {
    id: 'm6',
    anonymousId: 'User#D99R',
    realName: 'David Kim',
    gender: 'Male',
    university: 'Indian Institute of Management (IIM), Raipur',
    branch: 'Economics',
    year: 'Junior',
    interests: ['Finance', 'Basketball', 'Stocks'],
    bio: 'Stonks only go up. Lets hoop.',
    matchPercentage: 0,
    distance: '1.0 miles',
    isVerified: false,
    avatar: AVATAR_PRESETS[6],
    dob: '2003-03-12'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: "It's a Match!",
    message: "You and User#X92A liked each other. Start chatting now!",
    timestamp: Date.now() - 1000 * 60 * 5,
    read: false,
    type: 'match'
  },
  {
    id: 'n2',
    title: "Welcome to Othrhalff",
    message: "Your student profile is active. You can now start swiping.",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    read: true,
    type: 'system'
  },
  {
    id: 'n3',
    title: "New Feature",
    message: "Video calls are now end-to-end encrypted for your safety.",
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    read: true,
    type: 'system'
  }
];

export const APP_NAME = "Othrhalff";