/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CartaoFilme from "@/components/CartaoFilme";
import RoletaModal from "@/components/RoletaModal";
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
  const [modalRoletaAberto, setModalRoletaAberto] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const querySnapshot = await getDocs(collection(db, "filmes"));
        const listaCompleta = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const assistidos = listaCompleta.filter(f => f.status === "assistido");
        const sugeridos = listaCompleta.filter(f => f.status === "sugerido");

        setStats({ vistos: assistidos.length, naFila: sugeridos.length });
        setFilmes(assistidos);

        // 🪄 ALGORITMO SOBERANO: O INGRESSO DOURADO É O REI DA FILA
        const topSugestoes = sugeridos
          .sort((a, b) => {
            // 1. Checagem de Prioridade (Ingresso Dourado fura a fila)
            const prioridadeA = a.ingressoDourado ? 1 : 0;
            const prioridadeB = b.ingressoDourado ? 1 : 0;
            
            if (prioridadeA !== prioridadeB) {
              return prioridadeB - prioridadeA; // O que tem ingresso (1) vem antes do que não tem (0)
            }

            // 2. Critério de Desempate: Se ambos tiverem (ou não) ingresso, vence quem tem mais votos
            const votosA = a.upvotes?.length || a.quantidadeVotos || 0;
            const votosB = b.upvotes?.length || b.quantidadeVotos || 0;
            return votosB - votosA;
          })
          .slice(0, 4); // Pega os 4 vencedores para a vitrine da Home
          
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
      
      {/* HEADER HERO */}
      <div className="relative w-full pt-28 sm:pt-40 pb-12 sm:pb-16 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-20 scale-105" 
          style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5pIpk2JBiryNHSRzvS9_LOHB3-um8JSzqNQ&s')" }}
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

          <div className="bg-[#111111]/90 backdrop-blur-xl border border-white/5 p-1.5 sm:p-2 rounded-2xl sm:rounded-full flex flex-col sm:flex-row justify-between items-center shadow-lg relative gap-2 sm:gap-1 group">
            <div className="flex bg-[#141414]/60 p-1 rounded-xl sm:rounded-full border border-white/5 shadow-inner w-full sm:w-auto">
              <button onClick={() => setAbaAtiva("recentes")} className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none ${abaAtiva === 'recentes' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}>Recentes</button>
              <button onClick={() => setAbaAtiva("melhores")} className={`px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none ${abaAtiva === 'melhores' ? 'bg-transparent text-white' : 'text-gray-500 hover:text-white'}`}>Os Melhores</button>
            </div>

            <div className="relative w-full sm:flex-1 flex items-center gap-2">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-600">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input type="text" placeholder="Buscar filmes, atores..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full bg-[#111111] border border-white/5 rounded-xl sm:rounded-full py-2.5 sm:py-3.5 pl-9 sm:pl-12 pr-4 sm:pr-32 text-xs sm:text-sm outline-none placeholder:text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10 relative z-30">
        
        {/* SUGESTÕES COM LOGICA DE FURA-FILA APLICADA */}
        {sugestoesTop.length > 0 && (
          <div className="mb-16 sm:mb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
                  <span className="text-orange-500 animate-pulse">🔥</span> Em Alta na Fila
                </h2>
                <p className="text-gray-500 text-[9px] sm:text-[10px] mt-1 sm:mt-2 font-black uppercase tracking-[0.2em]">Os preferidos e os que furaram a fila 🎫</p>
              </div>
              
              <div className="flex w-full sm:w-auto items-center gap-3 justify-between sm:justify-end">
                <button onClick={() => setModalRoletaAberto(true)} className="bg-yellow-600/20 hover:bg-yellow-500 border border-yellow-600/50 hover:border-yellow-400 text-yellow-500 hover:text-black px-4 sm:px-6 py-3 rounded-xl sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg flex-1 sm:flex-none">
                  <span className="text-sm">🎲</span> Sortear Sessão
                </button>
                <Link href="/sugestoes" className="bg-[#111111] border border-white/10 px-4 sm:px-6 py-3 rounded-xl sm:rounded-full text-[9px] font-black uppercase tracking-widest text-gray-300 flex-1 sm:flex-none text-center">Fila Completa ➔</Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {sugestoesTop.map((filme) => (
                <CartaoFilme key={filme.id} filme={filme} isSugestao={true} />
              ))}
            </div>
          </div>
        )}

        <div className="pt-10 sm:pt-16 border-t border-white/5">
          <div className="mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
              <span className="text-red-600">🎬</span> Acervo de Assistidos
            </h2>
            <p className="text-gray-500 text-[9px] sm:text-[10px] mt-1 sm:mt-2 font-black uppercase tracking-[0.2em]">O que já vimos no grupo</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {filmesExibidos.map((filme) => (
              <CartaoFilme key={filme.id} filme={filme} isSugestao={false} dataLabel={formatarData(filme.dataAssistido)} />
            ))}
          </div>
        </div>
      </div>

      <RoletaModal isOpen={modalRoletaAberto} onClose={() => setModalRoletaAberto(false)} filmes={sugestoesTop} />
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