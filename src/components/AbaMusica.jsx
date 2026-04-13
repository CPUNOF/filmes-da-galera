"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function AbaMusica({ itens, isOwner, icon }) {
  const [filtro, setFiltro] = useState("todos");
  const [menuAberto, setMenuAberto] = useState(null); 

  const itensFiltrados = itens.filter(item => {
    if (filtro === "todos") return true;
    if (filtro === "tier_s") return item.tier === "S";
    return true;
  });

  const handlePlayTrack = (item) => {
    if (!item.audioUrl) return toast.error("Áudio indisponível.");
    const playEvent = new CustomEvent("playGlobalMusic", { 
      detail: { track: item, offset: 0, queueContext: itensFiltrados } 
    });
    window.dispatchEvent(playEvent);
  };

  const handleAddQueue = (e, item) => {
    e.stopPropagation();
    if (!item.audioUrl) return;
    const queueEvent = new CustomEvent("addGlobalQueue", { detail: { track: item } });
    window.dispatchEvent(queueEvent);
    setMenuAberto(null);
  };

  const handlePlayNext = (e, item) => {
    e.stopPropagation();
    if (!item.audioUrl) return;
    const nextEvent = new CustomEvent("playGlobalNext", { detail: { track: item } });
    window.dispatchEvent(nextEvent);
    setMenuAberto(null);
  };

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter flex items-center gap-2 text-white">
          <span className="text-pink-500 drop-shadow-md">{icon}</span> PLAYLIST GLOBAL
        </h2>
        {isOwner && (
          <button onClick={() => window.abrirGestorCultura('Música')} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all border border-pink-400 shrink-0 w-fit flex items-center gap-1.5">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Adicionar
          </button>
        )}
      </div>

      {itens.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 sm:mb-8 snap-x pb-2">
          <button onClick={() => setFiltro("todos")} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'todos' ? 'bg-white/20 border-white/30 text-white' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>Tudo</button>
          <button onClick={() => setFiltro("tier_s")} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'tier_s' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-black/30 border-white/5 text-gray-500 hover:text-yellow-500'}`}>🏆 Top Músicas (Tier S)</button>
        </div>
      )}

      {itensFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {itensFiltrados.map((item, idx) => (
            <div 
              key={item.id || idx}
              onMouseLeave={() => setMenuAberto(null)}
              // 🪄 O TRUQUE DO Z-INDEX AQUI: Se o menu deste item estiver aberto, ele ganha z-50 para sobrepor os outros!
              className={`bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-full p-2.5 sm:p-3 flex flex-row items-center gap-3 sm:gap-4 group transition-all hover:bg-white/5 relative shadow-lg hover:border-pink-500/30 ${menuAberto === item.id ? 'z-50' : 'z-10'}`}
            >
              <span className="text-gray-600 font-black text-sm sm:text-lg w-4 sm:w-6 text-center shrink-0 ml-2 group-hover:text-pink-500 transition-colors">
                {idx + 1}
              </span>
              
              <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14">
                <img src={item.capa} className="w-full h-full rounded-lg sm:rounded-xl shadow-md object-cover border border-white/10" alt={item.titulo} />
                {item.tier === 'S' && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 text-black rounded-full flex items-center justify-center font-black text-[8px] border-2 border-[#0a0a0a] shadow-lg z-10">S</div>
                )}
                
                <div 
                  onClick={() => handlePlayTrack(item)}
                  className="absolute inset-0 bg-black/60 rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 backdrop-blur-sm"
                >
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-white ml-1 shadow-lg"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>

              <div className="flex flex-col min-w-0 flex-1 justify-center py-1">
                <span className="font-black text-xs sm:text-[13px] text-white uppercase tracking-widest truncate drop-shadow-md">
                  {item.titulo}
                </span>
                <span className="text-[8px] sm:text-[10px] text-pink-500 uppercase font-black tracking-widest truncate mt-0.5">
                  {item.artista}
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0 pr-2 relative z-50">
                
                {/* Botão Menu ⋮ (Modernizado) */}
                <div className="relative">
                  <button 
                    onClick={() => setMenuAberto(menuAberto === item.id ? null : item.id)}
                    className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                  >
                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  </button>

                  {/* 🪄 POP-UP DO MENU MODERNO E SEM EMOJIS */}
                  {menuAberto === item.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col p-1.5 z-[999999] animate-fade-in-up">
                      <button onClick={(e) => handlePlayNext(e, item)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg text-left transition-colors group/btn">
                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 group-hover/btn:text-white"><path d="M8 5v14l11-7z"/></svg>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-300 group-hover/btn:text-white">Tocar a seguir</span>
                      </button>
                      <button onClick={(e) => handleAddQueue(e, item)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg text-left transition-colors group/btn">
                        <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 group-hover/btn:text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8M12 14v6m-3-3h6"/></svg>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-300 group-hover/btn:text-white">Adicionar à fila</span>
                      </button>
                    </div>
                  )}
                </div>

                {isOwner && (
                  <button onClick={() => window.abrirGestorCultura('Música', item)} className="w-8 h-8 flex items-center justify-center bg-transparent hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white">
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 sm:py-20 text-center border border-dashed border-white/10 rounded-2xl sm:rounded-3xl opacity-70 uppercase font-black text-[9px] sm:text-[10px] bg-black/20 backdrop-blur-md">
          {filtro !== "todos" ? "Nenhuma música com este filtro." : "A sua Playlist está vazia."}
        </div>
      )}
    </div>
  );
}