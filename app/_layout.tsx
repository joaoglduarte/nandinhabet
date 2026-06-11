import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inTabsGroup = segments[0] === '(tabs)';
    // Verifica se está na tela de login ou na tela de registro
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && inTabsGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" /> {/* Adicionamos a tela nova aqui */}
        <Stack.Screen name="(tabs)" />
      </Stack>
      
      {/* O Toast entra aqui, "flutuando" por cima de todas as telas do Stack */}
      <Toast />
    </>
  );
}