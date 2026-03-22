// This import is strictly required for NativeWind v4 to inject your Tailwind classes
import './global.css'; 

import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ActiveExamScreen from './screens/ActiveExamScreen';

export default function App() {
  return (
    <View className="flex-1 bg-slate-50">
      {/* Ensures the device status bar (battery, time) is visible and readable 
        against our light slate background.
      */}
      <StatusBar style="dark" translucent={true} />
      
      {/* Mounting our Phase 1 Active Exam Interface.
        Since Zustand manages state globally, we don't need to wrap this in a Provider.
      */}
      <ActiveExamScreen />
    </View>
  );
}