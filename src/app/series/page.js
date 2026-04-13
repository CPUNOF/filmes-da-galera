/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const TMDB_API_KEY = "5e0b606e87348f0592b761526df56825";

export default function SeriesPremium() {
  const [user, setUser] = useState(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState("em_alta");

  // Estado do Modal Premium
  const [obraSelecionada, setObraSelecionada] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // TMDB TV Genres: Action&Adventure=10759, Sci-Fi=10765, Comedy=35, Crime=80, Drama=18
  const categorias = [
    { id: "em_alta", nome: "🔥 Para Você", url: `https://api.themoviedb.org/3/trending/tv/day?api_key=${TMDB_API_KEY}&language=pt-BR` },
    { id: "acao", nome: "⚔️ Ação & Aventura", url: `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=10759` },
    { id: "scifi", nome: "👽 Sci-Fi & Fantasia", url: `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=10765` },
    { id: "crime", nome: "🕵️ Crime", url: `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=80` },
    { id: "drama", nome: "🎭 Drama", url: `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=18` },
    { id: "comedia", nome: "😂 Comédia", url: `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=35` }
  ];

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
    buscarPorCategoria("em_alta");
  }, []);

  const buscarPorCategoria = async (catId) => {
    setCategoriaAtiva(catId);
    setBuscando(true);
    setBusca("");
    const cat = categorias.find(c => c.id === catId);
    try {
      const res = await fetch(cat.url);
      const d = await res.json();
      setResultados(d.results || []);
    } catch(e) {
      toast.error("Erro ao buscar séries.");
    } finally { setBuscando(false); }
  };

  const buscarTexto = async (e) => {
    e.preventDefault(); 
    if(!busca.trim()) return;
    setCategoriaAtiva(""); 
    setBuscando(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(busca)}&language=pt-BR`);
      const d = await res.json(); 
      setResultados(d.results || []);
    } catch(err) {
      toast.error("Erro na busca.");
    } finally { setBuscando(false); }
  };

  const salvarNoPerfil = async () => {
    if(!user) return toast.error("Faça login para adicionar ao perfil!");
    setSalvando(true);
    const t = toast.loading("Guardando no Dossiê...");
    try {
      await addDoc(collection(db, "perfil_cultura"), {
        uid: user.uid, 
        tipo: "Série", 
        titulo: obraSelecionada.name || obraSelecionada.original_name,
        capa: `https://image.tmdb.org/t/p/w780${obraSelecionada.poster_path}`, 
        progresso: 0, 
        total: 10, // TMDB exige details fetch para total exato, usamos fallback
        sinopse: obraSelecionada.overview ? obraSelecionada.overview.substring(0,250) + "..." : "Sem sinopse em português.", 
        dataCriacao: new Date().toISOString()
      });
      toast.dismiss(t); 
      toast.success("Série salva com sucesso! 📺");
      setObraSelecionada(null);
    } catch(e) { 
      toast.dismiss(t); 
      toast.error("Erro ao salvar.");
    } finally { setSalvando(false); }
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 font-sans">
      <Navbar />
      
      {/* MODAL PREMIUM ESTILO "ACERVO MUNDIAL" */}
      {obraSelecionada && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer transition-opacity" onClick={() => setObraSelecionada(null)}></div>
          
          <div className="relative w-full max-w-4xl bg-[#111111] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 animate-fade-in-up shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col md:flex-row max-h-[90vh]">
            
            <button onClick={() => setObraSelecionada(null)} className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-red-600 rounded-full text-white font-black transition-colors flex items-center justify-center">✕</button>

            {/* Imagem Flutuante */}
            <div className="w-full md:w-[40%] relative flex justify-center items-end md:items-center bg-black min-h-[250px] md:min-h-[500px]">
              <div className="absolute inset-0 opacity-40 blur-2xl scale-110" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w780${obraSelecionada.poster_path})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#111111] via-transparent to-transparent"></div>
              
              <img src={`https://image.tmdb.org/t/p/w780${obraSelecionada.poster_path}`} alt={obraSelecionada.name} className="w-40 sm:w-56 md:w-64 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-white/10 relative z-20 translate-y-12 md:translate-y-0" />
            </div>

            {/* Conteúdo */}
            <div className="w-full md:w-[60%] p-6 md:p-10 pt-16 md:pt-10 flex flex-col justify-center overflow-y-auto custom-scrollbar">
              <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-3 text-white leading-tight">
                {obraSelecionada.name}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {obraSelecionada.first_air_date ? obraSelecionada.first_air_date.substring(0,4) : "Lançamento"}
                </span>
                <span className="bg-white/10 border border-white/10 text-purple-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  ⭐ {obraSelecionada.vote_average ? obraSelecionada.vote_average.toFixed(1) : "N/A"}
                </span>
                <span className="bg-white/10 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  TV SHOW
                </span>
              </div>

              <p className="text-gray-400 text-xs sm:text-sm mb-8 leading-relaxed italic line-clamp-5">
                {obraSelecionada.overview || "A plataforma ainda não disponibilizou uma sinopse em português para esta série."}
              </p>

              <div className="space-y-3 mt-auto">
                <button onClick={salvarNoPerfil} disabled={salvando} className="w-full bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 flex items-center justify-center gap-2">
                  {salvando ? "A processar..." : <>📺 Rastrear no Perfil</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-32 sm:pt-40 text-center">
        <h1 className="text-4xl sm:text-6xl font-black uppercase italic mb-2 tracking-tighter">
          ACERVO MUNDIAL <span className="text-purple-500">SÉRIES</span>
        </h1>
        <p className="text-gray-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-10">O que vamos maratonar? Busque, filtre e acompanhe.</p>
        
        {/* BARRA DE PESQUISA */}
        <form onSubmit={buscarTexto} className="relative mb-8 max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="Ex: Breaking Bad, Stranger Things..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
            className="w-full bg-[#111111] border border-white/5 rounded-full py-4 pl-6 pr-16 outline-none focus:border-purple-500 transition-all text-sm shadow-xl" 
          />
          <button type="submit" disabled={buscando} className="absolute right-2 top-2 bottom-2 bg-white/5 hover:bg-purple-600 w-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50">
            🔎
          </button>
        </form>

        {/* PÍLULAS DE CATEGORIAS */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-12 max-w-4xl mx-auto snap-x snap-mandatory px-4 sm:px-0">
          {categorias.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => buscarPorCategoria(cat.id)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center border ${categoriaAtiva === cat.id ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#111111] border-white/5 text-gray-500 hover:text-white hover:border-white/20'}`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* RESULTADOS */}
        {buscando ? (
          <div className="py-20 animate-pulse text-purple-500 font-black tracking-widest text-xs uppercase">Procurando na rede...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 animate-fade-in-up text-left pb-10">
            {resultados.map((s, idx) => {
              if(!s.poster_path) return null;
              return (
                <div key={`${s.id}-${idx}`} onClick={() => setObraSelecionada(s)} className="relative group cursor-pointer bg-[#111111] rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all overflow-hidden flex flex-col shadow-lg">
                  <div className="relative w-full aspect-[2/3] overflow-hidden">
                    <img src={`https://image.tmdb.org/t/p/w500${s.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={s.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>
                    
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-white/10 text-purple-500 text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                      ⭐ {s.vote_average ? s.vote_average.toFixed(1) : "N/A"}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white line-clamp-2 leading-tight drop-shadow-md">{s.name}</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">+ Adicionar</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  );
}