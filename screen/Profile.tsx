import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
  useColorScheme,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

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

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const navigator = useNavigation<ProfileScreenNavigationProp>();
  const invokeUrl = 'https://1dkrfof8di.execute-api.us-east-1.amazonaws.com/dev';

  const colors = {
    background: isDarkMode ? '#121212' : '#f5fefb',
    containerBackground: isDarkMode ? '#1e1e1e' : '#fff',
    textPrimary: isDarkMode ? '#fff' : '#333',
    inputBackground: isDarkMode ? '#2c2c2c' : '#fff',
    inputBorder: isDarkMode ? '#555' : '#ccc',
    green: '#2a9d8f',
    dropdownHeaderBackground: isDarkMode ? '#154d4a' : '#e0f7f5',
    errorText: '#ff6b6b',
    buttonText: '#fff',
  };

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const fetchTokenAndCallProfile = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const decodedToken = parseJwt(token || '');
    const id = decodedToken?.userId;
    const roleFromToken = decodedToken?.role;
    setRole(roleFromToken);

    if (!id) return;

    try {
      const endpoint = roleFromToken === 'Patient'
        ? `/api/users/findByPatientId/${id}`
        : `/api/users/findByAssistantId/${id}`;

        console.log("endpoint: ", endpoint);
      const res = await fetch(invokeUrl + endpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          }
      });

      const data = await res.json();
      setId(id);
      setName(data.name || '');
      setSurname(data.surname || '');
      setEmail(data.email || '');
      setPhoneNumber(data.phoneNumber || '');
      setAge(data.age);
      setAddress(data.address || '');

      console.log("id: ", id);
      console.log("token: ", token)
      console.log("Dati ricevuti:", data);
      


    } catch (err) {
      console.error('API error:', err);
      setError('Errore nel caricamento del profilo');
    }
  };

  const handleUpdate = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const endpoint = `/api/users/update/${id}`;

    const updateDTO =
      role === 'Patient'
        ? {
            name,
            surname,
            email,
            address,
            phoneNumber: phoneNumber || '',
            age,
            ...(password && { password }),
          }
        : {
            name,
            surname,
            email,
            phoneNumber: phoneNumber || '',
            ...(password && { password }),
          };

    try {

      console.log("updateDTO: ", updateDTO);
      console.log("body dato: ", JSON.stringify(updateDTO));
      console.log("age:")
      const response= await fetch(invokeUrl + endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
        body: JSON.stringify(updateDTO),
      });

      console.log("token: ", token);



      if(response.ok){
        Alert.alert('Your data has been updated');

      }

    } catch (error) {
      console.log('Update error:', error);
      setError('Errore durante il salvataggio');
    }
  };

  const handleDelete = async () => {
    const token = await AsyncStorage.getItem('authToken');
    try {
      await fetch(invokeUrl + `/api/users/delete/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
      });

      Alert.alert('Your profile has been correctly deleted 😢');
      navigator.navigate('Login');
    } catch (error) {
      console.log('Delete error:', error);
      setError('Errore durante la cancellazione');
    }
  };

  const handleNavigateToIndex = () => navigator.navigate('Layout');

  useEffect(() => {
    fetchTokenAndCallProfile();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={[styles.container, { backgroundColor: colors.containerBackground }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>

            <TextInput style={[styles.input, inputStyle(colors)]} placeholder="Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
            <TextInput style={[styles.input, inputStyle(colors)]} placeholder="Surname" placeholderTextColor="#888" value={surname} onChangeText={setSurname} />
            <TextInput style={[styles.input, inputStyle(colors)]} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} />
            <TextInput style={[styles.input, inputStyle(colors)]} placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={[styles.input, inputStyle(colors)]} placeholder="Phone Number" placeholderTextColor="#888" value={phoneNumber} onChangeText={setPhoneNumber} />

            {role === 'Patient' && (
              <>
                <TextInput style={[styles.input, inputStyle(colors)]} placeholder="Address" placeholderTextColor="#888" value={address} onChangeText={setAddress} />
                <TextInput style={[styles.input, inputStyle(colors)]} placeholder="Age" placeholderTextColor="#888" value={age} onChangeText={setAge} />
              </>
            )}

            {error ? <Text style={{ color: colors.errorText }}>{error}</Text> : null}

            <TouchableOpacity style={[styles.button, { backgroundColor: colors.green }]} onPress={handleUpdate}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Save Changes</Text>
            </TouchableOpacity>

            {role === 'Assistant' && (
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.green }]} onPress={handleDelete}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Delete</Text>
            </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.button, { backgroundColor: colors.green }]} onPress={handleNavigateToIndex}>
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const inputStyle = (colors: any) => ({
  backgroundColor: colors.inputBackground,
  borderColor: colors.inputBorder,
  color: colors.textPrimary,
});

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 60,
    paddingTop: 20,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
