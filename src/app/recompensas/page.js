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
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">O Teu Hub Cultural</span>
          </div>
          <h1 className="text-4xl sm:text-7xl font-black uppercase italic tracking-tighter mb-6 leading-none drop-shadow-2xl">
            MANUAL DA <span className="text-red-600">GALERA</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-3xl mx-auto leading-relaxed font-medium">
            Aqui não há espaço para fantasmas. Filmes, Músicas, Animes e Livros: tudo o que fazes alimenta o teu perfil e a Timeline Global. Entende o ecossistema, ganha medalhas e domina o acervo.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-16 sm:mt-24 space-y-20 sm:space-y-32 relative z-30">
        
        {/* 💡 1. A TIMELINE GLOBAL E STORIES */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 sm:gap-16 group">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-blue-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(59,130,246,0.5)] anim-float">
                  📱
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">O Centro de Tudo</h3>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">FEED E INSTAGRAM STORIES</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              A Timeline <span className="text-blue-500">Global</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              A nossa página principal não é um simples mural, é um organismo vivo. Quase tudo o que a galera faz pela plataforma aparece lá automaticamente.
            </p>
            <ul className="space-y-4 text-left">
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-blue-500 mt-0.5">📸</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium"><strong className="text-white">Exportação para Stories:</strong> Viste um filme brutal ou queres expor um lixo? Clica no botão "Story" em qualquer post do feed e o nosso sistema desenha um poster cinematográfico automático pronto para postares no Instagram!</p>
              </li>
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-blue-500 mt-0.5">🔍</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium"><strong className="text-white">Filtros Inteligentes:</strong> Usa a barra superior do Feed para filtrar apenas o que queres ver: só Músicas, só Cinema, atualizações de Coleção ou Comunidade, e ordena por mais antigos ou recentes.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* 💡 2. SESSÕES JAM E MÚSICA */}
        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-16 group">
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-pink-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-pink-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(236,72,153,0.5)] anim-float" style={{ animationDelay: '1s' }}>
                  🎧
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Sessões Jam & Auto-DJ</h3>
                <p className="text-[10px] text-pink-500 font-black uppercase tracking-widest">A BANDA SONORA DA PLATAFORMA</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              A Rádio da <span className="text-pink-500">Galera</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Ouvir música deixou de ser solitário. Sempre que dás Play numa música, um disco de vinil começa a girar em direto no Feed de toda a gente!
            </p>
            <ul className="space-y-4 text-left">
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-pink-500 mt-0.5">🔥</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium"><strong className="text-white">Ouvir Junto:</strong> Qualquer pessoa no feed pode clicar no teu disco e ouvir a música sincronizada contigo.</p>
              </li>
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-pink-500 mt-0.5">🧠</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium"><strong className="text-white">Karaokê e Conhecimento:</strong> O Player Global tem um sistema inteligente que extrai a letra original, gera traduções automáticas via IA e puxa a história da música diretamente da Wikipedia sem saíres do site!</p>
              </li>
            </ul>
          </div>
        </div>

        {/* 💡 3. PROGRESSO CULTURAL */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 sm:gap-16 group">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-emerald-500/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-emerald-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(16,185,129,0.5)] anim-float">
                  📚
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">A Jornada do Conhecimento</h3>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">LIVROS, ANIMES E MANGÁS</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              O Teu <span className="text-emerald-500">Legado</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              A tua biblioteca pessoal é acompanhada pelo sistema. Adiciona os teus livros, mangás e animes na página de Perfil e mantém o registo do que consomes.
            </p>
            <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 sm:p-6 rounded-2xl shadow-inner text-left">
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                Sempre que avanças um capítulo de Mangá ou lês mais umas páginas de um Livro, <strong className="text-emerald-500">uma barra de progresso motivacional é publicada automaticamente no Feed.</strong> A comunidade acompanha a tua evolução rumo aos 100%!
              </p>
            </div>
          </div>
        </div>

        {/* 💡 4. CINE CLUBE E INGRESSO DOURADO */}
        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-16 group">
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-yellow-500/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-yellow-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(234,179,8,0.5)] anim-float" style={{ animationDelay: '1s' }}>
                  🎫
                </div>
                <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/10 mb-4 p-[1px]">
                  <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 w-4/5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Ingresso Fura-Fila</h3>
                <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">A MOEDA DE TROCA DO CINEMA</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              O Ingresso <span className="text-yellow-500">Dourado</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              A Fila de Filmes é decidida por democracia e upvotes. Mas se quiseres que o teu filme seja o próximo, temos uma economia oculta.
            </p>
            <div className="bg-yellow-900/10 border border-yellow-500/20 p-5 sm:p-6 rounded-2xl mb-6 shadow-inner text-left">
              <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                A cada <strong className="text-yellow-500">20 interações</strong> (votar na fila ou avaliar filmes), ganhas <strong className="text-white">1 Ingresso Dourado</strong>. Na hora de sugerir o teu filme, usa o ingresso para ignorar a votação e jogá-lo <strong className="text-yellow-500 border-b border-yellow-500">direto para o Top 1 da Fila.</strong>
              </p>
            </div>
            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">⚠️ Regra Anti-Abuso: Só podes usar 1 ingresso a cada 7 dias.</p>
          </div>
        </div>

        {/* 💡 5. O TRIBUNAL DO BOT (OLIMPO E LIXEIRA) */}
        <div className="relative flex flex-col md:flex-row items-center gap-8 sm:gap-16 group">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-red-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-red-500/10"></div>
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="flex w-full items-center justify-around gap-4">
                  <div className="text-5xl sm:text-6xl drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-pulse">👑</div>
                  <div className="text-xl text-gray-600 font-black italic">VS</div>
                  <div className="text-5xl sm:text-6xl drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-bounce">☠️</div>
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">A Exposição Pública</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">O BOT JULGADOR NÃO PERDOA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              O Tribunal do <span className="text-red-600">Feed</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Depois da sessão acabar, todos avaliam de 1 a 10. Ninguém esconde o voto. O nosso **Bot Julgador** calcula a média e publica cartazes lindíssimos diretamente na Timeline expondo o culpado ou o abençoado!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-left">
              <div className="bg-yellow-900/10 border border-yellow-500/30 p-4 rounded-2xl flex flex-col justify-center items-start hover:bg-yellow-900/30 transition-colors">
                <span className="text-2xl mb-1">✨</span>
                <span className="text-yellow-500 font-black text-lg uppercase tracking-widest">Olimpo</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Média 8.5 a 10.0</span>
                <span className="text-[8px] text-yellow-600 italic mt-1">Selo Obra-Prima e Glória!</span>
              </div>
              <div className="bg-red-900/10 border border-red-500/30 p-4 rounded-2xl flex flex-col justify-center items-start hover:bg-red-900/30 transition-colors">
                <span className="text-2xl mb-1">🗑️</span>
                <span className="text-red-500 font-black text-lg uppercase tracking-widest">Lixão</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Média 0 a 4.5</span>
                <span className="text-[8px] text-red-600 italic mt-1">Selo de Chorume e Vergonha!</span>
              </div>
            </div>
          </div>
        </div>

        {/* 💡 6. O TERREMOTO E CURIOSIDADES */}
        <div className="relative flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-16 group">
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full pointer-events-none transition-all group-hover:bg-orange-600/20"></div>
          
          <div className="w-full md:w-1/2 shrink-0 relative">
            <div className="bg-[#111111] border border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform transition-transform group-hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-gradient-to-bl from-orange-600/10 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-7xl sm:text-9xl mb-6 drop-shadow-[0_0_40px_rgba(249,115,22,0.5)] anim-float" style={{ animationDelay: '1s' }}>
                  👉💥
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">A Cutucada</h3>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">O TERROR DOS PREGUIÇOSOS</p>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              O <span className="text-orange-500">Terremoto</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
              Aquele teu amigo nunca entra no site para votar na fila ou não responde aos comentários? Resolvemos isso. Agora podes cobrar a galera diretamente no perfil deles.
            </p>
            <ul className="space-y-4 text-left">
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-orange-500 mt-0.5">📳</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">Quando dás um toque no perfil do amigo, a próxima vez que ele abrir o site <strong className="text-white">a tela inteira dele vai tremer</strong> com um aviso na cara.</p>
              </li>
              <li className="flex items-start gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-orange-500 mt-0.5">⏳</span>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">Ele pode revidar, mas há um limite de segurança: só é permitido 1 cutucada por pessoa por dia.</p>
              </li>
            </ul>
          </div>
        </div>

        {/* 💡 7. AS 12 MEDALHAS DE HONRA COMPLETAS */}
        <div className="relative pt-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">
              <span className="text-cyan-500">Medalhas</span> de Honra
            </h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              O sistema monitoriza secretamente as tuas atitudes. Desde os livros que lês até à música que ouves de madrugada. Desbloqueia as <strong className="text-white">12 Conquistas Exclusivas</strong> para provares quem és na plataforma.
            </p>
          </div>

          {/* GRID DE 12 MEDALHAS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
            {[
              { icone: "🌟", nome: "O Influenciador", cor: "pink", desc: "Soma 5 ou mais curtidas num único post ou resenha." },
              { icone: "⛩️", nome: "O Otaku", cor: "orange", desc: "Adicionou 10+ Animes ou Mangás à coleção pessoal." },
              { icone: "💰", nome: "O Magnata", cor: "amber", desc: "Acumulou 3 ou mais Ingressos Dourados no cofre." },
              { icone: "🎧", nome: "DJ da Galera", cor: "fuchsia", desc: "Alguém entrou na tua Sessão Jam para ouvir junto." },
              { icone: "🦉", nome: "A Coruja", cor: "indigo", desc: "Utilizou o Auto-DJ de madrugada para descobrir música." },
              { icone: "📚", nome: "Rato de Biblioteca", cor: "emerald", desc: "Ultrapassou a marca de 1000 páginas lidas no diário." },
              { icone: "🏆", nome: "Cinéfilo Extremo", cor: "red", desc: "Já avaliou mais de 20 filmes assistidos pela galera." },
              { icone: "🎯", nome: "O Visionário", cor: "yellow", desc: "A tua indicação foi glorificada com Média 8.5+ (Olimpo)." },
              { icone: "🗑️", nome: "Inimigo do Gosto", cor: "green", desc: "A tua indicação foi humilhada com Média < 4.5 (Lixão)." },
              { icone: "😡", nome: "O Hater", cor: "rose", desc: "Deu nota implacável abaixo de 5.0 para 3 ou mais filmes." },
              { icone: "✍️", nome: "O Tagarela", cor: "blue", desc: "Escreveu 10 ou mais publicações ou resenhas no mural." },
              { icone: "🌐", nome: "O Historiador", cor: "cyan", desc: "Extraiu a história de 5 músicas direto da Wikipedia." }
            ].map((medalha, i) => (
              <div key={i} className={`bg-${medalha.cor}-900/10 border border-${medalha.cor}-500/20 p-5 rounded-2xl flex flex-col items-center text-center hover:bg-${medalha.cor}-900/30 hover:border-${medalha.cor}-500/50 transition-all hover:-translate-y-1 group`}>
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform drop-shadow-md">{medalha.icone}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest text-${medalha.cor}-400 mb-2`}>{medalha.nome}</span>
                <span className="text-[9px] text-gray-400 font-medium leading-tight">{medalha.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA FOOTER */}
      <div className="max-w-3xl mx-auto px-6 mt-20 sm:mt-32 text-center relative z-20">
        <h2 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tighter mb-6">
          Pronto para dominar?
        </h2>
        <p className="text-gray-400 text-sm mb-10 max-w-xl mx-auto">
          A teoria acabou. Vai para o teu perfil adicionar os teus livros, dá play numa música, ou partilha a tua opinião no Feed Global.
        </p>
        <Link href="/" className="inline-flex items-center gap-3 bg-white text-black hover:bg-red-600 hover:text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]">
          Ir para a Timeline <span>➔</span>
        </Link>
      </div>

    </main>
  );
}