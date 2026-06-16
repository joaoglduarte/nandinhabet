import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebaseConfig';

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
  realScoreA?: number; 
  realScoreB?: number;
  status?: string;
}

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { scoreA: string; scoreB: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // NOVOS ESTADOS PARA O MURAL DE TRANSPARÊNCIA (MODAL)
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [outrosPalpites, setOutrosPalpites] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [usersCache, setUsersCache] = useState<Record<string, string>>({});

  const currentUser = auth.currentUser;

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

  const isMatchLocked = (matchDateString: string) => {
    const matchDate = new Date(matchDateString);
    const now = new Date();
    return now.getTime() >= matchDate.getTime();
  };

  // 🔥 NOVA FUNÇÃO: Busca os palpites dos outros apenas quando o Modal abre
  const handleAbrirMural = async (match: Match) => {
    setSelectedMatch(match);
    setModalVisible(true);
    setLoadingModal(true);

    try {
      // 1. Busca os nomes dos usuários (usamos um cache para não buscar toda hora)
      let currentUsers = usersCache;
      if (Object.keys(currentUsers).length === 0) {
        const usersSnap = await getDocs(collection(db, 'users'));
        const tempCache: Record<string, string> = {};
        usersSnap.forEach(doc => { tempCache[doc.id] = doc.data().nickname || 'Jogador'; });
        setUsersCache(tempCache);
        currentUsers = tempCache;
      }

      // 2. Busca os palpites específicos deste jogo
      const q = query(collection(db, 'predictions'), where('matchId', '==', match.id));
      const snap = await getDocs(q);
      
      const lista = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          scoreA: data.scoreA,
          scoreB: data.scoreB,
          userName: currentUsers[data.userId] || 'Invisível'
        };
      });

      // Ordena alfabeticamente pelo nome para ficar organizado
      lista.sort((a, b) => a.userName.localeCompare(b.userName));
      setOutrosPalpites(lista);

    } catch (error) {
      console.log("Erro ao buscar mural:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  useEffect(() => {
    const verificarPalpiteFinal = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const betDoc = await getDoc(doc(db, 'tournament_bets', user.uid));
          if (!betDoc.exists()) {
            Alert.alert(
              '⚠️ Fim do Prazo!',
              'Você ainda não enviou seus palpites finais (Campeão, Artilheiro, etc). O prazo encerra HOJE!',
              [
                { text: 'Fazer Depois', style: 'cancel' },
                { text: 'Palpitar Agora', onPress: () => router.push('/palpitesfinais') }
              ]
            );
          }
        } catch (error) {
          console.log("Erro ao verificar palpite final:", error);
        }
      }
    };
    verificarPalpiteFinal();
  }, []); 

 // Adicione um estado para guardar o índice do próximo jogo no topo do arquivo:
  const [initialIndex, setInitialIndex] = useState(0);
  const flatListRef = useRef<any>(null); // Ref para controlar o scroll

  useEffect(() => {
    setLoading(true);
    const matchesRef = collection(db, 'matches');
    
    const unsubscribeMatches = onSnapshot(matchesRef, (snapshot) => {
      const matchesList: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        matchesList.push({
          id: doc.id,
          teamA: data.teamA || 'Time A',
          teamB: data.teamB || 'Time B',
          date: data.date || '',
          realScoreA: data.realScoreA, 
          realScoreB: data.realScoreB,
        });
      });

      // 🛡️ 1. ORDENAÇÃO SEGURA: Evita que datas nulas ou inválidas quebrem o Sort
    matchesList.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      if (isNaN(timeA)) return 1;  // Joga lixo/erros para o fim da lista
      if (isNaN(timeB)) return -1;
      return timeA - timeB;
    });

    // 🛡️ 2. BUSCA DO PRÓXIMO JOGO BLINDADA
    const agora = new Date().getTime();
    const indexProximoJogo = matchesList.findIndex((jogo) => {
      if (!jogo.date) return false;
      const jogoTime = new Date(jogo.date).getTime();
      // Só aceita se for uma data válida E for maior ou igual ao segundo atual
      return !isNaN(jogoTime) && jogoTime >= agora;
    });

    setMatches(matchesList);
    
    // 🛡️ 3. INTELIGÊNCIA DE FALLBACK
    if (indexProximoJogo >= 0) {
      setInitialIndex(indexProximoJogo);
    } else if (matchesList.length > 0) {
      // Se a Copa acabou (ou todos os jogos passaram), foca no ÚLTIMO jogo da lista
      setInitialIndex(matchesList.length - 1);
    }

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

