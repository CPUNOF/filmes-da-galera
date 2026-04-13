"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const TMDB_API_KEY = "5e0b606e87348f0592b761526df56825";

export default function GestorCultura({ usuarioLogado, recarregarDados }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); 
  const [tipo, setTipo] = useState("Série");
  
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [itemEditando, setItemEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  
  const [form, setForm] = useState({
    titulo: "", capa: "", sinopse: "", artista: "", 
    temporada: 1, progresso: 0, total: 0, audioUrl: "", tier: "Nenhum"
  });

  const theme = {
    Série: "purple", Anime: "orange", Livro: "emerald", Mangá: "red", Música: "pink"
  }[tipo] || "blue";

  // Escutador Global do Botão Adicionar
  useEffect(() => {
    window.abrirGestorCultura = (tipoSolicitado, itemExistente = null) => {
      setTipo(tipoSolicitado || "Série");
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

  // 🪄 EFEITO DE AUTOCOMPLETE (Debounce)
  // Aguarda o utilizador parar de digitar por 500ms antes de bater na API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        buscarNaAPIAutocomplete();
      } else {
        setResultados([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, tipo]);

  const buscarNaAPIAutocomplete = async () => {
    setBuscando(true);
    let list = [];
    try {
      if (tipo === "Série") {
        const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`);
        const data = await res.json();
        list = (data.results || []).slice(0, 6).map(r => ({
          id: r.id, // NECESSÁRIO PARA A RASPAGEM EXATA DEPOIS
          titulo: r.name, capa: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : "",
          sinopse: r.overview, total: 10 
        }));
      } 
      else if (tipo === "Anime" || tipo === "Mangá") {
        const endp = tipo === "Anime" ? "anime" : "manga";
        const res = await fetch(`https://api.jikan.moe/v4/${endp}?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        list = (data.data || []).map(r => ({
          titulo: r.title_english || r.title, capa: r.images?.jpg?.image_url,
          sinopse: r.synopsis, total: tipo === "Anime" ? (r.episodes || 12) : (r.chapters || r.volumes || 50)
        }));
      } 
      else if (tipo === "Livro") {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        list = (data.docs || []).map(r => ({
          titulo: r.title, capa: r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-M.jpg` : "",
          sinopse: `Autor: ${r.author_name?.[0] || "Desconhecido"}`, total: r.number_of_pages_median || 200, artista: r.author_name?.[0]
        }));
      } 
      else if (tipo === "Música") {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=6`);
        const data = await res.json();
        list = (data.results || []).map(r => ({
          titulo: r.trackName, capa: r.artworkUrl100?.replace("100x100", "300x300"),
          sinopse: r.collectionName, artista: r.artistName, audioUrl: r.previewUrl, total: 1
        }));
      }
      setResultados(list);
    } catch (error) { console.error(error); }
    setBuscando(false);
  };

  // 🪄 RASPAGEM EXATA E SELEÇÃO
  const selecionarItem = async (item) => {
    let exactData = { ...item };
    
    // Se for Série, entra nos servidores do TMDB para puxar a info exata da obra!
    if (tipo === "Série" && item.id) {
      const t = toast.loading("Buscando dados exatos do estúdio...");
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${item.id}?api_key=${TMDB_API_KEY}&language=pt-BR`);
        const data = await res.json();
        exactData.total = data.number_of_episodes || 10;
        exactData.temporada = data.number_of_seasons || 1;
        toast.dismiss(t);
      } catch(e) {
        toast.dismiss(t);
      }
    }

    setForm({ ...form, ...exactData, progresso: 0, tier: "Nenhum" });
    
    // Ajuste seguro para Temporadas
    if(!exactData.temporada && (tipo === "Série" || tipo === "Anime")) {
      setForm(prev => ({...prev, temporada: 1}));
    }

    setQuery(""); // Limpa o autocomplete
    setResultados([]);
    setStep(2);
  };

  const salvarRegistro = async (e) => {
    e.preventDefault();
    if(!usuarioLogado) return toast.error("Sessão expirada.");
    setSalvando(true);
    const t = toast.loading("A sincronizar com o Dossiê...");
    try {
      const payload = { uid: usuarioLogado.uid, tipo, ...form, dataAtualizacao: new Date().toISOString() };
      if (itemEditando) {
        await updateDoc(doc(db, "perfil_cultura", itemEditando.id), payload);
        toast.success("Marcadores atualizados! 🚀");
      } else {
        payload.dataCriacao = new Date().toISOString();
        await addDoc(collection(db, "perfil_cultura"), payload);
        toast.success("Adicionado ao Perfil! 🎉");
      }
      toast.dismiss(t);
      if (recarregarDados) recarregarDados();
      setIsOpen(false);
    } catch (error) {
      toast.dismiss(t); toast.error("Erro ao salvar.");
    }
    setSalvando(false);
  };

  const apagarRegistro = async () => {
    if(!confirm("Certeza que deseja remover esta obra da sua coleção?")) return;
    try {
      await deleteDoc(doc(db, "perfil_cultura", itemEditando.id));
      toast.success("Removido com sucesso! 🗑️");
      if (recarregarDados) recarregarDados();
      setIsOpen(false);
    } catch(e) { toast.error("Erro ao remover."); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className={`bg-[#111111] border border-${theme}-500/30 rounded-[2rem] w-full max-w-4xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in-up relative overflow-visible flex flex-col md:flex-row max-h-[90vh]`}>
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white z-50 bg-black/50 hover:bg-red-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center font-black">✕</button>

        {/* STEP 1: BUSCA GLOBAL COM AUTOCOMPLETE */}
        {step === 1 && (
          <div className="w-full p-6 md:p-10 flex flex-col h-full min-h-[500px]">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-white">
              Busca <span className={`text-${theme}-500`}>Inteligente</span>
            </h2>
            
            <div className="flex gap-2 bg-black/50 p-1.5 rounded-2xl border border-white/5 mb-6 overflow-x-auto hide-scrollbar snap-x">
              {['Série', 'Anime', 'Livro', 'Mangá', 'Música'].map(t => (
                <button key={t} onClick={() => { setTipo(t); setQuery(""); setResultados([]); }} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all snap-center shrink-0 ${tipo === t ? `bg-${theme}-600 text-white shadow-lg` : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
                  {t}
                </button>
              ))}
            </div>

            {/* BARRA DE AUTOCOMPLETE */}
            <div className="relative mb-6 z-50">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔎</span>
                <input 
                  type="text" 
                  placeholder={`Digite o nome do ${tipo}...`} 
                  value={query} 
                  onChange={e => setQuery(e.target.value)} 
                  className={`w-full bg-[#141414] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-white outline-none focus:border-${theme}-500 shadow-inner transition-all`} 
                />
                {buscando && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                )}
              </div>

              {/* DROPDOWN DE RESULTADOS FLUTUANTE */}
              {query.length > 2 && resultados.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar animate-fade-in-up">
                  {resultados.map((r, i) => (
                    <div 
                      key={i} 
                      onClick={() => selecionarItem(r)} 
                      className={`flex items-center gap-4 p-3 hover:bg-${theme}-500/20 cursor-pointer transition-colors border-b border-white/5 last:border-0 group`}
                    >
                      <img src={r.capa || 'https://via.placeholder.com/150'} className="w-12 h-16 object-cover rounded-md shadow-md group-hover:scale-105 transition-transform" alt="" />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-xs font-black text-white uppercase truncate drop-shadow-md">{r.titulo}</span>
                        <span className={`text-[9px] text-${theme}-400 font-bold uppercase truncate mt-0.5`}>{r.sinopse || r.artista}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto pt-10 text-center opacity-30">
              <span className="text-6xl grayscale">🔮</span>
              <p className="text-xs font-black uppercase tracking-widest mt-4">Digite para buscar nos bancos globais.</p>
            </div>
          </div>
        )}

        {/* STEP 2: MARCADORES E TIER LIST (Permanece Intacto) */}
        {step === 2 && (
          <>
            <div className="w-full md:w-2/5 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col items-center justify-center relative min-h-[250px] overflow-hidden rounded-l-[2rem]">
              <div className="absolute inset-0 opacity-20 blur-3xl scale-125" style={{ backgroundImage: `url(${form.capa})`, backgroundSize: 'cover' }}></div>
              <img src={form.capa || 'https://via.placeholder.com/300'} className={`w-32 md:w-full max-w-[200px] object-cover rounded-xl shadow-2xl border border-white/10 relative z-10 ${tipo === 'Música' ? 'aspect-square' : 'aspect-[2/3]'}`} alt="" />
              <h3 className="mt-6 text-center font-black uppercase text-white text-sm relative z-10 leading-tight drop-shadow-md">{form.titulo}</h3>
            </div>

            <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar bg-[#111111] rounded-r-[2rem]">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Status da <span className={`text-${theme}-500`}>Obra</span></h2>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-6 border-b border-white/5 pb-4">Configure o seu avanço e avaliação</p>

              <form onSubmit={salvarRegistro} className="flex flex-col gap-5 flex-1">
                
                {/* TIER LIST SELECTOR */}
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">O seu Ranking (Tier)</label>
                  <div className="flex gap-2">
                    {['S', 'A', 'B', 'C', 'D'].map(tier => {
                      const cores = { S: "yellow", A: "purple", B: "blue", C: "green", D: "gray" };
                      const cor = cores[tier];
                      return (
                        <button 
                          key={tier} type="button" 
                          onClick={() => setForm({...form, tier})} 
                          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${form.tier === tier ? `bg-${cor}-500 text-white shadow-[0_0_15px_rgba(var(--color-${cor}-500),0.5)] scale-105 border border-${cor}-400` : 'bg-[#141414] text-gray-500 border border-white/5 hover:bg-white/5'}`}
                        >
                          {tier}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {(tipo === 'Série' || tipo === 'Anime') && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Temporada</label>
                      <input type="number" required value={form.temporada} onChange={e => setForm({...form, temporada: e.target.value})} className={`w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-xs font-black text-white outline-none focus:border-${theme}-500 shadow-inner text-center`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Episódio Atual</label>
                      <input type="number" required value={form.progresso} onChange={e => setForm({...form, progresso: e.target.value})} className={`w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-xs font-black text-white outline-none focus:border-${theme}-500 shadow-inner text-center`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Total Eps.</label>
                      <input type="number" required value={form.total} onChange={e => setForm({...form, total: e.target.value})} className={`w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-xs font-black text-white outline-none focus:border-${theme}-500 shadow-inner text-center`} />
                    </div>
                  </div>
                )}

                {(tipo === 'Livro' || tipo === 'Mangá') && (
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Página / Cap. Atual</label>
                      <input type="number" required value={form.progresso} onChange={e => setForm({...form, progresso: e.target.value})} className={`w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-xs font-black text-white outline-none focus:border-${theme}-500 shadow-inner text-center`} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Total</label>
                      <input type="number" required value={form.total} onChange={e => setForm({...form, total: e.target.value})} className={`w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-xs font-black text-white outline-none focus:border-${theme}-500 shadow-inner text-center`} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Sua Opinião / Anotação</label>
                  <textarea placeholder="O que está a achar disto?" value={form.sinopse} onChange={e => setForm({...form, sinopse: e.target.value})} className={`w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-${theme}-500 min-h-[90px] resize-none shadow-inner`} />
                </div>

                <div className="mt-auto flex gap-3 pt-4 border-t border-white/5">
                  {itemEditando && (
                    <button type="button" onClick={apagarRegistro} className="bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white px-5 rounded-xl font-black transition-all">🗑️</button>
                  )}
                  <button type="submit" disabled={salvando} className={`flex-1 bg-${theme}-600 hover:bg-${theme}-500 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] disabled:opacity-50`}>
                    {salvando ? "A salvar..." : "💾 Salvar Progresso"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}