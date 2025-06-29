// file: screen/Behaviour.tsx

import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Errore nel decodificare il token:', error);
    return null;
  }
};

export default function Behaviour() {
  const colorScheme = useColorScheme();
  const [behaviour, setBehaviour] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);
  const invokeUrl = 'https://1dkrfof8di.execute-api.us-east-1.amazonaws.com/dev';

  useEffect(() => {
    const fetchBehaviour = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const decodedToken = parseJwt(token || '');
      const id = decodedToken?.userId;
      const userRole=decodedToken?.role;
      setRole(userRole)

      try {
        const response = await fetch(`${invokeUrl}/api/users/getBehaviour`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
        });
        const data = await response.json();
        setBehaviour(Number(data.behaviour));
      } catch (error) {
        setError('Errore nella chiamata API');
        console.log('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBehaviour();
  }, []);

  const renderFaceIcon = () => {
    let iconName = 'emoticon-neutral';
    let color = 'gray';

    switch (behaviour) {
      case 3:
        iconName = 'emoticon-happy';
        color = 'green';
        break;
      case 2:
        iconName = 'emoticon-neutral';
        color = 'gold';
        break;
      case 1:
        iconName = 'emoticon-sad';
        color = 'red';
        break;
    }

    return (
      <MaterialCommunityIcons
        name={iconName}
        size={150}
        color={color}
        style={styles.icon}
      />
    );
  };

  const getAdviceList = (): string[] => {
  switch (behaviour) {
    case 3:
      return [
        "Ottimo lavoro! Continua a uscire e a condividere momenti con le persone a cui vuoi bene: fa bene all’umore e alla salute.",
        "Stai facendo bene a restare in contatto con amici e familiari. Una chiacchierata ogni tanto rafforza i legami e mantiene la mente attiva.",
        "Continua a ritagliarti momenti di relax: anche solo respirare profondamente o fare un po’ di movimento leggero può aiutarti a mantenere questo benessere.",
        "Hai un buon equilibrio anche nel riposo: cerca di mantenere questa routine, il tuo corpo e la tua mente ti ringrazieranno."
      ];
    case 2:
      return [
        "Continua a mantenere qualche momento di socialità, magari cerca di uscire un po’ più spesso per fare una passeggiata o incontrare qualcuno.",
        "È utile restare in contatto con amici e familiari, anche con una telefonata o una videochiamata ogni tanto.",
        "Prenditi del tempo per rilassarti durante la giornata: un po’ di stretching leggero o semplici esercizi di respirazione possono aiutarti a sentirti meglio.",
        "Cerca di mantenere una buona routine del sonno per sentirti più riposato e energico."
      ];
    case 1:
      return [
        "Uscire e fare due chiacchiere con gli altri è molto importante. Cerca di trascorrere un po’ più tempo fuori casa e di incontrare qualche persona.",
        "Prova a contattare un familiare o un amico con una telefonata o videochiamata.",
        "Cerca di rilassarti un po’ di più in ogni momento della giornata. Fare un po’ di stretching e qualche semplice esercizio di meditazione può fare molto bene.",
        "Prova a migliorare la qualità del sonno e riposare di più.",

      ];
    default:
      return ["Comportamento non disponibile al momento."];
  }
};

const getAssistantAdviceList = (): string[] => {
  return [
    "Controlla regolarmente l’andamento del paziente tramite l’app.",
    "Incoraggialo con una chiamata o un messaggio se noti un calo nella socialità.",
    "Condividi piccoli suggerimenti utili per migliorare il suo benessere quotidiano.",
  ];
};

const isPatient = role === 'Patient';
const headerText = isPatient ? 'Consigli per te' : 'Azioni consigliate';
const text= isPatient ?  "Controlla regolarmente il tuo stato sociale per migliorare il benessere psico-fisico." : 
"Controlla regolarmente lo stato sociale del paziente per migliorare il suo benessere psico-fisico."


  return (
    <ScrollView contentContainerStyle={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }
    ]}>
      {loading ? (
        <ActivityIndicator size="large" color="#888" />
      ) : (
        <>
          <View style={styles.topSection}>
            {renderFaceIcon()}
          </View>


            <View style={styles.adviceContainer}>
  <Text style={[
    styles.adviceHeader,
    { color: colorScheme === 'dark' ? '#fff' : '#000' }
  ]}>
    {headerText}
  </Text>

  <View style={styles.cardList}>
    {(role === 'Patient' ? getAdviceList() : getAssistantAdviceList()).map((tip, index) => (
      <View 
        key={index} 
        style={[
          styles.adviceCard,
          { backgroundColor: colorScheme === 'dark' ? '#121212' : '#f9f9f9' }
        ]}
      >
        <Text style={[
          styles.adviceText,
          { color: colorScheme === 'dark' ? '#eee' : '#222' }
        ]}>
          {tip}
        </Text>
      </View>
    ))}
  </View>
</View>


          {error && (
            <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>
          )}

          <View style={styles.bottomSection}>
            <Text style={{
              fontSize: 16,
              color: colorScheme === 'dark' ? '#aaa' : '#555',
              textAlign: 'center'
            }}>
              {text}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  topSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 10,
  },
  expandableHeader: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
  expandableTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  advice: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 24,
    marginBottom: 20,
  },
  bottomSection: {
    marginTop: 40,
    paddingHorizontal: 10,
  },
  adviceContainer: {
  width: '100%',
  marginBottom: 20,
},
adviceHeader: {
  fontSize: 20,
  fontWeight: '600',
  marginBottom: 10,
  textAlign: 'center',
},
cardList: {
  gap: 10,
},
adviceCard: {
  backgroundColor: '#f2f2f2',
  padding: 15,
  borderRadius: 10,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 5,
  elevation: 3,
},
adviceText: {
  fontSize: 16,
  fontWeight: '400',
  textAlign: 'left',
  lineHeight: 22,
},


  
});
