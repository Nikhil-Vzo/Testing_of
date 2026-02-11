import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/auth';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  login: (user: UserProfile) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from DB on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const localUser = authService.getCurrentUser();
      if (localUser) setCurrentUser(localUser);

      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
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
              lookingFor: profile.looking_for || [],
              bio: profile.bio,
              dob: profile.dob,
              isVerified: profile.is_verified,
              avatar: profile.avatar,
              isPremium: profile.is_premium
            };

            setCurrentUser(appUser);
            localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (user: UserProfile) => {
    setCurrentUser(user);
    await authService.login(user);
  };

  const logout = () => {
    setCurrentUser(null);
    authService.logout();
    // Removed dataService.reset() as it is deprecated

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
    authService.login(updatedUser);
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