import { useRouter } from 'expo-router';
import { collection, doc, getDocs, increment, query, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebaseConfig';

// REGRAS DO BOLÃO
const PONTOS_CRAVADA = 5;
const PONTOS_VENCEDOR = 2;
const PONTOS_CAMPEAO = 20;
const PONTOS_VICE = 15;
const PONTOS_TERCEIRO = 10;
const PONTOS_ARTILHEIRO = 15;

// LISTA DE JOGOS PARA INJETAR NO BANCO
// Adicione ou edite os jogos aqui. O ID deve ser único para cada jogo!
const JOGOS_DA_COPA = [
  // 11 de junho
  { id: 'jogo_01', teamA: 'México', teamB: 'África do Sul', date: '2026-06-11T16:00:00-03:00' },
  { id: 'jogo_02', teamA: 'República da Coreia', teamB: 'República Tcheca', date: '2026-06-11T23:40:00-03:00' },
  // 12 de junho
  { id: 'jogo_03', teamA: 'Canadá', teamB: 'Bósnia e Herzegovina', date: '2026-06-12T16:00:00-03:00' },
  { id: 'jogo_04', teamA: 'Estados Unidos', teamB: 'Paraguai', date: '2026-06-12T22:00:00-03:00' },
  // 13 de junho
  { id: 'jogo_05', teamA: 'Catar', teamB: 'Suíça', date: '2026-06-13T16:00:00-03:00' },
  { id: 'jogo_06', teamA: 'Brasil', teamB: 'Marrocos', date: '2026-06-13T19:00:00-03:00' },
  { id: 'jogo_07', teamA: 'Haiti', teamB: 'Escócia', date: '2026-06-13T22:00:00-03:00' },
  { id: 'jogo_08', teamA: 'Austrália', teamB: 'Turquia', date: '2026-06-14T01:00:00-03:00' },
  // 14 de junho
  { id: 'jogo_09', teamA: 'Alemanha', teamB: 'Curaçau', date: '2026-06-14T14:00:00-03:00' },
  { id: 'jogo_10', teamA: 'Holanda', teamB: 'Japão', date: '2026-06-14T17:00:00-03:00' },
  { id: 'jogo_11', teamA: 'Costa do Marfim', teamB: 'Equador', date: '2026-06-14T20:00:00-03:00' },
  { id: 'jogo_12', teamA: 'Suécia', teamB: 'Tunísia', date: '2026-06-14T23:00:00-03:00' },
  // 15 de junho
  { id: 'jogo_13', teamA: 'Espanha', teamB: 'Cabo Verde', date: '2026-06-15T13:00:00-03:00' },
  { id: 'jogo_14', teamA: 'Bélgica', teamB: 'Egito', date: '2026-06-15T16:00:00-03:00' },
  { id: 'jogo_15', teamA: 'Arábia Saudita', teamB: 'Uruguai', date: '2026-06-15T19:00:00-03:00' },
  { id: 'jogo_16', teamA: 'Irã', teamB: 'Nova Zelândia', date: '2026-06-15T22:00:00-03:00' },
  // 16 de junho
  { id: 'jogo_17', teamA: 'França', teamB: 'Senegal', date: '2026-06-16T16:00:00-03:00' },
  { id: 'jogo_18', teamA: 'Iraque', teamB: 'Noruega', date: '2026-06-16T19:00:00-03:00' },
  { id: 'jogo_19', teamA: 'Argentina', teamB: 'Argélia', date: '2026-06-16T22:00:00-03:00' },
  { id: 'jogo_20', teamA: 'Áustria', teamB: 'Jordânia', date: '2026-06-17T01:00:00-03:00' },
  // 17 de junho
  { id: 'jogo_21', teamA: 'Portugal', teamB: 'República Democrática do Congo', date: '2026-06-17T14:00:00-03:00' },
  { id: 'jogo_22', teamA: 'Inglaterra', teamB: 'Croácia', date: '2026-06-17T17:00:00-03:00' },
  { id: 'jogo_23', teamA: 'Gana', teamB: 'Panamá', date: '2026-06-17T20:00:00-03:00' },
  { id: 'jogo_24', teamA: 'Uzbequistão', teamB: 'Colômbia', date: '2026-06-17T21:00:00-03:00' },
  // 18 de junho
  { id: 'jogo_25', teamA: 'República Tcheca', teamB: 'África do Sul', date: '2026-06-18T13:00:00-03:00' },
  { id: 'jogo_26', teamA: 'Suíça', teamB: 'Bósnia e Herzegovina', date: '2026-06-18T16:00:00-03:00' },
  { id: 'jogo_27', teamA: 'Canadá', teamB: 'Catar', date: '2026-06-18T19:00:00-03:00' },
  { id: 'jogo_28', teamA: 'México', teamB: 'República da Coreia', date: '2026-06-18T22:00:00-03:00' },
  // 19 de junho
  { id: 'jogo_29', teamA: 'Turquia', teamB: 'Paraguai', date: '2026-06-19T00:00:00-03:00' },
  { id: 'jogo_30', teamA: 'Estados Unidos', teamB: 'Austrália', date: '2026-06-19T16:00:00-03:00' },
  { id: 'jogo_31', teamA: 'Escócia', teamB: 'Marrocos', date: '2026-06-19T19:00:00-03:00' },
  { id: 'jogo_32', teamA: 'Brasil', teamB: 'Haiti', date: '2026-06-19T21:30:00-03:00' },
  // 20 de junho
  { id: 'jogo_33', teamA: 'Holanda', teamB: 'Suécia', date: '2026-06-20T14:00:00-03:00' },
  { id: 'jogo_34', teamA: 'Alemanha', teamB: 'Costa do Marfim', date: '2026-06-20T17:00:00-03:00' },
  { id: 'jogo_35', teamA: 'Equador', teamB: 'Curaçau', date: '2026-06-20T21:00:00-03:00' },
  { id: 'jogo_36', teamA: 'Tunísia', teamB: 'Japão', date: '2026-06-20T23:00:00-03:00' },
  // 21 de junho
  { id: 'jogo_37', teamA: 'Espanha', teamB: 'Arábia Saudita', date: '2026-06-21T13:00:00-03:00' },
  { id: 'jogo_38', teamA: 'Bélgica', teamB: 'Irã', date: '2026-06-21T16:00:00-03:00' },
  { id: 'jogo_39', teamA: 'Uruguai', teamB: 'Cabo Verde', date: '2026-06-21T19:00:00-03:00' },
  { id: 'jogo_40', teamA: 'Nova Zelândia', teamB: 'Egito', date: '2026-06-21T22:00:00-03:00' },
  // 22 de junho
  { id: 'jogo_41', teamA: 'Argentina', teamB: 'Áustria', date: '2026-06-22T14:00:00-03:00' },
  { id: 'jogo_42', teamA: 'França', teamB: 'Iraque', date: '2026-06-22T18:00:00-03:00' },
  { id: 'jogo_43', teamA: 'Noruega', teamB: 'Senegal', date: '2026-06-22T21:00:00-03:00' },
  { id: 'jogo_44', teamA: 'Jordânia', teamB: 'Argélia', date: '2026-06-23T00:00:00-03:00' },
  // 23 de junho
  { id: 'jogo_45', teamA: 'Portugal', teamB: 'Uzbequistão', date: '2026-06-23T14:00:00-03:00' },
  { id: 'jogo_46', teamA: 'Inglaterra', teamB: 'Gana', date: '2026-06-23T17:00:00-03:00' },
  { id: 'jogo_47', teamA: 'Panamá', teamB: 'Croácia', date: '2026-06-23T20:00:00-03:00' },
  { id: 'jogo_48', teamA: 'Colômbia', teamB: 'República Democrática do Congo', date: '2026-06-23T23:00:00-03:00' },
  // 24 de junho
  { id: 'jogo_49', teamA: 'Suíça', teamB: 'Canadá', date: '2026-06-24T16:00:00-03:00' },
  { id: 'jogo_50', teamA: 'Bósnia e Herzegovina', teamB: 'Catar', date: '2026-06-24T16:00:00-03:00' },
  { id: 'jogo_51', teamA: 'Escócia', teamB: 'Brasil', date: '2026-06-24T19:00:00-03:00' },
  { id: 'jogo_52', teamA: 'Marrocos', teamB: 'Haiti', date: '2026-06-24T19:00:00-03:00' },
  { id: 'jogo_53', teamA: 'República Tcheca', teamB: 'México', date: '2026-06-24T22:00:00-03:00' },
  { id: 'jogo_54', teamA: 'África do Sul', teamB: 'República da Coreia', date: '2026-06-24T22:00:00-03:00' },
  // 25 de junho
  { id: 'jogo_55', teamA: 'Equador', teamB: 'Alemanha', date: '2026-06-25T17:00:00-03:00' },
  { id: 'jogo_56', teamA: 'Curaçau', teamB: 'Costa do Marfim', date: '2026-06-25T17:00:00-03:00' },
  { id: 'jogo_57', teamA: 'Japão', teamB: 'Suécia', date: '2026-06-25T20:00:00-03:00' },
  { id: 'jogo_58', teamA: 'Tunísia', teamB: 'Holanda', date: '2026-06-25T20:00:00-03:00' },
  { id: 'jogo_59', teamA: 'Turquia', teamB: 'Estados Unidos', date: '2026-06-25T23:00:00-03:00' },
  { id: 'jogo_60', teamA: 'Paraguai', teamB: 'Austrália', date: '2026-06-25T23:00:00-03:00' },
  // 26 de junho
  { id: 'jogo_61', teamA: 'Noruega', teamB: 'França', date: '2026-06-26T16:00:00-03:00' },
  { id: 'jogo_62', teamA: 'Senegal', teamB: 'Iraque', date: '2026-06-26T16:00:00-03:00' },
  { id: 'jogo_63', teamA: 'Cabo Verde', teamB: 'Arábia Saudita', date: '2026-06-26T21:00:00-03:00' },
  { id: 'jogo_64', teamA: 'Uruguai', teamB: 'Espanha', date: '2026-06-26T21:00:00-03:00' },
  { id: 'jogo_65', teamA: 'Egito', teamB: 'Irã', date: '2026-06-27T00:00:00-03:00' },
  { id: 'jogo_66', teamA: 'Nova Zelândia', teamB: 'Bélgica', date: '2026-06-27T00:00:00-03:00' },
  // 27 de junho
  { id: 'jogo_67', teamA: 'Panamá', teamB: 'Inglaterra', date: '2026-06-27T18:00:00-03:00' },
  { id: 'jogo_68', teamA: 'Croácia', teamB: 'Gana', date: '2026-06-27T18:00:00-03:00' },
  { id: 'jogo_69', teamA: 'Colômbia', teamB: 'Portugal', date: '2026-06-27T20:30:00-03:00' },
  { id: 'jogo_70', teamA: 'República Democrática do Congo', teamB: 'Uzbequistão', date: '2026-06-27T20:30:00-03:00' },
  { id: 'jogo_71', teamA: 'Argélia', teamB: 'Áustria', date: '2026-06-27T23:00:00-03:00' },
  { id: 'jogo_72', teamA: 'Jordânia', teamB: 'Argentina', date: '2026-06-27T23:00:00-03:00' }
];

export default function AdminScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [realScores, setRealScores] = useState<Record<string, { a: string; b: string }>>({});
  
  const [realChampion, setRealChampion] = useState('');
  const [realRunnerUp, setRealRunnerUp] = useState('');
  const [realThirdPlace, setRealThirdPlace] = useState('');
  const [realTopScorer, setRealTopScorer] = useState('');

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      const q = query(collection(db, 'matches'), where('status', '!=', 'finished'));
      const snapshot = await getDocs(q);
      
      // Adicionamos o 'as any' no final para acalmar o TypeScript
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // Ordena os jogos por data para ficar organizado no painel
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setMatches(list);
    };
    fetchMatches();
  }, []);

  // FUNÇÃO NOVA SEM O ALERT DE CONFIRMAÇÃO (Funciona na Web e no Celular)
  const injetarJogosNoBanco = async () => {
    setLoading(true);
    console.log("Iniciando injeção de jogos...");

    try {
      const batch = writeBatch(db);
      JOGOS_DA_COPA.forEach((jogo) => {
        const matchRef = doc(db, 'matches', jogo.id);
        batch.set(matchRef, {
          teamA: jogo.teamA,
          teamB: jogo.teamB,
          date: jogo.date,
          // O merge: true protege os jogos que já têm placar, então o 'scheduled' 
          // não vai sobrescrever o que já acabou.
          status: 'scheduled' 
        }, { merge: true });
      });

      await batch.commit();
      console.log("Mágica feita! Jogos injetados.");
      
      Alert.alert('Sucesso!', 'Jogos adicionados ao Firebase!');
      
      // 🔥 A CORREÇÃO ENTRA AQUI: Carrega os jogos ignorando o status e olhando pro placar!
      const snapshot = await getDocs(collection(db, 'matches'));
      const list: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Só joga na lista do Admin se o placar oficial AINDA NÃO EXISTIR
        if (data.realScoreA === undefined || data.realScoreA === null) {
          list.push({ id: doc.id, ...data });
        }
      });

      // Ordena por data
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMatches(list);

    } catch (error) {
      console.error("Erro ao injetar:", error);
      Alert.alert('Erro', 'Olhe o terminal para ver o que deu errado.');
    } finally {
      setLoading(false);
    }
  };

    const lidarComVoltar = () => {
    if (router.canGoBack()) {
      router.back(); // Se tem histórico, volta normalmente
    } else {
      router.replace('/'); // Se não tem, chuta ele de volta pra Home de forma segura!
    }
  };

  const calcularPontosJogo = async (matchId: string) => {
    // ... [O restante do código do calcularPontosJogo continua igual]
    const placar = realScores[matchId];
    if (!placar?.a || !placar?.b) return Alert.alert('Erro', 'Digite o placar completo!');

    setLoading(true);
    try {
      const realA = parseInt(placar.a);
      const realB = parseInt(placar.b);
      const batch = writeBatch(db);

      const matchRef = doc(db, 'matches', matchId);
      batch.update(matchRef, { realScoreA: realA, realScoreB: realB, status: 'finished' });

      const q = query(collection(db, 'predictions'), where('matchId', '==', matchId));
      const predictionsSnap = await getDocs(q);

      predictionsSnap.forEach((predDoc) => {
        const palpite = predDoc.data();
        const predA = Number(palpite.scoreA);
        const predB = Number(palpite.scoreB);
        
        let pontosGanhos = 0;
        let cravada = 0;

        if (predA === realA && predB === realB) {
          pontosGanhos = PONTOS_CRAVADA;
          cravada = 1;
        } else if (
          (predA > predB && realA > realB) ||
          (predA < predB && realA < realB) ||
          (predA === predB && realA === realB)
        ) {
          pontosGanhos = PONTOS_VENCEDOR;
        }

        if (pontosGanhos > 0) {
          const userRef = doc(db, 'users', palpite.userId);
          batch.update(userRef, {
            totalPoints: increment(pontosGanhos),
            exactMatches: increment(cravada)
          });
        }
      });

      await batch.commit();
      Alert.alert('Sucesso', 'Pontos do jogo distribuídos!');
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const calcularPontosTorneio = async () => {
    // ... [O código do torneio continua igualzinho ao anterior]
    if (!realChampion || !realRunnerUp || !realThirdPlace || !realTopScorer) {
      return Alert.alert('Erro', 'Preencha todos os campos do torneio.');
    }

    const format = (text: string) => text.trim().toLowerCase();

    Alert.alert(
      "Atenção!",
      "Isso vai distribuir os pontos finais. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Encerrar Torneio", 
          onPress: async () => {
            setLoading(true);
            try {
              const batch = writeBatch(db);
              const betsSnap = await getDocs(collection(db, 'tournament_bets'));

              betsSnap.forEach((betDoc) => {
                const aposta = betDoc.data();
                let pontosTorneio = 0;

                if (format(aposta.champion) === format(realChampion)) pontosTorneio += PONTOS_CAMPEAO;
                if (format(aposta.runnerUp) === format(realRunnerUp)) pontosTorneio += PONTOS_VICE;
                if (format(aposta.thirdPlace) === format(realThirdPlace)) pontosTorneio += PONTOS_TERCEIRO;
                if (format(aposta.topScorer) === format(realTopScorer)) pontosTorneio += PONTOS_ARTILHEIRO;

                if (pontosTorneio > 0) {
                  const userRef = doc(db, 'users', aposta.userId);
                  batch.update(userRef, { totalPoints: increment(pontosTorneio) });
                }
              });

              await batch.commit();
              Alert.alert('Torneio Encerrado!', 'Os pontos finais foram distribuídos!');
            } catch (error) {
              Alert.alert('Erro', 'Ocorreu um erro na apuração.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Painel do Admin ⚙️</Text>

      {/* BOTÃO MÁGICO PARA INJETAR JOGOS */}
      <View style={[styles.section, { backgroundColor: '#fef3c7', padding: 16, borderRadius: 12 }]}>
        <Text style={[styles.sectionTitle, { color: '#d97706' }]}>Ferramentas de Desenvolvedor</Text>
        <Text style={{color: '#92400e', marginBottom: 16}}>Use isso para carregar a tabela inteira da Copa de uma vez.</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#d97706' }]} onPress={injetarJogosNoBanco} disabled={loading}>
          <Text style={styles.buttonText}>💉 Injetar Tabela de Jogos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Encerrar Partidas</Text>
        {matches.length === 0 ? <Text style={{color: '#64748b'}}>Sem jogos pendentes.</Text> : null}
        
        {matches.map(item => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.matchTitle}>{item.teamA} x {item.teamB}</Text>
            <View style={styles.row}>
              <TextInput 
                style={styles.input} keyboardType="numeric" placeholder="0"
                onChangeText={(val) => setRealScores(prev => ({ ...prev, [item.id]: { ...prev[item.id], a: val } }))}
              />
              <Text style={{fontWeight: 'bold'}}>X</Text>
              <TextInput 
                style={styles.input} keyboardType="numeric" placeholder="0"
                onChangeText={(val) => setRealScores(prev => ({ ...prev, [item.id]: { ...prev[item.id], b: val } }))}
              />
            </View>
            <TouchableOpacity style={styles.button} onPress={() => calcularPontosJogo(item.id)} disabled={loading}>
              <Text style={styles.buttonText}>Salvar Jogo</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.section, { marginTop: 40, borderTopWidth: 2, borderColor: '#e2e8f0', paddingTop: 30 }]}>
        <Text style={styles.sectionTitle}>2. Fechamento do Bolão</Text>
        <Text style={{color: '#64748b', marginBottom: 16}}>Preencha apenas no final do campeonato!</Text>

        <TextInput style={styles.textInput} placeholder="Campeão Real" value={realChampion} onChangeText={setRealChampion} />
        <TextInput style={styles.textInput} placeholder="Vice-Campeão Real" value={realRunnerUp} onChangeText={setRealRunnerUp} />
        <TextInput style={styles.textInput} placeholder="3º Colocado Real" value={realThirdPlace} onChangeText={setRealThirdPlace} />
        <TextInput style={styles.textInput} placeholder="Artilheiro Real" value={realTopScorer} onChangeText={setRealTopScorer} />

        <TouchableOpacity style={[styles.button, { backgroundColor: '#ef4444' }]} onPress={calcularPontosTorneio} disabled={loading}>
          <Text style={styles.buttonText}>APURAR TORNEIO E DAR PONTOS</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={{marginTop: 40, alignItems: 'center'}} onPress={lidarComVoltar}>
        <Text style={{color: '#64748b', fontSize: 16}}>Voltar ao App</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#334155', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  matchTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, width: 50, height: 50, textAlign: 'center', fontSize: 20 },
  textInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#0f172a', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});