/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function MusicasPremium() {
  const [user, setUser] = useState(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [categoriaAtiva, setCategoriaAtiva] = useState("em_alta");

  // Estado do Modal Premium
  const [obraSelecionada, setObraSelecionada] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const categorias = [
    { id: "em_alta", nome: "🔥 Hits Mundiais", url: "https://itunes.apple.com/search?term=hits&entity=song&limit=18" },
    { id: "pop", nome: "🎤 Pop", url: "https://itunes.apple.com/search?term=pop&entity=song&limit=18" },
    { id: "rock", nome: "🎸 Rock", url: "https://itunes.apple.com/search?term=rock&entity=song&limit=18" },
    { id: "hiphop", nome: "🎷 Hip-Hop", url: "https://itunes.apple.com/search?term=hip+hop&entity=song&limit=18" },
    { id: "eletronica", nome: "🎧 Eletrônica", url: "https://itunes.apple.com/search?term=electronic&entity=song&limit=18" }
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
      toast.error("Erro ao buscar músicas.");
    } finally { setBuscando(false); }
  };

  const buscarTexto = async (e) => {
    e.preventDefault(); 
    if(!busca.trim()) return;
    setCategoriaAtiva(""); 
    setBuscando(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(busca)}&entity=song&limit=18`);
      const d = await res.json(); 
      setResultados(d.results || []);
    } catch(err) {
      toast.error("Erro na busca.");
    } finally { setBuscando(false); }
  };

  const salvarNoPerfil = async () => {
    if(!user) return toast.error("Faça login para adicionar ao perfil!");
    setSalvando(true);
    const capaHD = obraSelecionada.artworkUrl100 ? obraSelecionada.artworkUrl100.replace('100x100bb', '600x600bb') : "https://via.placeholder.com/600";
    const t = toast.loading("Guardando na Playlist...");
    try {
      await addDoc(collection(db, "perfil_cultura"), {
        uid: user.uid, 
        tipo: "Música", 
        titulo: obraSelecionada.trackName || "Faixa Desconhecida",
        capa: capaHD, 
        progresso: 0, 
        total: 1, 
        sinopse: obraSelecionada.collectionName ? `Álbum: ${obraSelecionada.collectionName}` : "Single", 
        artista: obraSelecionada.artistName || "Desconhecido",
        audioUrl: obraSelecionada.previewUrl || null,
        dataCriacao: new Date().toISOString()
      });
      toast.dismiss(t); 
      toast.success("Música salva com sucesso! 🎵");
      setObraSelecionada(null);
    } catch(e) { 
      toast.dismiss(t); 
      toast.error("Erro ao salvar.");
    } finally { setSalvando(false); }
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 font-sans">
      <Navbar />
      
      {/* MODAL PREMIUM */}
      {obraSelecionada && (() => {
        const capaHD = obraSelecionada.artworkUrl100 ? obraSelecionada.artworkUrl100.replace('100x100bb', '600x600bb') : "https://via.placeholder.com/600";
        return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer transition-opacity" onClick={() => setObraSelecionada(null)}></div>
          
          <div className="relative w-full max-w-4xl bg-[#111111] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 animate-fade-in-up shadow-[0_0_50px_rgba(236,72,153,0.15)] flex flex-col md:flex-row max-h-[90vh]">
            <button onClick={() => setObraSelecionada(null)} className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-red-600 rounded-full text-white font-black transition-colors flex items-center justify-center">✕</button>

            {/* Imagem e Player */}
            <div className="w-full md:w-[45%] relative flex flex-col justify-center items-center bg-black min-h-[300px] md:min-h-[500px] p-6">
              <div className="absolute inset-0 opacity-30 blur-3xl scale-125" style={{ backgroundImage: `url(${capaHD})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              <img src={capaHD} alt={obraSelecionada.trackName} className="w-48 sm:w-64 md:w-72 aspect-square object-cover rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-white/10 relative z-20 mb-6" />
              
              {obraSelecionada.previewUrl && (
                <div className="w-full max-w-[250px] relative z-20">
                  <audio controls src={obraSelecionada.previewUrl} className="w-full h-10 outline-none rounded-full" controlsList="nodownload noplaybackrate"></audio>
                </div>
              )}
            </div>

            {/* Conteúdo */}
            <div className="w-full md:w-[55%] p-6 md:p-10 flex flex-col justify-center overflow-y-auto custom-scrollbar bg-gradient-to-l from-[#111111] to-[#0a0a0a]">
              <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-1 text-white leading-tight">
                {obraSelecionada.trackName}
              </h2>
              <p className="text-xl font-bold text-pink-500 uppercase tracking-widest mb-6">
                {obraSelecionada.artistName}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-pink-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {obraSelecionada.primaryGenreName || "Música"}
                </span>
                <span className="bg-white/10 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Álbum: {obraSelecionada.collectionName || "Single"}
                </span>
              </div>

              <div className="space-y-3 mt-auto pt-8">
                <button onClick={salvarNoPerfil} disabled={salvando} className="w-full bg-pink-600 hover:bg-pink-500 text-white px-8 py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(236,72,153,0.4)] disabled:opacity-50 flex items-center justify-center gap-2">
                  {salvando ? "A processar..." : <>🎵 Salvar no Perfil</>}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      <div className="max-w-6xl mx-auto px-4 pt-32 sm:pt-40 text-center">
        <h1 className="text-4xl sm:text-6xl font-black uppercase italic mb-2 tracking-tighter">
          ACERVO <span className="text-pink-500">MÚSICAS</span>
        </h1>
        <p className="text-gray-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-10">Qual é a trilha sonora de hoje? Busque, ouça e adicione.</p>
        
        {/* BARRA DE PESQUISA */}
        <form onSubmit={buscarTexto} className="relative mb-8 max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="Ex: The Weeknd, Linkin Park, Dua Lipa..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
            className="w-full bg-[#111111] border border-white/5 rounded-full py-4 pl-6 pr-16 outline-none focus:border-pink-500 transition-all text-sm shadow-xl" 
          />
          <button type="submit" disabled={buscando} className="absolute right-2 top-2 bottom-2 bg-white/5 hover:bg-pink-600 w-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50">
            🔎
          </button>
        </form>

        {/* PÍLULAS DE CATEGORIAS */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-12 max-w-4xl mx-auto snap-x snap-mandatory px-4 sm:px-0">
          {categorias.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => buscarPorCategoria(cat.id)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center border ${categoriaAtiva === cat.id ? 'bg-pink-600 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'bg-[#111111] border-white/5 text-gray-500 hover:text-white hover:border-white/20'}`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* RESULTADOS */}
        {buscando ? (
          <div className="py-20 animate-pulse text-pink-500 font-black tracking-widest text-xs uppercase">Conectando aos estúdios...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 animate-fade-in-up text-left pb-10">
            {resultados.map((m, idx) => {
              const capaGrid = m.artworkUrl100 ? m.artworkUrl100.replace('100x100bb', '300x300bb') : "https://via.placeholder.com/300";
              return (
                <div key={`${m.trackId}-${idx}`} onClick={() => setObraSelecionada(m)} className="relative group cursor-pointer bg-[#111111] rounded-2xl border border-white/5 hover:border-pink-500/50 transition-all overflow-hidden flex flex-col shadow-lg">
                  <div className="relative w-full aspect-square overflow-hidden bg-black">
                    <img src={capaGrid} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={m.trackName} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white line-clamp-1 leading-tight drop-shadow-md">{m.trackName}</span>
                    <span className="text-[8px] font-bold text-pink-400 uppercase tracking-widest truncate mb-1">{m.artistName}</span>
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