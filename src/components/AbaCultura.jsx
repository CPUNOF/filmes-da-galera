"use client";

import { useState } from "react";
import CustomAudioPlayer from "./CustomAudioPlayer"; 
import CardHolografico from "./CardHolografico"; // 🪄 IMPORTANDO A MAGIA HOLOGRÁFICA!

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
      case 'S': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
      case 'A': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'B': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'C': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'D': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'hidden';
    }
  };

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
          <span className={`text-${cor}-500 drop-shadow-md`}>{icon}</span> {categoria}
        </h2>
        {isOwner && (
          <button onClick={() => window.abrirGestorCultura(tipo)} className={`bg-${cor}-600 hover:bg-${cor}-500 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--color-${cor}-500),0.5)] transition-all border border-${cor}-400 shrink-0`}>
            + Adicionar
          </button>
        )}
      </div>

      {itens.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 snap-x pb-2">
          <button onClick={() => setFiltro("todos")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'todos' ? 'bg-white/20 border-white/30 text-white' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>Tudo</button>
          <button onClick={() => setFiltro("tier_s")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'tier_s' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-black/30 border-white/5 text-gray-500 hover:text-yellow-500'}`}>🏆 Tier S</button>
          <button onClick={() => setFiltro("andamento")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'andamento' ? `bg-${cor}-500/20 border-${cor}-500/50 text-${cor}-400` : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>⏳ Em Andamento</button>
          <button onClick={() => setFiltro("concluido")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${filtro === 'concluido' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>✅ Concluídos</button>
        </div>
      )}

      {itensFiltrados.length > 0 ? (
        <div className={tipo === 'Música' ? "flex flex-col gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
          {itensFiltrados.map((item, idx) => {
            const pct = Math.min(100, Math.round((item.progresso / item.total) * 100)) || 0;
            const isMusica = tipo === 'Música';
            const isLivro = tipo === 'Livro' || tipo === 'Mangá';
            
            return (
              <CardHolografico 
                key={`${item.id}-${idx}`}
                ativo={item.tier === 'S'} // 🪄 A MÁGICA: Só ativa se for Tier S!
                className={isMusica 
                  ? `bg-black/20 border border-white/5 rounded-[1.5rem] p-4 flex flex-col sm:flex-row items-center justify-between group transition-all hover:bg-black/40 gap-4` 
                  : `bg-black/30 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 group transition-all hover:bg-black/50 relative shadow-2xl`
                }
              >
                
                <div className={`shrink-0 relative ${!isMusica && isLivro ? 'group-hover:rotate-y-12 perspective-1000 transition-transform duration-500' : ''}`}>
                  {isMusica && <span className="text-gray-500/50 font-black text-xl w-4 text-center shrink-0 mr-4">{idx + 1}</span>}
                  
                  {isLivro ? (
                    <div className="relative w-24 h-36 shrink-0 z-10 ml-2 perspective-[1000px]">
                      <div className="absolute inset-y-1 right-0 left-2 bg-[#f0ebd8] rounded-r-lg border-y border-r border-[#d1c9b4] flex items-center justify-end pr-1.5 shadow-inner">
                         <div className="w-[1px] h-[90%] bg-[#d1c9b4] mx-[1px]"></div><div className="w-[1px] h-[90%] bg-[#d1c9b4] mx-[1px]"></div><div className="w-[1px] h-[90%] bg-[#d1c9b4] mx-[1px]"></div>
                      </div>
                      <img src={item.capa} className="absolute inset-0 w-full h-full object-cover rounded-l-sm rounded-r-lg origin-left transition-transform duration-700 ease-in-out group-hover:[transform:rotateY(-45deg)] shadow-[2px_2px_10px_rgba(0,0,0,0.8)] z-20" alt={item.titulo} />
                    </div>
                  ) : (
                    <img src={item.capa} className={`${isMusica ? 'w-14 h-14 rounded-xl shadow-md border border-white/10 shrink-0' : 'w-24 h-36 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.8)] object-cover border border-white/10'}`} alt="" />
                  )}

                  {item.tier && item.tier !== "Nenhum" && !isMusica && (
                    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border backdrop-blur-md shadow-lg z-30 ${getTierColor(item.tier)}`}>
                      {item.tier}
                    </div>
                  )}

                  {isMusica && (
                    <div className="flex flex-col truncate pr-4">
                      <span className="font-black text-[13px] text-white uppercase tracking-widest truncate drop-shadow-md">{item.titulo}</span>
                      <span className={`text-[10px] text-${cor}-500 uppercase font-black tracking-widest truncate mt-0.5`}>{item.artista}</span>
                    </div>
                  )}
                </div>

                <div className={`flex-1 w-full flex ${isMusica ? 'flex-row items-center justify-end sm:justify-between shrink-0 ml-auto sm:ml-0' : 'flex-col justify-between h-full relative z-10'}`}>
                  
                  {!isMusica && (
                    <>
                      <div>
                        <div className="flex gap-2 items-center mb-2">
                          <span className={`bg-${cor}-500/20 text-${cor}-300 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-${cor}-500/30 shadow-inner`}>{item.tipo}</span>
                        </div>
                        <h3 className="font-black text-white uppercase italic tracking-tighter truncate drop-shadow-md text-lg leading-tight mb-2">{item.titulo}</h3>
                        <p className="text-[10px] text-gray-400 italic mb-3 line-clamp-2 leading-relaxed">{item.sinopse}</p>
                      </div>

                      <div className="w-full mt-auto">
                        <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10 mb-2 shadow-inner">
                          <div className={`h-full bg-gradient-to-r from-${cor}-700 to-${cor}-400 shadow-[0_0_15px_rgba(var(--color-${cor}-500),0.8)] rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">
                            {(tipo === 'Série' || tipo === 'Anime') ? `T${item.temporada || 1} - EP ${item.progresso}` : `PÁG ${item.progresso}`} <span className="text-gray-500">/ {item.total}</span>
                          </span>
                          {isOwner && (
                            <button onClick={() => window.abrirGestorCultura(item.tipo, item)} className={`text-gray-400 hover:text-white text-xs bg-white/10 hover:bg-${cor}-600 px-2.5 py-1.5 rounded-lg transition-all border border-white/10 shadow-sm relative z-50`}>✏️</button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {isMusica && (
                    <div className="flex items-center gap-3 shrink-0 relative z-50">
                      {item.audioUrl && <CustomAudioPlayer src={item.audioUrl} cor={cor} />}
                      {isOwner && (
                        <button onClick={() => window.abrirGestorCultura(item.tipo, item)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-[#111111] hover:bg-[#1a1a1a] border border-white/10 rounded-xl transition-all shadow-sm shrink-0">
                          <span className="text-orange-500 text-[11px] sm:text-xs">✏️</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </CardHolografico>
            )
          })}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl opacity-70 uppercase font-black text-[10px] bg-black/20 backdrop-blur-md">
          {filtro !== "todos" ? "Nenhum item com este filtro." : `Nenhuma ${categoria.toLowerCase()} registada.`}
        </div>
      )}
    </div>
  );
}