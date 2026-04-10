"use client";

import { useState } from "react";
import CartaoFilme from "./CartaoFilme"; 

export default function ListaSugestoes({ filmesIniciais }) {
  const [busca, setBusca] = useState("");

  // 1. ORDENA DO MAIOR PARA O MENOR VOTO DE FORMA BLINDADA
  const filmesOrdenados = [...filmesIniciais].sort((a, b) => {
    const votosA = a.upvotes?.length || a.quantidadeVotos || 0;
    const votosB = b.upvotes?.length || b.quantidadeVotos || 0;
    return votosB - votosA;
  });

  const filmesFiltrados = filmesOrdenados.filter((filme) => 
    filme.titulo.toLowerCase().includes(busca.toLowerCase())
  );
  
  return (
    <div className="max-w-6xl mx-auto">
      
      <div className="max-w-md w-full mb-12 mx-auto sm:mx-0">
        <div className="relative shadow-2xl">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">🔍</span>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar sugestões..."
            className="w-full bg-[#141414] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
          />
        </div>
      </div>
            
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filmesFiltrados.length > 0 ? (
          filmesFiltrados.map((filme) => (
            <CartaoFilme 
              key={filme.id} 
              filme={filme} 
              veredito={{ texto: "Na Fila", cor: "text-blue-400 border-blue-500/50 bg-blue-900/20" }}
              dataLabel="Aguardando Sessão"
              isSugestao={true} // 🪄 AQUI É A MÁGICA QUE AVISA O CARTÃO!
            />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-[#141414] rounded-2xl border border-white/5">
            <p className="text-gray-500 text-lg">Nenhuma sugestão encontrada com <span className="font-bold text-white">"{busca}"</span>.</p>
          </div>
        )}
      </div>
    </div>
  );
}