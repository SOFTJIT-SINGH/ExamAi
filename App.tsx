import './global.css';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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
import ContributeScreen from './screens/ContributeScreen';
import InstructionsScreen from './screens/InstructionsScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

import EditProfileScreen from './screens/EditProfileScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  OTP: { email: string };
  ForgotPassword: undefined;
  Instructions: undefined;
  Dashboard: undefined;
  AdminDashboard: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Contribute: undefined;
  ActiveExam: { examId: string; limit?: number };
  Grading: { examId: string };
  Result: { examId: string; reviewAnswers?: Record<string, number> };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const SplashScreen = () => (
  <View className="flex-1 items-center justify-center bg-slate-50">
    <ActivityIndicator size="large" color="#3b82f6" />
  </View>
);

export default function App() {
  const { session, userProfile, isLoading, initializeAuth } = useAuthStore();
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent={true} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {isLoading ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : session ? (
            <Stack.Group>
              {userProfile?.role === 'admin' ? (
                // Admin Stack
                <>
                  <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                  <Stack.Screen name="Profile" component={ProfileScreen} />
                  <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                  <Stack.Screen name="Contribute" component={ContributeScreen} />
                </>
              ) : (
                // Student Stack
                <>
                  <Stack.Screen name="Instructions" component={InstructionsScreen} />
                  <Stack.Screen name="Dashboard" component={DashboardScreen} />
                  <Stack.Screen name="Profile" component={ProfileScreen} />
                  <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                  <Stack.Screen name="Contribute" component={ContributeScreen} />
                  <Stack.Screen name="Grading" component={GradingScreen} />
                  <Stack.Screen name="Result" component={ResultScreen} />
                  <Stack.Screen
                    name="ActiveExam"
                    component={ActiveExamScreen}
                    options={{ gestureEnabled: false }}
                  />
                </>
              )}
            </Stack.Group>
          ) : (
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
