import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/auth';
import { dataService } from '../services/data';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- CHANGED: Load from DB on mount ---
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Try Local Storage first (Fastest) to prevent flicker
      const localUser = authService.getCurrentUser();
      if (localUser) {
        setCurrentUser(localUser);
      }

      // 2. Try Supabase Session & Database (Most Accurate)
      if (supabase) {
        // Check if there is an active Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Fetch full profile from 'profiles' table in DB
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            // Convert Snake_Case DB fields to CamelCase App Types
            const appUser: UserProfile = {
              id: profile.id,
              anonymousId: profile.anonymous_id,
              realName: profile.real_name,
              gender: profile.gender,
              university: profile.university,
              universityEmail: profile.university_email,
              branch: profile.branch,
              year: profile.year,
              interests: profile.interests || [],
              bio: profile.bio,
              dob: profile.dob,
              isVerified: profile.is_verified,
              avatar: profile.avatar,
              isPremium: profile.is_premium
            };

            setCurrentUser(appUser);
            // Update local storage to keep it fresh with DB data
            localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
          }
        } else if (localUser) {
          // If local storage has a user but Supabase says "no session", 
          // it means the session expired. We should log them out.
          // Optional: You can decide to keep them logged in offline or force logout.
          // For now, we will respect the session expiry:
          // setCurrentUser(null);
          // localStorage.removeItem('otherhalf_session');
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (user: UserProfile) => {
    setCurrentUser(user);
    authService.login(user); // This calls the function that upserts to DB
  };

  const logout = () => {
    setCurrentUser(null);
    authService.logout();
    dataService.reset();
    // Clear all cached data
    sessionStorage.removeItem('otherhalf_discover_cache');
    sessionStorage.removeItem('otherhalf_discover_cache_expiry');
    sessionStorage.removeItem('otherhalf_matches_cache');
    sessionStorage.removeItem('otherhalf_matches_cache_expiry');
    sessionStorage.removeItem('otherhalf_notifications_cache');
    sessionStorage.removeItem('otherhalf_notifications_cache_expiry');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    authService.login(updatedUser); // Update persistence in DB
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      updateProfile,
      isAuthenticated: !!currentUser,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};