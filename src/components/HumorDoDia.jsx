"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom"; // 🪄 A MÁGICA QUE RESOLVE O PROBLEMA DE Z-INDEX
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function HumorDoDia({ humorAtual, isOwner, usuarioLogado }) {
  const [isOpen, setIsOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false); // Para evitar erros do Portal no Next.js
  const audioRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Controla volume e play
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.15;
  }, [humorAtual]);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      document.querySelectorAll('audio').forEach(el => {
        if(el !== audioRef.current) el.pause();
      });
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const setPause = () => setIsPlaying(false);
    audio.addEventListener('pause', setPause);
    audio.addEventListener('ended', setPause);
    return () => {
      audio.removeEventListener('pause', setPause);
      audio.removeEventListener('ended', setPause);
    }
  }, [humorAtual]);

  // 🪄 BUSCA ROBUSTA (Autocomplete + Botão Manual)
  const buscarMusicaAPI = async (e) => {
    if(e) e.preventDefault();
    if (!busca.trim()) return;
    setBuscando(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(busca)}&entity=song&limit=8`);
      const data = await res.json();
      setResultados(data.results || []);
    } catch(err) {
      toast.error("Erro na busca.");
    }
    setBuscando(false);
  };

  // Efeito Debounce: Busca automaticamente se parar de digitar por meio segundo
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (busca.trim().length > 2) buscarMusicaAPI();
      else setResultados([]);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [busca]);

  const salvarHumor = async (musica) => {
    if (!usuarioLogado) return;
    const t = toast.loading("A sintonizar Vibe...");
    try {
      const capaHD = musica.artworkUrl100 ? musica.artworkUrl100.replace('100x100bb', '300x300bb') : "";
      const payload = {
        titulo: musica.trackName,
        artista: musica.artistName,
        capa: capaHD,
        audioUrl: musica.previewUrl
      };
      await updateDoc(doc(db, "usuarios", usuarioLogado.email.toLowerCase()), { humorDoDia: payload });
      toast.dismiss(t);
      toast.success("Vibe do dia atualizada! 🎧");
      setIsOpen(false);
      setBusca("");
      setResultados([]);
    } catch(e) {
      toast.dismiss(t); toast.error("Erro ao salvar vibe.");
    }
  };

  const limparHumor = async (e) => {
    e.stopPropagation();
    if (!usuarioLogado) return;
    const t = toast.loading("A limpar status...");
    try {
      await updateDoc(doc(db, "usuarios", usuarioLogado.email.toLowerCase()), { humorDoDia: null });
      toast.dismiss(t);
      setIsPlaying(false);
    } catch(e) {
      toast.dismiss(t); toast.error("Erro ao limpar.");
    }
  };

  // 🪄 O CONTEÚDO DO MODAL (Que será jogado para fora do Header)
  const modalContent = (
    <div className="fixed top-0 left-0 w-screen h-screen z-[9999999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div className="bg-[#111] border border-green-500/30 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-[0_0_50px_rgba(34,197,94,0.15)] relative animate-fade-in-up m-4" onClick={e => e.stopPropagation()}>
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all">✕</button>
        <h3 className="text-xl font-black uppercase italic text-white mb-1"><span className="text-green-500">Música</span> do Momento</h3>
        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-6">Qual é a sua vibe hoje?</p>
        
        <form onSubmit={buscarMusicaAPI} className="relative mb-6 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🔎</span>
            <input 
              type="text" 
              placeholder="Busque uma Música..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-green-500 transition-colors shadow-inner" 
            />
          </div>
          <button type="submit" disabled={buscando} className="px-6 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-[10px] font-black uppercase transition-all disabled:opacity-50 shrink-0">
            {buscando ? "..." : "Buscar"}
          </button>
        </form>

        <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
          {resultados.length > 0 ? resultados.map((r, i) => (
            <div key={i} onClick={() => salvarHumor(r)} className="flex items-center gap-3 p-3 hover:bg-green-500/20 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-green-500/30">
              <img src={r.artworkUrl100} className="w-12 h-12 rounded-lg shadow-md group-hover:scale-105 transition-transform border border-white/5" alt="" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-black text-white uppercase truncate">{r.trackName}</span>
                <span className="text-[9px] text-gray-400 uppercase font-bold truncate group-hover:text-green-400 transition-colors">{r.artistName}</span>
              </div>
            </div>
          )) : (
            busca.length > 2 && !buscando && (
              <div className="text-center py-10 opacity-50">
                <p className="text-[10px] uppercase font-black tracking-widest">Nenhuma música encontrada.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative mt-3 sm:mt-0 sm:ml-4 inline-block z-40">
      
      {/* 🪄 A PÍLULA "OUVINDO AGORA" NO PERFIL */}
      {humorAtual ? (
        <div 
          onClick={() => isOwner && setIsOpen(true)}
          className={`inline-flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 pr-5 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all ${isOwner ? 'cursor-pointer hover:border-white/30 hover:bg-black/60 group' : ''}`}
          title={isOwner ? "Clique para alterar sua Vibe" : ""}
        >
          <div className="relative w-9 h-9 shrink-0 cursor-pointer" onClick={togglePlay}>
            <img src={humorAtual.capa} className={`w-full h-full rounded-full object-cover border-2 border-black shadow-md ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} alt="" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full border border-white/20"></div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
               <span className="text-white text-[10px]">{isPlaying ? '⏸' : '▶'}</span>
            </div>
          </div>
          
          <div className="flex flex-col justify-center">
            <span className="text-[8px] text-green-400 font-black uppercase tracking-widest flex items-center gap-1.5">
              Ouvindo agora 
              {isPlaying && (
                <div className="flex gap-[2px] items-end h-2">
                  <span className="w-[2px] h-full bg-green-400 animate-pulse"></span>
                  <span className="w-[2px] h-[60%] bg-green-400 animate-pulse delay-75"></span>
                  <span className="w-[2px] h-[80%] bg-green-400 animate-pulse delay-150"></span>
                </div>
              )}
            </span>
            <span className="text-[10px] font-bold text-white uppercase truncate max-w-[150px] sm:max-w-[200px] leading-tight">
              {humorAtual.titulo} <span className="text-gray-400 font-normal ml-0.5">• {humorAtual.artista}</span>
            </span>
          </div>

          {isOwner && (
            <button onClick={limparHumor} className="w-5 h-5 ml-1 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-red-600/80 hover:bg-red-600 text-white text-[8px] transition-all shrink-0">✕</button>
          )}
          {humorAtual.audioUrl && <audio ref={audioRef} src={humorAtual.audioUrl} preload="none" />}
        </div>
      ) : (
        isOwner && (
          <button onClick={() => setIsOpen(true)} className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all shadow-md">
            <span className="text-sm">🎧</span> Definir Humor do Dia
          </button>
        )
      )}

      {/* 🪄 RENDERIZA O MODAL FORA DO HEADER USANDO PORTAL */}
      {isOpen && isOwner && mounted && createPortal(modalContent, document.body)}
    </div>
  );
}