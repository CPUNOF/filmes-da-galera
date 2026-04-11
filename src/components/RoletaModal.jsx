/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RoletaModal({ isOpen, onClose, filmes }) {
  const [isSpinning, setIsSpinning] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (!isOpen || !filmes || filmes.length === 0) return;

    // Reseta o estado sempre que o modal abre
    setIsSpinning(true);
    setWinner(null);
    setCurrentIndex(0);

    // 🪄 LÓGICA MATEMÁTICA DA ROLETA
    // Escolhe quem vai ganhar antes mesmo de rodar
    const targetWinnerIndex = Math.floor(Math.random() * filmes.length);
    
    // Dá 5 voltas completas + o número de casas até o vencedor
    const voltasCompletas = 5 * filmes.length;
    const totalSpins = voltasCompletas + targetWinnerIndex;

    let currentStep = 0;
    let speed = 50; // Velocidade inicial (rápida)

    const tick = () => {
      currentStep++;
      setCurrentIndex((prev) => (prev + 1) % filmes.length);

      if (currentStep < totalSpins) {
        // Quando faltarem 8 passos para parar, começa a frear bruscamente (frio na barriga!)
        if (currentStep > totalSpins - 8) {
          speed += 50; 
        }
        setTimeout(tick, speed);
      } else {
        // Parou! Temos um vencedor!
        setIsSpinning(false);
        setWinner(filmes[targetWinnerIndex]);
      }
    };

    // Inicia o motor
    setTimeout(tick, speed);

  }, [isOpen, filmes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity">
      {/* Overlay Escuro com Blur Profundo */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl"></div>
      
      {/* Botão Fechar */}
      {!isSpinning && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-white/5 hover:bg-red-600 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors z-50 text-white font-black text-xl"
        >
          ✕
        </button>
      )}

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        {/* Título Dinâmico */}
        <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter text-white mb-12 text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse">
          {isSpinning ? "🎲 Sorteando o Filme da Noite..." : "🏆 TEMOS UM VENCEDOR!"}
        </h2>

        {/* 🪄 O PALCO DOS PÔSTERES (A ROLETA) */}
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-4 sm:gap-6 w-full px-4">
          {filmes.map((filme, index) => {
            const isHighlighted = currentIndex === index;
            const isWinner = winner && winner.id === filme.id;

            return (
              <div 
                key={filme.id} 
                className={`relative transition-all duration-300 ease-out transform rounded-2xl overflow-hidden
                  ${isHighlighted && isSpinning ? 'scale-110 opacity-100 z-20 shadow-[0_0_50px_rgba(255,255,255,0.5)] border-4 border-white' : ''}
                  ${!isHighlighted && isSpinning ? 'scale-90 opacity-30 grayscale blur-[2px] z-10' : ''}
                  ${isWinner && !isSpinning ? 'scale-110 sm:scale-125 opacity-100 z-50 shadow-[0_0_80px_rgba(234,179,8,0.8)] border-4 border-yellow-400' : ''}
                  ${!isWinner && !isSpinning ? 'scale-75 opacity-10 grayscale blur-sm z-0 hidden sm:block' : ''}
                `}
                style={{ width: isWinner && !isSpinning ? '250px' : '150px' }} // O Vencedor fica gigante
              >
                <img 
                  src={filme.capa} 
                  alt={filme.titulo} 
                  className="w-full h-auto aspect-[2/3] object-cover"
                />
                
                {/* Overlay do título no vencedor */}
                {isWinner && !isSpinning && (
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-10 text-center animate-fade-in-up">
                    <h3 className="text-white font-black text-lg uppercase italic tracking-tighter leading-tight shadow-black drop-shadow-md">
                      {filme.titulo}
                    </h3>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 🪄 BOTÃO PARA IR ASSISTIR O VENCEDOR */}
        {!isSpinning && winner && (
          <div className="mt-16 animate-fade-in-up flex flex-col items-center">
            <p className="text-yellow-500 font-black uppercase tracking-widest text-xs mb-4">
              A roleta falou, tá falado. Fim de papo!
            </p>
            <Link 
              href={`/filme/${winner.id}`}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-full text-sm sm:text-base font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:shadow-[0_0_60px_rgba(234,179,8,0.6)] flex items-center justify-center gap-3 hover:scale-105"
            >
              🍿 PREPARAR A PIPOCA
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}