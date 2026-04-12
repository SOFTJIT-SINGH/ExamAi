import { create } from 'zustand';
import { AuthState } from '../types/exam.types';
import { supabase } from '../utils/supabase';
import { Alert } from 'react-native';

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  initializeAuth: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, isLoading: false });
    supabase.auth.onAuthStateChange((_event, session) => set({ session, isLoading: false }));
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
    set({ session: null, isLoading: false });
  },

  updateUserProfile: async (firstName: string, lastName: string, phone: string = '') => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Sync metadata (Relies on Database Webhooks to copy to Profiles table)
    const { data, error: authError } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName, phone: phone },
    });

    if (authError) {
      Alert.alert('Auth Sync Error', authError.message);
    } else {
      if (data.user) {
        set((state) => ({
          session: state.session ? { ...state.session, user: data.user! } : null,
        }));
      }
      Alert.alert('Success', 'Profile updated successfully.');
    }
  },
}));
