import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { auth, db } from '../../firebaseConfig';

export default function TournamentScreen() {
  const [champion, setChampion] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [topScorer, setTopScorer] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Vai guardar se o usuário já tem um palpite salvo no banco
  const [hasExistingBet, setHasExistingBet] = useState(false);

  const currentUser = auth.currentUser;

  // DATA DE INÍCIO DO TORNEIO - Mude para o horário do primeiro jogo real!
  const TOURNAMENT_START_DATE = '2026-06-12T16:00:00'; 

  const isTournamentLocked = () => {
    const startDate = new Date(TOURNAMENT_START_DATE);
    const now = new Date();
    return now.getTime() >= startDate.getTime();
  };

  const locked = isTournamentLocked();

  useEffect(() => {
    const fetchTournamentBet = async () => {
      // SE NÃO HOUVER USUÁRIO: Desativa o loading antes de sair da função!
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const betDoc = await getDoc(doc(db, 'tournament_bets', currentUser.uid));
        if (betDoc.exists()) {
          const data = betDoc.data();
          setChampion(data.champion || '');
          setRunnerUp(data.runnerUp || '');
          setThirdPlace(data.thirdPlace || '');
          setTopScorer(data.topScorer || '');
          setHasExistingBet(true);
        }
      } catch (error) {
        console.log("Erro ao buscar palpite do torneio:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTournamentBet();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    if (locked) {
      if (Platform.OS === 'web') return window.alert('Fechado: Os palpites do torneio já foram encerrados!');
      return Alert.alert('Fechado', 'Os palpites do torneio já foram encerrados!');
    }
    if (!champion || !runnerUp || !thirdPlace || !topScorer) {
      if (Platform.OS === 'web') return window.alert('Aviso: Preencha todos os campos antes de salvar.');
      return Alert.alert('Aviso', 'Preencha todos os campos antes de salvar.');
    }

    const titleText = hasExistingBet ? 'Alterar Palpites' : 'Confirmar Palpites';
    const messageText = hasExistingBet 
      ? 'Você está prestes a editar seus palpites finais. Tem certeza?' 
      : 'Tem certeza que deseja salvar estes como seus palpites finais?';

    // FUNÇÃO QUE REALMENTE SALVA NO BANCO (Separada para não repetir código)
    const performSave = async () => {
      setSaving(true);
      try {
        await setDoc(doc(db, 'tournament_bets', currentUser.uid), {
          userId: currentUser.uid,
          champion: champion.trim(),
          runnerUp: runnerUp.trim(),
          thirdPlace: thirdPlace.trim(),
          topScorer: topScorer.trim(),
          updatedAt: new Date(),
        });
        
        setHasExistingBet(true);
        Toast.show({
        type: 'success',
        text1: 'Palpite Salvo! ⚽',
        text2: 'Seus palpites finais foram registrados com sucesso.',
        position: 'top', // Pode ser 'bottom' se preferir que apareça embaixo
        visibilityTime: 3000, // Some sozinho após 3 segundos
    });
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Erro: Não foi possível salvar.');
        } else {
          Alert.alert('Erro', 'Não foi possível salvar.');
        }
      } finally {
        setSaving(false);
      }
    };

    // DIVISÃO DE PLATAFORMAS: WEB vs NATIVO
    if (Platform.OS === 'web') {
      // Usa a caixa de confirmação nativa do navegador
      const confirmed = window.confirm(`${titleText}\n\n${messageText}`);
      if (confirmed) {
        performSave();
      }
    } else {
      // Usa a caixa do React Native para iOS/Android
      Alert.alert(
        titleText,
        messageText,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, salvar!', onPress: performSave }
        ]
      );
    }
  };
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.headerTitle}>Palpites Finais</Text>
        <Text style={styles.headerSubtitle}>
          {locked 
            ? 'Palpites encerrados! Agora é torcer.' 
            : 'Acerte o pódio e o artilheiro para ganhar pontos massivos no final do bolão! Obs: preencha todos os campos para salvá-los!'}
        </Text>

        <View style={[styles.card, locked && styles.cardLocked]}>
          <Text style={styles.label}>🏆 Campeão (20 pts)</Text>
          <TextInput
            style={[styles.input, locked && styles.inputLocked]}
            placeholder="Ex: Brasil"
            value={champion}
            onChangeText={setChampion}
            editable={!locked}
          />

          <Text style={styles.label}>🥈 Vice-Campeão (15 pts)</Text>
          <TextInput
            style={[styles.input, locked && styles.inputLocked]}
            placeholder="Ex: França"
            value={runnerUp}
            onChangeText={setRunnerUp}
            editable={!locked}
          />

          <Text style={styles.label}>🥉 3º Colocado (10 pts)</Text>
          <TextInput
            style={[styles.input, locked && styles.inputLocked]}
            placeholder="Ex: Argentina"
            value={thirdPlace}
            onChangeText={setThirdPlace}
            editable={!locked}
          />

          <Text style={styles.label}>⚽ Artilheiro (15 pts)</Text>
          <TextInput
            style={[styles.input, locked && styles.inputLocked]}
            placeholder="Ex: Neymar"
            value={topScorer}
            onChangeText={setTopScorer}
            editable={!locked}
          />

          <TouchableOpacity 
            style={[styles.saveButton, locked && styles.saveButtonLocked]} 
            onPress={handleSave}
            disabled={saving || locked}
          >
            <Text style={styles.saveButtonText}>
              {locked ? 'Palpites Travados 🔒' : saving ? 'Salvando...' : 'Salvar Apostas do Torneio'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', textAlign: 'center', marginTop: 20 },
  headerSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardLocked: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 14, fontSize: 16, color: '#0f172a' },
  inputLocked: { backgroundColor: '#e2e8f0', color: '#64748b' },
  saveButton: { backgroundColor: '#10b981', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  saveButtonLocked: { backgroundColor: '#94a3b8' },
  saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});