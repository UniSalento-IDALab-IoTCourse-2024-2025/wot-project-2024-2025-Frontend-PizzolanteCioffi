import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useColorScheme,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import { format, set } from 'date-fns';
import {BarChart} from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons';
import Cylinder from './Cylinder';
import MapView, { Marker, UrlTile } from 'react-native-maps';
//import { Cylinder } from 'lucide-react-native';


type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const GREEN = '#2a9d8f';

function haversine(p1: any, p2: any) {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function groupPositions(positions: any[], radiusMeters = 70) {
  const groups: { latitude: number; longitude: number; times: string[] }[] = [];

  positions.forEach((pos) => {
    let groupFound = false;
    for (const group of groups) {
      const distance = haversine(
        { lat: pos.latitude, lon: pos.longitude },
        { lat: group.latitude, lon: group.longitude }
      );
      if (distance < radiusMeters) {
        group.times.push(pos.time);
        groupFound = true;
        break;
      }
    }
    if (!groupFound) {
      groups.push({
        latitude: pos.latitude,
        longitude: pos.longitude,
        times: [pos.time],
      });
    }
  });
  return groups;
}


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


export default function HomeScreen() {
const scheme = useColorScheme();
  const navigation = useNavigation();
  const invokeUrl ='https://1dkrfof8di.execute-api.us-east-1.amazonaws.com/dev';
  const [heartRateData, setHeartRateData] = useState<number[]>([]);
  const [stepsData, setStepsData] = useState<number[]>([]);
  const [patientId, setPatientId]= useState<string | null>(null);
  const navigator = useNavigation<HomeScreenNavigationProp>();
  const [error, setError] = useState<string | null>(null);
  const [callDurationData, setCallDurationData] = useState<number[]>([]);
  const [sleepDurationData, setSleepDurationData] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  const [positions, setPositions] =useState<{latitude: number; longitude: number; time: string}[]> ([]);
  const [mapKey, setMapKey] = useState(0);


 const getPatientIdAndFetchData = useCallback(async () => {
    const now = format(new Date(), 'yyyy-MM-dd');
    const token = await AsyncStorage.getItem('authToken');
    const decodedToken = parseJwt(token || '');
    const role = decodedToken?.role;
    let resolvedPatientId: string | null = null;

    if (role === 'Patient') {
      resolvedPatientId = decodedToken?.userId;
    } else if (role === 'Assistant') {
      const assistantId = decodedToken?.userId;
      try {
        const response = await fetch(`${invokeUrl}/api/users/findByAssistantId/${assistantId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
        });
        const data = await response.json();
        resolvedPatientId = data.patientId;
      } catch (error) {
        setError('Error in API call');
        console.log('Error: ', error);
        return;
      }
    }

    if (!resolvedPatientId) {
      console.error('Patient ID is not available');
      return;
    }

    try {
      const response = await fetch(
        `${invokeUrl}/api/data/getAllByDate?date=${now}&patientId=${resolvedPatientId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
        }
      );

      const dataDTO = await response.json();
      const dataArray = dataDTO.data;
      dataArray.sort((a: { time: number }, b: { time: number }) =>
        a.time > b.time ? 1 : -1
      );

      const heartRates = dataArray.map((item: any) => item.heartRate ?? 0);
      const callDurations = dataArray.map((item: any) => item.callDuration ?? 0);
      const sleepDurations = dataArray.map((item: any) =>
        Number(item.sleepDuration) || 0
      );
      const labels = dataArray.map((item: any) => item.time);

      const positionArray=dataDTO.positions;
      const postitionFormatted = positionArray.map((pos: any) => ({
        latitude: Number(pos.latitude),
        longitude: Number(pos.longitude),
        time: pos.time,
      }));

      setPositions(postitionFormatted);
      setPositions(postitionFormatted);
      setMapKey(prev => prev + 1);  // forza il remount della mappa
      
      setHeartRateData(heartRates);
      setCallDurationData(callDurations);
      setSleepDurationData(sleepDurations);
      setTimeLabels(labels);

      setError(null);
    } catch (error) {
      setError('Error in API call');
      console.log('Error: ', error);
    }
  }, [invokeUrl]);

  /*
  // Ora uso useFocusEffect per eseguire fetch ogni volta che la pagina diventa visibile
  useFocusEffect(
    useCallback(() => {
      getPatientIdAndFetchData();
    }, [getPatientIdAndFetchData])
  );
  */

  useFocusEffect(
  useCallback(() => {
    const timeoutId = setTimeout(() => {
      getPatientIdAndFetchData();
    }, 300); // piccolo delay di 300ms

    return () => clearTimeout(timeoutId); // pulizia se si cambia schermata
  }, [getPatientIdAndFetchData])
);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      navigator.reset({
        index: 0,
        routes: [{ name: 'Login' }],
        });
    } catch (err) {
      console.log('Errore logout:', err);
    }
  };

  const goToProfile = () => {
    navigator.navigate('Profile'); 
  };

    const grouped = groupPositions(positions);
    console.log("grouped: ", grouped);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: scheme === 'dark' ? '#000' : '#fff' },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: scheme === 'dark' ? '#fff' : '#000' },
        ]}
      >
        Home
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: GREEN },
        ]}
        onPress={goToProfile}
      >
        <Text style={[styles.buttonText, { color: '#fff' }]}>
          Visualizza Profilo
        </Text>
      </TouchableOpacity>


      {/* Grafico Heart Rate */}
      {heartRateData.length > 0 && (
        <View
            style={[
              styles.chartContainer,
              { backgroundColor: scheme === 'dark' ? '#1e1e1e' : '#fff' },
            ]}
          >
            <Text
              style={[
                styles.chartTitle,
                { color: scheme === 'dark' ? '#fff' : '#000' },
              ]}
            >
              Heart Rate (bpm)
            </Text>
            <ScrollView horizontal>

             <LineChart
            data={{
              labels: timeLabels,
              datasets: [{ data: heartRateData }],
            }}
            width={timeLabels.length * 40}
            height={220}
            yAxisSuffix=" bpm"
            chartConfig={getChartConfig(scheme === 'dark')}
            bezier
            style={styles.chart}
        />
         </ScrollView>

        </View>
      )}

     {/* Grafico Call Duration */}
      {callDurationData.length > 0 && (
      
        <View
            style={[
              styles.chartContainer,
              { backgroundColor: scheme === 'dark' ? '#1e1e1e' : '#fff' },
            ]}
          >
            <Text
              style={[
                styles.chartTitle,
                { color: scheme === 'dark' ? '#fff' : '#000' },
              ]}
            >
              Call Duration (minuti)
            </Text>
            <ScrollView horizontal>
             <LineChart
            data={{
              labels: timeLabels,
              datasets: [{ data: callDurationData }],
            }}
            width={timeLabels.length * 40}
            height={220}
            yAxisSuffix=" min"
            chartConfig={getChartConfig(scheme === 'dark')}
            bezier
            style={styles.chart}
        />
        </ScrollView>
        </View>
      )}  

      {/* Grafico Sleep Duration */}
      {sleepDurationData.length > 0 && (
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: scheme === 'dark' ? '#1e1e1e' : '#fff' },
          ]}
        >
          <Text
            style={[
              styles.chartTitle,
              { color: scheme === 'dark' ? '#fff' : '#000' },
            ]}
          >
            Sleep Duration (ore)
          </Text>

          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Cylinder color={GREEN} width={80} height={170} fillPercent={Math.min(sleepDurationData[0] / 60 / 12, 1)} />
            <Text style={{ marginTop: 10, fontSize: 16, color: scheme === 'dark' ? '#fff' : '#000' }}>
              {`${Math.floor(sleepDurationData[0] / 60)}h ${Math.round(sleepDurationData[0] % 60)}m`}
            </Text>
          </View>
        </View>
      )}

      {positions.length > 0 && (
        <View
          style={[
            styles.chartContainer,
            { backgroundColor: scheme === 'dark' ? '#1e1e1e' : '#fff', paddingBottom: 16 },
          ]}
        >
          <Text
            style={[
              styles.chartTitle,
              { color: scheme === 'dark' ? '#fff' : '#000' },
            ]}
          >
            Posizioni Giornaliere
          </Text>

          <MapView
          key={mapKey}
            style={{ width: '100%', height: 200, borderRadius: 8 }}
            initialRegion={{
              latitude: positions[0].latitude,
              longitude: positions[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={true}
            zoomEnabled={true}
          >
            <UrlTile
              urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            {grouped.map((group, index) => {
              const sorted = group.times.sort((a, b) => a.localeCompare(b)); 
              const start = sorted[0];
              const end = sorted[sorted.length - 1];
              return (
                <Marker
                  key={index}
                  coordinate={{ latitude: group.latitude, longitude: group.longitude }}
                  onPress={() => Alert.alert("Posizione", `Orario: ${start} - ${end}`)}
                />
              );
            })}
          </MapView>
        </View>
      )}


      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: GREEN },
        ]}
        onPress={logout}
      >
        <Text style={[styles.buttonText, { color: '#fff' }]}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const getChartConfig = (isDarkMode: boolean) => ({
  backgroundGradientFrom: isDarkMode ? '#000000' : '#ffffff',
  backgroundGradientTo: isDarkMode ? '#000000' : '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) =>
    isDarkMode ? `rgba(0, 255, 180, ${opacity})` : `rgba(42, 157, 143, ${opacity})`, 
  labelColor: (opacity = 1) =>
    isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: isDarkMode ? '#00ffc2' : GREEN, 
  },
  propsForBackgroundLines: {
    stroke: isDarkMode ? '#444' : '#ccc', 
  },
});



const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    width: '90%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 30,
    elevation: 3,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'center',
  },
  chart: {
    borderRadius: 16,
  },
});