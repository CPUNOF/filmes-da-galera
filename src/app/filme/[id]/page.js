/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AreaVotacao from "@/components/AreaVotacao";
import AreaUpvote from "@/components/AreaUpvote";
import BotaoAdmin from "@/components/BotaoAdmin"; 
import AreaComentarios from "@/components/AreaComentarios"; 
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

async function getTMDBData(titulo) {
  const API_KEY = "5e0b606e87348f0592b761526df56825"; 
  try {
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`);
    const searchData = await searchRes.json();
    const movie = searchData.results[0];
    if (!movie) return null;
    const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}&language=pt-BR`);
    const creditsData = await creditsRes.json();
    return { details: movie, cast: creditsData.cast || [] };
  } catch (error) { return null; }
}

function obterVeredito(notaGeral) {
  if (notaGeral === 0) return { texto: "Sem nota", cor: "text-gray-500 border-gray-500", glow: "shadow-none", emoji: "😶", anim: "" };
  if (notaGeral <= 5) return { texto: "Ruim", cor: "text-red-500 border-red-500", glow: "shadow-red-900/40", emoji: "💩", anim: "anim-poop" };
  if (notaGeral <= 8) return { texto: "Muito Bom", cor: "text-blue-400 border-blue-400", glow: "shadow-blue-500/20", emoji: "👍", anim: "anim-pop" };
  return { texto: "Obra Prima", cor: "text-green-400 border-green-400", glow: "shadow-green-500/20", emoji: "🏆", anim: "anim-trophy" };
}

