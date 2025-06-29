import React, { useState } from 'react';
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'This method is deprecated',
]);
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

export default function LoginScreen() {
  const invokeUrl = 'https://1dkrfof8di.execute-api.us-east-1.amazonaws.com/dev';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [fcmToken, setFcmToken] = useState('');
  const navigator = useNavigation<LoginScreenNavigationProp>();
  const colorScheme = useColorScheme();

  // Definisci i colori in base al tema
  const isDarkMode = colorScheme === 'dark';

  const colors = {
    background: isDarkMode ? '#121212' : '#f5fefb',
    textPrimary: isDarkMode ? '#fff' : '#333',
    inputBackground: isDarkMode ? '#1e1e1e' : '#fff',
    inputBorder: isDarkMode ? '#444' : '#ccc',
    roleBorder: isDarkMode ? '#2a9d8f' : '#2a9d8f',
    roleSelectedBackground: isDarkMode ? '#2a9d8f' : '#2a9d8f',
    roleSelectedText: '#fff',
    roleText: isDarkMode ? '#2a9d8f' : '#2a9d8f',
    errorText: '#ff6b6b',
    buttonBackground: isDarkMode ? '#2a9d8f' : '#2a9d8f',
    buttonText: '#fff',
    registerText: isDarkMode ? '#2a9d8f' : '#2a9d8f',
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email or password missing');
      return;
    }

    if (!role) {
      setError('Role is required');
      return;
    }

    try {
        const token = await messaging().getToken();
        setFcmToken(token);
        console.log('token:', token);
        console.log('FCM Token:', fcmToken);

      const userDTO = {
        email: email,
        password: password,
        role: role,
        fcmToken: token,
      };

      console.log("UserDTO: ", userDTO);

      const response = await fetch(invokeUrl + '/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDTO),
      });

      if (!response.ok) {
        console.log('ricevuto HTTP status ' + response.status);
        setError('Invalid credentials');
        return;
      }

      const data = await response.json();
      const { jwt } = data;

      if (jwt) {
        await AsyncStorage.setItem('authToken', jwt);
         navigator.navigate('Layout');
      } else {
        setError('Authentication failed');
      }
    } catch (error) {
      setError('Error in API call');
      console.log('Error:', error);
    }
  };

  const handleNavigateToRegistration = () => {
    navigator.navigate('Registration');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Login</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
            placeholder="Email"
            placeholderTextColor={isDarkMode ? '#888' : '#888'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }]}
            placeholder="Password"
            placeholderTextColor={isDarkMode ? '#888' : '#888'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                {
                  borderColor: colors.roleBorder,
                  backgroundColor: role === 'Patient' ? colors.roleSelectedBackground : 'transparent',
                },
              ]}
              onPress={() => setRole('Patient')}>
              <Text
                style={[
                  styles.roleButtonText,
                  {
                    color: role === 'Patient' ? colors.roleSelectedText : colors.roleText,
                  },
                ]}>
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                {
                  borderColor: colors.roleBorder,
                  backgroundColor: role === 'Assistant' ? colors.roleSelectedBackground : 'transparent',
                },
              ]}
              onPress={() => setRole('Assistant')}>
              <Text
                style={[
                  styles.roleButtonText,
                  {
                    color: role === 'Assistant' ? colors.roleSelectedText : colors.roleText,
                  },
                ]}>
                Assistant
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={[styles.error, { color: colors.errorText }]}>{error}</Text> : null}

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.buttonBackground }]} onPress={handleLogin}>
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNavigateToRegistration}>
            <Text style={[styles.registerText, { color: colors.registerText }]}>
              Don't you have an account yet? Sign up
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const GREEN = '#2a9d8f';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
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
  roleContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  roleButtonSelected: {
    backgroundColor: GREEN,
  },
  roleButtonText: {
    fontWeight: 'bold',
  },
  roleButtonTextSelected: {
    color: '#fff',
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
  registerText: {
    marginTop: 12,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
