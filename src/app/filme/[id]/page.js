/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AreaVotacao from "@/components/AreaVotacao";
import AreaUpvote from "@/components/AreaUpvote";
import BotaoAdmin from "@/components/BotaoAdmin"; 
import AreaComentarios from "@/components/AreaComentarios"; 
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// 🪄 CHAMADA DA API DO TMDB
async function getTMDBData(tmdbId, titulo) {
  const API_KEY = "5e0b606e87348f0592b761526df56825"; 
  try {
    let id = tmdbId;
    if (!id) {
      const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`);
      const searchData = await searchRes.json();
      if (!searchData.results || searchData.results.length === 0) return null;
      id = searchData.results[0].id;
    }

    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,watch/providers,reviews,images&include_image_language=en,null,pt`);
    const data = await res.json();

    return { 
      details: data, 
      cast: data.credits?.cast || [],
      providers: data['watch/providers']?.results?.BR || null,
      reviews: data.reviews?.results || [],
      images: data.images?.backdrops || []
    };
  } catch (error) { return null; }
}

function obterVeredito(notaGeral) {
  if (notaGeral === 0) return { texto: "Sem nota", cor: "text-gray-500 border-gray-500", glow: "shadow-none", emoji: "😶", anim: "" };
  if (notaGeral <= 5) return { texto: "Ruim", cor: "text-red-500 border-red-500", glow: "shadow-red-900/40", emoji: "💩", anim: "anim-poop" };
  if (notaGeral <= 8) return { texto: "Muito Bom", cor: "text-blue-400 border-blue-400", glow: "shadow-blue-500/20", emoji: "👍", anim: "anim-pop" };
  return { texto: "Obra Prima", cor: "text-yellow-400 border-yellow-400", glow: "shadow-yellow-500/20", emoji: "🏆", anim: "anim-trophy" };
}

const formataDolar = (valor) => {
  if (!valor || valor === 0) return "---";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(valor);
};

