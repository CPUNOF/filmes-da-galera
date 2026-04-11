/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RecompensasPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 overflow-x-hidden font-sans relative">
      <Navbar />

      {/* HEADER HERO */}
      <div className="relative w-full pt-32 sm:pt-48 pb-16 sm:pb-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20 scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574267432553-4b462808152a?q=80&w=2070&auto=format&fit=crop')" }}></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#070707]/80 via-transparent to-transparent"></div>

        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-6 shadow-xl backdrop-blur-md">
            <span className="text-xl animate-pulse">🎮</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Sistema de Gamificação</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black uppercase italic tracking-tighter mb-6 leading-none drop-shadow-2xl">
            MANUAL DA <span className="text-red-600">GALERA</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            Aqui não tem espaço para fantasma. Se quiser que o seu filme seja assistido, você vai ter que jogar o jogo. Entenda as regras, suba no ranking e conquiste o topo do acervo.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16 sm:mt-24 space-y-16 sm:space-y-32 relative z-30">
        
        {/* 💡 IDEIA 1: MISSÃO PENDENTE */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 sm:gap-16 group">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-red-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="text-6xl sm:text-8xl bg-black/50 w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(220,38,38,0.15)]">
                    🔥
                  </div>
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-xl sm:text-2xl font-black w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 border-[#111111] shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-bounce">
                    3
                  </div>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">O Radar de Missões</h3>
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">O TERROR DOS PREGUIÇOSOS</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              A Bolinha <span className="text-red-600">Vermelha</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Sabe aquela notificação do WhatsApp que te obriga a abrir o app? Aqui é a mesma coisa. O sistema calcula automaticamente quantos filmes na Fila você ainda não votou, e quais filmes assistidos você ainda não avaliou.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-red-600 mt-0.5">📌</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">As pendências aparecem direto no menu superior da sua tela.</p>
              </li>
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-red-600 mt-0.5">📌</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">Você sente aquela agonia de ver a notificação? Excelente. Entre, vote e limpe o seu radar!</p>
              </li>
            </ul>
          </div>
        </div>

        {/* 💡 IDEIA 2: INGRESSO DOURADO */}
        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-16 group">
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-yellow-500/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-yellow-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(234,179,8,0.5)] animate-pulse">
                  🎫
                </div>
                <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/10 mb-4 p-[1px]">
                  <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 w-4/5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Ingresso Fura-Fila</h3>
                <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">A MOEDA DE TROCA DA GALERA</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              O Ingresso <span className="text-yellow-500">Dourado</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Quer que o seu filme seja o próximo a ser assistido? Você vai ter que merecer. Criamos uma economia oculta onde o seu esforço vira poder dentro do sistema.
            </p>
            <div className="bg-yellow-900/10 border border-yellow-500/20 p-5 sm:p-6 rounded-2xl mb-6 shadow-inner">
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                A cada <strong className="text-yellow-500">20 interações</strong> (votar nas sugestões ou avaliar filmes assistidos), você ganha <strong className="text-white">1 Ingresso Dourado</strong>. Na hora de indicar o seu filme, use o ingresso para ignorar a votação democrática e jogá-lo <strong className="text-yellow-500 border-b border-yellow-500">direto para o Top 1 da Fila.</strong>
              </p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]">
              <span>🎟️</span> Ver meu Cofre no Perfil
            </Link>
          </div>
        </div>

        {/* 💡 IDEIA 3: PÓDIO DOS CRÍTICOS */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 sm:gap-16 group">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-blue-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img src="https://via.placeholder.com/150" alt="Avatar" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#111111] shadow-2xl object-cover opacity-50 grayscale" />
                  <div className="absolute -top-6 -right-6 text-6xl sm:text-7xl drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] animate-bounce">
                    👑
                  </div>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">1º Lugar no Ranking</h3>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">O MAIOR CRÍTICO DO GRUPO</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              O Pódio dos <span className="text-blue-500">Críticos</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Aqui o ego entra em jogo. Ninguém gosta de ficar em último num ranking público. O nosso sistema rastreia toda a atividade da galera e cria um ranking de pontuação em tempo real.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
                <span className="text-2xl mb-1">🔥</span>
                <span className="text-white font-black text-lg">+1 Ponto</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Por Voto na Fila</span>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
                <span className="text-2xl mb-1">💬</span>
                <span className="text-white font-black text-lg">+2 Pontos</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Por Resenha Escrita</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 font-medium italic border-l-2 border-blue-500 pl-4 py-1">
              Quem conquista o 1º Lugar ganha a cobiçada Coroa 👑 no perfil, para todo mundo ver quem manda no acervo.
            </p>
          </div>
        </div>

      </div>

      {/* CTA FOOTER */}
      <div className="max-w-3xl mx-auto px-6 mt-20 sm:mt-32 text-center relative z-20">
        <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter mb-6">
          Pronto para jogar?
        </h2>
        <p className="text-gray-400 text-sm mb-10 max-w-xl mx-auto">
          Chega de teoria. Vá para a fila de sugestões agora mesmo, limpe suas notificações, ganhe seus ingressos e suba no pódio dos críticos.
        </p>
        <Link href="/sugestoes" className="inline-flex items-center gap-3 bg-white text-black hover:bg-red-600 hover:text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]">
          Entrar na Fila <span>➔</span>
        </Link>
      </div>

    </main>
  );
}