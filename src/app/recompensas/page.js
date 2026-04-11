/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RegrasPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 overflow-x-hidden font-sans relative">
      <Navbar />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .anim-float { animation: float 4s ease-in-out infinite; }
      `}</style>

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
          <p className="text-gray-400 text-sm sm:text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            Aqui não tem espaço para fantasma. Se quiseres que o teu filme seja assistido, vais ter que jogar o jogo. Entende as regras, cutuca os teus amigos, ganha medalhas e domina o acervo.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16 sm:mt-24 space-y-20 sm:space-y-32 relative z-30">
        
        {/* 💡 IDEIA 1: O INGRESSO DOURADO */}
        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-16 group">
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-yellow-500/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-yellow-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(234,179,8,0.5)] anim-float">
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
              Queres que o teu filme seja o próximo a ser assistido? Vais ter que merecer. Criamos uma economia oculta onde o teu esforço vira poder dentro do sistema.
            </p>
            <div className="bg-yellow-900/10 border border-yellow-500/20 p-5 sm:p-6 rounded-2xl mb-6 shadow-inner">
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                A cada <strong className="text-yellow-500">20 interações</strong> (votar na fila ou avaliar filmes), ganhas <strong className="text-white">1 Ingresso Dourado</strong>. Na hora de indicar o teu filme, usa o ingresso para ignorar a votação e jogá-lo <strong className="text-yellow-500 border-b border-yellow-500">direto para o Top 1 da Fila.</strong>
              </p>
            </div>
            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">⚠️ Regra Anti-Abuso: Só podes usar 1 ingresso a cada 7 dias.</p>
          </div>
        </div>

        {/* 💡 IDEIA 2: A CUTUCADA (NOVO) */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 sm:gap-16 group">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-red-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="text-7xl sm:text-9xl drop-shadow-[0_0_30px_rgba(220,38,38,0.5)] anim-float">
                    👉💥
                  </div>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">O Terremoto</h3>
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">O TERROR DOS PREGUIÇOSOS</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              A <span className="text-red-600">Cutucada</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Aquele teu amigo nunca entra no site para votar na fila ou confirmar presença na sessão? Resolvemos isso. Agora podes cobrar a galera diretamente no perfil deles.
            </p>
            <ul className="space-y-4 text-left">
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-red-600 mt-0.5">📳</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">Quando dás um toque no perfil do amigo, a próxima vez que ele entrar no site <strong className="text-white">a tela inteira dele vai tremer</strong> com um aviso na cara.</p>
              </li>
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-red-600 mt-0.5">⏳</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">Podes cutucar a pessoa e ela pode <strong className="text-white">revidar o toque</strong>, mas cuidado: só é permitido 1 cutucada por pessoa por dia.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* 💡 IDEIA 3: A ROLETA / FILME DO DIA (NOVO) */}
        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-16 group">
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-purple-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-purple-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(168,85,247,0.5)] anim-float" style={{ animationDelay: '1s' }}>
                  🎲
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Sorteio Sincronizado</h3>
                <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest">PARA OS INDECISOS</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              A Sugestão do <span className="text-purple-500">Dia</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              A Fila de Sugestões está cheia de obras-primas e ninguém se decide? Deixa que a plataforma escolha.
            </p>
            <div className="bg-purple-900/10 border border-purple-500/20 p-5 sm:p-6 rounded-2xl shadow-inner text-left">
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                Todos os dias, à <strong className="text-purple-500">meia-noite</strong>, o sistema roda os dados e destaca aleatoriamente um filme da fila na página inicial. <strong className="text-white">O filme escolhido é o mesmo para toda a galera</strong>, facilitando o acordo sobre o que assistir na sessão de hoje.
              </p>
            </div>
          </div>
        </div>

        {/* 💡 IDEIA 4: MEDALHAS DE HONRA (EXPANDIDO) */}
        <div className="relative pt-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              <span className="text-cyan-500">Medalhas</span> de Honra
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Os teus hábitos de cinema ficam gravados no teu perfil. O sistema rastreia as tuas atitudes e desbloqueia <strong className="text-white">11 Conquistas Secretas</strong> para todos verem quem tu és de verdade.
            </p>
          </div>

          {/* GRID DE 11 MEDALHAS ESTILOSAS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
            {[
              { icone: "🌟", nome: "O Influenciador", cor: "pink", desc: "Soma 5 ou mais curtidas nas suas resenhas públicas." },
              { icone: "🏛️", nome: "O Curador", cor: "purple", desc: "Indicou 3+ filmes que foram aprovados e assistidos." },
              { icone: "💰", nome: "O Magnata", cor: "amber", desc: "Tem 3 ou mais Ingressos Dourados acumulados no cofre." },
              { icone: "📓", nome: "O Explorador", cor: "cyan", desc: "Guardou 10+ filmes no seu Diário Pessoal." },
              { icone: "🗣️", nome: "Voz do Povo", cor: "emerald", desc: "Uma única resenha sua bateu 5 ou mais curtidas." },
              { icone: "🎟️", nome: "Mestre da Fila", cor: "orange", desc: "Apoiou com upvote 10+ filmes que estão na fila." },
              { icone: "🏆", nome: "Cinéfilo Extremo", cor: "red", desc: "Já avaliou mais de 20 filmes assistidos pela galera." },
              { icone: "🎯", nome: "O Visionário", cor: "yellow", desc: "Indicou um filme que terminou com média 9.0+." },
              { icone: "👴", nome: "O Cult", cor: "stone", desc: "Assistiu ou Indicou 3+ filmes lançados antes de 1990." },
              { icone: "😡", nome: "O Hater", cor: "rose", desc: "Deu nota abaixo de 5.0 para 3 ou mais filmes." },
              { icone: "✍️", nome: "O Tagarela", cor: "blue", desc: "Escreveu 10 ou mais resenhas no mural." }
            ].map((medalha, i) => (
              <div key={i} className={`bg-${medalha.cor}-900/10 border border-${medalha.cor}-500/20 p-5 rounded-2xl flex flex-col items-center text-center hover:bg-${medalha.cor}-900/30 hover:border-${medalha.cor}-500/50 transition-all hover:-translate-y-1 group`}>
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{medalha.icone}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest text-${medalha.cor}-400 mb-2`}>{medalha.nome}</span>
                <span className="text-[9px] text-gray-400 font-medium leading-tight">{medalha.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 💡 IDEIA 5: CÉU E INFERNO */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 sm:gap-16 group">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-green-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-green-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-green-500/10"></div>
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="flex w-full items-center justify-around gap-4">
                  <div className="text-5xl sm:text-6xl drop-shadow-[0_0_20px_rgba(234,179,8,0.8)] animate-pulse">✨</div>
                  <div className="text-xl text-gray-600 font-black italic">VS</div>
                  <div className="text-5xl sm:text-6xl drop-shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-bounce">💩</div>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">O Veredito Final</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">A DEMOCRACIA É IMPLACÁVEL</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              O Céu e o <span className="text-green-500">Inferno</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Depois que a sessão acaba, todos avaliam com nota de 1 a 10. Ninguém esconde o voto. A média geral decide para onde a obra vai: Tapete Vermelho ou Lixeira.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Link href="/olimpo" className="bg-yellow-900/10 border border-yellow-500/30 p-4 rounded-2xl flex flex-col justify-center items-center sm:items-start text-center sm:text-left hover:bg-yellow-900/30 transition-colors">
                <span className="text-2xl mb-1">✨</span>
                <span className="text-yellow-500 font-black text-lg">Olimpo</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Média 8.0 a 10.0</span>
                <span className="text-[8px] text-yellow-600 italic mt-1">Joga rosas e celebra!</span>
              </Link>
              <Link href="/lixeira" className="bg-green-900/10 border border-green-500/30 p-4 rounded-2xl flex flex-col justify-center items-center sm:items-start text-center sm:text-left hover:bg-green-900/30 transition-colors">
                <span className="text-2xl mb-1">💩</span>
                <span className="text-green-500 font-black text-lg">Lixeira</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Média 0 a 5.0</span>
                <span className="text-[8px] text-green-600 italic mt-1">Joga tomate e queima!</span>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* CTA FOOTER */}
      <div className="max-w-3xl mx-auto px-6 mt-20 sm:mt-32 text-center relative z-20">
        <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter mb-6">
          Pronto para jogar?
        </h2>
        <p className="text-gray-400 text-sm mb-10 max-w-xl mx-auto">
          Chega de teoria. Vai para a fila de sugestões agora mesmo, manda um toque para aquele amigo enrolado, ganha os teus ingressos e domina a Galera.
        </p>
        <Link href="/sugestoes" className="inline-flex items-center gap-3 bg-white text-black hover:bg-red-600 hover:text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]">
          Entrar na Fila <span>➔</span>
        </Link>
      </div>

    </main>
  );
}