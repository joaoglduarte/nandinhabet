import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig'; // Volta duas pastas para achar o arquivo na raiz

// Tipagem para ajudar o TypeScript a entender os dados
interface UserRanking {
  id: string;
  nickname: string;
  totalPoints: number;
  exactMatches: number;
  avatar?: string;
}

export default function RankingScreen() {
  const router = useRouter();

  const getAvatarUrl = (seed?: string) => {
    if (!seed) return `https://api.dicebear.com/7.x/notionists/png?seed=Felix&backgroundColor=e2e8f0`;
    return `https://api.dicebear.com/7.x/notionists/png?seed=${seed}&backgroundColor=e2e8f0`;
  };

  const [rankingData, setRankingData] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aponta para a coleção 'users' e ordena pelos pontos (do maior para o menor)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('totalPoints', 'desc'));

    // onSnapshot escuta o banco em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: UserRanking[] = [];
      snapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          nickname: doc.data().nickname || 'Sem Nome',
          totalPoints: doc.data().totalPoints || 0,
          exactMatches: doc.data().exactMatches || 0,
          avatar: doc.data().avatar,
        });
      });

      setRankingData(users);
      setLoading(false);
    });

    // Limpa o "ouvinte" de dados quando o usuário sair da tela para economizar memória
    return () => unsubscribe();
  }, []);

  const renderRankingItem = ({ item, index }: { item: UserRanking; index: number }) => {
    // Destaca os 3 primeiros colocados com cores diferentes
    const isTop3 = index < 3;
    const positionColor = index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#cbd5e1';

    return (
      // Envolvemos tudo com TouchableOpacity e chamamos a rota passando o item.id
      <TouchableOpacity 
        style={styles.rankingRow}
        // @ts-ignore
        onPress={() => router.push(`/user/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View style={[styles.positionBadge, { backgroundColor: positionColor }]}>
          <Text style={styles.positionText}>{index + 1}º</Text>
        </View>

        {/* FOTO DO PERFIL AQUI ⬇️ */}
        <Image 
          source={{ uri: getAvatarUrl(item.avatar) }} 
          style={styles.avatarMini} 
        />
        
        <View style={styles.nameContainer}>
          <Text style={[styles.name, isTop3 && styles.nameTop3]}>{item.nickname}</Text>
          <Text style={styles.exactMatches}>{item.exactMatches} acertos na mosca</Text>
        </View>

        <Text style={styles.points}>{item.totalPoints} pts</Text>
      </TouchableOpacity>
    );
  };

  // Mostra um ícone de carregamento enquanto busca no Firebase
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ marginTop: 10, color: '#64748b' }}>Carregando ranking...</Text>
      </View>
    );
  }
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Classificação</Text>
      </View>

      {/* Se não tiver ninguém cadastrado, mostra uma mensagem amigável */}
      {rankingData.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: '#64748b', fontSize: 16 }}>Nenhum jogador na disputa ainda!</Text>
        </View>
      ) : (
        <FlatList
          data={rankingData}
          keyExtractor={(item) => item.id}
          renderItem={renderRankingItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#10b981', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  rankingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  positionBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  positionText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  nameContainer: { flex: 1 },
  name: { fontSize: 16, color: '#334155', textTransform: 'capitalize' },
  nameTop3: { fontWeight: 'bold', color: '#0f172a' },
  exactMatches: { fontSize: 12, color: '#64748b', marginTop: 4 },
  points: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22, // Metade da largura para ficar um círculo perfeito
    backgroundColor: '#e2e8f0',
    marginRight: 12,
  },
});