import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'otherhalf_session';

export const authService = {
  login: async (user: UserProfile) => {
    // 1. Save to Local Storage (Client-side immediate cache)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));

    // 2. Sync to Supabase (Backend persistence)
    if (supabase) {
      try {
        // Get the real authenticated user ID to ensure strict linkage with Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          // Prepare data for Supabase (mapping camelCase to snake_case DB columns)
          const profileData = {
            id: authUser.id, // Use REAL Auth ID, overwriting any temporary ID
            anonymous_id: user.anonymousId,
            real_name: user.realName,
            gender: user.gender,
            university: user.university,
            university_email: user.universityEmail,
            branch: user.branch,
            year: user.year,
            interests: user.interests,
            bio: user.bio,
            dob: user.dob,
            is_verified: user.isVerified,
            looking_for: user.lookingFor,
            avatar: user.avatar, // Storing base64/URL string
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('profiles')
            .upsert(profileData);

          if (error) {
            console.error('Supabase profile sync error:', error);
            // We log but don't throw, to prevent blocking the UI flow
          }
        }
      } catch (err) {
        console.error('Unexpected error during profile sync:', err);
      }
    }
  },

  getCurrentUser: (): UserProfile | null => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  logout: async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (supabase) {
      await supabase.auth.signOut();
    }
  },
  /**
   * Compress and resize an image before converting to base64
   * Max size: 600x600, JPEG quality: 82.5%
   */
  compressImage: (file: File, maxSize: number = 600, quality: number = 0.825): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  uploadAvatar: async (file: File): Promise<string> => {
    try {
      // Compress image before returning
      return await authService.compressImage(file);
    } catch (err) {
      console.error('Image compression failed, using original:', err);
      // Fallback to original (uncompressed) if compression fails
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  },

  signInWithGoogle: async () => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      }
    });

    if (error) throw error;
    return data;
  },

  signInWithMagicLink: async (email: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      }
    });

    if (error) throw error;
    return data;
  }
};