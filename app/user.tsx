import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

export default function PublicProfileScreen() {
  // Pega o ID da URL clicada
  const { id } = useLocalSearchParams(); 
  const userId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [tournamentBet, setTournamentBet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getAvatarUrl = (seed: string) => {
    if (seed === 'Careca') return `https://api.dicebear.com/7.x/avataaars/png?seed=Careca&backgroundColor=e2e8f0&top=NoHair`;
    return `https://api.dicebear.com/7.x/notionists/png?seed=${seed}&backgroundColor=e2e8f0`;
  };

  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!userId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) setUserData(userDoc.data());

        const matchesSnapshot = await getDocs(collection(db, 'matches'));
        const matchesMap: any = {};
        matchesSnapshot.forEach((doc) => {
          const matchData = doc.data();
          matchesMap[doc.id] = `${matchData.teamA} x ${matchData.teamB}`; 
        });

        const betsQuery = query(collection(db, 'predictions'), where('userId', '==', userId));
        const betsSnapshot = await getDocs(betsQuery);
        const betsList = betsSnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, matchName: matchesMap[data.matchId] || data.matchId };
        });
        setUserBets(betsList);

        const tBetDoc = await getDoc(doc(db, 'tournament_bets', userId));
        if (tBetDoc.exists()) setTournamentBet(tBetDoc.data());

      } catch (error) {
        console.log("Erro ao carregar perfil público:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProfile();
  }, [userId]);

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <ScrollView style={styles.container}>

    {/* BOTÃO DE VOLTAR INTELIGENTE */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => {
          // Verifica se existe um histórico para voltar
          if (router.canGoBack()) {
            router.back();
          } else {
            // Se não houver histórico (comum na web), empurra o usuário direto pro Ranking
            router.push('/ranking'); 
          }
        }}
      >
        <Text style={styles.backButtonText}>⬅ Voltar ao Ranking</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Image source={{ uri: getAvatarUrl(userData?.avatar || 'Felix') }} style={styles.avatarImageLarge} />
        <Text style={styles.nickname}>{userData?.nickname || 'Jogador'}</Text>
        <Text style={styles.pointsText}>🏆 {userData?.totalpoints ||  0} Pontos</Text>
      </View>

      <View style={styles.betsContainer}>
        <Text style={styles.sectionTitle}>Palpites do Torneio:</Text>
        {tournamentBet ? (
          <View style={styles.tournamentCard}>
            <Text style={styles.tournamentText}>🏆 <Text style={styles.bold}>Campeão:</Text> {tournamentBet.champion}</Text>
            <Text style={styles.tournamentText}>🥈 <Text style={styles.bold}>Vice:</Text> {tournamentBet.runnerUp}</Text>
            <Text style={styles.tournamentText}>🥉 <Text style={styles.bold}>3º Lugar:</Text> {tournamentBet.thirdPlace}</Text>
            <Text style={styles.tournamentText}>⚽ <Text style={styles.bold}>Artilheiro:</Text> {tournamentBet.topScorer}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Este jogador ainda não fez palpites finais.</Text>
        )}
      </View>

      <View style={styles.betsContainer}>
        <Text style={styles.sectionTitle}>Palpites dos Jogos:</Text>
        {userBets.length === 0 ? (
          <Text style={styles.emptyText}>Este jogador não deu nenhum palpite.</Text>
        ) : (
          userBets.map((bet) => (
            <View key={bet.id} style={styles.betCard}>
              <Text style={styles.betMatchInfo}>{bet.matchName}</Text>
              <Text style={styles.betScore}>Palpite: {bet.scoreA} x {bet.scoreB}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Mantivemos os mesmos estilos do perfil normal, removendo só os botões
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { alignItems: 'center', backgroundColor: '#ffffff', paddingVertical: 30, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  avatarImageLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e2e8f0', marginBottom: 12 },
  nickname: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  pointsText: { fontSize: 18, color: '#10b981', fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginLeft: 20, marginBottom: 12 },
  betsContainer: { paddingHorizontal: 20, marginTop: 25 },
  tournamentCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10 },
  tournamentText: { color: '#f8fafc', fontSize: 16, marginBottom: 6 },
  bold: { fontWeight: 'bold', color: '#94a3b8' },
  betCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  betMatchInfo: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  betScore: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginTop: 5, marginBottom: 20 },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    marginLeft: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
  },
  backButtonText: {
    fontWeight: 'bold',
    color: '#334155',
  },
});