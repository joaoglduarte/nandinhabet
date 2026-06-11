import { FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#10b981', // Um verde legal para tema de futebol
      headerTitleAlign: 'center',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jogos',
          tabBarIcon: ({ color }) => <FontAwesome name="soccer-ball-o" size={24} color={color} />,
        }}
      />
        <Tabs.Screen
        name="tournament" // O nome do arquivo físico ainda é tournament.tsx
        options={{
          title: 'Palpites Finais', // O nome que aparece na tela e na barra
          // Trocamos o triângulo por um troféu (trophy) ou uma estrela (star)
          tabBarIcon: ({ color }) => <FontAwesome name="star" size={24} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color }) => <FontAwesome name="trophy" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={24} color={color} />,
        }}
      />
      {/* ABA DE REGRAS */}
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Regras',
          tabBarIcon: ({ color }) => <FontAwesome name="book" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}