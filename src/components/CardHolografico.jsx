"use client";

import { useState, useRef } from "react";

export default function CardHolografico({ children, ativo, className }) {
  const [rotacao, setRotacao] = useState({ x: 0, y: 0 });
  const [brilho, setBrilho] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef(null);

  // Se não for Tier S ou não tiver Ingresso Dourado, devolve o cartão normal (sem peso de processamento)
  if (!ativo) {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // Posição X do rato dentro do cartão
    const y = e.clientY - rect.top;  // Posição Y do rato dentro do cartão

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calcula a inclinação (Máximo de 15 graus)
    const rotateX = ((y - centerY) / centerY) * -15; 
    const rotateY = ((x - centerX) / centerX) * 15;

    setRotacao({ x: rotateX, y: rotateY });
    
    // Calcula onde a luz deve bater em percentagem (%)
    setBrilho({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 1
    });
  };

  const handleMouseLeave = () => {
    // Volta suavemente ao estado de repouso
    setRotacao({ x: 0, y: 0 });
    setBrilho(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setBrilho(prev => ({ ...prev, opacity: 1 }))}
      className={`relative transition-all cursor-pointer ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotacao.x}deg) rotateY(${rotacao.y}deg) scale3d(${brilho.opacity ? 1.02 : 1}, ${brilho.opacity ? 1.02 : 1}, 1)`,
        transition: brilho.opacity === 0 ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out',
        transformStyle: 'preserve-3d',
        zIndex: brilho.opacity ? 50 : 1
      }}
    >
      {/* O Conteúdo Original do Cartão */}
      {children}

      {/* 🪄 OVERLAY HOLOGRÁFICO BRILHANTE (Cores e Reflexo Dourado) */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-color-dodge transition-opacity duration-500 ease-out z-50 rounded-[inherit]"
        style={{
          opacity: brilho.opacity,
          background: `
            radial-gradient(
              farthest-corner circle at ${brilho.x}% ${brilho.y}%,
              rgba(255, 255, 255, 0.9) 0%,
              rgba(255, 255, 255, 0.15) 20%,
              transparent 50%
            ),
            linear-gradient(
              ${brilho.x + brilho.y}deg,
              transparent 20%,
              rgba(255, 215, 0, 0.5) 25%,
              rgba(255, 0, 128, 0.4) 40%,
              rgba(0, 255, 255, 0.4) 60%,
              rgba(57, 255, 20, 0.4) 75%,
              transparent 80%
            )
          `
        }}
      />
      
      {/* Borda dourada incandescente que aparece apenas no Hover */}
      <div 
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-all duration-500 z-50"
        style={{
          opacity: brilho.opacity ? 1 : 0,
          boxShadow: `inset 0 0 25px rgba(255, 215, 0, 0.6), 0 0 30px rgba(234, 179, 8, 0.4)`,
          border: '2px solid rgba(255, 215, 0, 0.6)'
        }}
      />
    </div>
  );
}