import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screen/Login';
import FitbitAuthScreen from './screen/Registration';
import RegistrationForm from './screen/RegistrationForm'; 
import LayoutScreen from './screen/Layout';
import HomeScreen from './screen/Home';
import ProfileScreen from './screen/Profile';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

async function setupNotificationChannel() {
  const channelId = await notifee.createChannel({
    id: 'default_channel', 
    name: 'Notifiche generiche',
    importance: AndroidImportance.HIGH,
  });
  console.log('Notification channel created:', channelId);
}


export type RootStackParamList = {
  Login: undefined;
  Registration: undefined;
  RegistrationForm: undefined;
  Layout: undefined
  Home: undefined;
  Profile: undefined
};

const Stack = createNativeStackNavigator<RootStackParamList>();




export default function App() {

   useEffect(() => {
    setupNotificationChannel();

    // Listener per notifiche in foreground
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM message received in foreground:', remoteMessage);

      // Mostra la notifica con notifee
      await notifee.displayNotification({
        title: remoteMessage.notification?.title ?? 'Notifica',
        body: remoteMessage.notification?.body ?? '',
        android: {
          channelId: 'default_channel',
        },
      });
    });

    return () => unsubscribe();
  }, []);


  const scheme = useColorScheme(); // 'dark' o 'light'

  return (
    <SafeAreaProvider>
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: ' ', headerBackVisible: false }}        
        />
        
        <Stack.Screen 
          name="Registration" 
          component={FitbitAuthScreen}
          options={{ title: ' ', headerBackVisible: false }}        
        />

        <Stack.Screen 
          name="RegistrationForm" 
          component={RegistrationForm} 
          options={{ title: ' ' }}
        />

        <Stack.Screen 
          name="Layout" 
          component={LayoutScreen}
          options={{ title: ' ',headerBackVisible: false, headerShown: false }}        
        />

        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: ' ',headerBackVisible: false, headerShown: false }}        
        />

        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: ' ',headerBackVisible: false, headerShown: false }}        
        />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}