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

  // Load from DB on mount (Optimized: Cache-First)
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. FAST: Load from LocalStorage immediately to unblock UI
      const localUser = authService.getCurrentUser();
      if (localUser) {
        setCurrentUser(localUser);
        setIsLoading(false); // <--- The App loads instantly here
      }

      // 2. SLOW (Background): Verify with Supabase for updates/security
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch fresh profile
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

              // Only update state if data actually changed (prevents re-renders)
              if (JSON.stringify(appUser) !== JSON.stringify(localUser)) {
                console.log('Profile updated from server');
                setCurrentUser(appUser);
                localStorage.setItem('otherhalf_session', JSON.stringify(appUser));
              }
            }
          } else if (localUser) {
            // OPTIONAL: If Supabase says "No Session" but we have Local Data, 
            // we might want to logout or try to refresh token. 
            // For now, we trust the cache to allow offline usage, but you can force logout here if strict security is needed.
            // logout(); 
          }
        } catch (err) {
          console.error('Background auth check failed:', err);
        }
      }

      // If we didn't have a local user, we had to wait for Supabase. Now we stop loading.
      if (!localUser) setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (user: UserProfile) => {
    setCurrentUser(user);
    // Non-blocking sync
    authService.login(user).catch(err => console.error("Background sync error:", err));
  };

  const logout = () => {
    setCurrentUser(null);
    authService.logout();

    // Clear all caches
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
    // Non-blocking update
    authService.login(updatedUser).catch(err => console.error("Profile update sync error:", err));
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