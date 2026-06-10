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
    </Tabs>
  );
}