/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function LixeiraPage() {
  const [filmesLixo, setFilmesLixo] = useState([]);
  const [filmeAtivo, setFilmeAtivo] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // 🪄 ESTADOS DAS FERRAMENTAS E FÍSICA
  const [ferramenta, setFerramenta] = useState("tomate"); // 'tomate', 'tinta', 'rasgar', 'tiro', 'fogo'
  const [interacoes, setInteracoes] = useState([]); 
  const [shaking, setShaking] = useState(false); 

  const coresTinta = ["#22c55e", "#a855f7", "#eab308", "#3b82f6", "#ec4899", "#14b8a6", "#ffffff"];

  useEffect(() => {
    async function carregarLixo() {
      try {
        const snapFilmes = await getDocs(collection(db, "filmes"));
        const todosFilmes = [];
        
        snapFilmes.forEach(doc => {
          const data = doc.data();
          if (data.status === "assistido" && Number(data.notaGeral) <= 5) {
            todosFilmes.push({ id: doc.id, ...data });
          }
        });

        todosFilmes.sort((a, b) => Number(a.notaGeral) - Number(b.notaGeral));
        
        setFilmesLixo(todosFilmes);
        if (todosFilmes.length > 0) {
          setFilmeAtivo(todosFilmes[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar lixeira:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarLixo();
  }, []);

  // 🪄 MOTOR DE FÍSICA E ANIMAÇÃO DOS CLIQUES
  const handlePosterClick = (e) => {
    if (!filmeAtivo) return;

    // Tremer o poster a cada hit!
    setShaking(true);
    setTimeout(() => setShaking(false), 200);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = Date.now() + Math.random();

    if (ferramenta === "rasgar") {
      setInteracoes([...interacoes, {
        id, tipo: "corte", x, y,
        rotacao: Math.floor(Math.random() * 360),
        comprimento: Math.floor(Math.random() * 150) + 100,
      }]);

    } else if (ferramenta === "tinta") {
      const cor = coresTinta[Math.floor(Math.random() * coresTinta.length)];
      const gotas = Array.from({ length: 8 }).map(() => ({
        dx: (Math.random() - 0.5) * 200, dy: (Math.random() - 0.5) * 200, size: Math.random() * 10 + 5
      }));
      setInteracoes([...interacoes, {
        id, tipo: "tinta", x, y, cor, gotas,
        rotacao: Math.floor(Math.random() * 360), escala: Math.random() * 0.5 + 0.8
      }]);

    } else if (ferramenta === "tomate") {
      // Tomate agora é igual a tinta, mas com cor fixa vermelho-sangue e formato de esmagado
      const gotas = Array.from({ length: 12 }).map(() => ({
        dx: (Math.random() - 0.5) * 150, dy: (Math.random() - 0.5) * 150, size: Math.random() * 12 + 4
      }));
      setInteracoes([...interacoes, {
        id, tipo: "tomate_splat", x, y, cor: "#b91c1c", gotas, // Vermelho tomate escuro
        rotacao: Math.floor(Math.random() * 360), escala: Math.random() * 0.4 + 0.9
      }]);

    } else if (ferramenta === "tiro") {
      setInteracoes([...interacoes, {
        id, tipo: "tiro", x, y,
        rotacao: Math.floor(Math.random() * 360), escala: Math.random() * 0.5 + 0.8
      }]);

    } else if (ferramenta === "fogo") {
      setInteracoes([...interacoes, {
        id, tipo: "fogo", x, y,
        rotacao: Math.floor(Math.random() * 360), escala: Math.random() * 0.5 + 1
      }]);
    }
  };

  const mudarFilme = (filme) => {
    setFilmeAtivo(filme);
    setInteracoes([]);
  };

  if (carregando) return <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center font-black uppercase tracking-widest text-xs">Abrindo a Lixeira...</main>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden font-sans relative selection:bg-green-500 selection:text-black">
      <Navbar />

      <style>{`
        /* 🎨 ANIMAÇÕES DE SPLAT (TINTA E TOMATE) */
        @keyframes splashMain {
          0% { transform: scale(0) rotate(var(--rot)); opacity: 0; }
          50% { transform: scale(1.3) rotate(var(--rot)); opacity: 1; filter: drop-shadow(0 0 10px var(--glow)); }
          100% { transform: scale(1) rotate(var(--rot)); opacity: 0.9; filter: drop-shadow(0 0 0px transparent); }
        }
        @keyframes dropFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
        .splat-main { animation: splashMain 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .splat-drop { animation: dropFly 0.5s ease-out forwards; border-radius: 50%; position: absolute; }

        /* ✂️ FÍSICA DA TESOURA (RASGO) */
        @keyframes slashAnim {
          0% { width: 0; opacity: 1; filter: drop-shadow(0 0 10px #fff); }
          100% { width: var(--slash-len); opacity: 0.9; filter: drop-shadow(0 0 0 transparent); }
        }
        .slash-mark {
          position: absolute; height: 8px; background: #050505;
          border-top: 1px solid rgba(255,255,255,0.4); border-bottom: 2px solid rgba(0,0,0,0.9);
          box-shadow: inset 0 3px 5px rgba(0,0,0,1);
          transform-origin: left center; border-radius: 10px 0 0 10px;
          animation: slashAnim 0.15s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        /* 🔫 BURACO DE BALA */
        @keyframes bulletHit {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(var(--scale)) rotate(var(--rot)); opacity: 0.9; }
        }
        .bullet-hole {
          position: absolute; width: 60px; height: 60px; margin-top: -30px; margin-left: -30px;
          animation: bulletHit 0.1s ease-out forwards;
        }

        /* 🔥 FOGO E QUEIMADO */
        @keyframes burnHit {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(var(--scale)); opacity: 0.9; }
        }
        @keyframes flameRise {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-60px) scale(1.5); opacity: 0; }
        }
        .scorch-mark {
          position: absolute; width: 100px; height: 100px; margin-top: -50px; margin-left: -50px;
          background: radial-gradient(circle, #000 20%, rgba(0,0,0,0.8) 50%, transparent 70%);
          animation: burnHit 0.2s ease-out forwards; mix-blend-multiply;
        }
        .flame-particle {
          position: absolute; font-size: 30px; margin-top: -15px; margin-left: -15px;
          animation: flameRise 1s ease-in infinite;
        }

        /* 💥 TREMOR NA TELA */
        @keyframes shakePoster {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          20% { transform: translate(-3px, 0px) rotate(2deg); }
          40% { transform: translate(2px, -2px) rotate(-1deg); }
          60% { transform: translate(-3px, 2px) rotate(1deg); }
          80% { transform: translate(1px, -1px) rotate(-1deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        .shake-active { animation: shakePoster 0.2s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      {/* HEADER TÓXICO */}
      <div className="pt-32 sm:pt-40 pb-8 text-center relative z-20">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full mb-4">
          <span className="text-xl animate-bounce">🗑️</span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">Hall da Vergonha</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter mb-2 text-gray-200">
          O Lixão da <span className="text-green-500 line-through decoration-red-600 decoration-4">Galera</span>
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm font-medium max-w-lg mx-auto">
          Estes são os piores filmes do nosso acervo. Sinta-se livre para fatiar, atirar, queimar e destruir esse poster.
        </p>
      </div>

      {filmesLixo.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <span className="text-6xl block mb-4">✨</span>
          <p className="font-black uppercase tracking-widest text-xs">Milagre! Não há filmes ruins no acervo.</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center mb-16">
            
            {/* O POSTER INTERATIVO (O PALCO DA BAGUNÇA) */}
            <div className="relative w-full max-w-[280px] sm:max-w-sm shrink-0 flex flex-col items-center">
              
              <div 
                className={`relative w-full aspect-[2/3] bg-[#0a0a0a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 cursor-crosshair overflow-hidden transition-colors duration-300 select-none ${ferramenta === 'tomate' ? 'border-red-900/50 hover:border-red-600' : ferramenta === 'tinta' ? 'border-blue-900/50 hover:border-blue-600' : ferramenta === 'tiro' ? 'border-gray-600 hover:border-white' : ferramenta === 'fogo' ? 'border-orange-600 hover:border-yellow-400' : 'border-yellow-900/50 hover:border-yellow-600'} ${shaking ? 'shake-active' : ''}`}
                onClick={handlePosterClick}
              >
                {filmeAtivo?.capa ? (
                  <>
                    <img src={filmeAtivo.capa} alt="Poster" className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" draggable="false" />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 via-transparent to-transparent pointer-events-none mix-blend-multiply"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">Sem Capa</div>
                )}

                {/* 💥 RENDERIZA AS INTERAÇÕES */}
                {interacoes.map(item => (
                  <div key={item.id} className="absolute pointer-events-none" style={{ left: item.x, top: item.y }}>
                    
                    {/* RENDERIZAR TINTA E TOMATE (SPLAT) */}
                    {(item.tipo === "tinta" || item.tipo === "tomate_splat") && (
                      <div className="relative z-10" style={{ '--rot': `${item.rotacao}deg`, '--glow': item.cor }}>
                        <svg width="120" height="120" viewBox="0 0 200 200" fill={item.cor} className={`splat-main opacity-90 -ml-[60px] -mt-[60px] ${item.tipo === 'tomate_splat' ? 'mix-blend-normal' : 'mix-blend-hard-light'}`}>
                          {item.tipo === "tomate_splat" ? (
                            // Shape mais "grosso" pro tomate amassado com sementinhas amarelas fake
                            <>
                              <path d="M 100 10 C 130 5 180 30 190 70 C 200 110 170 170 120 190 C 70 210 10 170 10 110 C 10 50 70 15 100 10 Z" />
                              <circle cx="80" cy="80" r="5" fill="#facc15" opacity="0.6"/>
                              <circle cx="120" cy="110" r="4" fill="#facc15" opacity="0.6"/>
                              <circle cx="90" cy="140" r="6" fill="#facc15" opacity="0.6"/>
                            </>
                          ) : (
                            // Shape espirrado pra tinta
                            <>
                              <path d="M 87.5 13 C 111 6 150 18 163.5 41 C 177 64 163 103 151.5 125 C 140 147 131 152 110 162.5 C 89 173 56 189 36 172.5 C 16 156 9 107 14 84 C 19 61 52 27 87.5 13 Z" />
                              <circle cx="40" cy="40" r="25" />
                              <circle cx="170" cy="110" r="18" />
                              <circle cx="110" cy="180" r="20" />
                            </>
                          )}
                        </svg>
                        {/* Gotas voando */}
                        {item.gotas.map((gota, i) => (
                          <div 
                            key={i} className="splat-drop" 
                            style={{ 
                              '--dx': `${gota.dx}px`, '--dy': `${gota.dy}px`, 
                              width: gota.size, height: gota.size, 
                              backgroundColor: item.cor,
                              left: -gota.size/2, top: -gota.size/2 
                            }}
                          ></div>
                        ))}
                      </div>
                    )}

                    {/* RENDERIZAR CORTE DA TESOURA */}
                    {item.tipo === "corte" && (
                      <div 
                        className="slash-mark z-20"
                        style={{ '--slash-len': `${item.comprimento}px`, transform: `rotate(${item.rotacao}deg) translateY(-50%)` }}
                      ></div>
                    )}

                    {/* RENDERIZAR BURACO DE BALA */}
                    {item.tipo === "tiro" && (
                      <div className="bullet-hole z-10" style={{ '--rot': `${item.rotacao}deg`, '--scale': item.escala }}>
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <circle cx="50" cy="50" r="8" fill="#000" />
                          <circle cx="50" cy="50" r="12" fill="none" stroke="#222" strokeWidth="2" opacity="0.8" />
                          {/* Rachaduras */}
                          <path d="M50 50 L20 10 M50 50 L80 15 M50 50 L90 60 M50 50 L60 90 M50 50 L10 70 M50 50 L30 30 M50 50 L70 70" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                          <path d="M50 50 L30 15 M50 50 L85 40 M50 50 L40 85 M50 50 L15 50" stroke="rgba(0,0,0,0.6)" strokeWidth="2" />
                        </svg>
                      </div>
                    )}

                    {/* RENDERIZAR FOGO E QUEIMADURA */}
                    {item.tipo === "fogo" && (
                      <div className="relative z-10" style={{ '--scale': item.escala }}>
                        <div className="scorch-mark"></div>
                        <div className="flame-particle" style={{ animationDelay: '0s' }}>🔥</div>
                        <div className="flame-particle" style={{ animationDelay: '0.2s', marginLeft: '0px', transform: 'scale(0.8)' }}>🔥</div>
                        <div className="flame-particle" style={{ animationDelay: '0.4s', marginLeft: '-25px', transform: 'scale(1.2)' }}>🔥</div>
                      </div>
                    )}

                  </div>
                ))}
              </div>

              {/* Informação do Filme */}
              <div className="mt-6 text-center w-full">
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter mb-2">{filmeAtivo?.titulo}</h2>
                <div className="flex justify-center gap-2 mb-3">
                  <span className="bg-red-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-white shadow-md">Nota: {filmeAtivo?.notaGeral}</span>
                  <span className="bg-green-900/40 border border-green-500/50 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-green-500 animate-pulse">
                    💩 Selo de Chorume
                  </span>
                </div>
              </div>

              {/* 🏆 MURAL DA CULPA (PARABÉNS AO ENVOLVIDO) */}
              <div className="mt-4 bg-red-900/10 border border-red-500/20 p-4 rounded-3xl w-full shadow-inner relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-24 h-24 bg-red-600/10 blur-2xl rounded-full"></div>
                <p className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-3 text-center">👏 Parabéns ao Envolvido</p>
                <div className="flex items-center gap-3 justify-center">
                  <img 
                    src={filmeAtivo?.sugeridoPor?.foto || "https://via.placeholder.com/150"} 
                    alt="O Culpado" 
                    className="w-12 h-12 rounded-full border-2 border-red-500 object-cover shadow-[0_0_10px_rgba(220,38,38,0.3)]" 
                  />
                  <div className="text-left">
                    <p className="text-sm font-black text-white uppercase italic tracking-tighter leading-none mb-1">
                      {filmeAtivo?.sugeridoPor?.nome || "Desconhecido"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Fez a galera perder <strong className="text-red-400 font-black">{filmeAtivo?.duracao || "120"} minutos</strong> de vida.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* 🛠️ ARMAMENTO (BARRA DE FERRAMENTAS) */}
            <div className="bg-[#111] border border-white/5 p-3 sm:p-5 rounded-full md:rounded-3xl flex flex-row md:flex-col gap-2 sm:gap-4 shadow-2xl shrink-0 w-full md:w-auto justify-center overflow-x-auto hide-scrollbar">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 text-center hidden md:block mb-1">Arsenal</p>
              
              <button onClick={() => setFerramenta("tomate")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'tomate' ? 'bg-red-600/20 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Tomatada!">🍅</button>
              
              <button onClick={() => setFerramenta("tinta")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'tinta' ? 'bg-blue-600/20 border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Balde de Tinta">🪣</button>
              
              <button onClick={() => setFerramenta("rasgar")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'rasgar' ? 'bg-yellow-600/20 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Retalhar">✂️</button>

              <button onClick={() => setFerramenta("tiro")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'tiro' ? 'bg-gray-600/20 border-2 border-gray-400 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Tiro">🔫</button>

              <button onClick={() => setFerramenta("fogo")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'fogo' ? 'bg-orange-600/20 border-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Lança Chamas">🔥</button>

              <div className="w-[1px] h-8 md:w-full md:h-[1px] bg-white/10 self-center shrink-0"></div>

              <button onClick={() => setInteracoes([])} className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-xl sm:text-2xl bg-black/50 border border-white/5 hover:bg-red-600 hover:text-white transition-all text-gray-500" title="Limpar Bagunça">🧹</button>
            </div>
          </div>

          {/* 🔄 CARROSSEL DA VERGONHA */}
          <div className="border-t border-white/5 pt-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> O Acervo do Lixo
            </h3>

            <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-8 hide-scrollbar">
              {filmesLixo.map(filme => (
                <div 
                  key={filme.id} 
                  onClick={() => mudarFilme(filme)}
                  className={`w-28 sm:w-36 shrink-0 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all border-2 relative group ${filmeAtivo?.id === filme.id ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105' : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/30'}`}
                >
                  <img src={filme.capa} className="w-full h-full object-cover" alt={filme.titulo} draggable="false" />
                  
                  {/* Coroa de Lixo 💩 */}
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-[10px] p-1.5 rounded-full border border-green-500/30 shadow-lg group-hover:scale-125 transition-transform">
                    💩
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                  <div className="absolute bottom-0 w-full p-3 text-center">
                    <span className="text-white font-black text-[10px] leading-tight drop-shadow-md bg-red-600 px-2 py-0.5 rounded-md">
                      Nota {filme.notaGeral}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </main>
  );
}