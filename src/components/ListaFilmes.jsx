"use client";

import { useState } from "react";
import CartaoFilme from "./CartaoFilme";

export default function ListaFilmes({ filmesIniciais }) {
  const [busca, setBusca] = useState(""); 
  const [filtro, setFiltro] = useState("recentes"); 

  // 1. PRIMEIRO ORDENA: Pega tudo que veio do Firebase e ordena
  const filmesOrdenados = [...filmesIniciais].sort((a, b) => {
    if (filtro === "melhores") {
      return b.notaGeral - a.notaGeral; 
    }
    return new Date(b.dataAssistido) - new Date(a.dataAssistido);
  });

  // 2. DEPOIS FILTRA: Pega os filmes já ordenados e aplica a pesquisa
  const filmesFiltrados = filmesOrdenados.filter((filme) => 
    filme.titulo.toLowerCase().includes(busca.toLowerCase())
  );
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-8 relative z-30">
      
      {/* BARRA DE PESQUISA */}
      <div className="max-w-md w-full mb-8">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
            🔍
          </span>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nos filmes assistidos..."
            className="w-full bg-[#141414] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm shadow-inner"
          />
        </div>
      </div>
      
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
          
          {/* 3. AQUI DESENHA: Usamos os filmesFiltrados e colocamos um aviso se não achar nada */}
          {filmesFiltrados.length > 0 ? (
            filmesFiltrados.map((filme) => (
              <CartaoFilme 
                key={filme.id} 
                filme={filme} 
                veredito={filme.veredito} 
                dataLabel={filme.dataFormatada} 
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-500 text-lg">Nenhum filme encontrado com <span className="font-bold text-white">"{busca}"</span>.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}