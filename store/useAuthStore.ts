import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Alert } from 'react-native';
import { AuthState } from '../types/exam.types';

// interface AuthState {
//   session: Session | null;
//   isLoading: boolean;
//   initializeAuth: () => void;
//   signOut: () => Promise<void>;
// }

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  initializeAuth: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, isLoading: false });
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isLoading: false });
    });

    // Listen for login/logout events
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },
  signUp: async (email, password, firstName, lastName, phone) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone, // Pass phone to Auth
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || '',
          phone: phone, // Also store in metadata for the trigger
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
    set({ session: null, isLoading: false });
  },
  // Inside useAuthStore.ts
  updateUserProfile: async (firstName: string, lastName: string, phone: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Update the public profiles table directly
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        updated_at: new Date(),
      })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Update Failed', error.message);
    } else {
      // Refresh the local session to show the new name
      const { data: sessionData } = await supabase.auth.getSession();
      set({ session: sessionData.session });
      Alert.alert('Success', 'Profile updated successfully.');
    }
  },
}));
