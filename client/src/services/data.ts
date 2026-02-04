import { MatchProfile, ChatSession, Notification, UserProfile, Confession } from '../types';
import { MOCK_MATCHES, MOCK_NOTIFICATIONS } from '../constants';
import { calculateMatchPercentage } from '../utils/matchingAlgorithm'; // Import the new algo

// Simple in-memory store with local storage persistence simulation for the demo
class DataService {
  private matches: MatchProfile[] = [];
  private chatSessions: Record<string, ChatSession> = {};
  private notifications: Notification[] = [...MOCK_NOTIFICATIONS];
  private confessions: Confession[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const storedMatches = localStorage.getItem('oh_matches');
    const storedChats = localStorage.getItem('oh_chats');
    const storedNotifs = localStorage.getItem('oh_notifications');
    const storedConfessions = localStorage.getItem('oh_confessions');

    if (storedMatches) this.matches = JSON.parse(storedMatches);
    if (storedChats) this.chatSessions = JSON.parse(storedChats);
    if (storedNotifs) this.notifications = JSON.parse(storedNotifs);
    if (storedConfessions) this.confessions = JSON.parse(storedConfessions);
  }

  private saveToStorage() {
    localStorage.setItem('oh_matches', JSON.stringify(this.matches));
    localStorage.setItem('oh_chats', JSON.stringify(this.chatSessions));
    localStorage.setItem('oh_notifications', JSON.stringify(this.notifications));
    localStorage.setItem('oh_confessions', JSON.stringify(this.confessions));
  }

  // Matches
  getMatches() {
    return this.matches;
  }

  addMatch(match: MatchProfile, currentUserId: string) {
    if (!this.matches.find(m => m.id === match.id)) {
      this.matches = [...this.matches, match];

      // Initialize chat session
      const newSession: ChatSession = {
        matchId: match.id,
        userA: currentUserId,
        userB: match.id,
        messages: [],
        lastUpdated: Date.now(),
        isRevealed: false
      };
      this.chatSessions[match.id] = newSession;

      // Add notification
      const newNotif: Notification = {
        id: Date.now().toString(),
        title: "It's a Match!",
        message: `You matched with ${match.anonymousId}!`,
        timestamp: Date.now(),
        read: false,
        type: 'match'
      };
      this.addNotification(newNotif);

      this.saveToStorage();
    }
  }

  removeMatch(matchId: string) {
    this.matches = this.matches.filter(m => m.id !== matchId);
    delete this.chatSessions[matchId];
    this.saveToStorage();
  }

  // Chats
  getChatSession(matchId: string) {
    return this.chatSessions[matchId];
  }

  addMessage(matchId: string, message: any) {
    if (this.chatSessions[matchId]) {
      this.chatSessions[matchId].messages.push(message);
      this.chatSessions[matchId].lastUpdated = Date.now();
      this.saveToStorage();
    }
  }

  // Notifications
  getNotifications() {
    return this.notifications;
  }

  addNotification(notif: Notification) {
    this.notifications = [notif, ...this.notifications];
    this.saveToStorage();
  }

  markNotificationsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.saveToStorage();
  }

  // Confessions
  getConfessions(university: string) {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    return this.confessions
      .filter(c => c.university === university && c.timestamp > twentyFourHoursAgo)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getConfessionCountLast24h(userId: string) {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    return this.confessions.filter(c => c.userId === userId && c.timestamp > twentyFourHoursAgo).length;
  }

  addConfession(confession: Confession) {
    // Ensure comments array exists
    if (!confession.comments) confession.comments = [];
    if (!confession.reactions) confession.reactions = {};
    this.confessions = [confession, ...this.confessions];
    this.saveToStorage();
  }

  reactToConfession(confessionId: string, emoji: string) {
    const conf = this.confessions.find(c => c.id === confessionId);
    if (conf) {
      if (!conf.reactions) conf.reactions = {};

      // Increment specific emoji
      conf.reactions[emoji] = (conf.reactions[emoji] || 0) + 1;

      // Also increment total likes for sorting/compat
      conf.likes += 1;

      this.saveToStorage();
    }
  }

  addComment(confessionId: string, text: string, userId: string) {
    const conf = this.confessions.find(c => c.id === confessionId);
    if (conf) {
      if (!conf.comments) conf.comments = [];
      conf.comments.push({
        id: Date.now().toString(),
        userId: userId,
        text: text,
        timestamp: Date.now()
      });
      this.saveToStorage();
    }
  }

  // Queue Logic
  getMatchQueue(user: UserProfile) {
    const targetGender = user.gender === 'Male' ? 'Female' : 'Male';
    
    // 1. Filter basic constraints (Gender, Not Self, Not Already Matched)
    const filtered = MOCK_MATCHES.filter(m =>
      m.gender === targetGender &&
      m.id !== user.id &&
      !this.matches.find(existing => existing.id === m.id)
    );

    // 2. Calculate Scores and Sort
    return filtered
      .map(profile => ({
        ...profile,
        // DYNAMICALLY calculate the match percentage using the new algorithm
        matchPercentage: calculateMatchPercentage(user, profile)
      }))
      // 3. Sort by highest match percentage first
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  // Reset data for demo purposes
  reset() {
    this.matches = [];
    this.chatSessions = {};
    this.notifications = [...MOCK_NOTIFICATIONS];
    this.confessions = [];
    this.saveToStorage();
  }
}

export const dataService = new DataService();