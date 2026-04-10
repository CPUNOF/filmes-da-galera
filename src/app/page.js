/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CartaoFilme from "@/components/CartaoFilme";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

function formatarData(dataISO) {
  if (!dataISO) return "";
  return new Date(dataISO).toLocaleDateString('pt-BR');
}

function GaleriaConteudo() {
  const searchParams = useSearchParams();
  const searchInital = searchParams.get('search') || "";

  const [filmes, setFilmes] = useState([]);
  const [sugestoesTop, setSugestoesTop] = useState([]);
  const [termoBusca, setTermoBusca] = useState(searchInital);
  const [abaAtiva, setAbaAtiva] = useState("recentes");
  const [stats, setStats] = useState({ vistos: 0, naFila: 0 });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        const querySnapshot = await getDocs(collection(db, "filmes"));
        const listaCompleta = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const assistidos = listaCompleta.filter(f => f.status === "assistido");
        const sugeridos = listaCompleta.filter(f => f.status === "sugerido");

        setStats({ vistos: assistidos.length, naFila: sugeridos.length });
        setFilmes(assistidos);

        // Pegando as 6 sugestões mais votadas (mais votos = na frente)
        const topSugestoes = sugeridos
          .sort((a, b) => {
            const votosA = a.upvotes?.length || a.quantidadeVotos || 0;
            const votosB = b.upvotes?.length || b.quantidadeVotos || 0;
            return votosB - votosA;
          })
          .slice(0, 6);
        setSugestoesTop(topSugestoes);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  const filmesExibidos = filmes
    .filter(f => JSON.stringify(f).toLowerCase().includes(termoBusca.toLowerCase()))
    .sort((a, b) => abaAtiva === "recentes" 
      ? new Date(b.dataAssistido || 0) - new Date(a.dataAssistido || 0)
      : (b.notaGeral || 0) - (a.notaGeral || 0)
    );

  return (
    <div className="relative min-h-screen pb-20">
      
      {/* 🎬 HEADER HERO */}
      <div className="relative w-full pt-28 sm:pt-40 pb-12 sm:pb-16 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20 scale-105" 
          style={{ backgroundImage: "url('data:image/jpeg;base64,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')" }}
        ></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-2 sm:mb-4 uppercase italic leading-none">
                FILMES DA <br className="hidden sm:block" />GALERA<span className="text-red-600">.</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-base font-medium leading-relaxed max-w-[90%]">
                Nossa curadoria particular de cinema. Onde a gente decide o que presta e o que vai pro lixo.
              </p>
            </div>
            
            {/* 🪄 CONTADORES ULTRA COMPACTOS NO MOBILE */}
            <div className="flex gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
              <div className="bg-[#111111]/80 backdrop-blur-md border border-white/5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-center flex-1 md:min-w-[90px] shadow-xl">
                <span className="block text-2xl sm:text-3xl font-black text-red-600 leading-none mb-1">{stats.vistos}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Vistos</span>
              </div>
              <div className="bg-[#111111]/80 backdrop-blur-md border border-white/5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl text-center flex-1 md:min-w-[90px] shadow-xl">
                <span className="block text-2xl sm:text-3xl font-black text-blue-500 leading-none mb-1">{stats.naFila}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Na Fila</span>
              </div>
            </div>
          </div>

          {/* 🪄 PÍLULA DE BUSCA E FILTROS ADAPTADA PARA MOBILE */}
          <div className="bg-[#111111]/90 backdrop-blur-xl border border-white/5 p-1.5 sm:p-2 rounded-2xl sm:rounded-full flex flex-col sm:flex-row justify-between items-center shadow-lg relative gap-2 sm:gap-1 group">
            
            <div className="flex bg-[#141414]/60 p-1 rounded-xl sm:rounded-full border border-white/5 shadow-inner w-full sm:w-auto">
              <button 
                onClick={() => setAbaAtiva("recentes")} 
                className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none ${abaAtiva === 'recentes' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
              >
                Recentes
              </button>
              <button 
                onClick={() => setAbaAtiva("melhores")} 
                className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none ${abaAtiva === 'melhores' ? 'bg-transparent text-white' : 'text-gray-500 hover:text-white'}`}
              >
                Os Melhores
              </button>
            </div>

            <div className="relative w-full sm:flex-1 flex items-center gap-2">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-600 transition-colors">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" placeholder="Buscar filmes, atores..."
                value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-[#111111] border border-white/5 rounded-xl sm:rounded-full py-2.5 sm:py-3.5 pl-9 sm:pl-12 pr-4 sm:pr-32 text-xs sm:text-sm focus:border-red-600/50 outline-none transition-all shadow-inner placeholder:text-gray-700"
              />
              <span className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-600 uppercase tracking-widest">
                Ordenado por {abaAtiva === 'recentes' ? 'atividade' : 'nota'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10 relative z-30">
        
        {/* GRID DE FILMES (Gaps ajustados pro mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {filmesExibidos.map((filme) => (
            <CartaoFilme key={filme.id} filme={filme} isSugestao={false} dataLabel={formatarData(filme.dataAssistido)} />
          ))}
        </div>

        {!carregando && filmesExibidos.length === 0 && (
          <div className="py-16 sm:py-20 text-center border border-dashed border-white/5 rounded-3xl mt-6 sm:mt-8">
            <span className="text-3xl sm:text-4xl mb-3 sm:mb-4 block">🎬</span>
            <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Nenhum filme corresponde à busca.</p>
          </div>
        )}

        {/* 🔥 FILA DE SUGESTÕES */}
        {sugestoesTop.length > 0 && (
          <div className="mt-20 sm:mt-32 pt-10 sm:pt-16 border-t border-white/5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-3 sm:gap-4">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
                  <span className="text-orange-500 animate-pulse">🔥</span> Fila de Sugestões
                </h2>
                <p className="text-gray-500 text-[9px] sm:text-[10px] mt-1 sm:mt-2 font-black uppercase tracking-[0.2em]">Os mais votados pela galera</p>
              </div>
              <Link href="/sugestoes" className="w-full sm:w-auto bg-[#111111] hover:bg-[#1a1a1a] border border-white/10 px-5 sm:px-6 py-3 rounded-xl sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all text-gray-300 hover:text-white flex items-center justify-center gap-2 shadow-md">
                Ver Mais Sugestões <span>➔</span>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {sugestoesTop.map((filme) => (
                <CartaoFilme key={filme.id} filme={filme} isSugestao={true} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function GaleriaHome() {
  return (
    <main className="min-h-screen bg-[#070707] text-white font-sans">
      <Navbar />
      <Suspense fallback={<div className="pt-40 text-center font-black uppercase text-gray-500 tracking-widest text-xs">Carregando Acervo...</div>}>
        <GaleriaConteudo />
      </Suspense>
    </main>
  );
}