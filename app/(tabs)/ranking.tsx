import { StyleSheet, Text, View } from 'react-native';

export default function RankingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Ranking do Bolão</Text>
      <Text>Aqui vai entrar a lista da galera!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});