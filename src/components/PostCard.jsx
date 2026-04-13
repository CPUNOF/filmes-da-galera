/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PostCard({ post, user }) {
  const [likes, setLikes] = useState({});
  const [comentarios, setComentarios] = useState([]);
  const [isComentAberto, setIsComentAberto] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);

  // Busca os Likes só desse post quando ele aparece na tela
  useEffect(() => {
    async function fetchLikes() {
      try {
        const snap = await getDoc(doc(db, "feed_likes", post.id));
        if (snap.exists() && snap.data().likesData) {
          setLikes(snap.data().likesData);
        }
      } catch (e) {}
    }
    fetchLikes();
  }, [post.id]);

  const handleLike = async () => {
    if (!user) return toast.error("Faça login para curtir!");
    
    const novosLikes = { ...likes };
    const jaCurtiu = !!novosLikes[user.uid];

    // Atualiza a tela na hora (Dopamina Visual)
    if (jaCurtiu) delete novosLikes[user.uid];
    else novosLikes[user.uid] = { foto: user.photoURL, nome: user.displayName };
    
    setLikes(novosLikes);

    // Salva no Firebase no fundo
    try {
      await setDoc(doc(db, "feed_likes", post.id), { likesData: novosLikes }, { merge: true });
    } catch (e) { console.error("Erro no like:", e); }
  };

  const toggleComentarios = async () => {
    if (isComentAberto) {
      setIsComentAberto(false);
      return;
    }
    
    setIsComentAberto(true);
    if (comentarios.length === 0) {
      setCarregandoComentarios(true);
      try {
        const q = query(collection(db, "feed_comentarios"), where("postId", "==", post.id));
        const snap = await getDocs(q);
        const coments = [];
        snap.forEach(d => coments.push({ id: d.id, ...d.data() }));
        // Ordena no JS para evitar erros do Firebase Index
        coments.sort((a, b) => new Date(a.data) - new Date(b.data));
        setComentarios(coments);
      } catch (e) {}
      setCarregandoComentarios(false);
    }
  };

  const enviarComentario = async () => {
    if (!user) return toast.error("Logue para comentar!");
    if (!novoComentario.trim()) return;

    const comentario = {
      postId: post.id,
      usuarioNome: user.displayName,
      usuarioFoto: user.photoURL,
      texto: novoComentario,
      data: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, "feed_comentarios"), comentario);
      setComentarios([...comentarios, { id: docRef.id, ...comentario }]);
      setNovoComentario("");
    } catch (e) { toast.error("Erro ao enviar comentário"); }
  };

  const tempoAtras = (data) => {
    const min = Math.floor((new Date() - data) / 60000);
    if (min < 1) return "Agora";
    if (min < 60) return `${min}m`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `${horas}h`;
    return `${Math.floor(horas / 24)}d`;
  };

  const arrayLikes = Object.values(likes);
  const curtiu = user && !!likes[user.uid];

  return (
    <article className={`bg-[#111111] sm:border border-white/5 sm:rounded-[2rem] shadow-2xl overflow-hidden relative ${post.isSugestaoAuto ? 'border-blue-500/30' : ''}`}>
      
      {post.isLive && <div className="absolute inset-0 bg-red-600/5 pointer-events-none animate-pulse"></div>}

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 sm:p-5 relative z-10">
        <div className="flex items-center gap-3">
          <img src={post.foto} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
          <div>
            <h3 className={`font-black text-sm leading-none mb-1 ${post.isSugestaoAuto ? 'text-blue-400' : 'text-white'}`}>{post.usuario}</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{post.acao}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-600">{tempoAtras(post.data)}</span>
      </div>

      {/* MÍDIA */}
      <div className="w-full bg-black relative flex items-center justify-center overflow-hidden border-y border-white/5 sm:border-none">
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 items-end">
          {post.isLive ? (
            <div className="bg-red-600 border border-red-500 px-3 py-1 rounded shadow-[0_0_15px_rgba(220,38,38,0.8)] text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> AO VIVO
            </div>
          ) : (
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white">
              {post.categoria}
            </div>
          )}
        </div>

        {post.trailerKey && !post.isLive ? (
          <div className="w-full aspect-video">
            <iframe src={`https://www.youtube.com/embed/${post.trailerKey}?autoplay=0&mute=1&controls=1`} className="w-full h-full border-0" allowFullScreen></iframe>
          </div>
        ) : (
          <div className={`w-full relative ${post.categoria === 'livro' || post.categoria === 'anime' ? 'aspect-square sm:aspect-video' : 'aspect-[4/5] sm:aspect-video'}`}>
            <img src={post.capa} className="w-full h-full object-cover blur-3xl opacity-30 absolute inset-0 scale-110" alt="" />
            <img src={post.capa} className="w-full h-full object-contain relative z-10 shadow-2xl" alt={post.titulo} />
          </div>
        )}
      </div>

      {/* FOOTER & AÇÕES */}
      <div className="p-4 sm:p-5 relative z-10">
        
        <div className="flex items-center gap-5 mb-3">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest transition-all ${curtiu ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
            <svg className={`w-6 h-6 transition-transform ${curtiu ? 'fill-current scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          </button>
          
          <button onClick={toggleComentarios} className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest transition-all ${isComentAberto ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            Comentar
          </button>
        </div>

        {/* ROSTOS DE QUEM CURTIU */}
        {arrayLikes.length > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex mr-2">
              {arrayLikes.slice(0, 5).map((lk, idx) => (
                 <img key={idx} src={lk.foto} className="w-5 h-5 rounded-full border-2 border-[#111111] -ml-2 first:ml-0 object-cover relative z-10" title={lk.nome} alt="" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-gray-400">
               {arrayLikes.length === 1 ? `Curtido por ${arrayLikes[0].nome.split(" ")[0]}` : `Curtido por ${arrayLikes[0].nome.split(" ")[0]} e mais ${arrayLikes.length - 1}`}
            </span>
          </div>
        )}
        
        <div className="text-sm text-gray-200 leading-relaxed mb-3">
          <span className="font-black text-white mr-2">{post.usuario}</span>
          {post.texto}
        </div>
        
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 inline-block px-2 py-1 rounded-md border border-white/5">
          {post.titulo}
        </p>

        {/* ÁREA DE COMENTÁRIOS */}
        {isComentAberto && (
          <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in-up">
            {carregandoComentarios ? (
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-2 animate-pulse">Buscando mensagens...</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {comentarios.length > 0 ? comentarios.map(c => (
                  <div key={c.id} className="flex gap-2 items-start">
                    <img src={c.usuarioFoto || "https://www.gravatar.com/avatar/?d=mp"} className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" alt="" />
                    <div className="bg-[#1a1a1a] rounded-2xl rounded-tl-none px-3 py-2 border border-white/5">
                      <span className="font-black text-[10px] text-gray-400 block mb-0.5">{c.usuarioNome}</span>
                      <span className="text-[11px] text-gray-200">{c.texto}</span>
                    </div>
                  </div>
                )) : <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-2">Nenhum comentário ainda.</p>}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <img src={user?.photoURL || "https://www.gravatar.com/avatar/?d=mp"} className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" alt="" />
              <input 
                type="text" placeholder="Adicione um comentário..." value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarComentario()}
                className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-xs text-white focus:outline-none focus:border-gray-500"
              />
              <button onClick={enviarComentario} disabled={!novoComentario.trim()} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full disabled:opacity-30 transition-all">
                <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </article>
  );
}