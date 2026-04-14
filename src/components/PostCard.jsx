"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, collection, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";

const Icones = {
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  Poison: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>,
  Crown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  Diamond: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
};

const TextoExpansivel = ({ texto }) => {
  const [expandido, setExpandido] = useState(false);
  if (!texto) return null;
  const isLong = texto.length > 180;
  return (
    <div className="mt-3 relative z-10 mb-2">
      <p className={`text-gray-400 text-xs sm:text-sm italic leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 border-l-2 border-l-gray-500 ${!expandido && isLong ? 'line-clamp-3' : ''}`}>
        "{texto}"
      </p>
      {isLong && (
        <button onClick={() => setExpandido(!expandido)} className="text-red-500 hover:text-red-400 text-[9px] font-black uppercase tracking-widest mt-2 ml-1 transition-colors">
          {expandido ? "Ver Menos" : "Ler Mais..."}
        </button>
      )}
    </div>
  );
};

export default function PostCard({ post, user }) {
  const [timeAgo, setTimeAgo] = useState("");
  const [playTrailer, setPlayTrailer] = useState(false);
  const [likes, setLikes] = useState(post.likes || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const hasLiked = user && likes.includes(user.uid);

  useEffect(() => {
    const calcTime = () => {
      const diff = Math.floor((new Date() - post.data) / 1000);
      if (diff < 60) return "Agora mesmo";
      if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
      if (diff < 86400) return `Há ${Math.floor(diff / 3600)} h`;
      const anos = new Date().getFullYear() - post.data.getFullYear();
      if (anos > 0) return `Há ${anos} ano${anos > 1 ? 's' : ''}`;
      return `Há ${Math.floor(diff / 86400)} dias`;
    };
    setTimeAgo(calcTime());
    const interval = setInterval(() => setTimeAgo(calcTime()), 60000);
    return () => clearInterval(interval);
  }, [post.data]);

  const entrarNaSessao = () => {
    if (!post.trackInfo) return;
    window.dispatchEvent(new CustomEvent("playGlobalMusic", { detail: { track: post.trackInfo, offset: post.offset || 0 } }));
    toast.success(`A ouvir com ${post.usuario}!`, { style: { background: '#111', color: '#fff' } });
  };

  const getFraseMotivacional = (progresso, total) => {
    const percent = (progresso / total) * 100;
    if (percent === 0) return "A jornada vai começar...";
    if (percent === 100) return "Obra finalizada com sucesso!";
    if (percent < 25) return "Bom começo! Continua firme.";
    if (percent < 50) return "O enredo está a engrossar...";
    if (percent < 80) return "Já passaste da metade!";
    return "A reta final! Quase lá!";
  };

  const percentual = post.total ? Math.min(100, (post.progresso / post.total) * 100) : 0;
  
  const getLinkDaObra = () => {
    if (!post.id) return null;
    if (post.id.startsWith("bot_")) return `/filme/${post.id.replace(/bot_(lixo|olimpo)_/, "")}`;
    if (post.id.startsWith("sug_auto_")) return `/filme/${post.id.replace("sug_auto_", "")}`;
    if (post.id.startsWith("sug_")) return `/filme/${post.id.replace("sug_", "")}`;
    if (post.id.startsWith("ass_")) return `/filme/${post.id.replace("ass_", "")}`;
    return null;
  };
  const urlObra = getLinkDaObra();

  const handleLike = async () => {
    if (!user) return toast.error("Faça login para curtir!");
    if (post.isSugestaoAuto) return toast.error("Radar Automático não recebe likes.");

    const newLikedState = !hasLiked;
    if (newLikedState) setLikes(prev => [...prev, user.uid]);
    else setLikes(prev => prev.filter(id => id !== user.uid));

    let colecao = ""; let realId = "";
    if (post.id.startsWith("post_")) { colecao = "posts_feed"; realId = post.id.replace("post_", ""); }
    else if (post.id.startsWith("sug_") || post.id.startsWith("ass_")) { colecao = "filmes"; realId = post.id.replace(/^(sug_|ass_)/, ""); }
    else if (post.id.startsWith("cult_")) { colecao = "perfil_cultura"; realId = post.id.replace("cult_", ""); }
    else if (post.id.startsWith("com_")) { colecao = "comentarios"; realId = post.id.replace("com_", ""); }
    else if (post.id.startsWith("jam_")) { colecao = "usuarios"; realId = post.id.replace("jam_", ""); } 
    else if (post.id.startsWith("bot_")) { colecao = "filmes"; realId = post.id.replace(/bot_(lixo|olimpo)_/, ""); } 

    if (!colecao || !realId) return;
    try {
      const ref = doc(db, colecao, realId);
      if (newLikedState) await updateDoc(ref, { likes: arrayUnion(user.uid) });
      else await updateDoc(ref, { likes: arrayRemove(user.uid) });
    } catch (error) { console.log("Erro ao salvar like:", error); }
  };

  const handleComment = async () => {
    if (!user) return toast.error("Faça login para comentar!");
    if (!commentText.trim()) return;
    toast.success("Comentário enviado!", { style: { background: '#111', color: '#fff' } });
    setCommentText(""); setShowComments(false);
  };

  const RodapeInteracao = () => (
    <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3 relative z-20">
      <div className="flex items-center justify-between pl-1">
        <div className="flex items-center gap-5">
          <button onClick={handleLike} className={`flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${hasLiked ? 'text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] scale-105' : 'text-gray-500 hover:text-red-400'}`}>
            <svg fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
            {likes.length > 0 ? likes.length : 'Gostar'}
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.36 5.47.22.215.34.505.326.8-.024.476-.08 1.096-.2 1.776a.75.75 0 00.912.871c1.23-.33 2.164-.818 2.82-1.25.18-.12.4-.18.62-.162C10.02 19.988 10.98 20.25 12 20.25z" /></svg>
            Comentar
          </button>
        </div>
      </div>
      {showComments && (
        <div className="flex gap-2 animate-fade-in-up mt-2">
          {/* MANTIVE O AVATAR PROTEGIDO APENAS POR CAUSA DO GOOGLE LOGIN */}
          <img src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.displayName || 'U'}`} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/10 shrink-0" alt="" />
          <div className="flex-1 flex bg-black/40 rounded-xl border border-white/10 overflow-hidden focus-within:border-red-500/50 transition-colors">
            <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Escreve um comentário..." className="w-full bg-transparent px-3 py-2 text-[10px] sm:text-xs text-white outline-none" />
            <button onClick={handleComment} disabled={!commentText.trim()} className="px-4 text-red-500 hover:text-red-400 font-black text-[9px] sm:text-[10px] uppercase tracking-widest disabled:opacity-50 transition-colors bg-red-500/10">Enviar</button>
          </div>
        </div>
      )}
    </div>
  );

  // =======================================================================
  // 🗑️ ESTILO: BOT DO LIXÃO (Filmes Ruins)
  // =======================================================================
  if (post.tipoPost === "lixao") {
    return (
      <div className="bg-[#050505] border border-red-900/50 rounded-[2rem] p-5 sm:p-6 flex flex-col relative overflow-hidden shadow-[0_10px_40px_rgba(220,38,38,0.15)] group animate-fade-in-up">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-600/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="bg-green-950/30 border border-green-900 text-green-500 px-3 py-1.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
            <Icones.Trash /> Hall da Vergonha
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase">{timeAgo}</span>
        </div>

        <div className="text-center z-10 mb-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-md">
            O LIXÃO DA <span className="text-green-500 line-through decoration-red-600 decoration-2">GALERA</span>
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-2 max-w-[280px] mx-auto">
            Este filme é uma atrocidade cinematográfica. Sinta-se livre para fatiar, atirar e queimar esta obra.
          </p>
        </div>

        <div className="flex gap-4 sm:gap-6 relative z-10 bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
          {urlObra ? (
            <Link href={urlObra} className="shrink-0 group/img">
               {/* 🪄 FIX: REMOVIDAS AS TAGS DE SEGURANÇA NAS IMAGENS */}
               <img src={post.capa} className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-xl border border-red-900/50 shadow-xl group-hover/img:border-red-500 transition-colors" alt="" />
            </Link>
          ) : (
             <img src={post.capa} className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-xl border border-red-900/50 shadow-xl shrink-0" alt="" />
          )}

          <div className="flex flex-col justify-center flex-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-red-600 mb-1">Filme Condenado</span>
            <Link href={urlObra || "#"} className="hover:text-red-500 transition-colors">
               <h3 className="text-lg sm:text-xl font-black uppercase text-white leading-tight mb-3 drop-shadow-md">{post.titulo}</h3>
            </Link>
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-red-600 text-white font-black px-2 py-1 rounded text-[10px] tracking-widest shadow-md">NOTA: {post.nota}</span>
              <span className="bg-green-950/40 border border-green-900/50 text-green-500 text-[9px] font-black tracking-widest uppercase flex items-center gap-1 px-2 py-1 rounded">
                <Icones.Poison /> Selo de Chorume
              </span>
            </div>

            <div className="flex items-center gap-3 bg-[#110000] border border-red-900/50 p-2 rounded-xl mt-auto">
              <img src={post.culpadoFoto} className="w-8 h-8 rounded-full border border-red-500 object-cover" alt="" />
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase tracking-widest text-red-600">O Responsável:</span>
                <span className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{post.culpadoNome}</span>
              </div>
            </div>

          </div>
        </div>

        <RodapeInteracao />
      </div>
    );
  }

  // =======================================================================
  // 🏛️ ESTILO: BOT DO OLIMPO (Filmes Excelentes)
  // =======================================================================
  if (post.tipoPost === "olimpo") {
    return (
      <div className="bg-[#020617] border border-amber-500/30 rounded-[2rem] p-5 sm:p-6 flex flex-col relative overflow-hidden shadow-[0_10px_40px_rgba(251,191,36,0.15)] group animate-fade-in-up">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="bg-amber-900/30 border border-amber-700 text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-widest shadow-md">
            <Icones.Crown /> Hall da Fama
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase">{timeAgo}</span>
        </div>

        <div className="text-center z-10 mb-6">
          <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white drop-shadow-md">
            O OLIMPO DA <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">GALERA</span>
          </h2>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-2 max-w-[280px] mx-auto">
            Uma verdadeira obra-prima intocável. Contemple a perfeição cinematográfica que enriqueceu a nossa alma.
          </p>
        </div>

        <div className="flex gap-4 sm:gap-6 relative z-10 bg-[#0f172a] p-4 rounded-2xl border border-white/5">
          {urlObra ? (
            <Link href={urlObra} className="shrink-0 group/img">
               <img src={post.capa} className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-xl border border-amber-500/50 shadow-xl group-hover/img:border-amber-400 transition-colors" alt="" />
            </Link>
          ) : (
             <img src={post.capa} className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-xl border border-amber-500/50 shadow-xl shrink-0" alt="" />
          )}

          <div className="flex flex-col justify-center flex-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1">Filme Abençoado</span>
            <Link href={urlObra || "#"} className="hover:text-amber-400 transition-colors">
               <h3 className="text-lg sm:text-xl font-black uppercase text-white leading-tight mb-3 drop-shadow-md">{post.titulo}</h3>
            </Link>
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-amber-500 text-black font-black px-2 py-1 rounded text-[10px] tracking-widest shadow-md">NOTA: {post.nota}</span>
              <span className="bg-blue-950/40 border border-blue-900/50 text-blue-400 text-[9px] font-black tracking-widest uppercase flex items-center gap-1 px-2 py-1 rounded">
                <Icones.Diamond /> Selo Obra-Prima
              </span>
            </div>

            <div className="flex items-center gap-3 bg-[#1a1300] border border-amber-900/50 p-2 rounded-xl mt-auto">
              <img src={post.culpadoFoto} className="w-8 h-8 rounded-full border border-amber-500 object-cover" alt="" />
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase tracking-widest text-amber-500">A Bênção de:</span>
                <span className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{post.culpadoNome}</span>
              </div>
            </div>

          </div>
        </div>

        <RodapeInteracao />
      </div>
    );
  }

  // =======================================================================
  // 🎵 ESTILO: MÚSICA AO VIVO (SESSÃO JAM)
  // =======================================================================
  if (post.tipoPost === "jam") {
    return (
      <div className="bg-[#111111] border border-pink-500/30 rounded-[2rem] p-4 sm:p-5 flex flex-col relative overflow-hidden shadow-[0_10px_40px_rgba(236,72,153,0.15)] group animate-fade-in-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="relative">
            <img src={post.foto} className="w-10 h-10 rounded-full object-cover border-2 border-[#111] shadow-md" alt="" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-pink-500 border-2 border-[#111] rounded-full animate-pulse"></span>
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-white">{post.usuario}</span>
            <span className="text-[9px] font-bold uppercase text-pink-500">{post.acao}</span>
          </div>
          <span className="text-[9px] font-black uppercase text-pink-500 animate-pulse bg-pink-500/10 px-2 py-1 rounded-md border border-pink-500/20">LIVE</span>
        </div>

        <div className="flex items-center gap-4 bg-black/40 rounded-2xl p-3 border border-white/5 relative z-10">
          <div className="relative w-16 h-16 shrink-0">
            <div className="absolute inset-0 bg-black rounded-full border-2 border-white/10 animate-[spin_4s_linear_infinite] shadow-lg flex items-center justify-center">
               {post.capa ? <img src={post.capa} className="w-6 h-6 rounded-full object-cover opacity-80" alt="" /> : <div className="w-6 h-6 bg-zinc-800 rounded-full" />}
               <div className="absolute w-1.5 h-1.5 bg-black rounded-full z-20"></div>
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-black uppercase text-white truncate drop-shadow-md">{post.titulo}</span>
            <span className="text-[10px] font-bold uppercase text-gray-400 truncate">{post.artista}</span>
          </div>
          <button onClick={entrarNaSessao} className="w-10 h-10 bg-pink-600 hover:bg-pink-500 text-white rounded-full flex items-center justify-center transition-all shadow-[0_0_15px_rgba(236,72,153,0.5)] shrink-0 group-hover:scale-105" title="Ouvir Junto">
            <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>

        <RodapeInteracao />
      </div>
    );
  }

  // =======================================================================
  // 📚 ESTILO: PROGRESSO (LIVROS, MANGÁS, SÉRIES)
  // =======================================================================
  if (post.tipoPost === "progresso") {
    const cores = { Série: "purple", Anime: "orange", Livro: "emerald", Mangá: "red" };
    const corTema = cores[post.categoria] || "blue";

    return (
      <div className={`bg-[#111111] border border-${corTema}-500/20 rounded-[2rem] p-4 sm:p-5 flex flex-col relative overflow-hidden shadow-lg animate-fade-in-up`}>
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${corTema}-600/10 blur-3xl rounded-full pointer-events-none`}></div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <img src={post.foto} className="w-10 h-10 rounded-full object-cover shadow-md border border-white/10" alt="" />
          <div className="flex flex-col flex-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-white">{post.usuario}</span>
            <span className={`text-[9px] font-bold uppercase text-${corTema}-400`}>{post.acao}</span>
          </div>
          <span className="text-[9px] font-bold text-gray-500 uppercase">{timeAgo}</span>
        </div>

        <div className="flex gap-4 relative z-10 bg-black/30 p-3 rounded-2xl border border-white/5">
          {post.capa ? <img src={post.capa} className="w-16 h-24 object-cover rounded-lg shadow-md border border-white/10 shrink-0" alt="" /> : <div className="w-16 h-24 bg-zinc-800 rounded-lg shrink-0"></div>}
          <div className="flex flex-col flex-1 justify-center">
            <span className={`text-[8px] font-black uppercase tracking-widest text-${corTema}-500 mb-1`}>{post.categoria}</span>
            <span className="text-xs sm:text-sm font-black uppercase text-white truncate drop-shadow-md mb-2 leading-tight">{post.titulo}</span>
            
            <div className="flex flex-col gap-1.5 mt-auto">
              <div className="flex justify-between items-end">
                <span className="text-[8px] text-gray-400 font-bold uppercase">{getFraseMotivacional(post.progresso, post.total)}</span>
                <span className="text-[9px] font-black text-white">{post.progresso} / {post.total}</span>
              </div>
              <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                <div className={`h-full bg-${corTema}-500 rounded-full transition-all duration-1000`} style={{ width: `${percentual}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <TextoExpansivel texto={post.texto} />
        <RodapeInteracao />
      </div>
    );
  }

  // =======================================================================
  // 🍿 ESTILO DEFAULT (FILMES COM TRAILER, RESENHAS E POSTS LIVRES)
  // =======================================================================
  return (
    <div className="bg-[#111111] border border-white/5 rounded-[2rem] p-4 sm:p-5 flex flex-col relative overflow-hidden shadow-lg animate-fade-in-up hover:border-white/10 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <img src={post.foto} className="w-10 h-10 rounded-full object-cover shadow-md border border-white/10" alt="" />
        <div className="flex flex-col flex-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-white">{post.usuario}</span>
          <span className="text-[9px] font-bold uppercase text-gray-400">{post.acao}</span>
        </div>
        <span className="text-[9px] font-bold text-gray-500 uppercase">{timeAgo}</span>
      </div>

      {post.titulo && (
        <div className="mb-2 px-1">
          {urlObra ? (
            <Link href={urlObra} className="group inline-flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-0.5">{post.categoria}</span>
              <span className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-white group-hover:text-red-500 transition-colors drop-shadow-md">{post.titulo}</span>
            </Link>
          ) : (
            <div className="inline-flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-0.5">{post.categoria}</span>
              <span className="text-lg sm:text-xl font-black uppercase italic tracking-tighter text-white drop-shadow-md">{post.titulo}</span>
            </div>
          )}
        </div>
      )}

      <TextoExpansivel texto={post.texto} />

      {(post.trailerKey || post.capa) && (
        <div className="mt-2 relative rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-black">
          {post.trailerKey ? (
            playTrailer ? (
              <iframe src={`https://www.youtube.com/embed/${post.trailerKey}?autoplay=1`} className="w-full aspect-video border-0" allow="autoplay; fullscreen" />
            ) : (
              <div className="relative group cursor-pointer aspect-video" onClick={() => setPlayTrailer(true)}>
                <img src={post.capa} className="w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-opacity" alt="" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.8)] group-hover:scale-110 transition-transform backdrop-blur-md">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-1"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase text-white tracking-widest">Trailer Oficial</span>
                </div>
              </div>
            )
          ) : post.capa ? (
            <div className="relative aspect-video bg-black/40">
              <img src={post.capa} className="w-full h-full object-cover opacity-90" alt="" />
            </div>
          ) : null}
        </div>
      )}

      <RodapeInteracao />
    </div>
  );
}