/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function OtakuPremium() {
  const [user, setUser] = useState(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState("em_alta");

  // Estado do Modal Premium
  const [obraSelecionada, setObraSelecionada] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const categorias = [
    { id: "em_alta", nome: "🔥 Em Alta", url: "https://api.jikan.moe/v4/seasons/now?limit=18" },
    { id: "shounen", nome: "⚔️ Shounen", url: "https://api.jikan.moe/v4/anime?genres=27&order_by=score&sort=desc&limit=18" },
    { id: "romance", nome: "🌸 Romance", url: "https://api.jikan.moe/v4/anime?genres=22&order_by=score&sort=desc&limit=18" },
    { id: "comedia", nome: "😂 Comédia", url: "https://api.jikan.moe/v4/anime?genres=4&order_by=score&sort=desc&limit=18" },
    { id: "isekai", nome: "✨ Isekai", url: "https://api.jikan.moe/v4/anime?genres=62&order_by=score&sort=desc&limit=18" },
    { id: "terror", nome: "🧛 Terror", url: "https://api.jikan.moe/v4/anime?genres=14&order_by=score&sort=desc&limit=18" }
  ];

  useEffect(() => {
    onAuthStateChanged(auth, u => setUser(u));
    buscarPorCategoria("em_alta");
  }, []);

  const buscarPorCategoria = async (catId) => {
    setCategoriaAtiva(catId);
    setBuscando(true);
    setBusca(""); // Limpa a busca por texto
    const cat = categorias.find(c => c.id === catId);
    try {
      const res = await fetch(cat.url);
      const d = await res.json();
      
      const unicos = [];
      const map = new Set();
      (d.data || []).forEach(anime => {
          if(!map.has(anime.mal_id)) {
              map.add(anime.mal_id);
              unicos.push(anime);
          }
      });
      setResultados(unicos);
    } catch(e) {
      toast.error("Erro ao buscar animes.");
    } finally { setBuscando(false); }
  };

  const buscarTexto = async (e) => {
    e.preventDefault(); 
    if(!busca.trim()) return;
    setCategoriaAtiva(""); // Desmarca as pílulas
    setBuscando(true);
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(busca)}&limit=18&order_by=score&sort=desc`);
      const d = await res.json(); 
      setResultados(d.data || []);
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
        tipo: "Anime", 
        titulo: obraSelecionada.title_english || obraSelecionada.title,
        capa: obraSelecionada.images?.jpg?.large_image_url || obraSelecionada.images?.jpg?.image_url, 
        progresso: 0, 
        total: obraSelecionada.episodes || 12,
        sinopse: obraSelecionada.synopsis ? obraSelecionada.synopsis.substring(0,250) + "..." : "Sem sinopse disponível.", 
        dataCriacao: new Date().toISOString()
      });
      toast.dismiss(t); 
      toast.success("Adicionado à sua lista! 🎌");
      setObraSelecionada(null);
    } catch(e) { 
      toast.dismiss(t); 
      toast.error("Erro ao salvar.");
    } finally { setSalvando(false); }
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 font-sans">
      <Navbar />
      
      {/* MODAL PREMIUM ESTILO "ACERVO" */}
      {obraSelecionada && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer transition-opacity" onClick={() => setObraSelecionada(null)}></div>
          
          <div className="relative w-full max-w-4xl bg-[#111111] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 animate-fade-in-up shadow-[0_0_50px_rgba(249,115,22,0.15)] flex flex-col md:flex-row max-h-[90vh]">
            
            <button onClick={() => setObraSelecionada(null)} className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-red-600 rounded-full text-white font-black transition-colors flex items-center justify-center">✕</button>

            {/* Imagem Flutuante (Esquerda Desktop / Topo Mobile) */}
            <div className="w-full md:w-[40%] relative flex justify-center items-end md:items-center bg-black min-h-[250px] md:min-h-[500px]">
              <div className="absolute inset-0 opacity-40 blur-2xl scale-110" style={{ backgroundImage: `url(${obraSelecionada.images?.jpg?.large_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#111111] via-transparent to-transparent"></div>
              
              <img src={obraSelecionada.images?.jpg?.large_image_url} alt={obraSelecionada.title} className="w-40 sm:w-56 md:w-64 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-white/10 relative z-20 translate-y-12 md:translate-y-0" />
            </div>

            {/* Conteúdo (Direita Desktop / Baixo Mobile) */}
            <div className="w-full md:w-[60%] p-6 md:p-10 pt-16 md:pt-10 flex flex-col justify-center overflow-y-auto custom-scrollbar">
              <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-3 text-white leading-tight">
                {obraSelecionada.title_english || obraSelecionada.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {obraSelecionada.year || "Lançamento"}
                </span>
                <span className="bg-white/10 border border-white/10 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  ⭐ {obraSelecionada.score || "N/A"}
                </span>
                <span className="bg-white/10 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {obraSelecionada.episodes ? `${obraSelecionada.episodes} EPS` : 'Em Andamento'}
                </span>
              </div>

              <p className="text-gray-400 text-xs sm:text-sm mb-8 leading-relaxed italic line-clamp-5">
                {obraSelecionada.synopsis || "O MyAnimeList não forneceu uma sinopse em inglês/português para esta obra ainda."}
              </p>

              {/* Botões de Ação */}
              <div className="space-y-3 mt-auto">
                <button onClick={salvarNoPerfil} disabled={salvando} className="w-full bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] disabled:opacity-50 flex items-center justify-center gap-2">
                  {salvando ? "A processar..." : <>🔥 Rastrear no Perfil</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-32 sm:pt-40 text-center">
        <h1 className="text-4xl sm:text-6xl font-black uppercase italic mb-2 tracking-tighter">
          ACERVO <span className="text-orange-500">OTAKU</span>
        </h1>
        <p className="text-gray-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-10">O que vamos acompanhar? Busque, filtre e adicione.</p>
        
        {/* BARRA DE PESQUISA */}
        <form onSubmit={buscarTexto} className="relative mb-8 max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="Ex: Shingeki no Kyojin..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
            className="w-full bg-[#111111] border border-white/5 rounded-full py-4 pl-6 pr-16 outline-none focus:border-orange-500 transition-all text-sm shadow-xl" 
          />
          <button type="submit" disabled={buscando} className="absolute right-2 top-2 bottom-2 bg-white/5 hover:bg-orange-600 w-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50">
            🔎
          </button>
        </form>

        {/* PÍLULAS DE CATEGORIAS COM SNAP SCROLL */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-12 max-w-4xl mx-auto snap-x snap-mandatory px-4 sm:px-0">
          {categorias.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => buscarPorCategoria(cat.id)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center border ${categoriaAtiva === cat.id ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-[#111111] border-white/5 text-gray-500 hover:text-white hover:border-white/20'}`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* RESULTADOS */}
        {buscando ? (
          <div className="py-20 animate-pulse text-orange-500 font-black tracking-widest text-xs uppercase">Buscando no Japão...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 animate-fade-in-up text-left pb-10">
            {resultados.map((a, idx) => (
              <div key={`${a.mal_id}-${idx}`} onClick={() => setObraSelecionada(a)} className="relative group cursor-pointer bg-[#111111] rounded-2xl border border-white/5 hover:border-orange-500/50 transition-all overflow-hidden flex flex-col shadow-lg">
                <div className="relative w-full aspect-[2/3] overflow-hidden">
                  <img src={a.images?.jpg?.large_image_url || a.images?.jpg?.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={a.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80"></div>
                  
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-white/10 text-orange-500 text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                    ⭐ {a.score || "N/A"}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white line-clamp-2 leading-tight drop-shadow-md">{a.title_english || a.title}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">+ Adicionar</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}