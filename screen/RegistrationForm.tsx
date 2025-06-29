import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RegistrationFormScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RegistrationForm'
>;

export default function RegistrationScreen() {
  const invokeUrl =
    'https://1dkrfof8di.execute-api.us-east-1.amazonaws.com/dev';

  const [patientName, setPatientName] = useState('');
  const [patientSurname, setPatientSurname] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [patientPhoneNumber, setPatientPhoneNumber] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientAddress, setPatientAddress] = useState('');

  const [assistantName, setAssistantName] = useState('');
  const [assistantSurname, setAssistantSurname] = useState('');
  const [assistantEmail, setAssistantEmail] = useState('');
  const [assistantPassword, setAssistantPassword] = useState('');
  const [assistantPhoneNumber, setAssistantPhoneNumber] = useState('');

  const [error, setError] = useState('');
  const navigator = useNavigation<RegistrationFormScreenNavigationProp>();
  const [showPatientForm, setShowPatientForm] = useState(true);
  const [showAssistantForm, setShowAssistantForm] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Colori dinamici per tema chiaro/scuro
  const colors = {
    background: isDarkMode ? '#121212' : '#f5fefb',
    containerBackground: isDarkMode ? '#1e1e1e' : '#fff',
    textPrimary: isDarkMode ? '#fff' : '#333',
    inputBackground: isDarkMode ? '#2c2c2c' : '#fff',
    inputBorder: isDarkMode ? '#555' : '#ccc',
    green: '#2a9d8f',
    dropdownHeaderBackground: isDarkMode ? '#154d4a' : '#e0f7f5',
    errorText: '#ff6b6b',
    buttonBackground: '#2a9d8f',
    buttonText: '#fff',
    iconColor: '#2a9d8f',
    loginLink: '#2a9d8f',
  };

  const handleRegistration = async () => {
    if (
      !patientEmail ||
      !patientPassword ||
      !patientName ||
      !patientSurname ||
      !patientAddress ||
      ! patientAge ||
      !assistantEmail ||
      !assistantPassword ||
      !assistantName ||
      !assistantSurname
    ) {
      setError('Data with * must be compiled!');
      return;
    }

    const addressRegex = /^Via Bari 17,\s*Presicce-Acquarica,\s*Italy$/;

    if (!addressRegex.test(patientAddress)) {
      setError('Formato corretto: <via> <numero civico>, <città/paese>, <nazione>');
      return;
    } else {
      setError('');
    }

    const userDTO = {
      patientName,
      patientSurname,
      patientEmail,
      patientPassword,
      patientPhoneNumber,
      patientAge,
      patientAddress,
      assistantName,
      assistantSurname,
      assistantEmail,
      assistantPassword,
      assistantPhoneNumber,
    };
    try {
      const response = await fetch(invokeUrl + '/api/registration2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'Authorization': 'Bearer ' + jwt
        },
        body: JSON.stringify(userDTO),
      });

      if (!response.ok) {
        console.log('Ricevuto HTTP status: ' + response.status);
        if (response.status === 409) {
          setError('Email already exists');
          return;
        } else {
          setError('Error in registration, please try again');
        }
      }
      // Andiamo alla schermata del login
      navigator.navigate('Login');
    } catch (error) {
      setError('Error in API call');
      console.log('Error: ', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex1, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Complete your Registration
            </Text>

            {/* PAZIENTE */}
            <TouchableOpacity
              style={[styles.dropdownHeader, { backgroundColor: colors.dropdownHeaderBackground, borderColor: colors.green }]}
              onPress={() => setShowPatientForm(!showPatientForm)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={showPatientForm ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={colors.green}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.dropdownHeaderText, { color: colors.green }]}>Patient Information</Text>
              </View>
            </TouchableOpacity>

            {showPatientForm && (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Patient Name*"
                  placeholderTextColor="#888"
                  value={patientName}
                  onChangeText={setPatientName}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Patient Surname*"
                  placeholderTextColor="#888"
                  value={patientSurname}
                  onChangeText={setPatientSurname}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Patient Email*"
                  placeholderTextColor="#888"
                  value={patientEmail}
                  onChangeText={setPatientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Patient Password*"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={patientPassword}
                  onChangeText={setPatientPassword}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Patient Address*"
                  placeholderTextColor="#888"
                  value={patientAddress}
                  onChangeText={setPatientAddress}
                />
                <Text style={{
                  color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  textAlign: 'center',
                  marginTop: 0,
                  width: '100%',
                  fontSize: 14,
                }}
              >
                  Inserisci l'indirizzo nel seguente formato:              "via numero civico, città/paese, nazione"
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Patient Phone Number"
                  placeholderTextColor="#888"
                  value={patientPhoneNumber}
                  onChangeText={setPatientPhoneNumber}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Patient Age*"
                  placeholderTextColor="#888"
                  value={patientAge}
                  onChangeText={setPatientAge}
                  keyboardType="numeric"
                />
              </>
            )}

            {/* ASSISTENTE */}
            <TouchableOpacity
              style={[styles.dropdownHeader, { backgroundColor: colors.dropdownHeaderBackground, borderColor: colors.green }]}
              onPress={() => setShowAssistantForm(!showAssistantForm)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={showAssistantForm ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={colors.green}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.dropdownHeaderText, { color: colors.green }]}>Assistant Information</Text>
              </View>
            </TouchableOpacity>

            {showAssistantForm && (
              <>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Assistant Name*"
                  placeholderTextColor="#888"
                  value={assistantName}
                  onChangeText={setAssistantName}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Assistant Surname*"
                  placeholderTextColor="#888"
                  value={assistantSurname}
                  onChangeText={setAssistantSurname}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Assistant Email*"
                  placeholderTextColor="#888"
                  value={assistantEmail}
                  onChangeText={setAssistantEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Assistant Password*"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={assistantPassword}
                  onChangeText={setAssistantPassword}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
                  placeholder="Assistant Phone Number"
                  placeholderTextColor="#888"
                  value={assistantPhoneNumber}
                  onChangeText={setAssistantPhoneNumber}
                  keyboardType="phone-pad"
                />
              </>
            )}

            {error ? <Text style={[styles.error, { color: colors.errorText }]}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.buttonBackground }]}
              onPress={handleRegistration}
            >
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigator.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.loginLink }]}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    height: 50,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 15,
    fontSize: 16,
  },
  dropdownHeader: {
    width: '90%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 15,
  },
  dropdownHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    marginTop: 8,
    fontSize: 14,
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
  loginLink: {
    marginTop: 12,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
