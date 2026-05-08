import { create } from 'zustand';
import { AuthState } from '../types/exam.types';
import { supabase } from '../utils/supabase';
import { Alert } from 'react-native';

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  userProfile: null,
  isLoading: true,

  initializeAuth: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    let userProfile = null;
    if (session?.user) {
      // Try to fetch with phone and avatar_url first
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, phone, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.warn('Profile Fetch (with new columns) failed, trying basic selection:', error.message);
        // Fallback: Try without new columns
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (fallbackError) console.error('Final Profile Fetch Error:', fallbackError);
        userProfile = fallbackData;
      } else {
        userProfile = data;
      }
    }

    set({ session, userProfile, isLoading: false });
    
    supabase.auth.onAuthStateChange(async (_event, session) => {
      let profile = null;
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, phone, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (error) {
          const { data: fallback } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, role')
            .eq('id', session.user.id)
            .maybeSingle();
          profile = fallback;
        } else {
          profile = data;
        }
      }
      set({ session, userProfile: profile, isLoading: false });
    });
  },

  signUp: async (email, password, firstName, lastName, phone) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || '',
          phone: phone || '', // Stores in metadata, triggering the SQL function to copy to Profiles
        },
      },
    });
    set({ isLoading: false });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ session: null, userProfile: null, isLoading: false });
  },

  uploadAvatar: async (uri: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, formData);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  },

  updateUserProfile: async (firstName: string, lastName: string, phone: string = '', avatarUrl?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('--- Profile Update: Starting ---');

    // We skip supabase.auth.updateUser here because it triggers onAuthStateChange 
    // which creates a race condition/deadlock with the profiles table update.
    // The app relies on the `profiles` table for displaying user data anyway.

    // 2. Directly update the profiles table (Aligned with SQL Schema)
    console.log('--- DB Update: Starting ---');
    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      email: user.email, // Syncing email as per your schema
      updated_at: new Date().toISOString(),
    };
    if (avatarUrl) updateData.avatar_url = avatarUrl;

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (profileError) {
      console.error('--- DB Update: ERROR ---', profileError);
      throw new Error(`Database Error: ${profileError.message}`);
    }

    console.log('--- DB Update: SUCCESS ---');

    // 3. Keep local state in sync
    if (user) {
      set((state) => ({
        session: state.session ? { ...state.session, user: user } : null,
        userProfile: state.userProfile 
          ? { 
              ...state.userProfile, 
              first_name: firstName, 
              last_name: lastName, 
              phone: phone,
              email: user.email,
              avatar_url: avatarUrl || state.userProfile.avatar_url
            }
          : {
              id: user.id,
              first_name: firstName,
              last_name: lastName,
              phone: phone,
              email: user.email,
              avatar_url: avatarUrl || '',
              role: 'student'
            },
      }));
      console.log('--- Store Sync: SUCCESS ---');
    }
  },
}));
