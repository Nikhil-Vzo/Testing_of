/**
 * DEPRECATED: Legacy Data Service
 * --------------------------------
 * This file previously handled Local Storage persistence for the prototype.
 * * All data logic has been migrated to Supabase:
 * - Auth: services/auth.ts + Supabase Auth
 * - Matches: pages/Matches.tsx (db: matches)
 * - Chat: pages/Chat.tsx (db: messages)
 * - Notifications: pages/Notifications.tsx (db: notifications)
 * - Confessions: pages/Confessions.tsx (db: confessions)
 * * This file is kept only to prevent build errors during the transition 
 * and should be removed once you confirm no imports remain.
 */

class DataService {
  // Methods are removed to ensure developers use Supabase.
  constructor() {
    console.warn('DataService is deprecated. Use Supabase client instead.');
  }
}

export const dataService = new DataService();