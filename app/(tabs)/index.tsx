import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebaseConfig';

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
}

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { scoreA: string; scoreB: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentUser = auth.currentUser;

  // Função para formatar a data ISO de um jeito bonito na tela
  const formatDisplayDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ' -');
    } catch (e) {
      return isoString;
    }
  };

  // FUNÇÃO CRUCIAL: Verifica se faltar menos de 1 hora para o jogo
  const isMatchLocked = (matchDateString: string) => {
  const matchDate = new Date(matchDateString);
  const now = new Date();
  // Trava apenas se o horário atual for maior ou igual ao horário do jogo
  return now.getTime() >= matchDate.getTime();
};

  useEffect(() => {
    const matchesRef = collection(db, 'matches');
    
    const unsubscribeMatches = onSnapshot(matchesRef, (snapshot) => {
      const matchesList: Match[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        matchesList.push({
          id: doc.id,
          teamA: data.teamA || 'Time A',
          teamB: data.teamB || 'Time B',
          date: data.date || '',
        });
      });
      setMatches(matchesList);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    if (currentUser) {
      const predictionsRef = collection(db, 'predictions');
      const q = query(predictionsRef, where('userId', '==', currentUser.uid));
      
      getDocs(q).then((snapshot) => {
        const userPredictions: Record<string, { scoreA: string; scoreB: string }> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          userPredictions[data.matchId] = {
            scoreA: String(data.scoreA),
            scoreB: String(data.scoreB),
          };
        });
        setPredictions(userPredictions);
      });
    }

    return () => unsubscribeMatches();
  }, [currentUser]);

  const handleScoreChange = (matchId: string, team: 'scoreA' | 'scoreB', value: string) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value,
      },
    }));
  };

  const handleSavePrediction = async (matchId: string, scoreA: string, scoreB: string) => {
  if (!auth.currentUser) return;

  try {
    // Criamos um ID único para o palpite combinando o ID do usuário + ID do jogo
    // Isso impede que o mesmo usuário crie dois palpites para o mesmo jogo!
    const predictionId = `${auth.currentUser.uid}_${matchId}`;
    const predictionRef = doc(db, 'predictions', predictionId);

    // USAMOS SETDOC COM MERGE:
    // Se o palpite não existir (2º jogo), ele cria. Se já existir, ele só atualiza!
    await setDoc(predictionRef, {
      userId: auth.currentUser.uid,
      matchId: matchId,
      scoreA: Number(scoreA), // Já salvando como número para não quebrar o Admin!
      scoreB: Number(scoreB), // Já salvando como número para não quebrar o Admin!
      updatedAt: new Date(),
    }, { merge: true });

    Toast.show({
      type: 'success',
      text1: 'Palpite Salvo! ⚽',
      text2: 'Seu placar foi registrado com sucesso.',
      position: 'top', // Pode ser 'bottom' se preferir que apareça embaixo
      visibilityTime: 3000, // Some sozinho após 3 segundos
    });
  } catch (error) {
    console.log("Erro ao salvar palpite:", error);
    if (Platform.OS === 'web') window.alert('Erro ao salvar palpite.');
    else Alert.alert('Erro', 'Não foi possível salvar seu palpite.');
  }
};

  const renderMatchCard = ({ item }: { item: Match }) => {
    const locked = isMatchLocked(item.date); // Descobre se o jogo está travado

    return (
      <View style={[styles.card, locked && styles.cardLocked]}>
        <Text style={styles.date}>{formatDisplayDate(item.date)}</Text>
        
        <View style={styles.matchRow}>
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{item.teamA}</Text>
          </View>

          <View style={styles.scoreContainer}>
            <TextInput 
              style={[styles.input, locked && styles.inputLocked]} 
              keyboardType="numeric"
              maxLength={2}
              value={predictions[item.id]?.scoreA || ''}
              onChangeText={(text) => handleScoreChange(item.id, 'scoreA', text)}
              placeholder="0"
              editable={!locked} // Bloqueia a digitação se estiver travado
            />
            <Text style={styles.vs}>X</Text>
            <TextInput 
              style={[styles.input, locked && styles.inputLocked]} 
              keyboardType="numeric"
              maxLength={2}
              value={predictions[item.id]?.scoreB || ''}
              onChangeText={(text) => handleScoreChange(item.id, 'scoreB', text)}
              placeholder="0"
              editable={!locked} // Bloqueia a digitação se estiver travado
            />
          </View>

          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{item.teamB}</Text>
          </View>
        </View>

        {/* Altera o botão dependendo do status de bloqueio */}
        <TouchableOpacity 
          style={[styles.saveButton, locked ? styles.saveButtonLocked : null]} 
          onPress={() => handleSavePrediction(item.id, predictions[item.id]?.scoreA || '', predictions[item.id]?.scoreB || '')}
          disabled={saving || locked}
        >
          <Text style={styles.saveButtonText}>
            {locked ? 'Palpites Encerrados 🔒' : saving ? 'Salvando...' : 'Salvar Palpite'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList 
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  listContainer: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardLocked: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1 }, // Estilo pro card cinza
  date: { textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamContainer: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 16, fontWeight: 'bold', color: '#334155', textAlign: 'center' },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  input: { width: 44, height: 44, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  inputLocked: { backgroundColor: '#e2e8f0', color: '#64748b', borderColor: '#cbd5e1' }, // Estilo pro input cinza
  vs: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', marginHorizontal: 8 },
  saveButton: { backgroundColor: '#10b981', padding: 10, borderRadius: 8, alignItems: 'center' },
  saveButtonLocked: { backgroundColor: '#94a3b8' }, // Botão cinza desativado
  saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});