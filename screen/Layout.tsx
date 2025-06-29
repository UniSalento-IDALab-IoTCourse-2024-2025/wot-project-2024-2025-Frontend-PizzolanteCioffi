import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import CallLogs from 'react-native-call-log';
import Geolocation from '@react-native-community/geolocation';
import BackgroundService from 'react-native-background-actions';
import { PermissionsAndroid, Platform } from 'react-native';


import HomeScreen from './Home';
import Behaviour from './Behaviour';

type LayoutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Layout'
>;

const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    // Richiedi ACCESS_FINE_LOCATION
    const fineLocationGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Permesso posizione',
        message: "L'app ha bisogno di accedere alla tua posizione.",
        buttonPositive: 'OK',
      }
    );

    if (fineLocationGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      return false; // permesso negato
    }

    // Per Android 10+ (API 29+), richiedi anche ACCESS_BACKGROUND_LOCATION
    if (Platform.Version >= 29) {
      const backgroundLocationGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Permesso posizione in background',
          message: "L'app ha bisogno di accedere alla tua posizione anche quando non la stai usando.",
          buttonPositive: 'OK',
        }
      );
      return backgroundLocationGranted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true; // se versione android < 29, basta ACCESS_FINE_LOCATION
  }

  return true;
};

async function requestCallLogPermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        {
          title: 'Permesso Log Chiamate',
          message: 'L\'app ha bisogno di accedere al registro chiamate',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    // iOS non permette l'accesso ai call log
    return false;
  }
}


const Tab = createBottomTabNavigator();

const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1]; // Prende la parte del payload
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload); // Decodifica il payload come oggetto JSON
    } catch (error) {
      console.error('Errore nel decodificare il token:', error);
      return null;
    }
};

export default function LayoutScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const navigator = useNavigation<LayoutScreenNavigationProp>();
  const invokeUrl ='https://1dkrfof8di.execute-api.us-east-1.amazonaws.com/dev';
  const [error, setError] = useState<string | null>(null);
  const [timestampt, setTimestamp] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);


const sleep = (time: number) => new Promise<void>(resolve => setTimeout(() => resolve(), time));

const veryIntensiveTask = async (taskDataArguments: any) => {
  // taskDataArguments è opzionale, puoi passare dati alla funzione
  const { positionDelay, apiDelay } = taskDataArguments;

  let lastPositionTime=Date.now();
  let lastApiTime=Date.now();

  while (BackgroundService.isRunning()) {
    const now= Date.now();
    if(now- lastPositionTime >= positionDelay){
      console.log("invio posizione");
      await callPosition();
      lastPositionTime=now;
    }

    if(now- lastApiTime >= apiDelay){
      console.log("invio dati");
      await callApi();
      await callPrediction();
      lastApiTime=now;
    }

    await sleep(60*1000);
  }
};

const options = {
  taskName: 'ChiamataAPIBackground',
  taskTitle: 'Background service attivo',
  taskDesc: 'Sincronizzazione dati in background',
  taskIcon: {
    name: 'ic_launcher', // nome icona Android (deve essere in drawable)
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'yourapp://', // opzionale deep link
  parameters: {
    positionDelay: 4 * 60 * 1000, 
    apiDelay: 5 * 60 * 1000,
  },
};

useEffect(() => {
    const startBackgroundService = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const decodedToken = parseJwt(token || '');
      const role = decodedToken?.role;
      if(role==='Patient'){
        const isRunning = await BackgroundService.isRunning();
        if(!isRunning){
          await BackgroundService.start(veryIntensiveTask, options);
        }
      }
      
    };

    startBackgroundService();

    return () => {
      BackgroundService.stop();
    };
  }, []);

  const callPosition = async() =>{
    //faccio chiamata per prendere la posizione
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.warn('Permesso posizione negato');
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Posizione:', latitude, longitude);

        const token = await AsyncStorage.getItem('authToken');
        const decodedToken = parseJwt(token || '');
        const role = decodedToken?.role;

        const positionDTO = {
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        };

        try {
          const response = await fetch(`${invokeUrl}/api/data/savePositions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify(positionDTO),
          });

          if (!response.ok) {
            console.error('Errore risposta API position:', response.status);
          } else {
            console.log('Posizione inviata con successo');
          }
        } catch (error) {
          console.error('Errore invio posizione:', error);
        }
      },
      (error) => {
        console.error('Errore ottenimento posizione:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  const callApi = async () => {

  // Ottieni token e ruolo
  const token = await AsyncStorage.getItem('authToken');
  const decodedToken = parseJwt(token || '');
  const role = decodedToken?.role;

  if (role === 'Patient') {

    
  const getTodayCallLogs = async () => {
    const hasPermission = await requestCallLogPermission();
    if (!hasPermission) {
      console.log('Permesso log chiamate negato');
      return [];
    }

    try {
      const allLogs = await CallLogs.loadAll();
      // Calcolo inizio giornata (mezzanotte)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      // Filtra solo log di oggi
      const todayLogs = allLogs.filter((log: { timestamp: string; }) => {
        const logTime = parseInt(log.timestamp, 10); // timestamp in ms
        return logTime >= startOfDay;
      });

      // Mappa nel formato { timestamp, callduration }
      const callDTO = todayLogs.map((log: { timestamp: any; durationSeconds: any; }) => ({
        timestamp: log.timestamp, // in ms o come stringa, lascia così
        callduration: Math.ceil(Number(log.durationSeconds || 0) /60),
      }));

      return callDTO;
    } catch (error) {
      console.error('Errore caricamento log chiamate', error);
      return [];
    }
  };

    const callDTO = await getTodayCallLogs();

    try {
      const response = await fetch(`${invokeUrl}/api/data/saveCallsFromFE`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(callDTO), // invio array di chiamate
      });

      // Puoi gestire la risposta se vuoi
      if (!response.ok) {
        console.error('Errore risposta API dati:', response.status);
      }

    } catch (error) {
      setError('Error in API call');
      console.log('Error: ', error);
      return;
    }


    //acquisizione dati da fitbit
    try {
      const response = await fetch(`${invokeUrl}/api/data/saveDataFromFB`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        }
      });

      if (!response.ok) {
        console.error('Errore risposta API fitbit:', response.status);
      }

    } catch (error) {
      setError('Error in API call');
      console.log('Error: ', error);
      return;
    }

  }
    
};

const callPrediction= async () =>{
   // Ottieni token e ruolo
  const token = await AsyncStorage.getItem('authToken');
  const decodedToken = parseJwt(token || '');
  const role = decodedToken?.role;
  //chiamo modello predizione
    try {
      const response = await fetch(`${invokeUrl}/api/prediction/AIModel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        }
      });

      if (!response.ok) {
        console.error('Errore risposta API prediction:', response.status);
      }

    } catch (error) {
      setError('Error in API call');
      console.log('Error: ', error);
      return;
    }
}

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.log('Errore nel recupero token:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigator.navigate('Login');
    }
  }, [isAuthenticated, navigator]);

  useEffect(() => {
    // Solo se autenticato
    if (!isAuthenticated) return;

    // Chiama subito la prima volta (opzionale)
    callApi();

    const intervalId = setInterval(() => {
      callApi();
    }, 15 * 60 * 1000); // 15 minuti

    // Cleanup all'unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Behaviour') {
            iconName = focused ? 'happy' : 'happy-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2a9d8f',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Behaviour" component={Behaviour} />
    </Tab.Navigator>
  );
}