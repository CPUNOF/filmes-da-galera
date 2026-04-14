"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PainelKaraoke({ track, isOwner, onClose }) {
  const [aba, setAba] = useState("original"); 
  const [isEditing, setIsEditing] = useState(false);
  const [loadingLetra, setLoadingLetra] = useState(false);
  const [loadingHistoria, setLoadingHistoria] = useState(false); 
  const [loadingTraducao, setLoadingTraducao] = useState(false); // 🪄 NOVO ESTADO DE TRADUÇÃO
  const [mounted, setMounted] = useState(false); 
  
  const [letraOriginal, setLetraOriginal] = useState("");
  const [letraTraduzida, setLetraTraduzida] = useState("");
  const [significado, setSignificado] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!track?.id) return; 
    
    const unsubscribe = onSnapshot(doc(db, "perfil_cultura", track.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLetraOriginal(data.letraOriginal || "");
        setLetraTraduzida(data.letraTraduzida || "");
        setSignificado(data.significado || "");
      }
    });
    return () => unsubscribe();
  }, [track?.id]);

  const limparTexto = (str) => {
    if (!str) return "";
    return str
      .replace(/VEVO/gi, '')
      .replace(/ - Topic/gi, '')
      .replace(/\[.*?\]|\(.*?\)/g, '') 
      .replace(/Official|Video|Audio|Music|Lyric|HD|4K/gi, '')
      .trim();
  };

  // 1. BUSCAR LETRA ORIGINAL
  const buscarLetraInternet = async () => {
    if (!track.artista || !track.titulo) return;
    setLoadingLetra(true);
    const t = toast.loading("A analisar bases de dados... 🌐");
    
    const artistaLimpo = limparTexto(track.artista);
    const tituloLimpo = limparTexto(track.titulo);
    const busca = `${artistaLimpo} ${tituloLimpo}`;

    try {
      const resLrc = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(busca)}`);
      const dataLrc = await resLrc.json();
      
      if (dataLrc && dataLrc.length > 0 && (dataLrc[0].plainLyrics || dataLrc[0].syncedLyrics)) {
        const letra = dataLrc[0].plainLyrics || dataLrc[0].syncedLyrics;
        setLetraOriginal(letra);
        setAba("original");
        toast.dismiss(t);
        toast.success("Letra extraída com sucesso! 🎤");
        if (track.id && isOwner) await updateDoc(doc(db, "perfil_cultura", track.id), { letraOriginal: letra });
        setLoadingLetra(false);
        return;
      }

      const resOvh = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistaLimpo)}/${encodeURIComponent(tituloLimpo)}`);
      if (resOvh.ok) {
        const dataOvh = await resOvh.json();
        setLetraOriginal(dataOvh.lyrics);
        setAba("original");
        toast.dismiss(t);
        toast.success("Letra encontrada! 🎤");
        if (track.id && isOwner) await updateDoc(doc(db, "perfil_cultura", track.id), { letraOriginal: dataOvh.lyrics });
      } else {
        throw new Error("Não encontrada");
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error("Letra não encontrada nas bases públicas.");
      setIsEditing(true);
    }
    setLoadingLetra(false);
  };

  // 🪄 2. TRADUÇÃO AUTOMÁTICA VIA GOOGLE TRANSLATE API (NOVO)
  const traduzirLetraAutomaticamente = async () => {
    if (!letraOriginal) {
      setAba("original");
      return toast.error("Por favor, obtenha a Letra Original primeiro!");
    }
    
    setLoadingTraducao(true);
    const t = toast.loading("A traduzir a letra para Português... 🇧🇷");
    
    try {
      // Usamos a API pública do Google Translate para traduzir o texto
      // Cortamos em 4000 caracteres por segurança para não rebentar o limite de URL do navegador
      const textoParaTraduzir = letraOriginal.substring(0, 4000);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(textoParaTraduzir)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      let textoTraduzido = "";
      if (data && data[0]) {
        data[0].forEach(item => {
          if (item[0]) textoTraduzido += item[0];
        });
      }

      if (textoTraduzido) {
        setLetraTraduzida(textoTraduzido);
        toast.dismiss(t);
        toast.success("Tradução concluída! ✨");
        if (track.id && isOwner) {
          await updateDoc(doc(db, "perfil_cultura", track.id), { letraTraduzida: textoTraduzido });
        }
      } else {
        throw new Error("Falha ao traduzir");
      }
    } catch (error) {
      toast.dismiss(t);
      toast.error("Erro ao tentar traduzir. A letra pode ser muito longa.");
      setIsEditing(true);
    }
    setLoadingTraducao(false);
  };

  // 🪄 3. WIKIPEDIA FOCADA ESTRITAMENTE NA MÚSICA
  const buscarHistoriaInternet = async () => {
    if (!track.artista || !track.titulo) return;
    setLoadingHistoria(true);
    const t = toast.loading("A pesquisar a história da música... 📚");
    
    const artistaLimpo = limparTexto(track.artista);
    const tituloLimpo = limparTexto(track.titulo);
    
    // As aspas duplas à volta do título obrigam a Wikipedia a procurar a música exata
    const queryPt = `"${tituloLimpo}" canção ${artistaLimpo}`;
    const queryEn = `"${tituloLimpo}" song ${artistaLimpo}`;

    try {
      const resPt = await fetch(`https://pt.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&generator=search&gsrsearch=${encodeURIComponent(queryPt)}&gsrlimit=1`);
      const dataPt = await resPt.json();

      let extratoFinal = null;

      if (dataPt.query && dataPt.query.pages) {
        const pages = dataPt.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract;
        if (extract && extract.length > 30) extratoFinal = extract;
      }

      if (!extratoFinal) {
        const resEn = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=1&explaintext=1&generator=search&gsrsearch=${encodeURIComponent(queryEn)}&gsrlimit=1`);
        const dataEn = await resEn.json();
        if (dataEn.query && dataEn.query.pages) {
          const pagesEn = dataEn.query.pages;
          const pageIdEn = Object.keys(pagesEn)[0];
          const extractEn = pagesEn[pageIdEn].extract;
          if (extractEn && extractEn.length > 30) {
            extratoFinal = extractEn + "\n\n(Texto original extraído da Wikipedia em Inglês)";
          }
        }
      }

      if (extratoFinal) {
        setSignificado(extratoFinal);
        toast.dismiss(t);
        toast.success("História da música encontrada! 🧠", { style: { background: '#111', color: '#fff', border: '1px solid #eab308' }});
        if (track.id && isOwner) {
          await updateDoc(doc(db, "perfil_cultura", track.id), { significado: extratoFinal });
        }
      } else {
        throw new Error("Sem dados.");
      }

    } catch (error) {
      toast.dismiss(t);
      toast.error("História não encontrada. Tente escrever manualmente!", { style: { background: '#111', color: '#fff' }});
      setIsEditing(true);
    }
    setLoadingHistoria(false);
  };

  const pesquisarSignificadoWeb = () => {
    const artistaLimpo = limparTexto(track.artista);
    const tituloLimpo = limparTexto(track.titulo);
    const query = `Significado da música ${tituloLimpo} de ${artistaLimpo}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const salvarLetras = async () => {
    if (!track.id) return toast.error("Guarde primeiro a música na sua Playlist (❤️) para poder salvar textos!");
    
    const t = toast.loading("A guardar conhecimento... 🧠");
    try {
      await updateDoc(doc(db, "perfil_cultura", track.id), {
        letraOriginal,
        letraTraduzida,
        significado
      });
      toast.dismiss(t);
      toast.success("Salvo com sucesso!");
      setIsEditing(false);
    } catch(e) {
      toast.dismiss(t);
      toast.error("Erro ao salvar.");
    }
  };

  const modalContent = (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0a0a0a]/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-[9999998] flex flex-col animate-fade-in-left">
      
      <div className="p-5 sm:p-6 border-b border-white/5 flex flex-col shrink-0 relative overflow-hidden pt-6 sm:pt-8">
        <div className="absolute inset-0 opacity-20 blur-2xl scale-150" style={{ backgroundImage: `url(${track.capa})`, backgroundSize: 'cover' }}></div>
        
        <div className="relative z-10 flex justify-between items-start mb-4">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-md">✕</button>
          {isOwner && (
            <button onClick={() => isEditing ? salvarLetras() : setIsEditing(true)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-lg ${isEditing ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'bg-black/50 text-gray-300 border-white/20 hover:text-white hover:bg-white/10'}`}>
              {isEditing ? '💾 Salvar' : '✏️ Editar'}
            </button>
          )}
        </div>
        
        <div className="relative z-10 flex items-center gap-4 mt-2">
          <img src={track.capa} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-2xl object-cover border border-white/10" alt="" />
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-white font-black uppercase tracking-tighter text-lg sm:text-2xl truncate leading-none mb-1.5 drop-shadow-md">{track.titulo}</h2>
            <span className="text-pink-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs truncate">{track.artista}</span>
          </div>
        </div>
      </div>

      <div className="flex px-4 pt-4 shrink-0 border-b border-white/5 bg-black/20">
        <button onClick={() => setAba("original")} className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${aba === 'original' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-500 hover:text-white'}`}>🎤 Original</button>
        <button onClick={() => setAba("traducao")} className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${aba === 'traducao' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-white'}`}>🇧🇷 Tradução</button>
        <button onClick={() => setAba("significado")} className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${aba === 'significado' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'}`}>🧠 História</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 sm:pb-36">
        
        {/* ABA ORIGINAL: ESTADO VAZIO */}
        {aba === "original" && isOwner && !letraOriginal && !isEditing && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-70 hover:opacity-100 transition-opacity pb-10">
            <span className="text-6xl drop-shadow-lg">🎵</span>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sem letra registada.</p>
            <button onClick={buscarLetraInternet} disabled={loadingLetra} className="bg-white/10 hover:bg-pink-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 shadow-lg">
              {loadingLetra ? 'A buscar...' : '🌐 Procurar na Internet'}
            </button>
          </div>
        )}

        {/* 🪄 ABA TRADUÇÃO: O BOTÃO DE TRADUÇÃO AUTOMÁTICA */}
        {aba === "traducao" && isOwner && !letraTraduzida && !isEditing && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-70 hover:opacity-100 transition-opacity pb-10">
            <span className="text-6xl drop-shadow-lg">🇧🇷</span>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">A tradução ainda não foi gerada.</p>
            <button onClick={traduzirLetraAutomaticamente} disabled={loadingTraducao} className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/50 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              {loadingTraducao ? 'A Traduzir...' : '✨ Traduzir Letra Automaticamente'}
            </button>
          </div>
        )}

        {/* ABA HISTÓRIA: ESTADO VAZIO */}
        {aba === "significado" && isOwner && !significado && !isEditing && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-70 hover:opacity-100 transition-opacity pb-10">
            <span className="text-6xl drop-shadow-lg">📖</span>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">A história desta obra é um mistério.</p>
            <button onClick={buscarHistoriaInternet} disabled={loadingHistoria} className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              {loadingHistoria ? 'A consultar arquivos...' : '📚 Extrair da Wikipedia'}
            </button>
          </div>
        )}

        {!isEditing && (
          <div className="whitespace-pre-wrap text-sm sm:text-base font-medium text-gray-200 leading-relaxed drop-shadow-sm">
            {aba === "original" && (letraOriginal || (!isOwner && "O dono ainda não adicionou a letra."))}
            {aba === "traducao" && (letraTraduzida || (!isOwner && "Sem tradução disponível."))}
            
            {aba === "significado" && significado && (
              <div className="flex flex-col gap-4">
                <div className="bg-black/40 p-5 rounded-2xl border border-white/10 text-gray-300 italic shadow-inner">
                  {significado}
                </div>
              </div>
            )}
            {aba === "significado" && !significado && !isOwner && "Nenhuma história registada."}
            
            {/* O BOTÃO DO GOOGLE COMO ÚLTIMO RECURSO SE A WIKIPEDIA FALHAR (APENAS PARA O DONO) */}
            {aba === "significado" && isOwner && !significado && !isEditing && (
              <div className="mt-4 flex justify-center">
                <button onClick={pesquisarSignificadoWeb} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                  🔍 Abrir Pesquisa no Google
                </button>
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="flex flex-col h-full min-h-[300px]">
            {aba === "original" && (
              <textarea value={letraOriginal} onChange={(e) => setLetraOriginal(e.target.value)} placeholder="Cole a letra original aqui..." className="w-full h-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-pink-500 outline-none resize-none custom-scrollbar shadow-inner" />
            )}
            {aba === "traducao" && (
              <textarea value={letraTraduzida} onChange={(e) => setLetraTraduzida(e.target.value)} placeholder="Cole a tradução em Português aqui..." className="w-full h-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-emerald-500 outline-none resize-none custom-scrollbar shadow-inner" />
            )}
            {aba === "significado" && (
              <textarea value={significado} onChange={(e) => setSignificado(e.target.value)} placeholder="Qual o significado da música? Escreva as curiosidades..." className="w-full h-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-yellow-500 outline-none resize-none custom-scrollbar italic shadow-inner" />
            )}
          </div>
        )}

      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}