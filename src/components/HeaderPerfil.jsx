"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import QuadroMedalhas from "./QuadroMedalhas";
import NotificacoesFeed from "./NotificacoesFeed"; 
import HumorDoDia from "./HumorDoDia";

export default function HeaderPerfil({ 
  usuarioPerfil, usuarioLogado, isOwner, dadosGamer, setDadosGamer, 
  statusUsuario, rankingInfo, matchScore, cutucarAmigo,
  filmesComNotas, indicacoes, comentarios, diarioPessoal, upvoted, itensCultura
}) {
  const [editandoCapa, setEditandoCapa] = useState(false);
  const [linkYoutube, setLinkYoutube] = useState("");

  const salvarCapaVideo = async () => {
    if (!linkYoutube) return setEditandoCapa(false); 
    const t = toast.loading("A atualizar cenário...");
    try {
      let videoId = null;
      if (linkYoutube.includes("v=")) videoId = linkYoutube.split("v=")[1].substring(0, 11);
      else if (linkYoutube.includes("youtu.be/")) videoId = linkYoutube.split("youtu.be/")[1].substring(0, 11);
      if (!videoId) throw new Error("Link inválido");
      
      await updateDoc(doc(db, "usuarios", usuarioLogado.email.toLowerCase()), { trailerCapa: videoId });
      setDadosGamer(prev => ({ ...prev, trailerCapa: videoId }));
      toast.dismiss(t); toast.success("Capa atualizada!");
    } catch (error) { 
      toast.dismiss(t); toast.error("Link inválido do YouTube."); 
    } finally { 
      setEditandoCapa(false); setLinkYoutube(""); 
    }
  };

  const entrarNaSessaoJam = () => {
    const jam = dadosGamer.sessaoJam;
    if (!jam || !jam.isPlaying) return;
    
    const segundosPassados = (Date.now() - jam.startTimestamp) / 1000;
    
    window.dispatchEvent(new CustomEvent("playGlobalMusic", { 
      detail: { track: jam.track, offset: segundosPassados } 
    }));
    
    toast.success(`Sincronizado com ${usuarioPerfil.nome}! 🎧`, { icon: "🔥", style: { background: '#111', color: '#fff' } });
  };

  // Previne erro de undefined
  if (!usuarioPerfil) return null;

  return (
    <div className="relative w-full pt-28 sm:pt-40 pb-8 sm:pb-12 bg-[#111111] border-b border-white/10 z-[60]">
      
      {/* 🪄 BACKGROUND (YOUTUBE OU IMAGEM) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {dadosGamer?.trailerCapa ? (
          <iframe className="absolute w-[300vw] h-[300vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none z-0" src={`https://www.youtube.com/embed/${dadosGamer.trailerCapa}?autoplay=1&mute=1&controls=0&loop=1&playlist=${dadosGamer.trailerCapa}&modestbranding=1`} allow="autoplay; encrypted-media"></iframe>
        ) : (
          <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')" }}></div>
        )}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        
        {/* 🪄 MENU DO DONO DO PERFIL (TOPO DIREITA) */}
        {isOwner && (
          <div className="absolute top-0 right-4 z-50 -mt-10 sm:-mt-6 flex items-center gap-2 sm:gap-3">
            <NotificacoesFeed usuarioLogado={usuarioLogado} />
            {editandoCapa ? (
              <div className="bg-black/80 backdrop-blur-md p-2 sm:p-3 rounded-2xl border border-white/20 shadow-2xl flex gap-2 items-center">
                <input type="text" value={linkYoutube} onChange={e => setLinkYoutube(e.target.value)} placeholder="Link do YouTube..." className="bg-[#141414] text-[10px] sm:text-xs px-3 py-2 rounded-lg text-white outline-none w-[120px] sm:w-[200px]" />
                <button onClick={salvarCapaVideo} className="bg-red-600 text-white text-[9px] font-black px-3 py-2 rounded-lg uppercase shrink-0">Salvar</button>
                <button onClick={() => setEditandoCapa(false)} className="text-gray-400 px-2 shrink-0">✕</button>
              </div>
            ) : (
              <button onClick={() => setEditandoCapa(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all flex items-center gap-2 shadow-lg shrink-0">
                <span className="text-sm">🎨</span> <span className="hidden sm:block">Mudar Fundo</span>
              </button>
            )}
          </div>
        )}

        {/* 🪄 LAYOUT PRINCIPAL RESPONSIVO */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 mt-6 sm:mt-0">
          
          {/* 📸 AVATAR E STATUS */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative">
              <img src={usuarioPerfil.foto} alt="" className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-[#070707] shadow-xl" />
              <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 rounded-full border-4 border-[#070707] ${statusUsuario?.cor || 'bg-gray-500'}`}></div>
            </div>
            <span className="bg-black/60 backdrop-blur-md border border-white/5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400 mt-3 whitespace-nowrap">
              {statusUsuario?.texto || "Status Oculto"}
            </span>
          </div>
          
          {/* 📝 INFORMAÇÕES DO USUÁRIO */}
          <div className="flex-1 w-full flex flex-col items-center sm:items-start text-center sm:text-left mt-2 sm:mt-0">
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase italic tracking-tighter drop-shadow-lg leading-none mb-3">
              {usuarioPerfil.nome}
            </h1>
            
            {/* INFORMAÇÕES EXTRAS: ID, HUMOR E JAM */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-4 w-full">
              <p className="text-gray-400 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1">
                <span className="text-red-500">Membro</span> <span className="hidden sm:inline">•</span> <span className="border border-gray-800 sm:border-none px-2 py-0.5 sm:p-0 rounded">ID: {usuarioPerfil.uid.substring(0,6)}</span>
              </p>
              
              <HumorDoDia humorAtual={dadosGamer?.humorDoDia} isOwner={isOwner} usuarioLogado={usuarioLogado} />
              
              {!isOwner && dadosGamer?.sessaoJam?.isPlaying && (
                <button 
                  onClick={entrarNaSessaoJam} 
                  className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(236,72,153,0.8)] flex items-center justify-center gap-2 transition-all animate-pulse"
                >
                  <span className="text-sm">🎧</span> Ouvir Junto
                </button>
              )}
            </div>
            
            {/* 🏆 RANKING BADGES */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 w-full mb-2">
              {rankingInfo?.pontos > 0 ? (
                <>
                  <div className="bg-red-600/20 border border-red-600/30 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-red-500">🏆 {rankingInfo.posicao}º Maior Crítico</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">⭐ {rankingInfo.pontos} Pts Atividade</span>
                  </div>
                </>
              ) : (
                <div className="bg-gray-800/30 px-3 py-1.5 rounded-full">
                  <span className="text-[9px] font-black uppercase text-gray-500">0 Pts - Sem Atividade</span>
                </div>
              )}
            </div>

            {/* 🪄 PAINEL DO VISITANTE: MATCH & CUTUCADA */}
            {!isOwner && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-4 w-full">
                
                {/* MATCH CULTURAL */}
                {matchScore !== null && (
                  <div className="bg-pink-950/30 border border-pink-500/40 text-pink-400 px-4 py-2 rounded-xl flex items-center gap-2 sm:gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse drop-shadow-md shrink-0"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <div className="flex flex-col text-left">
                      <span className="text-[7px] sm:text-[8px] text-pink-500/80 leading-none mb-0.5">Compatibilidade</span>
                      <span className="text-sm sm:text-base leading-none">{matchScore}% Match</span>
                    </div>
                  </div>
                )}

                {/* BOTÃO CUTUCAR */}
                {usuarioLogado && (
                  <button 
                    onClick={cutucarAmigo}
                    className="group bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 sm:gap-3 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:-translate-y-1"
                  >
                    <span className="text-xl sm:text-2xl leading-none group-hover:animate-bounce shrink-0">👉</span> 
                    <div className="flex flex-col text-left">
                      <span className="text-[7px] sm:text-[8px] text-orange-200 leading-none mb-0.5">Enviar Terremoto</span>
                      <span className="text-sm sm:text-base leading-none">Dar um Toque</span>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* 🏅 QUADRO DE MEDALHAS (AGORA BEM POSICIONADO) */}
            <div className="mt-6 sm:mt-8 w-full flex justify-center sm:justify-start">
              <QuadroMedalhas 
                filmesComNotas={filmesComNotas} indicacoes={indicacoes} comentarios={comentarios} 
                diarioPessoal={diarioPessoal} upvoted={upvoted} itensCultura={itensCultura} dadosGamer={dadosGamer}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}