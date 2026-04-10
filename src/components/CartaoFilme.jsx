"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function CartaoFilme({ filme, veredito, dataLabel }) {
  const [mostrarVideo, setMostrarVideo] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    if (filme.trailerKey) {
      timerRef.current = setTimeout(() => {
        setMostrarVideo(true);
      }, 2000); 
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
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all hover:scale-105 hover:z-50 cursor-pointer border border-gray-700 flex flex-col relative group"
    >
      <Link href={`/filme/${filme.id}`}>
        <div className="relative h-64 sm:h-80 overflow-hidden bg-black">
          
          {/* IMAGEM DA CAPA */}
          <img 
            src={filme.capa} 
            alt={filme.titulo}
            className={`w-full h-full object-cover transition-opacity duration-700 ${mostrarVideo ? 'opacity-0' : 'opacity-100'}`} 
          />

          {/* PLAYER DO YOUTUBE (O trailer que você disse que tá rodando) */}
          {mostrarVideo && (
            <div className="absolute inset-0 w-full h-full">
              <iframe
                className="w-full h-full pointer-events-none scale-150" // Aumentamos o scale para sumir com as bordas do YT
                src={`https://www.youtube.com/embed/${filme.trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${filme.trailerKey}&modestbranding=1`}
                frameBorder="0"
                allow="autoplay"
              ></iframe>
            </div>
          )}

          {/* Ano flutuante */}
          {!mostrarVideo && filme.dataLancamento && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
              {filme.dataLancamento.substring(0, 4)}
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold line-clamp-2 mb-4 group-hover:text-red-500 transition-colors">
              {filme.titulo}
            </h3>
            {/* Gênero principal no card */}
            {filme.generos && filme.generos.length > 0 && (
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">
                {filme.generos[0]}
              </p>
            )}
            <div className="flex items-center justify-between mb-1">
              {/* A NOTA NO PADRÃO 7 / 10 */}
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.4)]">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-black text-base">
                  {filme.notaGeral} <span className="text-gray-500 text-[10px] font-normal tracking-tighter">/ 10</span>
                </span>
              </div>

              {/* Selo de Veredito mais clean */}
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border leading-none ${veredito.cor}`}>
                {veredito.texto}
              </span>
            </div>
          </div>
          
          {/* Rodapé com a data assistida */}
          {dataLabel && (
            <div className="text-[10px] text-gray-500 border-t border-gray-700/50 pt-3 mt-3 flex items-center gap-1">
              <span className="opacity-70">📅</span> 
              <span>Assistido em {dataLabel}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}