# 🏆 Bolão da Copa 2026 - App

Um aplicativo móvel e web desenvolvido em **React Native (Expo)** e **Firebase** para gerenciar um Bolão da Copa do Mundo, permitindo que os usuários façam palpites, acompanhem o ranking em tempo real e vejam os palpites de outros jogadores através de um Mural de Transparência.

## ✨ Novidades da Última Atualização
- **Fase Mata-Mata Ativada:** Suporte completo para os jogos eliminatórios (Oitavas, Quartas, Semis e Final).
- **Decisão por Pênaltis:** Se o usuário palpitar um empate no tempo normal durante o mata-mata, o sistema revela automaticamente botões para escolher quem avança nos pênaltis.
- **Mural de Transparência Atualizado:** Agora exibe não apenas os placares, mas também quem os usuários escolheram como vencedor nas disputas de pênaltis.

## ⚙️ Funcionalidades Principais
- **Autenticação:** Login de usuários integrado.
- **Painel de Palpites:** Interface intuitiva para palpitar nos jogos antes do bloqueio (início da partida).
- **Painel de Admin:** Área restrita para os administradores encerrarem jogos, lançarem os placares oficiais, escolherem vencedores de pênaltis e distribuírem pontos.
- **Sistema de Pontuação Automático:**
  - **Cravada (5 pontos):** Acertar o placar exato (e o vencedor dos pênaltis, se houver).
  - **Vencedor (2 pontos):** Acertar a tendência (quem ganhou ou se foi empate), mas errar o placar exato.
- **Fechamento do Torneio:** Distribuição de bônus no final da Copa (Campeão, Vice, 3º Lugar e Artilheiro).

## 🛠️ Tecnologias Utilizadas
- [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/) (Framework principal e Expo Router)
- [Firebase Firestore](https://firebase.google.com/) (Banco de Dados em tempo real)
- [Firebase Hosting](https://firebase.google.com/) (Hospedagem da versão Web/Admin)
- **TypeScript** (Tipagem de dados)