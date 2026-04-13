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

  // 🪄 A FUNÇÃO MÁGICA: Juntar-se ao Dono do Perfil
  const entrarNaSessaoJam = () => {
    const jam = dadosGamer.sessaoJam;
    if (!jam || !jam.isPlaying) return;
    
    // Calcula quantos segundos passaram desde que o dono deu Play
    const segundosPassados = (Date.now() - jam.startTimestamp) / 1000;
    
    // Dispara o Player Global com a música e o tempo exato
    window.dispatchEvent(new CustomEvent("playGlobalMusic", { 
      detail: { track: jam.track, offset: segundosPassados } 
    }));
    
    toast.success(`Sincronizado com ${usuarioPerfil.nome}! 🎧`, { icon: "🔥" });
  };

  return (
    <div className="relative w-full pt-32 sm:pt-40 pb-10 bg-[#111111] border-b border-white/10 min-h-[350px] z-[60]">
      
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {dadosGamer.trailerCapa ? (
          <iframe className="absolute w-[300vw] h-[300vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none z-0" src={`https://www.youtube.com/embed/${dadosGamer.trailerCapa}?autoplay=1&mute=1&controls=0&loop=1&playlist=${dadosGamer.trailerCapa}&modestbranding=1`} allow="autoplay; encrypted-media"></iframe>
        ) : <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')" }}></div>}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        
        {isOwner && (
          <div className="absolute top-0 right-4 z-50 -mt-12 sm:-mt-6 flex items-center gap-2 sm:gap-3">
            <NotificacoesFeed usuarioLogado={usuarioLogado} />
            {editandoCapa ? (
              <div className="bg-black/80 backdrop-blur-md p-2 sm:p-3 rounded-2xl border border-white/20 shadow-2xl flex gap-2 items-center">
                <input type="text" value={linkYoutube} onChange={e => setLinkYoutube(e.target.value)} placeholder="Link do YouTube..." className="bg-[#141414] text-xs px-3 py-2 rounded-lg text-white outline-none w-[120px] sm:w-[200px]" />
                <button onClick={salvarCapaVideo} className="bg-red-600 text-white text-[9px] font-black px-3 py-2 rounded-lg uppercase shrink-0">Salvar</button>
                <button onClick={() => setEditandoCapa(false)} className="text-gray-400 px-2 shrink-0">✕</button>
              </div>
            ) : (
              <button onClick={() => setEditandoCapa(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 sm:py-2.5 rounded-full transition-all flex items-center gap-2 shadow-lg h-9 sm:h-10 shrink-0">
                <span className="text-sm">🎨</span> <span className="hidden sm:block">Mudar Fundo</span>
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-8 mt-6 sm:mt-0">
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative">
              <img src={usuarioPerfil.foto} alt="" className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#070707] shadow-xl" />
              <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#070707] ${statusUsuario.cor}`}></div>
            </div>
            <span className="bg-black/60 backdrop-blur-md border border-white/5 px-3 py-1 rounded-full text-[8px] font-black uppercase text-gray-400 mt-3">{statusUsuario.texto}</span>
          </div>
          
          <div className="text-center sm:text-left flex-1 w-full">
            <h1 className="text-3xl sm:text-6xl font-black uppercase italic tracking-tighter mb-1 drop-shadow-lg">{usuarioPerfil.nome}</h1>
            
            <div className="flex flex-col sm:flex-row sm:items-center mb-3 gap-2 sm:gap-3">
              <p className="text-gray-400 text-[10px] sm:text-sm font-black uppercase tracking-widest">
                <span className="text-red-500">Membro da Galera</span> • ID: {usuarioPerfil.uid.substring(0,6)}
              </p>
              <HumorDoDia humorAtual={dadosGamer.humorDoDia} isOwner={isOwner} usuarioLogado={usuarioLogado} />
              
              {/* 🪄 BOTÃO MÁGICO: APARECE SE O DONO ESTIVER A OUVIR ALGO */}
              {!isOwner && dadosGamer.sessaoJam?.isPlaying && (
                <button 
                  onClick={entrarNaSessaoJam} 
                  className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(236,72,153,0.8)] flex items-center justify-center gap-2 transition-all animate-pulse ml-0 sm:ml-2"
                >
                  <span className="text-sm">🎧</span> Ouvir Junto
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              {rankingInfo.pontos > 0 ? (
                <><div className="bg-red-600/20 border border-red-600/30 px-3 py-1.5 rounded-full flex gap-1.5"><span className="text-[10px] font-black uppercase text-red-500">🏆 {rankingInfo.posicao}º Maior Crítico</span></div>
                <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex gap-1.5"><span className="text-[10px] font-black uppercase text-gray-400">⭐ {rankingInfo.pontos} Pts Atividade</span></div></>
              ) : <div className="bg-gray-800/30 px-3 py-1.5 rounded-full"><span className="text-[9px] font-black uppercase text-gray-500">0 Pts - Sem Atividade</span></div>}
            </div>

            <QuadroMedalhas 
              filmesComNotas={filmesComNotas} indicacoes={indicacoes} comentarios={comentarios} 
              diarioPessoal={diarioPessoal} upvoted={upvoted} itensCultura={itensCultura} dadosGamer={dadosGamer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}