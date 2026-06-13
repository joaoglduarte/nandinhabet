import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth, db } from '../../firebaseConfig';


// Adicionamos 'Careca' na lista
const AVATAR_SEEDS = ['Alex', 'Jordan', 'Luca', 'Clara', 'Bruno', 'Elena', 'maria', 'nandinha', '0m5nhf5', 'jg', 'liponez', '3hj24', 'bnksnd', 'catatau', 'betuca', 'smtfelipe', 'sdaiy548', 'b6453b', 'casio', 'leticiaramosdeoliveira', '674267'];

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [userBets, setUserBets] = useState<any[]>([]);
  const [tournamentBet, setTournamentBet] = useState<any>(null); // NOVO: Estado para palpites finais
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState('');
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const currentUser = auth.currentUser;
  const router = useRouter();

  // FUNÇÃO MÁGICA DO AVATAR: Se for 'Careca', força o estilo sem cabelo!
  const getAvatarUrl = (seed: string) => {
    if (seed === 'Careca') {
      return `https://api.dicebear.com/7.x/avataaars/png?seed=Careca&backgroundColor=e2e8f0&top=NoHair`;
    }
    return `https://api.dicebear.com/7.x/notionists/png?seed=${seed}&backgroundColor=e2e8f0`;
  };

  useEffect(() => {
    // O onAuthStateChanged fica "vigiando". Quando o Firebase acha o usuário (mesmo após o F5), ele roda o código!
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Busca os dados do usuário
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setSelectedAvatarSeed(data.avatar || AVATAR_SEEDS[0]);
          }

          // 2. Busca os nomes dos Jogos para a lista
          const matchesSnapshot = await getDocs(collection(db, 'matches'));
          const matchesMap: any = {};
          matchesSnapshot.forEach((doc) => {
            const matchData = doc.data();
            matchesMap[doc.id] = `${matchData.teamA} x ${matchData.teamB}`; 
          });

          // 3. Busca os palpites dos jogos
          const betsQuery = query(collection(db, 'predictions'), where('userId', '==', user.uid));
          const betsSnapshot = await getDocs(betsQuery);
          const betsList = betsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, matchName: matchesMap[data.matchId] || data.matchId };
          });
          setUserBets(betsList);

          // 4. Busca os palpites finais do torneio
          const tBetDoc = await getDoc(doc(db, 'tournament_bets', user.uid));
          if (tBetDoc.exists()) {
            setTournamentBet(tBetDoc.data());
          }

        } catch (error) {
          console.log("Erro ao carregar perfil:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Se não tiver ninguém logado, apenas para o loading
        setLoading(false);
      }
    });

    // Limpa o "olheiro" quando a tela for fechada para economizar memória
    return () => unsubscribe();
  }, []);

  const handleSaveAvatar = async () => {
    if (!currentUser) return;
    setSavingAvatar(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { avatar: selectedAvatarSeed }, { merge: true });
      setUserData({ ...userData, avatar: selectedAvatarSeed });
      setIsEditingAvatar(false);
      Toast.show({
      type: 'success',
      text1: 'Avatar Atualizado! 🎮',
      text2: 'Seu avatar foi atualizado com sucesso.',
      position: 'top', // Pode ser 'bottom' se preferir que apareça embaixo
      visibilityTime: 3000, // Some sozinho após 3 segundos
    });
    } catch (error) {
      if (Platform.OS === 'web') window.alert('Erro ao salvar avatar.');
      else Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); } catch (error) { console.log(error); }
  };

  const renderAvatarOption = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={[styles.avatarOption, selectedAvatarSeed === item && styles.avatarOptionSelected]}
      onPress={() => setSelectedAvatarSeed(item)}
    >
      <Image source={{ uri: getAvatarUrl(item) }} style={styles.avatarImageSmall} />
    </TouchableOpacity>
  );

  if (loading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#10b981" /></View>;

  const handleShare = async () => {
    try {
      const pontos = userData?.totalPoints || 0;
      const message = `Estou competindo no Bolão NandinhaBet e já tenho ${pontos} pontos! 🏆\n\nAcesse o link e tente me bater: https://nandinhabet-be12d.web.app`;
      
      await Share.share({
        message: message,
      });
    } catch (error) {
      console.log("Erro ao compartilhar", error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: getAvatarUrl(userData?.avatar || selectedAvatarSeed) }} style={styles.avatarImageLarge} />
        <Text style={styles.nickname}>{userData?.nickname || 'Jogador'}</Text>
        <Text style={styles.pointsText}>🏆 {userData?.totalPoints || 0} Pontos</Text>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Compartilhar Bolão 📣</Text>
        </TouchableOpacity>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditingAvatar(!isEditingAvatar)}>
            <Text style={styles.editButtonText}>{isEditingAvatar ? 'Cancelar Edição' : 'Mudar Avatar'}</Text>
          </TouchableOpacity>

          {currentUser?.uid === '8wPW5SLYdiUDKVWRBhEuOSL45d72' && (
            <TouchableOpacity style={styles.adminButton} onPress={() => router.push('/admin')}>
              <Text style={styles.adminButtonText}>Painel Admin ⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isEditingAvatar && (
        <View style={styles.carouselContainer}>
          <Text style={styles.sectionTitle}>Escolha seu visual:</Text>
          <FlatList horizontal data={AVATAR_SEEDS} renderItem={renderAvatarOption} keyExtractor={item => item} showsHorizontalScrollIndicator={true} contentContainerStyle={{ paddingHorizontal: 20 }} />
          <TouchableOpacity style={styles.saveAvatarButton} onPress={handleSaveAvatar} disabled={savingAvatar}>
            <Text style={styles.saveAvatarText}>{savingAvatar ? 'Salvando...' : 'Salvar Novo Avatar'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NOVO: BLOCO DOS PALPITES FINAIS */}
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
          <Text style={styles.emptyText}>Você ainda não fez os palpites finais.</Text>
        )}
      </View>

      <View style={styles.betsContainer}>
        <Text style={styles.sectionTitle}>Palpites dos Jogos:</Text>
        {userBets.length === 0 ? (
          <Text style={styles.emptyText}>Você ainda não deu nenhum palpite.</Text>
        ) : (
          userBets.map((bet) => (
            <View key={bet.id} style={styles.betCard}>
              <Text style={styles.betMatchInfo}>{bet.matchName}</Text>
              {/* Ajuste os nomes de golsA e golsB se necessário */}
              <Text style={styles.betScore}>Palpite: {bet.scoreA} x {bet.scoreB}</Text> 
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutButtonText}>Sair da Conta 🚪</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { alignItems: 'center', backgroundColor: '#ffffff', paddingVertical: 30, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  avatarImageLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e2e8f0', marginBottom: 12 },
  nickname: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  pointsText: { fontSize: 18, color: '#10b981', fontWeight: '600', marginTop: 4 },
  actionButtonsContainer: { flexDirection: 'row', marginTop: 16, gap: 10, alignItems: 'center' },
  editButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  editButtonText: { color: '#475569', fontWeight: 'bold' },
  adminButton: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  adminButtonText: { color: '#ffffff', fontWeight: 'bold' },
  carouselContainer: { backgroundColor: '#ffffff', paddingVertical: 20, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginLeft: 20, marginBottom: 12 },
  avatarOption: { marginHorizontal: 8, padding: 4, borderRadius: 50, borderWidth: 3, borderColor: 'transparent' },
  avatarOptionSelected: { borderColor: '#10b981' },
  avatarImageSmall: { width: 70, height: 70, borderRadius: 35 },
  saveAvatarButton: { backgroundColor: '#10b981', marginHorizontal: 20, marginTop: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveAvatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  betsContainer: { paddingHorizontal: 20, marginTop: 15 },
  
  // Novos estilos para os palpites finais
  tournamentCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10 },
  tournamentText: { color: '#f8fafc', fontSize: 16, marginBottom: 6 },
  bold: { fontWeight: 'bold', color: '#94a3b8' },

  betCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  betMatchInfo: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  betScore: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginTop: 5, marginBottom: 10 },
  logoutButton: { backgroundColor: '#ef4444', marginHorizontal: 20, marginBottom: 40, marginTop: 20, padding: 16, borderRadius: 10, alignItems: 'center' },
  logoutButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  shareButton: {
    marginTop: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});