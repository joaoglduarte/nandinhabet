import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<any>(null); // Mantive caso você queira usar no futuro
  const [tournamentBet, setTournamentBet] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  const getAvatarUrl = (seed?: string) => {
    if (!seed) return `https://api.dicebear.com/7.x/notionists/png?seed=Felix&backgroundColor=e2e8f0`;
    return `https://api.dicebear.com/7.x/notionists/png?seed=${seed}&backgroundColor=e2e8f0`;
  };

  useEffect(() => {
    const carregarPerfilPublico = async () => {
      try {
        setLoading(true);

        const userSnap = await getDoc(doc(db, 'users', id as string)); 
        if (userSnap.exists()) {
          setUserInfo(userSnap.data()); 
        }

        // 🔥 1. AJUSTADO: Separando teamA e teamB para encaixar no seu layout
        const matchesSnap = await getDocs(collection(db, 'matches'));
        const matchesMap: Record<string, any> = {};

        matchesSnap.forEach((doc) => {
          const matchData = doc.data();
          matchesMap[doc.id] = {
            teamA: matchData.teamA || 'Time A',
            teamB: matchData.teamB || 'Time B',
            date: matchData.date || '',
            realScoreA: matchData.realScoreA, // Placar oficial do Admin
            realScoreB: matchData.realScoreB,
            realPenaltyWinner: matchData.realPenaltyWinner || null, // 🔥 NOVO
            isKnockout: matchData.isKnockout || false,
            status: matchData.status          // Para saber se o jogo terminou 
          };
        });

        const q = query(collection(db, 'predictions'), where('userId', '==', id));
        const predictionsSnap = await getDocs(q);
        
        const listaPalpites = predictionsSnap.docs.map(doc => {
          const data = doc.data();
          const jogoInfo = matchesMap[data.matchId];

          return {
            id: doc.id,
            scoreA: data.scoreA,
            scoreB: data.scoreB,
            penaltyWinner: data.penaltyWinner || null, // 🔥 NOVO
            teamA: jogoInfo?.teamA || 'Time A', // Repassando os times separados
            teamB: jogoInfo?.teamB || 'Time B', 
            matchDate: jogoInfo?.date || '',     // Repassando a data do jogo
            realScoreA: jogoInfo?.realScoreA, // Repassando placar oficial
            realScoreB: jogoInfo?.realScoreB,
            realPenaltyWinner: jogoInfo?.realPenaltyWinner, // 🔥 NOVO
            isKnockout: jogoInfo?.isKnockout,
            status: jogoInfo?.status          // Repassando status oficial
          };
        });

        setPredictions(listaPalpites);

        // 🔥 EXTRA: Adicionada a busca do torneio para preencher a sua caixinha na tela
        const tBetDoc = await getDoc(doc(db, 'tournament_bets', id as string));
        if (tBetDoc.exists()) {
          setTournamentBet(tBetDoc.data());
        }

      } catch (error) {
        console.log("Erro ao carregar perfil público:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) carregarPerfilPublico();
  }, [id]);

  const isMatchLocked = (matchDateString: string) => {
    if (!matchDateString) return false;
    const matchDate = new Date(matchDateString);
    const now = new Date();
    return now.getTime() >= matchDate.getTime();
  };

  const getScoreBadgeStyle = (pred: any) => {
  // 1. Jogo não finalizado
  if (
    pred.realScoreA === undefined ||
    pred.realScoreA === null ||
    pred.realScoreB === undefined ||
    pred.realScoreB === null
  ) {
    return styles.scoreBadgeDefault;
  }

  const pA = Number(pred.scoreA);
  const pB = Number(pred.scoreB);
  const pPenal = pred.penaltyWinner;

  const rA = Number(pred.realScoreA);
  const rB = Number(pred.realScoreB);
  const rPenal = pred.realPenaltyWinner;

  const isMataMata = pred.isKnockout;

  // 🟢 CRAVADA
  const acertouPlacar = (pA === rA && pB === rB);

  if (acertouPlacar) {
    if (isMataMata && rPenal && pPenal !== rPenal) {
      return styles.scoreBadgePartial; // virou 4 pts
    }
    return styles.scoreBadgeExact;
  }

  // 🟡 ACERTOU VENCEDOR
  if (
    (pA > pB && rA > rB) ||
    (pA < pB && rA < rB)
  ) {
    return styles.scoreBadgePartial;
  }

  // 🤝 EMPATE
  if (pA === pB && rA === rB) {
    if (isMataMata) {
      if (pPenal === rPenal) {
        return styles.scoreBadgePartial; // acertou pênalti
      }

      // 🔥 CONSOLAÇÃO (LARANJA)
      return styles.scoreBadgeConsolation;
    }

    return styles.scoreBadgePartial; // fase de grupos
  }

  // 🔴 ERROU
  return styles.scoreBadgeWrong;
};

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>

        {/* Usando userInfo em vez de userProfile, já que foi ele que você carregou no useEffect */}
        <Image 
          source={{ uri: getAvatarUrl(userInfo?.avatar || userInfo?.nickname) }} 
          style={styles.avatar} 
        />

        <Text style={styles.nickname}>{userInfo?.nickname || 'Jogador'}</Text>
        <Text style={styles.points}>{userInfo?.totalPoints || 0} pts</Text>
        <Text style={styles.exactMatches}>{userInfo?.exactMatches || 0} cravadas na mosca</Text>
      </View>

      {/* PALPITES DO TORNEIO (Longo Prazo) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apostas do Torneio</Text>
        {tournamentBet ? (
          <View style={styles.tournamentCard}>
            <Text style={styles.betText}>🏆 Campeão: <Text style={styles.bold}>{tournamentBet.champion}</Text></Text>
            <Text style={styles.betText}>🥈 Vice: <Text style={styles.bold}>{tournamentBet.runnerUp}</Text></Text>
            <Text style={styles.betText}>🥉 3º Lugar: <Text style={styles.bold}>{tournamentBet.thirdPlace}</Text></Text>
            <Text style={styles.betText}>⚽ Artilheiro: <Text style={styles.bold}>{tournamentBet.topScorer}</Text></Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Este jogador ainda não fez os palpites finais.</Text>
        )}
      </View>

      {/* PALPITES DOS JOGOS */}
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Palpites por Jogo</Text>
          {predictions.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum palpite registrado para as partidas.</Text>
          ) : (
            predictions.map((pred) => {
              const jogoJaComecou = isMatchLocked(pred.matchDate);
              const isEmpate = Number(pred.scoreA) === Number(pred.scoreB);

              return (
                <View 
                  key={pred.id} 
                  style={[styles.matchCard, { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }]}
                >
                  
                  {/* 👈 LADO ESQUERDO: Nomes dos Times + Informações Extras de Pênaltis */}
                  <View style={{ flex: 1, justifyContent: 'center', paddingRight: 12 }}>
                    <Text style={styles.matchTeams}>{pred.teamA} x {pred.teamB}</Text>

                    {/* 1. Palpite de Pênalti do Usuário (Apenas se for empate e o jogo começou) */}
                    {jogoJaComecou && isEmpate && pred.penaltyWinner && (
                      <Text style={{ fontSize: 13, color: '#f97316', marginTop: 4, fontWeight: 'bold' }}>
                        ↳ Escolheu: {pred.penaltyWinner === 'A' ? pred.teamA : pred.teamB}
                      </Text>
                    )}

                    {/* 2. Resultado Oficial dos Pênaltis (Se o jogo já encerrou) */}
                    {jogoJaComecou && pred.realPenaltyWinner && (
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '500' }}>
                        Oficial: {pred.realPenaltyWinner === 'A' ? pred.teamA : pred.teamB} avançou
                      </Text>
                    )}
                  </View>

                  {/* 👉 LADO DIREITO: Caixinha do Placar (Oculta ou Aberta com a cor do acerto) */}
                  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    {jogoJaComecou ? (
                      <View style={[styles.scoreBadge, getScoreBadgeStyle(pred)]}>
                        <Text style={styles.scoreText}>{pred.scoreA} - {pred.scoreB}</Text>
                      </View>
                    ) : (
                      <View style={[styles.scoreBadge, styles.scoreBadgeLocked]}>
                        <Text style={styles.scoreTextLocked}>🔒 Oculto</Text>
                      </View>
                    )}
                  </View>

                </View>
              );
            })
          )}
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#10b981', padding: 24, paddingTop: 60, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  backButton: { position: 'absolute', top: 60, left: 20 },
  backButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  nickname: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textTransform: 'capitalize', marginBottom: 8 },
  points: { fontSize: 32, fontWeight: '900', color: '#ffffff' },
  exactMatches: { fontSize: 14, color: '#e2e8f0', marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  emptyText: { color: '#64748b', fontStyle: 'italic' },
  tournamentCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  betText: { fontSize: 16, color: '#475569', marginBottom: 8 },
  bold: { fontWeight: 'bold', color: '#0f172a' },
  matchCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  matchTeams: { fontSize: 16, fontWeight: '600', color: '#334155', flex: 1 },
  
  // Base do Badge (tamanho, padding, formato)
  scoreBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  
  // 🔥 ESTILOS DE CORES DOS RESULTADOS
  scoreBadgeDefault: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },           // Neutro (Ainda jogando)
  scoreBadgeExact: { backgroundColor: '#d1fae5', borderColor: '#10b981' },             // Verde Claro (Cravada)
  scoreBadgePartial: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },           // Amarelo Claro (Acertou Vencedor)
  scoreBadgeConsolation: { backgroundColor: '#fad9c1', borderColor: '#f97316' },
  scoreBadgeWrong: { backgroundColor: '#fee2e2', borderColor: '#ef4444' },             // Vermelho Claro (Errou)
  
  scoreBadgeLocked: { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' },
  scoreTextLocked: { color: '#64748b', fontSize: 14, fontWeight: '600', fontStyle: 'italic' },
  
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff', marginBottom: 12, borderWidth: 2, borderColor: '#ffffff' },
});