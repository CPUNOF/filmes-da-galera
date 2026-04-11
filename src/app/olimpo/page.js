/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function OlimpoPage() {
  const [filmesOlimpo, setFilmesOlimpo] = useState([]);
  const [filmeAtivo, setFilmeAtivo] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // 🪄 ESTADOS DAS FERRAMENTAS E FÍSICA
  const [ferramenta, setFerramenta] = useState("rosa"); // 'rosa', 'estrela', 'oscar', 'brinde'
  const [interacoes, setInteracoes] = useState([]); 
  const [celebrando, setCelebrando] = useState(false); 

  useEffect(() => {
    async function carregarOlimpo() {
      try {
        const snapFilmes = await getDocs(collection(db, "filmes"));
        const todosFilmes = [];
        
        snapFilmes.forEach(doc => {
          const data = doc.data();
          // 🏆 REGRA: Só entra no Olimpo se foi assistido e a nota for 8.0 ou MAIOR!
          if (data.status === "assistido" && Number(data.notaGeral) >= 8.0) {
            todosFilmes.push({ id: doc.id, ...data });
          }
        });

        // Ordena do melhor (maior nota) para o "menos melhor"
        todosFilmes.sort((a, b) => Number(b.notaGeral) - Number(a.notaGeral));
        
        setFilmesOlimpo(todosFilmes);
        if (todosFilmes.length > 0) {
          setFilmeAtivo(todosFilmes[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar olimpo:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarOlimpo();
  }, []);

  // 🪄 MOTOR DE FÍSICA DAS GLÓRIAS
  const handlePosterClick = (e) => {
    if (!filmeAtivo) return;

    setCelebrando(true);
    setTimeout(() => setCelebrando(false), 300);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = Date.now() + Math.random();

    if (ferramenta === "rosa") {
      setInteracoes([...interacoes, {
        id, tipo: "rosa", x, y,
        rotacao: Math.floor(Math.random() * 360),
        escala: Math.random() * 0.4 + 1
      }]);
    } else if (ferramenta === "estrela") {
      setInteracoes([...interacoes, {
        id, tipo: "estrela", x, y,
        rotacao: Math.floor(Math.random() * 90) - 45,
        escala: Math.random() * 0.5 + 1
      }]);
    } else if (ferramenta === "oscar") {
      setInteracoes([...interacoes, {
        id, tipo: "oscar", x, y,
        rotacao: 0,
        escala: 1.5
      }]);
    } else if (ferramenta === "brinde") {
      setInteracoes([...interacoes, {
        id, tipo: "brinde", x, y,
        rotacao: Math.floor(Math.random() * 30) - 15,
        escala: 1.2
      }]);
    }
  };

  const mudarFilme = (filme) => {
    setFilmeAtivo(filme);
    setInteracoes([]);
  };

  if (carregando) return <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center font-black uppercase tracking-widest text-xs">Estendendo o Tapete Vermelho...</main>;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden font-sans relative selection:bg-yellow-500 selection:text-black">
      <Navbar />

      <style>{`
        /* ✨ EFEITO DE CARTA DO FIFA (HOLOFOTE PASSANDO) */
        @keyframes spotlightSweep {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        .glare-effect::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 50%; height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,215,0,0.3) 50%, rgba(255,255,255,0) 100%);
          animation: spotlightSweep 3s infinite ease-in-out;
          pointer-events: none;
          z-index: 10;
        }

        /* 🌹 FÍSICA DA ROSA (CAI E GIRA) */
        @keyframes dropRosa {
          0% { transform: translateY(-100px) rotate(var(--rot)) scale(var(--scale)); opacity: 0; filter: drop-shadow(0 20px 10px rgba(0,0,0,0.5)); }
          100% { transform: translateY(0) rotate(calc(var(--rot) + 45deg)) scale(var(--scale)); opacity: 1; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.8)); }
        }
        .rosa-item { animation: dropRosa 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; font-size: 3rem; }

        /* ⭐ FÍSICA DA ESTRELA (POP E BRILHO DOURADO) */
        @keyframes starPop {
          0% { transform: scale(0) rotate(var(--rot)); opacity: 0; }
          60% { transform: scale(calc(var(--scale) * 1.5)) rotate(calc(var(--rot) + 20deg)); opacity: 1; filter: drop-shadow(0 0 30px rgba(250, 204, 21, 1)); }
          100% { transform: scale(var(--scale)) rotate(var(--rot)); opacity: 1; filter: drop-shadow(0 0 15px rgba(250, 204, 21, 0.8)); }
        }
        .estrela-item { animation: starPop 0.4s ease-out forwards; font-size: 3rem; }

        /* 🏆 FÍSICA DO OSCAR (DESCE MAJESTOSO) */
        @keyframes oscarDrop {
          0% { transform: translateY(-50px) scale(3); opacity: 0; filter: blur(5px); }
          100% { transform: translateY(0) scale(var(--scale)); opacity: 1; filter: drop-shadow(0 0 40px rgba(255, 215, 0, 1)); }
        }
        .oscar-item { animation: oscarDrop 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; font-size: 4rem; }

        /* 🥂 FÍSICA DO BRINDE */
        @keyframes brindePop {
          0% { transform: scale(0.5) rotate(-20deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(10deg); opacity: 1; filter: drop-shadow(0 0 20px rgba(255,255,255,0.8)); }
          100% { transform: scale(1) rotate(var(--rot)); opacity: 1; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5)); }
        }
        .brinde-item { animation: brindePop 0.4s ease-out forwards; font-size: 3rem; }

        /* 💖 PULSO DE GLÓRIA NO POSTER */
        @keyframes pulseGlory {
          0% { transform: scale(1); box-shadow: 0 0 30px rgba(234, 179, 8, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 60px rgba(234, 179, 8, 0.8); }
          100% { transform: scale(1); box-shadow: 0 0 30px rgba(234, 179, 8, 0.4); }
        }
        .celebrating { animation: pulseGlory 0.3s ease-out; }
      `}</style>

      {/* BACKGROUND PREMIUM */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-[#0a0a0a] to-[#0a0a0a] pointer-events-none"></div>

      {/* HEADER LUXUOSO */}
      <div className="pt-32 sm:pt-40 pb-8 text-center relative z-20">
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-full mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
          <span className="text-xl animate-pulse">✨</span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500">Tapete Vermelho</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black uppercase italic tracking-tighter mb-2 text-white drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]">
          O Olimpo da <span className="text-yellow-500">Galera</span>
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm font-medium max-w-lg mx-auto">
          A elite do nosso acervo. Os filmes que nos fizeram chorar, rir e aplaudir de pé. Jogue suas flores para as obras-primas.
        </p>
      </div>

      {filmesOlimpo.length === 0 ? (
        <div className="text-center py-20 opacity-50 relative z-10">
          <span className="text-6xl block mb-4">🌪️</span>
          <p className="font-black uppercase tracking-widest text-xs">O Olimpo está vazio. Nenhuma obra-prima encontrada (Média 8.0+).</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center mb-16">
            
            {/* O POSTER INTERATIVO (O PALCO DA GLÓRIA) */}
            <div className="relative w-full max-w-[280px] sm:max-w-sm shrink-0 flex flex-col items-center">
              
              <div 
                className={`relative w-full aspect-[2/3] bg-[#0a0a0a] rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] border-[3px] cursor-crosshair overflow-hidden transition-all duration-300 select-none glare-effect ${ferramenta === 'rosa' ? 'border-pink-500/80 hover:border-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.4)]' : ferramenta === 'estrela' ? 'border-yellow-400 hover:border-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.4)]' : ferramenta === 'oscar' ? 'border-amber-600 hover:border-amber-400 shadow-[0_0_30px_rgba(217,119,6,0.4)]' : 'border-indigo-400 hover:border-indigo-300 shadow-[0_0_30px_rgba(129,140,248,0.4)]'} ${celebrando ? 'celebrating' : ''}`}
                onClick={handlePosterClick}
              >
                {filmeAtivo?.capa ? (
                  <>
                    <img src={filmeAtivo.capa} alt="Poster" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable="false" />
                    {/* Filtro levemente dourado no poster */}
                    <div className="absolute inset-0 bg-yellow-900/10 pointer-events-none mix-blend-overlay"></div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">Sem Capa</div>
                )}

                {/* ✨ RENDERIZA AS INTERAÇÕES (ROSAS, ESTRELAS, OSCARS) */}
                {interacoes.map(item => (
                  <div key={item.id} className="absolute pointer-events-none" style={{ left: item.x, top: item.y }}>
                    
                    {item.tipo === "rosa" && (
                      <div className="rosa-item -ml-[24px] -mt-[24px]" style={{ '--rot': `${item.rotacao}deg`, '--scale': item.escala }}>💐</div>
                    )}
                    {item.tipo === "estrela" && (
                      <div className="estrela-item -ml-[24px] -mt-[24px]" style={{ '--rot': `${item.rotacao}deg`, '--scale': item.escala }}>⭐</div>
                    )}
                    {item.tipo === "oscar" && (
                      <div className="oscar-item -ml-[32px] -mt-[32px]" style={{ '--scale': item.escala }}>🏆</div>
                    )}
                    {item.tipo === "brinde" && (
                      <div className="brinde-item -ml-[24px] -mt-[24px]" style={{ '--rot': `${item.rotacao}deg` }}>🥂</div>
                    )}

                  </div>
                ))}
              </div>

              {/* Informação do Filme */}
              <div className="mt-6 text-center w-full">
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600">
                  {filmeAtivo?.titulo}
                </h2>
                <div className="flex justify-center gap-2 mb-3">
                  <span className="bg-yellow-500 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]">Nota: {filmeAtivo?.notaGeral}</span>
                  <span className="bg-yellow-900/40 border border-yellow-500/50 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-yellow-400 animate-pulse flex items-center gap-1">
                    ✨ Obra-Prima
                  </span>
                </div>
              </div>

              {/* 🦸‍♂️ MURAL DOS HERÓIS (PARABÉNS AO ENVOLVIDO) */}
              <div className="mt-4 bg-yellow-900/10 border border-yellow-500/30 p-4 rounded-3xl w-full shadow-inner relative overflow-hidden">
                <div className="absolute -left-10 -top-10 w-24 h-24 bg-yellow-500/20 blur-2xl rounded-full"></div>
                <p className="text-[9px] font-black uppercase tracking-widest text-yellow-500 mb-3 text-center">🌟 O Herói da Sessão</p>
                <div className="flex items-center gap-3 justify-center">
                  <img 
                    src={filmeAtivo?.sugeridoPor?.foto || "https://via.placeholder.com/150"} 
                    alt="O Herói" 
                    className="w-12 h-12 rounded-full border-2 border-yellow-500 object-cover shadow-[0_0_15px_rgba(234,179,8,0.5)]" 
                  />
                  <div className="text-left">
                    <p className="text-sm font-black text-white uppercase italic tracking-tighter leading-none mb-1">
                      {filmeAtivo?.sugeridoPor?.nome || "Desconhecido"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Elevou o nível cultural de <strong className="text-yellow-400 font-black">todo o grupo</strong>.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* 🛠️ ARMAMENTO DE GLÓRIA (BARRA DE FERRAMENTAS) */}
            <div className="bg-[#111] border border-white/5 p-3 sm:p-5 rounded-full md:rounded-3xl flex flex-row md:flex-col gap-2 sm:gap-4 shadow-2xl shrink-0 w-full md:w-auto justify-center overflow-x-auto hide-scrollbar relative z-30">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 text-center hidden md:block mb-1">Homenagens</p>
              
              <button onClick={() => setFerramenta("rosa")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'rosa' ? 'bg-pink-600/20 border-2 border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Jogar Rosas">💐</button>
              
              <button onClick={() => setFerramenta("estrela")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'estrela' ? 'bg-yellow-500/20 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Carimbar Estrelas">⭐</button>
              
              <button onClick={() => setFerramenta("oscar")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'oscar' ? 'bg-amber-600/20 border-2 border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Entregar o Oscar">🏆</button>

              <button onClick={() => setFerramenta("brinde")} className={`w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl transition-all ${ferramenta === 'brinde' ? 'bg-indigo-500/20 border-2 border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.4)] scale-110' : 'bg-black/50 border border-white/5 hover:bg-white/5 grayscale hover:grayscale-0'}`} title="Brinde">🥂</button>

              <div className="w-[1px] h-8 md:w-full md:h-[1px] bg-white/10 self-center shrink-0"></div>

              <button onClick={() => setInteracoes([])} className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-full md:rounded-2xl flex items-center justify-center text-xl sm:text-2xl bg-black/50 border border-white/5 hover:text-white transition-all text-gray-500 hover:bg-white/10" title="Limpar Palco">🧹</button>
            </div>
          </div>

          {/* 🔄 CARROSSEL DA GLÓRIA */}
          <div className="border-t border-white/5 pt-10">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(234,179,8,1)]"></span> Outras Obras-Primas
            </h3>

            <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-8 hide-scrollbar">
              {filmesOlimpo.map(filme => (
                <div 
                  key={filme.id} 
                  onClick={() => mudarFilme(filme)}
                  className={`w-28 sm:w-36 shrink-0 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all border-[3px] relative group ${filmeAtivo?.id === filme.id ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105' : 'border-white/5 opacity-60 hover:opacity-100 hover:border-yellow-500/50'}`}
                >
                  <img src={filme.capa} className="w-full h-full object-cover" alt={filme.titulo} draggable="false" />
                  
                  {/* Estrela de Ouro ⭐ */}
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-[10px] p-1.5 rounded-full border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)] group-hover:scale-125 transition-transform">
                    🌟
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                  <div className="absolute bottom-0 w-full p-3 text-center">
                    <span className="text-black font-black text-[10px] leading-tight drop-shadow-md bg-yellow-500 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(234,179,8,0.4)]">
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