"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

// 🪄 AS SUAS CHAVES AQUI
const TMDB_API_KEY = "5e0b606e87348f0592b761526df56825";
const YOUTUBE_API_KEY = "AIzaSyDq8o6rJNZpvyNWyA1wZqv3j09X9f4zPIw"; 

export default function GestorCultura({ usuarioLogado, recarregarDados }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); 
  const [tipo, setTipo] = useState("Série");
  
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(""); 

  const [itemEditando, setItemEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false); // 🪄 NOVO ESTADO DE EXCLUSÃO
  
  const [form, setForm] = useState({
    titulo: "", capa: "", sinopse: "", artista: "", 
    temporada: 1, progresso: 0, total: 0, audioUrl: "", tier: "Nenhum"
  });

  const theme = {
    Série: "purple", Anime: "orange", Livro: "emerald", Mangá: "red", Música: "pink"
  }[tipo] || "blue";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    window.abrirGestorCultura = (tipoSolicitado, itemExistente = null) => {
      setTipo(tipoSolicitado || "Série");
      setTrailerUrl(""); 
      setConfirmDelete(false); // Garante que a tela de excluir fecha ao abrir o modal
      
      if (itemExistente) {
        setForm({
          titulo: itemExistente.titulo || "", capa: itemExistente.capa || "",
          sinopse: itemExistente.sinopse || "", artista: itemExistente.artista || "",
          temporada: itemExistente.temporada || 1, progresso: itemExistente.progresso || 0,
          total: itemExistente.total || 0, audioUrl: itemExistente.audioUrl || "",
          tier: itemExistente.tier || "Nenhum"
        });
        setItemEditando(itemExistente);
        setStep(2); 
      } else {
        setForm({ titulo: "", capa: "", sinopse: "", artista: "", temporada: 1, progresso: 0, total: 0, audioUrl: "", tier: "Nenhum" });
        setQuery(""); setResultados([]); setItemEditando(null);
        setStep(1); 
      }
      setIsOpen(true);
    };
    return () => { delete window.abrirGestorCultura; };
  }, []);

  const buscarRecomendacoes = async () => {
    setBuscando(true);
    let list = [];
    try {
      if (tipo === "Série") {
        const res = await fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=pt-BR`);
        const data = await res.json();
        list = (data.results || []).slice(0, 6).map(r => ({ id: r.id, titulo: r.name, capa: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : "", sinopse: r.overview, total: 10 }));
      } 
      else if (tipo === "Anime" || tipo === "Mangá") {
        const res = await fetch(`https://api.jikan.moe/v4/top/${tipo.toLowerCase()}?limit=6`);
        const data = await res.json();
        list = (data.data || []).map(r => ({ titulo: r.title_english || r.title, capa: r.images?.jpg?.image_url, sinopse: r.synopsis, total: tipo === "Anime" ? (r.episodes || 12) : (r.chapters || r.volumes || 50) }));
      } 
      else if (tipo === "Livro") {
        const res = await fetch(`https://openlibrary.org/subjects/bestsellers.json?limit=6`);
        const data = await res.json();
        list = (data.works || []).map(r => ({ titulo: r.title, capa: r.cover_id ? `https://covers.openlibrary.org/b/id/${r.cover_id}-M.jpg` : "", sinopse: `Autor: ${r.authors?.[0]?.name || "Desconhecido"}`, total: 200, artista: r.authors?.[0]?.name }));
      } 
      else if (tipo === "Música") {
        if (YOUTUBE_API_KEY === "COLOQUE_AQUI_A_SUA_CHAVE_DO_YOUTUBE") return setBuscando(false);
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=top+hits+official+music+video&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        list = (data.items || []).map(r => ({
          titulo: r.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"),
          capa: r.snippet.thumbnails.high.url, sinopse: r.snippet.channelTitle, artista: r.snippet.channelTitle, audioUrl: r.id.videoId, total: 1
        }));
      }
      setResultados(list);
    } catch (e) { console.error(e); }
    setBuscando(false);
  };

  const buscarNaAPIAutocomplete = async () => {
    setBuscando(true);
    let list = [];
    try {
      if (tipo === "Série") {
        const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
        const data = await res.json();
        list = (data.results || []).slice(0, 6).map(r => ({ id: r.id, titulo: r.name, capa: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : "", sinopse: r.overview, total: 10 }));
      } 
      else if (tipo === "Anime" || tipo === "Mangá") {
        const endp = tipo === "Anime" ? "anime" : "manga";
        const res = await fetch(`https://api.jikan.moe/v4/${endp}?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        list = (data.data || []).map(r => ({ titulo: r.title_english || r.title, capa: r.images?.jpg?.image_url, sinopse: r.synopsis, total: tipo === "Anime" ? (r.episodes || 12) : (r.chapters || r.volumes || 50) }));
      } 
      else if (tipo === "Livro") {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        list = (data.docs || []).map(r => ({ titulo: r.title, capa: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-M.jpg` : "", sinopse: `Autor: ${r.author_name?.[0] || "Desconhecido"}`, total: r.number_of_pages_median || 200, artista: r.author_name?.[0] }));
      } 
      else if (tipo === "Música") {
        if (YOUTUBE_API_KEY === "COLOQUE_AQUI_A_SUA_CHAVE_DO_YOUTUBE") { toast.error("API Key do YouTube ausente!"); setBuscando(false); return; }
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query + " official audio")}&type=video&key=${YOUTUBE_API_KEY}`);
        const data = await res.json();
        list = (data.items || []).map(r => ({
          titulo: r.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"),
          capa: r.snippet.thumbnails.high.url, sinopse: r.snippet.channelTitle, artista: r.snippet.channelTitle, audioUrl: r.id.videoId, total: 1
        }));
      }
      setResultados(list);
    } catch (e) { console.error(e); }
    setBuscando(false);
  };

  useEffect(() => {
    if (query.trim().length > 2) {
      const delayDebounceFn = setTimeout(() => { buscarNaAPIAutocomplete(); }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else if (query.trim().length === 0 && step === 1) {
      buscarRecomendacoes();
    }
  }, [query, tipo, step]);

  useEffect(() => {
    if (step === 2 && (tipo === "Série" || tipo === "Anime") && form.titulo && !trailerUrl) {
      const fetchTrailer = async () => {
        try {
          if (tipo === "Série") {
            const resBusca = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(form.titulo)}`);
            const dataBusca = await resBusca.json();
            if (dataBusca.results?.[0]?.id) {
              const resVid = await fetch(`https://api.themoviedb.org/3/tv/${dataBusca.results[0].id}/videos?api_key=${TMDB_API_KEY}`);
              const dataVid = await resVid.json();
              const trailer = dataVid.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
              if (trailer) setTrailerUrl(trailer.key);
            }
          } else if (tipo === "Anime") {
            const resBusca = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(form.titulo)}&limit=1`);
            const dataBusca = await resBusca.json();
            if (dataBusca.data?.[0]?.trailer?.youtube_id) setTrailerUrl(dataBusca.data[0].trailer.youtube_id);
          }
        } catch(e) {}
      };
      fetchTrailer();
    }
  }, [step, form.titulo, tipo, trailerUrl]);

  const selecionarItem = async (item) => {
    let exactData = { ...item };
    if (tipo === "Série" && item.id) {
      const t = toast.loading("Buscando dados...");
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${TMDB_API_KEY}&language=pt-BR`);
        const data = await res.json();
        exactData.total = data.number_of_episodes || 10;
        exactData.temporada = data.number_of_seasons || 1;
        toast.dismiss(t);
      } catch(e) { toast.dismiss(t); }
    }
    setForm({ ...form, ...exactData, progresso: 0, tier: "Nenhum" });
    if(!exactData.temporada && (tipo === "Série" || tipo === "Anime")) setForm(prev => ({...prev, temporada: 1}));
    setQuery(""); setResultados([]); setStep(2);
  };

  const salvarRegistro = async (e) => {
    e.preventDefault();
    if(!usuarioLogado) return toast.error("Sessão expirada.");
    setSalvando(true);
    const t = toast.loading("A salvar...");
    try {
      const payload = { uid: usuarioLogado.uid, tipo, ...form, dataAtualizacao: new Date().toISOString() };
      if (itemEditando) {
        await updateDoc(doc(db, "perfil_cultura", itemEditando.id), payload);
        toast.success("Atualizado! 🚀", { style: { background: '#111', color: '#fff', border: '1px solid #22c55e' }});
      } else {
        payload.dataCriacao = new Date().toISOString();
        await addDoc(collection(db, "perfil_cultura"), payload);
        toast.success("Adicionado! 🎉", { style: { background: '#111', color: '#fff', border: '1px solid #22c55e' }});
      }
      toast.dismiss(t);
      if (recarregarDados) recarregarDados();
      setIsOpen(false);
    } catch (error) { toast.dismiss(t); toast.error("Erro ao salvar."); }
    setSalvando(false);
  };

  // 🪄 A NOVA FUNÇÃO QUE APAGA DIRETO NO FIREBASE
  const executarApagar = async () => {
    const t = toast.loading("A remover...");
    try {
      await deleteDoc(doc(db, "perfil_cultura", itemEditando.id));
      toast.dismiss(t); 
      toast.success("Removido com sucesso! 🗑️", { style: { background: '#111', color: '#fff', border: '1px solid #ef4444' }});
      if (recarregarDados) recarregarDados();
      setIsOpen(false);
      setConfirmDelete(false);
    } catch(e) { 
      toast.dismiss(t); 
      toast.error("Erro ao remover."); 
      setConfirmDelete(false); 
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md" onClick={() => setIsOpen(false)}>
      
      <style>{`
        .perspective-container { perspective: 1500px; }
        .book-cover { transform-origin: left center; animation: openBook 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; transform-style: preserve-3d; }
        @keyframes openBook { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(-135deg); } }
        .book-front { backface-visibility: hidden; }
        .book-back { transform: rotateY(180deg); backface-visibility: hidden; }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div className={`bg-[#111111] border border-${theme}-500/30 rounded-[2rem] w-full max-w-4xl h-[550px] max-h-[90vh] shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col md:flex-row relative overflow-hidden`} onClick={e => e.stopPropagation()}>
        
        {/* 🪄 OVERLAY DE CONFIRMAÇÃO DE EXCLUSÃO (Por cima de tudo no modal) */}
        {confirmDelete && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 fade-in">
             <div className="bg-[#0a0a0a] border border-red-500/30 p-6 sm:p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.3)] flex flex-col items-center text-center max-w-sm w-full">
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 border border-red-500/50">
                  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-8 h-8 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-lg sm:text-xl mb-1">Apagar Obra?</h3>
                <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase mb-6 leading-relaxed">Esta ação vai remover o item da sua coleção para sempre.</p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all border border-white/10">Cancelar</button>
                  <button onClick={executarApagar} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]">Sim, Apagar</button>
                </div>
             </div>
          </div>
        )}

        {/* Botão de Fechar Modal */}
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white z-50 bg-black/50 hover:bg-red-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center font-black shadow-lg">✕</button>

        {/* STEP 1: BUSCA GLOBAL */}
        {step === 1 && (
          <div className="w-full p-6 sm:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
            
            <div className="flex flex-col mb-6">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                Explorar <span className={`text-${theme}-500 drop-shadow-md`}>{tipo}s</span>
              </h2>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Adicione obras à sua coleção pessoal</p>
            </div>
            
            <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-6 overflow-x-auto hide-scrollbar shrink-0">
              {['Série', 'Anime', 'Livro', 'Mangá', 'Música'].map(t => (
                <button key={t} onClick={() => { setTipo(t); setQuery(""); setResultados([]); }} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${tipo === t ? `bg-${theme}-600 text-white shadow-[0_0_15px_rgba(var(--color-${theme}-500),0.4)] border border-${theme}-400` : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>{t}</button>
              ))}
            </div>

            <div className="relative mb-6 z-40 shrink-0 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors">
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
              </span>
              <input 
                type="text" 
                placeholder={`Pesquisar ${tipo}...`} 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                className={`w-full bg-[#161616] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-white outline-none focus:border-${theme}-500 shadow-inner transition-all focus:shadow-[0_0_20px_rgba(var(--color-${theme}-500),0.2)]`} 
              />
              {buscando && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>}
            </div>

            <div className="flex flex-col flex-1 pb-4">
              {query.length === 0 && !buscando && (
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5 text-yellow-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 
                  Sugestões em Alta
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultados.map((r, i) => (
                  <div key={i} onClick={() => selecionarItem(r)} className={`flex items-center gap-3 p-2 bg-black/30 hover:bg-${theme}-500/20 cursor-pointer transition-all border border-white/5 hover:border-${theme}-500/40 rounded-2xl group shadow-lg`}>
                    <img src={r.capa || 'https://via.placeholder.com/150'} className={`w-14 ${tipo === 'Música' ? 'h-14 rounded-xl' : 'h-20 rounded-lg'} object-cover shadow-md group-hover:scale-105 transition-transform border border-white/10`} alt="" />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <span className="text-xs font-black text-white uppercase truncate">{r.titulo}</span>
                      <span className={`text-[9px] text-${theme}-400 font-bold uppercase truncate mt-0.5`}>{r.sinopse || r.artista}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors mr-2 shrink-0">
                      <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                    </div>
                  </div>
                ))}
              </div>
              {!buscando && query.length > 2 && resultados.length === 0 && (
                <div className="text-center opacity-40 pt-10 flex-1 flex flex-col items-center justify-center">
                  <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="w-16 h-16 mb-4 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.54l-1.59-1.59"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nenhum resultado encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: EDIÇÃO COM O LIVRO 3D E VIDEOCLIPE */}
        {step === 2 && (
          <>
            <div className="w-full md:w-2/5 bg-[#0a0a0a] flex flex-col items-center justify-center p-6 border-r border-white/5 relative overflow-hidden perspective-container">
              <div className="absolute inset-0 opacity-20 blur-3xl scale-150" style={{ backgroundImage: `url(${form.capa})`, backgroundSize: 'cover' }}></div>
              <div className="relative w-36 h-52 sm:w-48 sm:h-72 z-10 drop-shadow-2xl flex items-center justify-center">
                <div className="absolute inset-0 bg-[#1a1a1a] rounded-r-xl border border-white/10 shadow-inner flex flex-col items-center justify-center overflow-hidden">
                  {((tipo === 'Série' || tipo === 'Anime') && trailerUrl) || (tipo === 'Música' && form.audioUrl) ? (
                    <div className="w-full h-full relative">
                      <iframe className="absolute inset-0 w-full h-full object-cover scale-[1.35] opacity-80 pointer-events-none" src={`https://www.youtube.com/embed/${tipo === 'Música' ? form.audioUrl : trailerUrl}?autoplay=1&mute=1&controls=0&loop=1&playlist=${tipo === 'Música' ? form.audioUrl : trailerUrl}`} allow="autoplay" />
                      <div className="absolute bottom-2 left-0 w-full text-center z-10"><span className={`bg-${theme}-600/80 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full backdrop-blur-md`}>{tipo === 'Música' ? 'Videoclipe' : 'Trailer Ativo'}</span></div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#f0ebd8] flex flex-col items-center justify-center opacity-90 p-4 text-center">
                       <span className="text-4xl opacity-30 mb-2">📖</span>
                       <span className="text-[8px] font-black uppercase text-[#8b826b] tracking-widest leading-tight">Página<br/>de Registo</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 book-cover flex items-center justify-center">
                  <img src={form.capa} className={`absolute inset-0 w-full h-full object-cover rounded-r-xl shadow-[5px_0_15px_rgba(0,0,0,0.8)] book-front border border-white/10`} alt="" />
                  <div className="absolute inset-0 w-full h-full bg-black/90 rounded-l-xl book-back flex items-center justify-center border border-white/10">
                    <img src={form.capa} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm rounded-l-xl" alt="" />
                  </div>
                </div>
              </div>
              <h3 className="font-black text-center uppercase italic tracking-tighter text-white text-sm sm:text-lg mt-6 relative z-10 leading-tight drop-shadow-lg">{form.titulo}</h3>
            </div>

            <div className="w-full md:w-3/5 p-6 sm:p-8 bg-[#111111] overflow-y-auto custom-scrollbar flex flex-col">
              <div className="mb-6 shrink-0">
                <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter mb-1">Status da <span className={`text-${theme}-500`}>Obra</span></h2>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest border-b border-white/5 pb-3">Configure o seu avanço e avaliação</p>
              </div>
              <form onSubmit={salvarRegistro} className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">O SEU RANKING (TIER)</label>
                  <div className="flex gap-1.5 sm:gap-2">
                    {['Nenhum', 'S', 'A', 'B', 'C', 'D'].map(tier => {
                      const cores = { S: "yellow", A: "purple", B: "blue", C: "green", D: "gray", Nenhum: "zinc" };
                      const cor = cores[tier];
                      return (
                        <button key={tier} type="button" onClick={() => setForm({...form, tier})} className={`flex-1 py-2 sm:py-2.5 rounded-lg font-black text-[10px] sm:text-xs transition-all border ${form.tier === tier ? `bg-${cor}-500 text-white shadow-[0_0_10px_rgba(var(--color-${cor}-500),0.4)] border-${cor}-400` : 'bg-[#1a1a1a] text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}`}>
                          {tier === 'Nenhum' ? '✖' : tier}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(tipo === 'Série' || tipo === 'Anime') && (
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Temporada</label>
                      <input type="number" required value={form.temporada} onChange={e => setForm({...form, temporada: e.target.value})} className={`w-full bg-[#1a1a1a] border border-white/5 rounded-lg p-3 text-[10px] sm:text-xs font-black text-white outline-none focus:border-${theme}-500 text-center shadow-inner`} />
                    </div>
                  )}
                  {(tipo !== 'Música') && (
                    <>
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">{tipo === 'Série' || tipo === 'Anime' ? 'Episódio Atual' : 'Página Atual'}</label>
                        <input type="number" required value={form.progresso} onChange={e => setForm({...form, progresso: e.target.value})} className={`w-full bg-[#1a1a1a] border border-white/5 rounded-lg p-3 text-[10px] sm:text-xs font-black text-white outline-none focus:border-${theme}-500 text-center shadow-inner`} />
                      </div>
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Total</label>
                        <input type="number" required value={form.total} onChange={e => setForm({...form, total: e.target.value})} className={`w-full bg-[#1a1a1a] border border-white/5 rounded-lg p-3 text-[10px] sm:text-xs font-black text-white outline-none focus:border-${theme}-500 text-center shadow-inner`} />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 min-h-[100px] flex flex-col">
                  <label className="text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1.5 block">Sua Opinião / Anotação</label>
                  <textarea placeholder="O que achou desta obra? (Seus amigos vão ler!)" value={form.sinopse} onChange={e => setForm({...form, sinopse: e.target.value})} className={`w-full bg-[#1a1a1a] border border-white/5 rounded-lg p-3 sm:p-4 text-[10px] sm:text-xs font-medium text-gray-300 outline-none focus:border-${theme}-500 resize-none shadow-inner flex-1 leading-relaxed`} />
                </div>
                <div className="flex gap-3 pt-2 shrink-0 mt-2">
                  {/* 🪄 NOVO: O BOTÃO DA LIXEIRA AGORA ATIVA O ESTADO DE CONFIRMAÇÃO EM VEZ DO TOAST */}
                  {itemEditando && (
                    <button type="button" onClick={() => setConfirmDelete(true)} className="bg-red-900/20 border border-red-500/30 text-red-500 hover:bg-red-600 hover:text-white w-12 rounded-xl font-black transition-all flex items-center justify-center shrink-0">
                      <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                    </button>
                  )}
                  <button type="submit" disabled={salvando} className={`flex-1 bg-${theme}-600 hover:bg-${theme}-500 text-white font-black uppercase tracking-widest text-[10px] sm:text-xs py-3.5 sm:py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(0,0,0,0.4)] disabled:opacity-50`}>
                    {salvando ? "A processar..." : `💾 Salvar ${itemEditando ? 'Progresso' : ''}`}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (!mounted || !isOpen) return null;
  return createPortal(modalContent, document.body);
}