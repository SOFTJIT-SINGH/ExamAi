import './global.css'; 

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// State & Screens
import { useAuthStore } from './store/useAuthStore';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import OTPScreen from './screens/OTPScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import DashboardScreen from './screens/DashboardScreen';
import ActiveExamScreen from './screens/ActiveExamScreen';
import ProfileScreen from './screens/ProfileScreen';
import GradingScreen from './screens/GradingScreen'; 
import ResultScreen from './screens/ResultScreen';   

export type RootStackParamList = {
  Splash: undefined; // <-- NEW: Dedicated loading route
  Login: undefined;
  Signup: undefined;
  OTP: { email: string };
  ForgotPassword: undefined;
  Dashboard: undefined;
  Profile: undefined;
  ActiveExam: { examId: string };
  Grading: { examId: string };
  Result: { examId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// A dedicated loading screen to keep the Navigation context alive
const SplashScreen = () => (
  <View className="flex-1 bg-slate-50 justify-center items-center">
    <ActivityIndicator size="large" color="#4338ca" />
  </View>
);

export default function App() {
  const { session, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent={true} />
      {/* THE FIX: NavigationContainer is now permanently anchored */}
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {isLoading ? (
            // 1. Show Loading Screen INSIDE the navigator
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : session ? (
            // 2. Show Authenticated Screens
            <Stack.Group>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Grading" component={GradingScreen} />
              <Stack.Screen name="Result" component={ResultScreen} />
              <Stack.Screen 
                name="ActiveExam" 
                component={ActiveExamScreen} 
                options={{ gestureEnabled: false }} 
              />
            </Stack.Group>
          ) : (
            // 3. Show Public Screens
            <Stack.Group>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="OTP" component={OTPScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}