export default function FilmePage({ params }) {
  const [filme, setFilme] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        if (!id) return;
        const filmeRef = doc(db, "filmes", id); 
        const filmeSnap = await getDoc(filmeRef);

        if (filmeSnap.exists()) {
          const dadosFilme = { id: filmeSnap.id, ...filmeSnap.data() };
          setFilme(dadosFilme);
          const tmdb = await getTMDBData(dadosFilme.titulo);
          setTmdbData(tmdb);
        }
      } catch (error) {
        console.error("Erro no carregamento:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, [params]);

  if (carregando) return <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center font-black uppercase tracking-widest italic">Acessando Registro...</main>;
  if (!filme) return <main className="min-h-screen bg-[#070707] text-white p-8 text-center uppercase font-black">Filme não encontrado.</main>;

  const veredito = obterVeredito(filme.notaGeral || 0);
  const isSugestao = filme.status === "sugerido";

  // 🪄 CORREÇÃO: VARIÁVEIS DO AUTOR DECLARADAS AQUI, ANTES DO RETURN
  const autorRaw = filme.usuarioNome || filme.sugeridoPor || filme.autor;
  const nomeIndicador = typeof autorRaw === 'object' && autorRaw !== null 
    ? (autorRaw.nome || autorRaw.displayName || "Desconhecido") 
    : autorRaw;
  const fotoIndicador = typeof autorRaw === 'object' && autorRaw !== null 
    ? (autorRaw.foto || autorRaw.photoURL || autorRaw.usuarioFoto) 
    : null;

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 overflow-x-hidden relative font-sans">
      
      <style>{`
        @keyframes swingTrophy {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        @keyframes vibratePoop {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 2px); }
          50% { transform: translate(2px, -2px); }
          75% { transform: translate(-2px, -2px); }
        }
        .anim-trophy { animation: swingTrophy 2.5s ease-in-out infinite; transform-origin: bottom center; display: inline-block; filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }
        .anim-poop { animation: vibratePoop 0.4s linear infinite; display: inline-block; }
      `}</style>

      <div className="relative w-full min-h-[50vh] sm:min-h-[70vh] flex flex-col items-center justify-start overflow-hidden pb-8 sm:pb-0">
        <div className="absolute inset-0 z-0 bg-cover bg-center scale-110 blur-3xl opacity-20" style={{ backgroundImage: `url(${filme.capa})` }}></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]"></div>
        
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col">
          <Navbar />
          
          <div className="w-full flex justify-center mt-28 sm:mt-36 mb-4 sm:mb-12">
            <div className="w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative z-30">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${filme.trailerKey}?autoplay=0&controls=1&rel=0&modestbranding=1`} allowFullScreen></iframe>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-40 mt-2 sm:-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          
          <div className="lg:col-span-8 space-y-6 sm:space-y-10">
            <header>
              <h1 className="text-4xl sm:text-7xl font-black tracking-tighter mb-4 uppercase italic leading-none">{filme.titulo}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                {filme.generos?.map((g) => <span key={g} className="bg-white/5 border border-white/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-300">{g}</span>)}
                <span className="bg-red-600 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-md">{filme.dataLancamento?.substring(0,4)}</span>
                
                {/* NOME E FOTO DO INDICADOR NA PÁGINA */}
                {nomeIndicador && (
                  <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
                    {fotoIndicador ? (
                      <img src={fotoIndicador} alt={nomeIndicador} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-blue-400/50" />
                    ) : (
                      <span className="text-[10px]">👤</span>
                    )}
                    INDICADO POR: {nomeIndicador}
                  </span>
                )}
              </div>
            </header>

            <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl">
              <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-red-600"></span> Sinopse
              </h2>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed font-light italic">{filme.sinopse}</p>
            </div>

            <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl">
              <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-blue-600"></span> Elenco Principal
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 sm:gap-6">
                {tmdbData?.cast?.slice(0, 5).map((ator) => (
                  <Link key={ator.id} href={`/?search=${encodeURIComponent(ator.name)}`} className="text-center group cursor-pointer">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
                      <img src={ator.profile_path ? `https://image.tmdb.org/t/p/w200${ator.profile_path}` : "https://via.placeholder.com/200"} className="w-full h-full object-cover rounded-full border-2 border-transparent group-hover:border-blue-500 transition-all grayscale group-hover:grayscale-0 shadow-lg" alt={ator.name} />
                    </div>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase text-white group-hover:text-blue-400 leading-tight">{ator.name}</p>
                    <p className="text-[7px] sm:text-[8px] text-gray-500 uppercase font-bold mt-1">{ator.character}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl relative">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-yellow-500 mb-6 flex items-center gap-2">
                <span className={`text-xl sm:text-2xl ${veredito.anim}`}>{veredito.emoji}</span> 
                Avaliação do Grupo
              </h4>
              
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl sm:text-6xl font-black text-white">{filme.notaGeral || "0"}</span>
                  <span className="text-gray-600 font-bold text-base sm:text-lg">/10</span>
                </div>
                <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border-2 font-black text-[8px] sm:text-[9px] uppercase tracking-widest ${veredito.cor} ${veredito.glow}`}>{veredito.texto}</div>
              </div>

              {tmdbData?.details && (
                <div className="bg-black/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 flex items-center justify-between mb-6 shadow-inner">
                  <div className="flex items-center gap-2">
                    <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" className="h-3" alt="TMDB" />
                    <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Nota Global</span>
                  </div>
                  <span className="font-black text-blue-400 text-sm sm:text-base">{tmdbData.details.vote_average.toFixed(1)}</span>
                </div>
              )}
              
              <div className="pt-5 sm:pt-6 border-t border-white/5">
                {isSugestao ? <AreaUpvote filmeId={filme.id} /> : <AreaVotacao filmeId={filme.id} />}
              </div>
            </div>

            <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl">
              <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-500 mb-4 italic">Dados Técnicos</h4>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase">Popularidade</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-white">{tmdbData?.details?.popularity.toFixed(0) || "---"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase">Idioma</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-white uppercase">{tmdbData?.details?.original_language || "---"}</span>
                </div>
              </div>
            </div>

            <BotaoAdmin filmeId={filme.id} isSugestao={isSugestao} dataAssistidoAtual={filme.dataAssistido} />
          </div>
        </div>

        <div className="mt-16 sm:mt-20 pt-10 sm:pt-12 border-t border-white/5">
          <AreaComentarios filmeId={filme.id} />
        </div>
      </div>
    </main>
  );
}