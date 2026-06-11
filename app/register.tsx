import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function RegisterScreen() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const FAKE_DOMAIN = '@nandinhabet.com';

  const handleSignUp = async () => {
  if (!nickname || !password) {
    return Alert.alert('Ops', 'Preencha um apelido e senha!');
  }
  if (password.length < 6) {
    return Alert.alert('Aviso', 'A senha precisa ter pelo menos 6 caracteres.');
  }

  const fakeEmail = nickname.trim().toLowerCase() + FAKE_DOMAIN;

  try {
    // 1. Cria o usuário na Autenticação do Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
    const user = userCredential.user;

    // 2. Cria o perfil do usuário no Firestore usando o UID dele como ID do documento
    await setDoc(doc(db, 'users', user.uid), {
      nickname: nickname.trim(),
      totalPoints: 0,
      exactMatches: 0,
      createdAt: new Date()
    });

    Alert.alert('Sucesso!', 'Sua conta do bolão foi criada!');
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      Alert.alert('Poxa', 'Esse apelido já está em uso.');
    } else {
      Alert.alert('Erro', 'Não foi possível criar a conta.');
    }
    console.log(error);
  }
};

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Nova Conta</Text>
        <Text style={styles.subtitle}>Escolha seu apelido para o bolão</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escolha um apelido"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Crie uma senha (mínimo 6 letras/números)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Cadastrar e Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Já tenho conta! Voltar para Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#10b981', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 24 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { padding: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
});