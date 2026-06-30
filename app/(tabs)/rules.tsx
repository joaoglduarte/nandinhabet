import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RulesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Como Pontuar 🏆</Text>
        <Text style={styles.headerSubtitle}>Entenda as regras do bolão e suba no ranking!</Text>
      </View>

      {/* REGRAS DE JOGOS COMUNS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚽ Partidas (Fase de Grupos)</Text>
        
        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text style={styles.rulePoints}>+5 pts</Text>
            <Text style={styles.ruleName}>Placar Exato (Na Mosca!)</Text>
          </View>
          <Text style={styles.ruleDesc}>
            Você acertou exatamente o número de gols de cada time. {'\n'}
            <Text style={styles.example}>Ex: Apostou 2x1 e o jogo terminou 2x1.</Text>
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text style={styles.rulePoints}>+2 pts</Text>
            <Text style={styles.ruleName}>Acerto de Tendência</Text>
          </View>
          <Text style={styles.ruleDesc}>
            Você não acertou o placar, mas acertou quem venceu ou se foi empate. {'\n'}
            <Text style={styles.example}>Ex: Apostou 1x0, o jogo terminou 3x0 (acertou o vencedor). {'\n'}Apostou 1x1, o jogo terminou 0x0 (acertou o empate).</Text>
          </Text>
        </View>

        

        <Text style={styles.sectionTitle}>🔥 Fase Mata-Mata (Novo Peso!)</Text>

        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text style={styles.rulePoints}>+7 pts</Text>
            <Text style={styles.ruleName}>Acerto na mosca</Text>
          </View>
          <Text style={styles.ruleDesc}>
            Acertou o placar exato. Se houver disputa de pênaltis, tem que cravar o time vencedor também! {'\n'}
            <Text style={styles.example}>Ex: Apostou 3x0, o jogo terminou 3x0. {'\n'}</Text>
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text style={styles.rulePoints}>+4 pts</Text>
            <Text style={styles.ruleName}>Acerto de Tendência ou Quase</Text>
          </View>
          <Text style={styles.ruleDesc}>
            Previu a tendência. Para empates: Você previu o empate, mas errou os gols no tempo normal ou errou quem passou nos pênaltis. Pelo menos a leitura de jogo foi boa! {'\n'}
            <Text style={styles.example}>Ex: Apostou 1x0, o jogo terminou 3x0 (acertou o vencedor). {'\n'}Apostou 1x1, o jogo terminou 0x0 (acertou o empate).</Text>
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text style={styles.rulePoints}>+2 pts</Text>
            <Text style={styles.ruleName}>Acerto de Consolação</Text>
          </View>
          <Text style={styles.ruleDesc}>
            Você previu o empate, mas errou os gols no tempo normal e também errou quem passou nos pênaltis. Pelo menos a leitura de jogo foi boa! {'\n'}
            <Text style={styles.example}>Ex: Apostou 1x1, e que o time A ganharia. O jogo terminou 3x3, e o time B venceu (Prêmio de consolação).</Text>
          </Text>
        </View>
          
          <Text style={styles.rulePoints}>
            <Text style={{fontWeight: 'bold', color: '#10b981'}}>🟩 7 Pontos (Cravada Máxima):</Text>
          </Text>
          
          <Text style={styles.rulePoints}>
            <Text style={{fontWeight: 'bold', color: '#fbbf24'}}>🟨 4 Pontos (Tendência ou Quase):</Text>
          </Text>
          
          <Text style={styles.rulePoints}>
            <Text style={{fontWeight: 'bold', color: '#f97316'}}>🟧 2 Pontos (Consolação)</Text>
          </Text>
        </View>
        
        <Text style={styles.note}>⚠️ Nota: Os palpites podem ser alterados até o minuto exato em que a partida começa!</Text>

      {/* REGRAS DE PALPITES FINAIS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔮 Palpites do Torneio (Longo Prazo)</Text>
        <Text style={styles.sectionSubtitle}>
          Estes pontos são somados apenas no final do campeonato, podendo virar o jogo no ranking!
        </Text>

        <View style={styles.ruleCard}>
          <Text style={styles.tournamentRule}>🥇 <Text style={styles.bold}>Campeão:</Text> +20 pontos</Text>
          <View style={styles.divider} />
          <Text style={styles.tournamentRule}>🥈 <Text style={styles.bold}>Vice-Campeão:</Text> +15 pontos</Text>
          <View style={styles.divider} />
          <Text style={styles.tournamentRule}>🥉 <Text style={styles.bold}>3º Colocado:</Text> +10 pontos</Text>
          <View style={styles.divider} />
          <Text style={styles.tournamentRule}>⚽ <Text style={styles.bold}>Artilheiro:</Text> +15 pontos</Text>
        </View>
      </View>

      {/* CRITÉRIOS DE DESEMPATE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚖️ Critérios de Desempate</Text>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleDesc}>
            Se dois ou mais jogadores terminarem com a mesma pontuação, o desempate será feito por:
          </Text>
          <Text style={styles.bullet}>1. Maior número de acertos na mosca (Placar Exato).</Text>
          <Text style={styles.bullet}>2. Sorteio ou decisão do Administrador.</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { alignItems: 'center', backgroundColor: '#10b981', paddingVertical: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: '#ecfdf5' },
  
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
  sectionSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 12, lineHeight: 20 },
  
  ruleCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rulePoints: { backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold', fontSize: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 10, overflow: 'hidden' },
  ruleName: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  ruleDesc: { fontSize: 14, color: '#475569', lineHeight: 22 },
  example: { fontStyle: 'italic', color: '#94a3b8' },
  
  note: { fontSize: 13, color: '#ef4444', fontStyle: 'italic', marginTop: 4, paddingHorizontal: 4 },
  
  tournamentRule: { fontSize: 16, color: '#334155', paddingVertical: 6 },
  bold: { fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
  
  bullet: { fontSize: 14, color: '#475569', marginTop: 8, fontWeight: '500' },
});