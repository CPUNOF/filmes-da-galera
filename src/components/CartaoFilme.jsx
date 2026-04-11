/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 

export default function CartaoFilme({ filme, veredito, dataLabel, isSugestao, isDiario, onClickDiario }) {
  const router = useRouter(); 
  const totalVotos = filme.upvotes?.length || filme.quantidadeVotos || 0;
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const timerRef = useRef(null);

  const autorRaw = filme.usuarioNome || filme.sugeridoPor || filme.autor;
  const nomeIndicador = typeof autorRaw === 'object' && autorRaw !== null ? (autorRaw.nome || autorRaw.displayName || "Desconhecido") : autorRaw;
  const fotoIndicador = typeof autorRaw === 'object' && autorRaw !== null ? (autorRaw.foto || autorRaw.photoURL || autorRaw.usuarioFoto) : null;

  const notaExibida = isDiario ? filme.notaPessoal : (isSugestao ? (filme.notaTMDB || "?") : (filme.notaGeral || 0));

  const handleMouseEnter = () => {
    if (filme.trailerKey) {
      timerRef.current = setTimeout(() => { setMostrarVideo(true); }, 2000); 
    }
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMostrarVideo(false);
  };

  // 🪄 VERIFICAÇÕES DE CLASSIFICAÇÃO (LIXO VS OBRA-PRIMA)
  const isChorume = !isSugestao && !isDiario && Number(filme.notaGeral) <= 5 && Number(filme.notaGeral) > 0;
  const isObraPrima = !isSugestao && !isDiario && Number(filme.notaGeral) >= 8.0;

  return (
    <div 
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
      className={`bg-[#111111] rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:z-50 cursor-pointer border flex flex-col relative group ${isChorume ? 'border-green-900/40 hover:border-green-500 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]' : isObraPrima ? 'border-yellow-900/40 hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)]' : 'border-white/5 hover:border-red-500/50'}`}
    >
      <Link 
        href={isDiario ? '#' : `/filme/${filme.id}`} 
        className="flex flex-col h-full" 
        onClick={(e) => {
          if (isDiario) {
            e.preventDefault();
            if (onClickDiario) onClickDiario(filme);
          }
        }}
      >
        <div className="relative h-64 sm:h-80 overflow-hidden bg-black">
          
          {/* 🪄 O SELO DO INGRESSO DOURADO (FURA-FILA) */}
          {filme.ingressoDourado && !isDiario && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-400 to-yellow-600 text-black text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-xl shadow-[0_0_30px_rgba(234,179,8,0.9)] z-30 flex items-center gap-1 border-x border-b border-yellow-200">
              <span className="text-[10px] animate-pulse">🎫</span> Fura-Fila
            </div>
          )}

          {/* 🪄 CONTAINER PARA OS BADGES DA PONTA SUPERIOR ESQUERDA */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 items-start z-30 pointer-events-none">
            
            {filme.seloJaAssistido && (
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-xl flex items-center gap-1 border border-yellow-300">
                <span>🥇</span> Selo do Indic.: {filme.notaAutor}/10
              </div>
            )}

            {/* ✨ SELO DE OBRA-PRIMA ANIMADO */}
            {isObraPrima && (
              <div className="bg-yellow-950/90 backdrop-blur-md border border-yellow-500/50 text-yellow-400 text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.5)] flex items-center gap-1.5 transition-transform group-hover:scale-110">
                <span className="text-[12px] sm:text-sm animate-pulse drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">✨</span> Obra-Prima
              </div>
            )}

            {/* 💩 SELO DE CHORUME ANIMADO */}
            {isChorume && (
              <div className="bg-green-950/90 backdrop-blur-md border border-green-500/50 text-green-400 text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center gap-1.5 transition-transform group-hover:scale-110">
                <span className="text-[12px] sm:text-sm animate-bounce drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">💩</span> Chorume
              </div>
            )}

          </div>

          <img 
            src={filme.capa} 
            alt={filme.titulo} 
            className={`w-full h-full object-cover transition-all duration-700 ${mostrarVideo ? 'opacity-0' : 'opacity-100'} ${isChorume ? 'saturate-50 opacity-80 group-hover:saturate-100 group-hover:opacity-100' : isObraPrima ? 'group-hover:scale-110 group-hover:saturate-150' : ''}`} 
          />

          {mostrarVideo && !isDiario && (
            <div className="absolute inset-0 w-full h-full">
              <iframe className="w-full h-full pointer-events-none scale-150" src={`https://www.youtube.com/embed/${filme.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${filme.trailerKey}&modestbranding=1`} frameBorder="0" allow="autoplay"></iframe>
            </div>
          )}

          {/* ANO E DURAÇÃO */}
          {!mostrarVideo && (
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-10">
              {filme.dataLancamento && (
                <div className="bg-black/70 backdrop-blur-md text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 shadow-lg">
                  {filme.dataLancamento.substring(0, 4)}
                </div>
              )}
              {filme.duracao > 0 && (
                <div className="bg-black/70 backdrop-blur-md text-gray-300 text-[9px] font-bold px-2 py-1 rounded-md border border-white/10 shadow-lg flex items-center gap-1">
                  <span>⏱️</span> {Math.floor(filme.duracao / 60)}h {filme.duracao % 60}m
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between relative z-20 bg-[#111111]">
          <div>
            <h3 className={`text-sm font-bold line-clamp-2 mb-3 uppercase tracking-tighter transition-colors ${isChorume ? 'group-hover:text-green-500' : isObraPrima ? 'group-hover:text-yellow-500' : 'group-hover:text-red-500'}`}>
              {filme.titulo}
            </h3>
            
            {!isDiario && nomeIndicador && (
              <div 
                onClick={(e) => {
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  router.push(`/perfil/${filme.sugeridoPor?.uid}`); 
                }}
                className={`flex items-center gap-2 mb-3 bg-white/5 hover:bg-white/10 p-1.5 pr-3 rounded-lg border border-white/5 w-fit transition-colors group/autor relative cursor-pointer ${isChorume ? 'hover:border-green-500/30' : isObraPrima ? 'hover:border-yellow-500/30' : ''}`}
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
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-y-2 mb-1">
              <div className="flex items-center gap-1 font-bold">
                <span className={isChorume ? "text-green-500 text-xs" : "text-yellow-500 text-xs"}>⭐</span>
                <span className={`text-sm font-black ${isChorume ? 'text-green-400' : isObraPrima ? 'text-yellow-400' : 'text-white'}`}>{notaExibida}</span>
                <span className="text-gray-600 text-[10px]">/ 10</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {isSugestao && !isDiario && (
                  <span className="bg-orange-900/40 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-inner">
                    🔥 {totalVotos}
                  </span>
                )}
                {veredito && !isDiario && (
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm border leading-none ${veredito.cor}`}>
                    {veredito.texto}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {isDiario ? (
            <div className="text-[9px] font-bold text-gray-500 border-t border-white/5 pt-3 mt-3 flex items-center gap-1 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
              <span className="opacity-70">🚀</span> Sugerir para o Grupo
            </div>
          ) : (
            dataLabel && (
              <div className="text-[9px] font-bold text-gray-500 border-t border-white/5 pt-3 mt-3 flex items-center gap-1 uppercase tracking-widest">
                <span className="opacity-70">📅</span> 
                <span>{isSugestao ? dataLabel : `Visto em ${dataLabel}`}</span>
              </div>
            )
          )}
        </div>
      </Link>
    </div>
  );
}