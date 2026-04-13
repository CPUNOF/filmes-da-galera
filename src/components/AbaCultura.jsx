"use client";

import { useState } from "react";
import CustomAudioPlayer from "./CustomAudioPlayer"; 
import CardHolografico from "./CardHolografico"; 

export default function AbaCultura({ itens, categoria, tipo, cor, isOwner, icon }) {
  const [filtro, setFiltro] = useState("todos");

  const itensFiltrados = itens.filter(item => {
    if (filtro === "todos") return true;
    if (filtro === "tier_s") return item.tier === "S";
    if (filtro === "andamento") return Number(item.progresso) < Number(item.total);
    if (filtro === "concluido") return Number(item.progresso) >= Number(item.total);
    return true;
  });

  const getTierColor = (tier) => {
    switch(tier) {
      case 'S': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
      case 'A': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'B': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'C': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'D': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'hidden';
    }
  };

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
          <span className={`text-${cor}-500 drop-shadow-md`}>{icon}</span> {categoria}
        </h2>
        {isOwner && (
          <button onClick={() => window.abrirGestorCultura(tipo)} className={`bg-${cor}-600 hover:bg-${cor}-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(var(--color-${cor}-500),0.5)] transition-all border border-${cor}-400 shrink-0 w-fit`}>
            + Adicionar
          </button>
        )}
      </div>

      {itens.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 sm:mb-8 snap-x pb-2">
          <button onClick={() => setFiltro("todos")} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'todos' ? 'bg-white/20 border-white/30 text-white' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>Tudo</button>
          <button onClick={() => setFiltro("tier_s")} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'tier_s' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-black/30 border-white/5 text-gray-500 hover:text-yellow-500'}`}>🏆 Tier S</button>
          <button onClick={() => setFiltro("andamento")} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'andamento' ? `bg-${cor}-500/20 border-${cor}-500/50 text-${cor}-400` : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>⏳ Andamento</button>
          <button onClick={() => setFiltro("concluido")} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'concluido' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>✅ Concluídos</button>
        </div>
      )}

      {itensFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {itensFiltrados.map((item, idx) => {
            const pct = Math.min(100, Math.round((item.progresso / item.total) * 100)) || 0;
            const isMusica = tipo === 'Música';
            
            return (
              <CardHolografico 
                key={`${item.id}-${idx}`}
                ativo={item.tier === 'S'} 
                className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-3 sm:p-5 flex flex-row gap-3 sm:gap-5 group transition-all hover:bg-black/50 relative shadow-xl hover:border-${cor}-500/50 items-center sm:items-stretch overflow-visible ${isOwner ? 'cursor-pointer hover:-translate-y-1' : ''}`}
              >
                {/* 🪄 O VIDRO MÁGICO DE CLIQUE: Ocupa o cartão todo e abre o modal */}
                {isOwner && (
                  <div 
                    className="absolute inset-0 z-40" 
                    onClick={() => window.abrirGestorCultura(item.tipo, item)}
                    title="Clique para editar"
                  ></div>
                )}

                {/* Imagem */}
                <div className="shrink-0 relative z-10 flex items-center">
                  {isMusica && <span className="text-gray-500/50 font-black text-sm sm:text-xl w-4 text-center shrink-0 mr-2 sm:mr-4 hidden sm:inline-block">{idx + 1}</span>}
                  
                  <img src={item.capa} className={`${isMusica ? 'w-12 h-12 sm:w-14 sm:h-14 rounded-lg' : 'w-16 h-24 sm:w-20 sm:h-32 rounded-lg sm:rounded-xl'} shadow-lg object-cover border border-white/10 shrink-0`} alt="" />

                  {item.tier && item.tier !== "Nenhum" && !isMusica && (
                    <div className={`absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs border backdrop-blur-md shadow-lg z-30 ${getTierColor(item.tier)}`}>
                      {item.tier}
                    </div>
                  )}
                </div>

                {/* Conteúdo Central */}
                <div className={`flex-1 min-w-0 flex flex-col justify-center h-full relative z-10 py-1`}>
                  
                  {!isMusica && (
                    <>
                      <div>
                        <div className="flex gap-2 items-center mb-1">
                          <span className={`bg-${cor}-500/20 text-${cor}-300 px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-widest border border-${cor}-500/30`}>{item.tipo}</span>
                        </div>
                        <h3 className="font-black text-white uppercase italic tracking-tighter truncate drop-shadow-md text-sm sm:text-lg leading-tight">{item.titulo}</h3>
                        
                        {/* 🪄 SINOPSE DOMADA COM LINE-CLAMP-2 ESTREITO */}
                        <p className="hidden sm:-webkit-box text-[9px] text-gray-400 italic mt-1.5 line-clamp-2 leading-relaxed text-ellipsis overflow-hidden">
                          {item.sinopse}
                        </p>
                      </div>

                      <div className="w-full mt-2 sm:mt-auto">
                        <div className="w-full bg-black/60 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/10 mb-1 sm:mb-1.5 shadow-inner">
                          <div className={`h-full bg-gradient-to-r from-${cor}-700 to-${cor}-400 shadow-[0_0_10px_rgba(var(--color-${cor}-500),0.8)] rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase text-gray-300 tracking-widest">
                            {(tipo === 'Série' || tipo === 'Anime') ? `T${item.temporada||1} EP${item.progresso}` : `PÁG ${item.progresso}`} <span className="text-gray-500">/ {item.total}</span>
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {isMusica && (
                    <div className="flex flex-row items-center justify-between w-full gap-4">
                      <div className="flex flex-col truncate pr-2">
                        <span className="font-black text-xs sm:text-[13px] text-white uppercase tracking-widest truncate drop-shadow-md">{item.titulo}</span>
                        <span className={`text-[8px] sm:text-[10px] text-${cor}-500 uppercase font-black tracking-widest truncate mt-0.5`}>{item.artista}</span>
                      </div>
                      <div className="flex items-center shrink-0 relative z-50">
                        {item.audioUrl && <CustomAudioPlayer src={item.audioUrl} cor={cor} />}
                      </div>
                    </div>
                  )}

                </div>
              </CardHolografico>
            )
          })}
        </div>
      ) : (
        <div className="py-16 sm:py-20 text-center border border-dashed border-white/10 rounded-2xl sm:rounded-3xl opacity-70 uppercase font-black text-[9px] sm:text-[10px] bg-black/20 backdrop-blur-md">
          {filtro !== "todos" ? "Nenhum item com este filtro." : `Nenhuma ${categoria.toLowerCase()} registada.`}
        </div>
      )}
    </div>
  );
}