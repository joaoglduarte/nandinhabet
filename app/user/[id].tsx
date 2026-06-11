import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

export default function UserProfileScreen() {
  // Pega o ID que passamos pela URL (o nome do arquivo é [id].tsx)
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<any>(null);
  const [tournamentBet, setTournamentBet] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 1. Busca os dados do usuário (Nome e Pontos)
        const userDoc = await getDoc(doc(db, 'users', id as string));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }

        // 2. Busca os palpites do torneio (Campeão, Vice, etc)
        const tourneyDoc = await getDoc(doc(db, 'tournament_bets', id as string));
        if (tourneyDoc.exists()) {
          setTournamentBet(tourneyDoc.data());
        }

        // 3. Busca a tabela de jogos para sabermos quem está jogando
        const matchesSnap = await getDocs(collection(db, 'matches'));
        const matchesDict: Record<string, any> = {};
        matchesSnap.forEach((mDoc) => {
          matchesDict[mDoc.id] = mDoc.data();
        });

        // 4. Busca os palpites de jogos desse usuário
        const predQ = query(collection(db, 'predictions'), where('userId', '==', id));
        const predSnap = await getDocs(predQ);
        
        const userPredictions: any[] = [];
        predSnap.forEach((pDoc) => {
          const palpite = pDoc.data();
          const matchInfo = matchesDict[palpite.matchId];
          
          if (matchInfo) {
            userPredictions.push({
              id: pDoc.id,
              teamA: matchInfo.teamA,
              teamB: matchInfo.teamB,
              scoreA: palpite.scoreA,
              scoreB: palpite.scoreB,
              matchDate: matchInfo.date,
            });
          }
        });

        // Ordena os palpites pela data do jogo
        userPredictions.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
        setPredictions(userPredictions);

      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

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
        <Text style={styles.nickname}>{userProfile?.nickname || 'Jogador'}</Text>
        <Text style={styles.points}>{userProfile?.totalPoints || 0} pts</Text>
        <Text style={styles.exactMatches}>{userProfile?.exactMatches || 0} cravadas na mosca</Text>
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
          predictions.map((pred) => (
            <View key={pred.id} style={styles.matchCard}>
              <Text style={styles.matchTeams}>{pred.teamA} x {pred.teamB}</Text>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{pred.scoreA} - {pred.scoreB}</Text>
              </View>
            </View>
          ))
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
  scoreBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  scoreText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' }
});