import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { auth } from '../../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível deslogar.');
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Meu Perfil</Text>
      <Text style={styles.text}>Aqui você pode gerenciar sua conta do bolão.</Text>
      
      <View style={styles.buttonContainer}>
        {/* Botão do Admin */}
        <Button 
          title="Painel de Controle (Admin)" 
          onPress={() => router.push('/admin')} 
          color="#0f172a" 
        />
        
        <View style={{ height: 20 }} />
        
        {/* Botão de Sair */}
        <Button 
          title="Sair da Conta" 
          onPress={handleLogout} 
          color="#ef4444" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 40,
  },
});