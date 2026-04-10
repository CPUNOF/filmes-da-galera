# 🎬 Filmes da Galera

Bem-vindo ao **Filmes da Galera**, uma plataforma web de luxo desenvolvida para substituir planilhas chatas e centralizar a curadoria de filmes do nosso grupo. 

O objetivo deste projeto foi criar uma experiência de usuário (UX) e interface (UI) dignas de grandes serviços de streaming, combinando alta performance com design cinematográfico.

🔗 **Acesse o projeto online:** [https://filmes-da-galera.vercel.app/]

---

## ✨ Funcionalidades 

- 🔐 **Autenticação Segura:** Login rápido e seguro utilizando contas do Google (Firebase Auth).
- 🔍 **Busca no Acervo Mundial:** Integração direta com a API do TMDB para buscar pôsteres, sinopses, gêneros e trailers oficiais em alta qualidade.
- 🗳️ **Sistema de Votação e Fila:** Os usuários podem indicar filmes ("Fila de Sugestões") e dar upvotes nos títulos que mais querem assistir.
- 💬 **Mural de Resenhas:** Comentários em tempo real na página de cada filme para a galera debater se o filme é "Ótimo 🏆" ou "Lixo 🗑️".
- 👑 **Painel de Controle (Admin):** Sistema de permissões onde apenas administradores podem definir a data da sessão, mover filmes da fila para os assistidos ou excluir títulos.

---

## 🎨 Destaques de UI/UX 

Este projeto não é apenas funcional; ele foi milimetricamente desenhado para ser bonito e responsivo:

- **Cinematic Backdrop:** Fundos dinâmicos e borrados gerados a partir da capa de cada filme.
- **Glassmorphism:** Uso intensivo de desfoque de fundo (`backdrop-blur`) e transparências para um visual moderno.
- **Loading Skeletons:** Telas de carregamento animadas (`animate-pulse`) que simulam a estrutura do site enquanto os dados são buscados, eliminando telas brancas e melhorando a percepção de velocidade.
- **Toasts Customizados:** Zero `alerts` nativos do navegador. Todas as notificações e confirmações de ações usam o `react-hot-toast` com design escuro e interativo.
- **Ultrawide & Mobile First:** Layout elástico (Grid de 12 colunas) que se adapta perfeitamente desde a tela de um celular até monitores ultrawide.

---

## 🛠️ Tecnologias Utilizadas

- **[Next.js](https://nextjs.org/)** (App Router, Server/Client Components)
- **[React](https://reactjs.org/)**
- **[Tailwind CSS](https://tailwindcss.com/)** (Estilização avançada)
- **[Firebase](https://firebase.google.com/)** (Firestore Database & Authentication)
- **[TMDB API](https://www.themoviedb.org/)** (Dados e Mídias dos Filmes)
- **[React Hot Toast](https://react-hot-toast.com/)** (Notificações)
- **[Vercel](https://vercel.com/)** (Deploy e Hospedagem)

---
