/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard"; // 🪄 O NOSSO COMPONENTE MÁGICO!
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const TMDB_API_KEY = "5e0b606e87348f0592b761526df56825";

export default function HubHome() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estados de Nova Publicação (Modal)
  const [modalPost, setModalPost] = useState(false);
  const [postCategoria, setPostCategoria] = useState("livro");
  const [postTitulo, setPostTitulo] = useState("");
  const [postCapa, setPostCapa] = useState("");
  const [postTexto, setPostTexto] = useState("");
  const [enviandoPost, setEnviandoPost] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const carregarFeedCompleto = async () => {
    try {
      const filmesSnap = await getDocs(collection(db, "filmes"));
      const comentariosSnap = await getDocs(collection(db, "comentarios"));
      const postsLivresSnap = await getDocs(collection(db, "posts_feed"));
      
      let posts = [];
      const agora = new Date();

      filmesSnap.forEach(doc => {
        const data = doc.data();
        if (data.status === "sugerido") {
          posts.push({
            id: `sug_${doc.id}`,
            categoria: "filme",
            usuario: data.sugeridoPor?.nome || "Membro",
            foto: data.sugeridoPor?.foto || "https://www.gravatar.com/avatar/?d=mp",
            acao: "Sugeriu um filme para a fila",
            titulo: data.titulo,
            capa: data.capa,
            trailerKey: data.trailerKey,
            texto: data.sinopse,
            data: new Date(data.dataCriacao || 0),
            isLive: false
          });
        } 
        else if (data.status === "assistido") {
          const dataInicio = new Date(data.dataAssistido || data.dataCriacao || 0);
          const duracaoMs = (data.duracao || 120) * 60 * 1000;
          const estaAoVivo = agora >= dataInicio && agora < new Date(dataInicio.getTime() + duracaoMs);

          posts.push({
            id: `ass_${doc.id}`,
            categoria: "sessão",
            usuario: "A Galera",
            foto: "https://api.dicebear.com/7.x/shapes/svg?seed=Galera&backgroundColor=dc2626",
            acao: estaAoVivo ? "Está a assistir agora" : "Assistiu a este filme",
            titulo: data.titulo,
            capa: data.capa,
            trailerKey: estaAoVivo ? null : data.trailerKey,
            texto: estaAoVivo ? "Sessão a decorrer! Pega nas pipocas e vem." : `A sessão acabou. Média: ${data.notaGeral} ⭐`,
            data: dataInicio,
            isLive: estaAoVivo
          });
        }
      });

      comentariosSnap.forEach(docComent => {
        const c = docComent.data();
        const filme = filmesSnap.docs.find(d => d.id === c.filmeId)?.data();
        if (filme) {
          posts.push({
            id: `com_${docComent.id}`,
            categoria: "resenha",
            usuario: c.usuarioNome || "Membro",
            foto: c.usuarioFoto || "https://www.gravatar.com/avatar/?d=mp",
            acao: "Publicou uma resenha",
            titulo: filme.titulo,
            capa: filme.capa,
            texto: c.texto,
            data: new Date(c.dataCriacao || 0),
            isLive: false
          });
        }
      });

      postsLivresSnap.forEach(d => {
        const data = d.data();
        posts.push({
          id: `post_${d.id}`,
          categoria: data.categoria,
          usuario: data.autor.nome,
          foto: data.autor.foto,
          acao: data.categoria === 'livro' ? 'Começou a ler' : data.categoria === 'musica' ? 'Está a ouvir' : 'Partilhou',
          titulo: data.tituloObra,
          capa: data.capaUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
          texto: data.texto,
          data: new Date(data.dataCriacao),
          isLive: false
        });
      });

      try {
        const horaAtual = new Date().getHours();
        const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=pt-BR`);
        const tmdbData = await res.json();
        if (tmdbData.results && tmdbData.results.length > 0) {
          const filmeSugestao = tmdbData.results[horaAtual % tmdbData.results.length];
          posts.push({
            id: `sug_auto_${filmeSugestao.id}`,
            categoria: "Em Alta",
            usuario: "Radar FDG",
            foto: "https://api.dicebear.com/7.x/shapes/svg?seed=Radar&backgroundColor=000000",
            acao: "Sugestão da Hora",
            titulo: filmeSugestao.title || filmeSugestao.name,
            capa: `https://image.tmdb.org/t/p/w1280${filmeSugestao.backdrop_path || filmeSugestao.poster_path}`,
            texto: "A bombar no mundo inteiro agora. Alguém alinha colocar na fila?",
            data: new Date(agora.getTime() + 1000), 
            isLive: false,
            isSugestaoAuto: true
          });
        }
      } catch (e) { console.log("Erro no radar", e); }

      posts.sort((a, b) => b.data - a.data);
      setFeed(posts.slice(0, 30));

    } catch (error) {
      console.error("Erro a carregar feed:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarFeedCompleto(); }, []);

  const publicarNoFeed = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Apenas membros podem publicar.");
    setEnviandoPost(true);

    try {
      await addDoc(collection(db, "posts_feed"), {
        autor: { uid: user.uid, nome: user.displayName, foto: user.photoURL },
        categoria: postCategoria,
        tituloObra: postTitulo,
        capaUrl: postCapa,
        texto: postTexto,
        dataCriacao: new Date().toISOString()
      });
      toast.success("Publicado no Feed!");
      setModalPost(false);
      setPostTitulo(""); setPostCapa(""); setPostTexto("");
      carregarFeedCompleto();
    } catch (error) { toast.error("Erro ao publicar."); }
    setEnviandoPost(false);
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white font-sans relative pb-20">
      <Navbar />

      {modalPost && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#111111] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-fade-in-up relative">
            <button onClick={() => setModalPost(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-xl font-black italic uppercase mb-6">Nova Publicação</h2>
            
            <form onSubmit={publicarNoFeed} className="space-y-4">
              <div className="flex gap-2 mb-2">
                {['livro', 'musica', 'anime'].map(cat => (
                  <button type="button" key={cat} onClick={() => setPostCategoria(cat)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${postCategoria === cat ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              
              <input type="text" placeholder="Nome da Obra (Ex: Berserk, Starboy...)" value={postTitulo} onChange={e => setPostTitulo(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500 outline-none" />
              <input type="url" placeholder="URL da Capa (Opcional, cola o link de uma imagem)" value={postCapa} onChange={e => setPostCapa(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500 outline-none" />
              <textarea placeholder="O que achaste disto?" value={postTexto} onChange={e => setPostTexto(e.target.value)} required className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500 outline-none min-h-[100px] resize-none" />
              
              <button type="submit" disabled={enviandoPost} className="w-full bg-white text-black hover:bg-red-600 hover:text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
                {enviandoPost ? "A publicar..." : "Publicar na Timeline"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[600px] mx-auto px-0 sm:px-4 pt-24 sm:pt-36">
        
        <div className="px-4 sm:px-0 mb-6 flex justify-between items-end border-b border-white/5 pb-4">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Timeline</h1>
          <button onClick={() => setModalPost(true)} className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white flex items-center gap-2 transition-all">
            <span className="text-red-500 text-lg leading-none">+</span> Partilhar
          </button>
        </div>

        {carregando ? (
          <div className="text-center text-gray-600 text-xs font-black uppercase tracking-widest mt-20 animate-pulse">
            A carregar o radar...
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-8 pb-10">
            {feed.map(post => (
               /* O componente encarrega-se agora de todo o trabalho pesado! */
               <PostCard key={post.id} post={post} user={user} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}