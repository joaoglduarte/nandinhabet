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
  isKnockout?: boolean; 
  realPenaltyWinner?: 'A' | 'B';
}

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, { scoreA: string; scoreB: string; penaltyWinner?: string }>>({});
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
  // Garanta que getDoc e doc estão importados do 'firebase/firestore'


const handleAbrirMural = async (match: any) => {
  setModalVisible(true);
  setSelectedMatch(match);
  setLoadingModal(true);

  try {
    const q = query(collection(db, 'predictions'), where('matchId', '==', match.id));
    const snapshot = await getDocs(q);
    
    // 🔥 Usamos Promise.all porque agora precisamos fazer buscas "extras" para os palpites antigos
    const palpitesDaGalera = await Promise.all(snapshot.docs.map(async (predictionDoc) => {
      const data = predictionDoc.data();
      
      let nomeParaExibir = data.userName;

      // Se for um palpite ANTIGO que não tem o 'userName' salvo na raiz...
      if (!nomeParaExibir && data.userId) {
        // ...vamos lá na coleção de usuários buscar o nickname!
        const userRef = doc(db, 'users', data.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().nickname) {
          nomeParaExibir = userSnap.data().nickname;
        } else {
          nomeParaExibir = 'Usuário'; // Fallback final
        }
      }

      return {
        id: predictionDoc.id,
        userName: nomeParaExibir || 'Usuário',
        scoreA: data.scoreA,
        scoreB: data.scoreB,
        penaltyWinner: data.penaltyWinner, 
      };
    }));

    setOutrosPalpites(palpitesDaGalera);
  } catch (error) {
    console.error("Erro ao buscar palpites:", error);
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
          isKnockout: data.isKnockout,
          realPenaltyWinner: data.realPenaltyWinner,
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

  const handleScoreChange = (matchId: string, team: 'scoreA' | 'scoreB' | 'penaltyWinner', value: string) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [team]: value },
    }));
  };

  const handleSavePrediction = async (matchId: string, scoreA: string, scoreB: string, penaltyWinner?: string) => {
    if (!auth.currentUser) return;
    
    // 🔥 TRAVA DE SEGURANÇA: Exige os pênaltis se for empate no mata-mata
    // Nota: "matches" aqui deve ser o nome da sua variável de estado que guarda a lista de jogos!
    const matchCorrente = matches.find(m => m.id === matchId); 
    if (matchCorrente?.isKnockout && scoreA !== '' && scoreA === scoreB && !penaltyWinner) {
      if (Platform.OS === 'web') window.alert('Em caso de empate, escolha quem vence nos pênaltis!');
      else Alert.alert('Atenção', 'Em caso de empate, escolha quem vence nos pênaltis!');
      return;
    }

    setSaving(true);
    try {

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      // Se ele achar o documento, pega o 'nickname'. Se não, usa 'Jogador' de backup.
      const nomeReal = userSnap.exists() ? userSnap.data().nickname : 'Jogador';

      const predictionId = `${auth.currentUser.uid}_${matchId}`;
      const predictionRef = doc(db, 'predictions', predictionId);

      // 1. Monta o pacote base de dados
      const dadosDoPalpite: any = {
        userId: auth.currentUser.uid,
        userName: nomeReal,
        matchId: matchId,
        scoreA: Number(scoreA), 
        scoreB: Number(scoreB), 
        updatedAt: new Date(),
      };

      // 2. 🔥 INSERE O PÊNALTI NO PACOTE ANTES DE ENVIAR
      if (penaltyWinner) {
        dadosDoPalpite.penaltyWinner = penaltyWinner;
      } else {
        // Se a pessoa mudar o placar (ex: de 1x1 pra 2x1), salvamos nulo para limpar pênaltis velhos
        dadosDoPalpite.penaltyWinner = null; 
      }

      // 3. Salva no banco de verdade!
      await setDoc(predictionRef, dadosDoPalpite, { merge: true });

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
  const jogoAberto = selectedMatch; 

  // 1. Jogo ainda não finalizado (Cinza)
  if (!jogoAberto || jogoAberto.realScoreA === undefined || jogoAberto.realScoreA === null) {
    return styles.scoreBadgeDefault; 
  }

  const pA = Number(item.scoreA);
  const pB = Number(item.scoreB);
  const pPenal = item.penaltyWinner;
  
  const rA = Number(jogoAberto.realScoreA);
  const rB = Number(jogoAberto.realScoreB);
  const rPenal = jogoAberto.realPenaltyWinner;
  const isMataMata = jogoAberto.isKnockout;

  // 🟢 7 ou 5 Pontos: CRAVADA NA MOSCA
  // No mata-mata, precisa acertar o pênalti se foi empate
  const acertouPlacar = (pA === rA && pB === rB);
  if (acertouPlacar) {
    if (isMataMata && rPenal && pPenal !== rPenal) {
      // Cravou placar mas errou pênalti (vira 4 pontos - usa Amarelo)
      return styles.scoreBadgePartial; 
    }
    return styles.scoreBadgeExact;
  }

  // 🟡 4 ou 2 Pontos: TENDÊNCIA
  if ((pA > pB && rA > rB) || (pA < pB && rA < rB)) return styles.scoreBadgePartial;
  
  // Caso de Empate
  if (pA === pB && rA === rB) {
    if (isMataMata) {
      if (pPenal === rPenal) return styles.scoreBadgePartial; // Acertou empate + pênalti
      
      // 🔥 AQUI ENTRA O LARANJA: Errou os gols e errou o pênalti, mas previu o empate
      return styles.scoreBadgeConsolation; 
    }
    return styles.scoreBadgePartial; // Fase de grupos
  }
  
  // 🔴 0 Pontos: ERROU
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

        {/* 🔥 NOVO: SELETOR DE PÊNALTIS (Aparece só no mata-mata em caso de empate) */}
        {item.isKnockout && 
         predictions[item.id]?.scoreA !== '' && 
         predictions[item.id]?.scoreA !== undefined && 
         predictions[item.id]?.scoreA === predictions[item.id]?.scoreB && (
          <View style={styles.penaltyContainer}>
            <Text style={styles.penaltyTitle}>Quem avança nos pênaltis?</Text>
            <View style={styles.penaltyButtons}>
              
              {/* Botão do Time A */}
              <TouchableOpacity 
                style={[
                  styles.penaltyBtn, 
                  predictions[item.id]?.penaltyWinner === 'A' && styles.penaltyBtnActive
                ]}
                // Usa o mesmo handleScoreChange para salvar a escolha 'A' ou 'B'
                onPress={() => handleScoreChange(item.id, 'penaltyWinner', 'A')}
                disabled={locked} // Bloqueia se o jogo já começou
              >
                <Text style={styles.penaltyBtnText}>{item.teamA}</Text>
              </TouchableOpacity>

              {/* Botão do Time B */}
              <TouchableOpacity 
                style={[
                  styles.penaltyBtn, 
                  predictions[item.id]?.penaltyWinner === 'B' && styles.penaltyBtnActive
                ]}
                onPress={() => handleScoreChange(item.id, 'penaltyWinner', 'B')}
                disabled={locked}
              >
                <Text style={styles.penaltyBtnText}>{item.teamB}</Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.saveButton, locked ? styles.saveButtonLocked : null]} 
          onPress={() => handleSavePrediction(item.id, predictions[item.id]?.scoreA || '', predictions[item.id]?.scoreB || '', predictions[item.id]?.penaltyWinner || '')}
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
              <View style={{ alignItems: 'center', marginBottom: 15 }}>
                <View style={styles.officialModalBadge}>
                  <Text style={styles.officialModalText}>
                    Placar Oficial: {selectedMatch.realScoreA} x {selectedMatch.realScoreB}
                  </Text>
                </View>
                
                {/* 🔥 NOVO: AVISA A GALERA QUEM VENCEU NOS PÊNALTIS! */}
                {selectedMatch.realPenaltyWinner && (
                  <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: 14, marginTop: 8 }}>
                    🏆 {selectedMatch.realPenaltyWinner === 'A' ? selectedMatch.teamA : selectedMatch.teamB} venceu nos pênaltis
                  </Text>
                )}
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
          renderItem={({ item }) => {
            
            // 🔥 O ESPIÃO: Olhe o terminal do Expo! 
            // Se aparecer "penaltyWinner: 'A'", o dado chegou perfeito.
            //console.log("Desenhando palpite no Mural:", item.userName, " | Tem pênalti?", item.penaltyWinner);

            const isEmpate = Number(item.scoreA) === Number(item.scoreB);

            return (
              // 🔥 A SOLUÇÃO VISUAL: Forçamos o minHeight e o padding para a caixa "crescer"
              <View style={[styles.palpiteRow, { minHeight: 70, paddingVertical: 10, alignItems: 'center' }]}>
                
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={styles.playerName}>{item.userName}</Text>
                  
                  {isEmpate && item.penaltyWinner && (
                    <Text style={{ fontSize: 13, color: '#252525', marginTop: 4, fontWeight: 'bold' }}>
                      ↳ Pênaltis: {item.penaltyWinner === 'A' ? selectedMatch?.teamA : selectedMatch?.teamB}
                    </Text>
                  )}
                </View>
                
                <View style={[styles.scoreBadge, getScoreBadgeStyle(item)]}>
                  <Text style={styles.scoreText}>{item.scoreA} - {item.scoreB}</Text>
                </View>

              </View>
            );
          }}
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
  scoreBadgeConsolation: { backgroundColor: '#fad9c1', borderColor: '#f97316' },     // Laranja (Consolação)
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
  penaltyContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  penaltyTitle: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  penaltyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  penaltyBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    alignItems: 'center',
  },
  penaltyBtnActive: {
    backgroundColor: '#10b981', // Verde confirmando a seleção
    borderColor: '#059669',
  },
  penaltyBtnText: {
    fontWeight: 'bold',
    color: '#334155',
    fontSize: 12,
  },
});