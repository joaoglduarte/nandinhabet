import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ATENÇÃO: Esse domínio TEM que ser exatamente igual ao do arquivo register.tsx!
  const FAKE_DOMAIN = '@nandinhabet.com'; 

  const handleLogin = async () => {
    if (!nickname || !password) {
      return Alert.alert('Ops', 'Preencha seu apelido e senha!');
    }

    setLoading(true);
    const fakeEmail = nickname.trim().toLowerCase() + FAKE_DOMAIN;

    try {
      await signInWithEmailAndPassword(auth, fakeEmail, password);
      // O _layout.tsx vai escutar o sucesso e redirecionar sozinho
    } catch (error: any) {
      console.log("Erro de Login:", error.code);
      
      // Mapeando os erros mais comuns do Firebase para avisos amigáveis
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        Alert.alert('Erro', 'Apelido ou senha incorretos.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Calma aí!', 'Muitas tentativas erradas. Tente novamente mais tarde.');
      } else {
        Alert.alert('Erro Inesperado', `Código: ${error.code}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logoText}>🏆 Nandinhabet</Text>
        <Text style={styles.subtitle}>Faça login com seu apelido para palpitar</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Seu apelido"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha secreta"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => router.push('/register')}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Ainda não tem conta? Crie uma</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logoText: { fontSize: 40, fontWeight: 'bold', color: '#10b981', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 24 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { padding: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#10b981', fontSize: 16, fontWeight: '600' },
});