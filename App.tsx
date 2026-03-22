// Strictly required for NativeWind v4
import './global.css'; 

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Screen Imports
import ActiveExamScreen from './screens/ActiveExamScreen';

// Type definitions for our Route params
export type RootStackParamList = {
  ActiveExam: undefined;
  // Future screens will go here:
  // Dashboard: undefined;
  // ExamResults: { score: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      <StatusBar style="dark" translucent={true} />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="ActiveExam"
          screenOptions={{ 
            headerShown: false, // We built our own custom header in the screen
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen 
            name="ActiveExam" 
            component={ActiveExamScreen} 
            // Crucial for exams: prevent iOS swipe-back gesture
            options={{ gestureEnabled: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}