export default function FilmePage({ params }) {
  const [filme, setFilme] = useState(null);
  const [tmdbData, setTmdbData] = useState(null);
  const [carregando, setCarregando] = useState(true);
  
  const galeriaRef = useRef(null);

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
          const tmdb = await getTMDBData(dadosFilme.tmdbId, dadosFilme.titulo);
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

  const rolarGaleria = (direcao) => {
    if (galeriaRef.current) {
      const scrollAmount = direcao === 'esq' ? -300 : 300;
      galeriaRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (carregando) return <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-black uppercase tracking-widest italic">Acessando Dossiê...</main>;
  if (!filme) return <main className="min-h-screen bg-[#0a0a0a] text-white p-8 text-center uppercase font-black">Filme não encontrado.</main>;

  const veredito = obterVeredito(filme.notaGeral || 0);
  const isSugestao = filme.status === "sugerido";

  const autorRaw = filme.usuarioNome || filme.sugeridoPor || filme.autor;
  const nomeIndicador = typeof autorRaw === 'object' && autorRaw !== null ? (autorRaw.nome || autorRaw.displayName || "Desconhecido") : autorRaw;
  const fotoIndicador = typeof autorRaw === 'object' && autorRaw !== null ? (autorRaw.foto || autorRaw.photoURL || autorRaw.usuarioFoto) : null;

  const provedoresUnicos = [];
  if (tmdbData?.providers) {
    const todosProvedores = [
      ...(tmdbData.providers.flatrate || []), 
      ...(tmdbData.providers.rent || []), 
      ...(tmdbData.providers.buy || [])
    ];
    const mapa = new Map();
    for (const p of todosProvedores) {
      if (!mapa.has(p.provider_id)) {
        mapa.set(p.provider_id, true);
        provedoresUnicos.push(p);
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden relative font-sans">
      
      <style>{`
        @keyframes swingTrophy { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } }
        @keyframes vibratePoop { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-2px, 2px); } 50% { transform: translate(2px, -2px); } 75% { transform: translate(-2px, -2px); } }
        .anim-trophy { animation: swingTrophy 2.5s ease-in-out infinite; transform-origin: bottom center; display: inline-block; filter: drop-shadow(0 0 8px rgba(250, 204, 21, 0.6)); }
        .anim-poop { animation: vibratePoop 0.4s linear infinite; display: inline-block; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Navbar />

      {/* BACKGROUND DA CAPA BORRADA (Isolado no fundo) */}
      <div className="absolute top-0 left-0 w-full h-[60vh] sm:h-[80vh] z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110" style={{ backgroundImage: `url(${filme.capa})` }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
      </div>

      {/* CONTEÚDO PRINCIPAL (Tudo no mesmo fluxo natural, sem buracos!) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-36 flex flex-col gap-6 sm:gap-10">
        
        {/* O TRAILER */}
        <div className="w-full bg-black rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 aspect-video relative">
          <iframe className="w-full h-full absolute inset-0" src={`https://www.youtube.com/embed/${filme.trailerKey}?autoplay=0&controls=1&rel=0&modestbranding=1`} allowFullScreen></iframe>
        </div>

        {/* TÍTULO E INFORMAÇÕES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          
          <div className="lg:col-span-8 space-y-6 sm:space-y-10">
            <header>
              {tmdbData?.details?.tagline && (
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] mb-2">"{tmdbData.details.tagline}"</p>
              )}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter mb-4 uppercase italic leading-none text-white">{filme.titulo}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                {filme.generos?.map((g) => <span key={g} className="bg-white/5 border border-white/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-300">{g}</span>)}
                <span className="bg-red-600 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-md">{filme.dataLancamento?.substring(0,4)}</span>
                
                {nomeIndicador && (
                  <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
                    {fotoIndicador ? <img src={fotoIndicador} alt={nomeIndicador} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-blue-400/50" /> : <span className="text-[10px]">👤</span>}
                    INDICADO POR: {nomeIndicador}
                  </span>
                )}
              </div>
            </header>

            {provedoresUnicos.length > 0 && (
              <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl">
                <h2 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-green-600"></span> Onde Assistir (Brasil)
                </h2>
                <div className="flex flex-wrap gap-3">
                  {provedoresUnicos.map((prov) => (
                    <div key={prov.provider_id} className="group relative cursor-help">
                      <img src={`https://image.tmdb.org/t/p/w92${prov.logo_path}`} alt={prov.provider_name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/10 shadow-lg group-hover:scale-110 transition-transform object-cover" />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                        {prov.provider_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl">
              <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-red-600"></span> Sinopse
              </h2>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed font-light italic">{filme.sinopse}</p>
            </div>

            {/* 🖼️ GALERIA COM SETAS FIXAS E VISÍVEIS NO MOBILE */}
            {tmdbData?.images?.length > 0 && (
              <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-purple-600"></span> Galeria de Cenas
                </h2>
                
                <div className="relative group/galeria">
                  {/* Seta Esquerda */}
                  <button 
                    onClick={() => rolarGaleria('esq')} 
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/80 text-white w-10 h-10 flex items-center justify-center rounded-full z-20 opacity-100 sm:opacity-0 sm:group-hover/galeria:opacity-100 transition-opacity border border-white/20 hover:bg-red-600 hover:border-red-500 shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  {/* Carrossel */}
                  <div ref={galeriaRef} className="flex overflow-x-auto gap-4 hide-scrollbar snap-x pb-2">
                    {tmdbData.images.slice(0, 10).map((img, idx) => (
                      <img key={idx} src={`https://image.tmdb.org/t/p/w500${img.file_path}`} className="h-36 sm:h-48 shrink-0 rounded-xl object-cover border border-white/10 shadow-lg snap-center hover:brightness-110 transition-all cursor-pointer" alt="Cena do filme" />
                    ))}
                  </div>

                  {/* Seta Direita */}
                  <button 
                    onClick={() => rolarGaleria('dir')} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/80 text-white w-10 h-10 flex items-center justify-center rounded-full z-20 opacity-100 sm:opacity-0 sm:group-hover/galeria:opacity-100 transition-opacity border border-white/20 hover:bg-red-600 hover:border-red-500 shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}

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

            {tmdbData?.reviews?.length > 0 && (
              <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl">
                <h2 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-yellow-600"></span> Crítica Internacional (TMDB)
                </h2>
                <div className="space-y-4">
                  {tmdbData.reviews.slice(0, 3).map((rev) => (
                    <div key={rev.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                      <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-600/20 text-yellow-500 flex items-center justify-center font-black uppercase text-xs border border-yellow-500/30">
                          {rev.author.charAt(0)}
                        </div>
                        <span className="font-black text-sm uppercase text-gray-300">{rev.author}</span>
                        {rev.author_details?.rating && (
                          <span className="ml-auto bg-yellow-500 text-black px-2 py-1 rounded text-[10px] font-black shadow-md">
                            ⭐ {rev.author_details.rating} / 10
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed italic line-clamp-4 hover:line-clamp-none transition-all cursor-ns-resize">
                        "{rev.content}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LADO DIREITO (BARRA LATERAL) */}
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
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase">Idioma Orig.</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-white uppercase">{tmdbData?.details?.original_language || "---"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase">Orçamento</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-green-500 uppercase">{formataDolar(tmdbData?.details?.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase">Bilheteria</span>
                  <span className="text-[9px] sm:text-[10px] font-black text-green-500 uppercase">{formataDolar(tmdbData?.details?.revenue)}</span>
                </div>
              </div>
            </div>

            <BotaoAdmin filmeId={filme.id} isSugestao={isSugestao} dataAssistidoAtual={filme.dataAssistido} />
          </div>
        </div>

        <div className="pt-10 sm:pt-12 border-t border-white/5">
          <AreaComentarios filmeId={filme.id} />
        </div>
      </div>
    </main>
  );
}