useEffect(() => {
  if (matches.length > 0 && initialIndex > 0) {
    // Um pequeno delay de 100ms garante que o layout da tela já foi desenhado antes do scroll rodar
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: initialIndex,
        animated: false, // false para não dar aquele tranco visual de rolagem ao abrir o app
        viewPosition: 0  // 0 significa alinhar o item exatamente no topo da tela!
      });
    }, 100);
  }
}, [matches, initialIndex]);

  const handleScoreChange = (matchId: string, team: 'scoreA' | 'scoreB', value: string) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: value },
    }));
  };

  const handleSavePrediction = async (matchId: string, scoreA: string, scoreB: string) => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const predictionId = `${auth.currentUser.uid}_${matchId}`;
      const predictionRef = doc(db, 'predictions', predictionId);

      await setDoc(predictionRef, {
        userId: auth.currentUser.uid,
        matchId: matchId,
        scoreA: Number(scoreA), 
        scoreB: Number(scoreB), 
        updatedAt: new Date(),
      }, { merge: true });

      Toast.show({
        type: 'success',
        text1: 'Palpite Salvo! ⚽',
        text2: 'Seu placar foi registrado com sucesso.',
        position: 'top', 
        visibilityTime: 3000, 
      });
    } catch (error) {
      console.log("Erro ao salvar palpite:", error);
      if (Platform.OS === 'web') window.alert('Erro ao salvar palpite.');
      else Alert.alert('Erro', 'Não foi possível salvar seu palpite.');
    } finally {
      setSaving(false);
    }
  };

  const getScoreBadgeStyle = (item: any) => {
    // ATENÇÃO: Substitua "selectedMatch" pelo nome da variável de estado 
    // que você usa para guardar qual jogo está aberto no Modal agora!
    // (Pode ser "jogoSelecionado", "currentMatch", etc)
    const jogoAberto = selectedMatch; 

    if (!jogoAberto || jogoAberto.realScoreA === undefined || jogoAberto.realScoreA === null) {
      return styles.scoreBadgeDefault; // Cinza se não acabou
    }

    const pA = Number(item.scoreA);
    const pB = Number(item.scoreB);
    const rA = Number(jogoAberto.realScoreA);
    const rB = Number(jogoAberto.realScoreB);

    // 🟢 CRAVADA (Verde)
    if (pA === rA && pB === rB) return styles.scoreBadgeExact;
    
    // 🟡 ACERTOU VENCEDOR/EMPATE (Amarelo)
    if ((pA > pB && rA > rB) || (pA < pB && rA < rB) || (pA === pB && rA === rB)) return styles.scoreBadgePartial;
    
    // 🔴 ERROU (Vermelho)
    return styles.scoreBadgeWrong;
  };

  const renderMatchCard = ({ item }: { item: Match }) => {
    const locked = isMatchLocked(item.date); 

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
              editable={!locked} 
            />
            <Text style={styles.vs}>X</Text>
            <TextInput 
              style={[styles.input, locked && styles.inputLocked]} 
              keyboardType="numeric"
              maxLength={2}
              value={predictions[item.id]?.scoreB || ''}
              onChangeText={(text) => handleScoreChange(item.id, 'scoreB', text)}
              placeholder="0"
              editable={!locked} 
            />
          </View>

          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{item.teamB}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, locked ? styles.saveButtonLocked : null]} 
          onPress={() => handleSavePrediction(item.id, predictions[item.id]?.scoreA || '', predictions[item.id]?.scoreB || '')}
          disabled={saving || locked}
        >
          <Text style={styles.saveButtonText}>
            {locked ? 'Palpites Encerrados 🔒' : saving ? 'Salvando...' : 'Salvar Palpite'}
          </Text>
        </TouchableOpacity>

        {/* 🔥 NOVO: Botão para abrir o mural de transparência quando o jogo travar */}
        {locked && (
          <TouchableOpacity style={styles.muralButton} onPress={() => handleAbrirMural(item)}>
            <Text style={styles.muralButtonText}>Ver Palpites da Galera 📊</Text>
          </TouchableOpacity>
        )}
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
        ref={flatListRef}
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => (
        { length: 228, offset: 228 * index, index }
        )}
      />

      {/* 🔥 NOVO: O Modal Flutuante do Mural de Transparência */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mural de Palpites</Text>
            <Text style={styles.modalSubtitle}>{selectedMatch?.teamA} x {selectedMatch?.teamB}</Text>
            
            {/* 🔥 PLACAR OFICIAL CENTRALIZADO NO TOPO DO MODAL */}
            {selectedMatch?.realScoreA !== undefined && selectedMatch?.realScoreA !== null && (
              <View style={styles.officialModalBadge}>
                <Text style={styles.officialModalText}>
                  Placar Oficial: {selectedMatch.realScoreA} x {selectedMatch.realScoreB}
                </Text>
              </View>
            )}
          </View>

            {/* A caixinha solta que dava erro foi REMOVIDA daqui! */}

            {loadingModal ? (
              <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 40 }} />
            ) : (
              <FlatList
                data={outrosPalpites}
                keyExtractor={(item) => item.id}
                style={{ width: '100%' }}
                ListEmptyComponent={<Text style={styles.emptyModalText}>Ninguém palpitou nesse jogo.</Text>}
                renderItem={({ item }) => (
                  <View style={styles.palpiteRow}>
                    <Text style={styles.playerName}>{item.userName}</Text>
                    
                    {/* 🔥 A CAIXINHA COLORIDA ENTRA AQUI! Substituindo o playerScore antigo */}
                    <View style={[styles.scoreBadge, getScoreBadgeStyle(item)]}>
                      <Text style={styles.scoreText}>{item.scoreA} - {item.scoreB}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalText}>Fechar Mural</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  listContainer: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardLocked: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1 }, 
  date: { textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  matchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamContainer: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 16, fontWeight: 'bold', color: '#334155', textAlign: 'center' },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  input: { width: 44, height: 44, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  inputLocked: { backgroundColor: '#e2e8f0', color: '#64748b', borderColor: '#cbd5e1' }, 
  vs: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', marginHorizontal: 8 },
  saveButton: { backgroundColor: '#10b981', padding: 10, borderRadius: 8, alignItems: 'center' },
  saveButtonLocked: { backgroundColor: '#94a3b8' }, 
  saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
  // 🔥 ESTILOS NOVOS DO MURAL E DO MODAL
  muralButton: { marginTop: 10, backgroundColor: '#3b82f6', padding: 10, borderRadius: 8, alignItems: 'center' },
  muralButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#f8fafc', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', alignItems: 'center' },
  modalHeader: { width: '100%', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e2e8f0', paddingBottom: 16, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  modalSubtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
  palpiteRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#ffffff', width: '100%', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  playerName: { fontSize: 16, color: '#334155', fontWeight: 'bold', textTransform: 'capitalize' },
  playerScore: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  emptyModalText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginVertical: 20 },
  closeModalButton: { marginTop: 16, backgroundColor: '#ef4444', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeModalText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  scoreBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0f172a' 
  },
  
  // As Cores:
  scoreBadgeDefault: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },           // Cinza (Em andamento)
  scoreBadgeExact: { backgroundColor: '#d1fae5', borderColor: '#10b981' },             // Verde (Cravada)
  scoreBadgePartial: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },           // Amarelo (Vencedor/Empate)
  scoreBadgeWrong: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },             // Vermelho (Errou)
  officialModalBadge: {
    backgroundColor: '#1e293b', // Fundo escuro para destacar bem
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  officialModalText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});