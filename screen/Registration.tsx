import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RegistrationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Registration'
>;

export default function FitbitAuthScreen() {
  const invokeUrl = 'https://1dkrfof8di.execute-api.us-east-1.amazonaws.com/dev';
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fitbitDone, setFitbitDone] = useState(false);
  const navigator = useNavigation<RegistrationScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Definisci colori dinamici
  const colors = {
    background: isDarkMode ? '#121212' : '#fff',
    textPrimary: isDarkMode ? '#fff' : '#333',
    buttonText: isDarkMode ? '#fff' : '#333',
    buttonIcon: isDarkMode ? '#fff' : '#333',
    loadingIndicator: isDarkMode ? '#2a9d8f' : '#2F4493',
  };

  useEffect(() => {
    const fetchAuthUrl = async () => {
      try {
        const response = await fetch(invokeUrl + '/api/registration1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Errore nella chiamata API');
        const data = await response.json();
        setAuthUrl(data.fitbitAuthUrl);
        console.log('URL di autenticazione:', data.fitbitAuthUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthUrl();
  }, []);

  useLayoutEffect(() => {
    navigator.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 15, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => {
            if (fitbitDone) {
              navigator.navigate('RegistrationForm' as never);
            } else {
              navigator.navigate('Login' as never);
            }
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.buttonIcon}
            style={{ marginRight: 5 }}
          />
          <Text style={{ color: colors.buttonText, fontSize: 16 }}>
            {fitbitDone ? 'To RegistrationForm' : 'To Login'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigator, fitbitDone, colors]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.loadingIndicator} />
        <Text style={{ color: colors.textPrimary, marginTop: 10 }}>Caricamento...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>Errore: {error}</Text>
      </View>
    );
  }

  if (authUrl) {
    return (
      <WebView
        source={{ uri: authUrl }}
        style={{ flex: 1, backgroundColor: colors.background }}
        onMessage={(event) => {
          const message = event.nativeEvent.data;
          if (message === 'FITBIT_DONE') {
            setFitbitDone(true);
          }
        }}
        onError={({ nativeEvent }) => {
          console.warn('WebView error: ', nativeEvent);
        }}
      />
    );
  }

  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.textPrimary }}>Nessun URL disponibile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
