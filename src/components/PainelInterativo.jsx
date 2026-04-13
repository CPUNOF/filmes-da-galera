"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PainelInterativo({ dadosGamer, todosMembros }) {
  const router = useRouter();
  const [buscaMembro, setBuscaMembro] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const membrosFiltrados = todosMembros.filter(m => m.nome.toLowerCase().includes(buscaMembro.toLowerCase()));

  const handleKeyDownBusca = (e) => {
    if (e.key === 'Enter' && membrosFiltrados.length > 0) { 
      setMostrarDropdown(false); setBuscaMembro(""); 
      router.push(`/perfil/${membrosFiltrados[0].uid}`); 
    }
  };

  const ingressos = dadosGamer?.ingressos || 0;
  const progresso = dadosGamer?.progresso || 0;
  const faltam = Math.max(0, 20 - progresso);
  const pct = Math.min(100, Math.max(0, (progresso / 20) * 100));

  return (
    <div className="flex flex-col lg:flex-row justify-between items-stretch gap-3 sm:gap-4 mb-6 w-full max-w-5xl mx-auto">
      
      {/* 🪄 CARTÃO VIP FLAT NO MOBILE (flex-row em todas as telas) */}
      <div className="w-full flex-1 relative overflow-hidden bg-gradient-to-br from-[#1a1500] to-[#0a0a0a] border border-yellow-600/20 rounded-2xl sm:rounded-[1.5rem] p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-5 shadow-xl">
        
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Lado Esquerdo: Ícone e Número */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10 w-auto">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-400 p-[1px] shadow-[0_0_15px_rgba(234,179,8,0.3)] shrink-0">
            <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center">
              <span className="text-sm sm:text-lg">🎫</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 leading-none tracking-tighter drop-shadow-sm">{ingressos}</span>
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500/80">Vips</span>
            </div>
            {/* Texto escondido no mobile para poupar espaço vertical */}
            <span className="hidden sm:block text-[7px] text-gray-500 uppercase font-bold tracking-widest leading-tight mt-0.5">Ingressos Disponíveis</span>
          </div>
        </div>

        {/* Lado Direito: Barra de Progresso */}
        <div className="flex-1 w-full flex flex-col justify-center relative z-10 border-l border-white/5 pl-3 sm:pl-5">
          <div className="flex justify-between items-end mb-1 sm:mb-1.5 w-full">
            <p className="text-[6px] sm:text-[8px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1 sm:gap-1.5">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
              Próximo <span className="hidden sm:inline ml-1">Ingresso</span>
            </p>
            <p className="text-[7px] sm:text-[8px] font-black uppercase text-yellow-500 tracking-widest">
              {progresso} <span className="text-gray-600">/ 20</span>
            </p>
          </div>
          <div className="w-full h-1.5 sm:h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(234,179,8,0.8)] relative" style={{ width: `${pct}%` }}>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"></div>
            </div>
          </div>
          <p className="text-[6px] sm:text-[7px] text-gray-500 font-bold uppercase tracking-widest mt-1 sm:mt-1.5 text-right">
            Faltam {faltam}
          </p>
        </div>
      </div>

      {/* 🪄 BUSCADOR INTACTO */}
      <div className="relative w-full lg:w-[280px] xl:w-[320px] z-[100] shrink-0 flex items-center">
        <div className="absolute left-4 text-gray-500 text-sm pointer-events-none">🔎</div>
        <input 
          type="text" 
          placeholder="Encontrar amigos..." 
          value={buscaMembro} 
          onFocus={() => setMostrarDropdown(true)} 
          onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)} 
          onChange={(e) => { setBuscaMembro(e.target.value); setMostrarDropdown(true); }} 
          onKeyDown={handleKeyDownBusca} 
          className="w-full bg-[#111] hover:bg-[#141414] border border-white/10 hover:border-white/20 rounded-full py-3.5 pl-10 pr-4 text-[11px] font-bold text-white placeholder-gray-500 outline-none focus:border-red-500 transition-all shadow-xl focus:shadow-[0_0_20px_rgba(220,38,38,0.15)] min-h-[50px] h-full" 
        />
        
        <div className={`absolute top-full left-0 mt-2 w-full bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar transition-all duration-300 transform origin-top ${mostrarDropdown && buscaMembro.trim() !== "" ? 'opacity-100 scale-y-100 visible' : 'opacity-0 scale-y-95 invisible'}`}>
          {membrosFiltrados.length === 0 ? (
            <div className="p-4 text-center text-[9px] text-gray-500 uppercase font-black border border-dashed border-white/5 m-2 rounded-xl">
              Fantasma não encontrado 👻
            </div>
          ) : (
            <div className="flex flex-col p-1.5 gap-1">
              {membrosFiltrados.map((m) => (
                <div key={m.uid} onMouseDown={() => { setMostrarDropdown(false); setBuscaMembro(""); router.push(`/perfil/${m.uid}`); }} className="flex items-center gap-3 p-2.5 bg-transparent hover:bg-white/5 cursor-pointer rounded-xl transition-all group">
                  <img src={m.foto} alt={m.nome} className="w-8 h-8 rounded-full border border-white/10 object-cover shadow-md group-hover:scale-105 transition-transform shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[11px] font-black text-white uppercase italic truncate">{m.nome}</span>
                    <span className="text-[7px] text-red-500 group-hover:text-red-400 uppercase font-black mt-0.5 tracking-widest transition-colors">Acessar Perfil ➔</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}