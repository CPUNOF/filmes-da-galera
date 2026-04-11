/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function CartaoFilme({ filme, veredito, dataLabel, isSugestao }) {
  const totalVotos = filme.upvotes?.length || filme.quantidadeVotos || 0;
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const timerRef = useRef(null);

  // 🪄 EXTRAÇÃO SEGURA DO NOME E DA FOTO DO INDICADOR
  const autorRaw = filme.usuarioNome || filme.sugeridoPor || filme.autor;
  const nomeIndicador = typeof autorRaw === 'object' && autorRaw !== null 
    ? (autorRaw.nome || autorRaw.displayName || "Desconhecido") 
    : autorRaw;
  const fotoIndicador = typeof autorRaw === 'object' && autorRaw !== null 
    ? (autorRaw.foto || autorRaw.photoURL || autorRaw.usuarioFoto) 
    : null;

  const handleMouseEnter = () => {
    if (filme.trailerKey) {
      timerRef.current = setTimeout(() => { setMostrarVideo(true); }, 2000); 
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMostrarVideo(false);
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bg-[#111111] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:z-50 cursor-pointer border border-white/5 flex flex-col relative group"
    >
      <Link href={`/filme/${filme.id}`} className="flex flex-col h-full">
        <div className="relative h-64 sm:h-80 overflow-hidden bg-black">
          <img 
            src={filme.capa} alt={filme.titulo}
            className={`w-full h-full object-cover transition-opacity duration-700 ${mostrarVideo ? 'opacity-0' : 'opacity-100'}`} 
          />
          {mostrarVideo && (
            <div className="absolute inset-0 w-full h-full">
              <iframe
                className="w-full h-full pointer-events-none scale-150" 
                src={`https://www.youtube.com/embed/${filme.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${filme.trailerKey}&modestbranding=1`}
                frameBorder="0" allow="autoplay"
              ></iframe>
            </div>
          )}
          {!mostrarVideo && filme.dataLancamento && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
              {filme.dataLancamento.substring(0, 4)}
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold line-clamp-2 mb-3 group-hover:text-red-500 transition-colors uppercase tracking-tighter">
              {filme.titulo}
            </h3>
            
            {/* 🪄 QUEM INDICOU O FILME (COM FOTO) */}
            {nomeIndicador && (
              <Link 
                href={`/perfil/${filme.sugeridoPor?.uid}`} 
                className="flex items-center gap-2 mb-3 bg-white/5 hover:bg-white/10 p-1.5 pr-3 rounded-lg border border-white/5 w-fit transition-colors group/autor z-40 relative"
                onClick={(e) => e.stopPropagation()} // Impede de abrir o filme ao clicar no autor
              >
                {fotoIndicador ? (
                  <img src={fotoIndicador} alt={nomeIndicador} className="w-5 h-5 rounded-full object-cover border border-white/10 shadow-sm group-hover/autor:border-blue-400 transition-colors" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/5 group-hover/autor:border-blue-400 transition-colors">
                    <span className="text-[8px]">👤</span>
                  </div>
                )}
                <p className="text-[7px] text-gray-400 uppercase tracking-widest leading-tight group-hover/autor:text-white transition-colors">
                  Indicação<br/><span className="text-gray-200 font-black text-[8px]">{nomeIndicador}</span>
                </p>
              </Link>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-y-2 mb-1">
              <div className="flex items-center gap-1 font-bold">
                <span className="text-yellow-500 text-xs">⭐</span>
                <span className="text-white text-sm font-black">{isSugestao ? (filme.notaTMDB || "?") : (filme.notaGeral || 0)}</span>
                <span className="text-gray-600 text-[10px]">/ 10</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {isSugestao && (
                  <span className="bg-orange-900/40 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-inner">
                    🔥 {totalVotos}
                  </span>
                )}
                {veredito && (
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm border leading-none ${veredito.cor}`}>
                    {veredito.texto}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {dataLabel && (
            <div className="text-[9px] font-bold text-gray-500 border-t border-white/5 pt-3 mt-3 flex items-center gap-1 uppercase tracking-widest">
              <span className="opacity-70">📅</span> 
              <span>{isSugestao ? dataLabel : `Visto em ${dataLabel}`}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}