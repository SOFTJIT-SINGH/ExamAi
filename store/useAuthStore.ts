import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Alert } from "react-native";
import { AuthState } from "../types/exam.types";

// interface AuthState {
//   session: Session | null;
//   isLoading: boolean;
//   initializeAuth: () => void;
//   signOut: () => Promise<void>;
// }

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  initializeAuth:async () => {
    const { data: { session } } = await supabase.auth.getSession();
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
signUp: async (email, password, firstName, lastName) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName || ''
        }
      }
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
  updateUserProfile: async (firstName, lastName) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName }
    });
    if (error) {
      Alert.alert("Update Failed", error.message);
    } else {
      set({ session: data.session }); // Refresh UI with new name
      Alert.alert("Success", "Profile updated successfully.");
    }
  }
}));
