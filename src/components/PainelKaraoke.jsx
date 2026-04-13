"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // 🪄 A MÁGICA QUE RESOLVE O CORTE
import { db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PainelKaraoke({ track, isOwner, onClose }) {
  const [aba, setAba] = useState("original"); // original, traducao, significado
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false); // Evita erros de hidratação no Next.js
  
  const [letraOriginal, setLetraOriginal] = useState("");
  const [letraTraduzida, setLetraTraduzida] = useState("");
  const [significado, setSignificado] = useState("");

  // Ativa o Portal apenas no lado do cliente
  useEffect(() => { setMounted(true); }, []);

  // Sincroniza em tempo real com o Firebase
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

  const buscarLetraInternet = async () => {
    if (!track.artista || !track.titulo) return;
    setLoading(true);
    const t = toast.loading("A procurar letra na web... 🌐");
    
    try {
      const tituloLimpo = track.titulo.split(/[-[(]/)[0].trim();
      const res = await fetch(`https://api.lyrics.ovh/v1/${track.artista}/${tituloLimpo}`);
      
      if (res.ok) {
        const data = await res.json();
        setLetraOriginal(data.lyrics);
        setAba("original");
        toast.dismiss(t);
        toast.success("Letra encontrada! 🎤");
        if (track.id && isOwner) {
          await updateDoc(doc(db, "perfil_cultura", track.id), { letraOriginal: data.lyrics });
        }
      } else {
        throw new Error("Não encontrada");
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error("Letra não encontrada. Pode colar manualmente!");
      setIsEditing(true);
    }
    setLoading(false);
  };

  const salvarLetras = async () => {
    if (!track.id) {
      toast.error("Guarde primeiro a música na sua Playlist (❤️) para poder salvar letras!");
      return;
    }
    
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

  // 🪄 O CONTEÚDO QUE VAI SER ENVIADO PARA O PORTAL
  const modalContent = (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0a0a0a]/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-[9999998] flex flex-col animate-fade-in-left">
      
      {/* HEADER DO PAINEL */}
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

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex px-4 pt-4 shrink-0 border-b border-white/5 bg-black/20">
        <button onClick={() => setAba("original")} className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${aba === 'original' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-500 hover:text-white'}`}>🎤 Original</button>
        <button onClick={() => setAba("traducao")} className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${aba === 'traducao' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-white'}`}>🇧🇷 Tradução</button>
        <button onClick={() => setAba("significado")} className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${aba === 'significado' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-white'}`}>🧠 História</button>
      </div>

      {/* 🪄 ÁREA DE TEXTO: Coloquei "pb-32" (Padding Bottom) para o texto não ficar escondido atrás do Player no Mobile */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 sm:pb-36">
        
        {aba === "original" && isOwner && !letraOriginal && !isEditing && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-70 hover:opacity-100 transition-opacity pb-10">
            <span className="text-6xl drop-shadow-lg">🎵</span>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sem letra registada.</p>
            <button onClick={buscarLetraInternet} disabled={loading} className="bg-white/10 hover:bg-pink-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 shadow-lg">
              {loading ? 'A buscar...' : '🌐 Procurar na Internet'}
            </button>
          </div>
        )}

        {!isEditing && (
          <div className="whitespace-pre-wrap text-sm sm:text-base font-medium text-gray-200 leading-relaxed drop-shadow-sm">
            {aba === "original" && (letraOriginal || (!isOwner && "O dono ainda não adicionou a letra."))}
            {aba === "traducao" && (letraTraduzida || "Sem tradução disponível.")}
            {aba === "significado" && (
              <div className="bg-black/40 p-5 rounded-2xl border border-white/10 text-gray-300 italic shadow-inner">
                {significado || "Nenhum significado ou curiosidade adicionada sobre esta obra."}
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="flex flex-col h-full min-h-[300px]">
            {aba === "original" && (
              <textarea 
                value={letraOriginal} onChange={(e) => setLetraOriginal(e.target.value)}
                placeholder="Cole a letra original aqui..."
                className="w-full h-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-pink-500 outline-none resize-none custom-scrollbar shadow-inner"
              />
            )}
            {aba === "traducao" && (
              <textarea 
                value={letraTraduzida} onChange={(e) => setLetraTraduzida(e.target.value)}
                placeholder="Cole a tradução em Português aqui..."
                className="w-full h-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-emerald-500 outline-none resize-none custom-scrollbar shadow-inner"
              />
            )}
            {aba === "significado" && (
              <textarea 
                value={significado} onChange={(e) => setSignificado(e.target.value)}
                placeholder="Qual o significado da música? Escreva as curiosidades..."
                className="w-full h-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-yellow-500 outline-none resize-none custom-scrollbar italic shadow-inner"
              />
            )}
          </div>
        )}

      </div>
    </div>
  );

  // Se não estiver montado no cliente, não renderiza para evitar bugs do Next.js
  if (!mounted) return null;
  
  // Renderiza no topo da árvore DOM (Por cima de tudo!)
  return createPortal(modalContent, document.body);
}