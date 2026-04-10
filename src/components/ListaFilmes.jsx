"use client";

import { useState } from "react";
import CartaoFilme from "./CartaoFilme";

export default function ListaFilmes({ filmesIniciais }) {
  const [filtro, setFiltro] = useState("recentes"); // 'recentes' ou 'melhores'

  // Lógica de Ordenação
  const filmesOrdenados = [...filmesIniciais].sort((a, b) => {
    if (filtro === "melhores") {
      return b.notaGeral - a.notaGeral; // Nota maior primeiro
    }
    // Caso contrário, ordena por data assistido (Recentes)
    return new Date(b.dataAssistido) - new Date(a.dataAssistido);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-8 relative z-30">
      
      {/* Barra de Filtros Inteligente */}
      <div className="flex items-center justify-between mb-10 bg-[#141414] p-2 rounded-full border border-white/5 shadow-2xl">
        <div className="flex gap-2">
          <button 
            onClick={() => setFiltro("recentes")}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              filtro === "recentes" 
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
              : "text-gray-400 hover:bg-white/5"
            }`}
          >
            Recentes
          </button>
          <button 
            onClick={() => setFiltro("melhores")}
            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              filtro === "melhores" 
              ? "bg-red-600 text-white shadow-lg shadow-red-600/20" 
              : "text-gray-400 hover:bg-white/5"
            }`}
          >
            Os Melhores
          </button>
        </div>
        <div className="hidden sm:block text-[10px] font-bold text-gray-600 uppercase pr-6">
          {filtro === "melhores" ? "Ordenado por maior nota" : "Ordenado por atividade recente"}
        </div>
      </div>

      {/* Grid de Filmes Assistidos */}
      <div className="mb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filmesOrdenados.map((filme) => (
            <CartaoFilme 
              key={filme.id} 
              filme={filme} 
              veredito={filme.veredito} 
              dataLabel={filme.dataFormatada} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}