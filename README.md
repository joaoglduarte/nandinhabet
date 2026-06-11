# NandinhaBet ⚽

O NandinhaBet é uma plataforma de bolão esportivo completa, desenvolvida com React Native (Expo) e Firebase, permitindo palpites em tempo real, ranking dinâmico e integração com sistemas de gestão.

## 🚀 Funcionalidades
- **Palpites em Tempo Real**: Sistema de palpites com travamento automático no início da partida (com tolerância de 15min).
- **Ranking Inteligente**: Exibição de pontuação, avatares customizados e critérios de desempate.
- **Sistema de Pontuação Justo**: 
    - 5 pontos para placar exato (cravada).
    - 2 pontos para acerto de vencedor/empate.
- **Segurança Blindada**: Regras do Firestore que impedem manipulação de pontos pelos usuários.
- **Experiência PWA**: Otimizado para rodar como app na tela inicial (iOS/Android) via Web.
- **Feedback Proativo**: Notificações Toast elegantes para ações de usuário.

## 🛠 Tecnologias
- **Frontend**: React Native, Expo, Expo Router.
- **Backend**: Firebase Firestore (NoSQL), Firebase Auth.
- **Design**: DiceBear Avatars API.

## 📦 Como rodar o projeto
1. Clone o repositório.
2. Instale as dependências: `npm install`.
3. Configure o seu `firebaseConfig.js` com as suas credenciais.
4. Rode o projeto: `npx expo start -c`.

## ⚙️ Configuração de Produção
- O app está configurado como **PWA**.
- As regras de segurança do Firestore devem ser aplicadas através do console do Firebase para garantir a integridade dos dados de pontuação.