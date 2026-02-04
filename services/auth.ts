
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'otherhalf_session';

export const authService = {
  // Save user to local storage (and DB if connected)
  login: async (user: UserProfile) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    
    if (supabase) {
      // Example: Upsert user to Supabase 'users' table
      // await supabase.from('users').upsert(user);
    }
  },

  // Retrieve current user from local storage
  getCurrentUser: (): UserProfile | null => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Clear session
  logout: () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (supabase) {
      supabase.auth.signOut();
    }
  },
  
  // Helper to upload avatar (simulated for now)
  uploadAvatar: async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }
};
