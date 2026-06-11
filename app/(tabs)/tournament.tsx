import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function TournamentScreen() {
  const [champion, setChampion] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  const [topScorer, setTopScorer] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentUser = auth.currentUser;

  // DATA DE INÍCIO DO TORNEIO - Mude para o horário do primeiro jogo real!
  const TOURNAMENT_START_DATE = '2026-06-11T16:00:00'; 

  const isTournamentLocked = () => {
    const startDate = new Date(TOURNAMENT_START_DATE);
    const now = new Date();
    return now.getTime() >= startDate.getTime();
  };

  const locked = isTournamentLocked();

  useEffect(() => {
    const fetchTournamentBet = async () => {
      if (!currentUser) return;
      try {
        const betDoc = await getDoc(doc(db, 'tournament_bets', currentUser.uid));
        if (betDoc.exists()) {
          const data = betDoc.data();
          setChampion(data.champion || '');
          setRunnerUp(data.runnerUp || '');
          setThirdPlace(data.thirdPlace || '');
          setTopScorer(data.topScorer || '');
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
      return Alert.alert('Fechado', 'Os palpites do torneio já foram encerrados!');
    }
    if (!champion || !runnerUp || !thirdPlace || !topScorer) {
      return Alert.alert('Aviso', 'Preencha todos os campos antes de salvar.');
    }

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
      Alert.alert('Sucesso', 'Seus palpites de longo prazo foram salvos!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
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
            : 'Acerte o pódio e o artilheiro para ganhar pontos massivos no final do bolão!'}
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