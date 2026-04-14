/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard"; 
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const TMDB_API_KEY = "5e0b606e87348f0592b761526df56825";

export default function HubHome() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [ordemRecente, setOrdemRecente] = useState(true);

  const [modalPost, setModalPost] = useState(false);
  const [postCategoria, setPostCategoria] = useState("livro");
  const [postTitulo, setPostTitulo] = useState("");
  const [postCapa, setPostCapa] = useState("");
  const [postTexto, setPostTexto] = useState("");
  const [enviandoPost, setEnviandoPost] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const formatarCapa = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
    if (url.startsWith("http")) return url;
    return `https://image.tmdb.org/t/p/w1280${url}`;
  };

  const carregarFeedCompleto = async () => {
    try {
      const filmesSnap = await getDocs(collection(db, "filmes"));
      const comentariosSnap = await getDocs(collection(db, "comentarios"));
      const postsLivresSnap = await getDocs(collection(db, "posts_feed"));
      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      const culturaSnap = await getDocs(collection(db, "perfil_cultura"));
      
      let posts = [];
      const agora = new Date();

      const mapUsuarios = {};
      usuariosSnap.forEach(d => {
        const u = d.data();
        mapUsuarios[u.email?.toLowerCase()] = u;
        if (u.uid) mapUsuarios[u.uid] = u;
      });

      const lixaoFilmes = [];
      const olimpoFilmes = [];

      filmesSnap.forEach(doc => {
        const data = doc.data();

        if (data.status === "assistido" && data.notaGeral !== undefined) {
          const nota = parseFloat(data.notaGeral);
          if (nota <= 4.5) lixaoFilmes.push({ ...data, id: doc.id });
          if (nota >= 8.5) olimpoFilmes.push({ ...data, id: doc.id });
        }

        if (data.status === "sugerido") {
          posts.push({
            id: `sug_${doc.id}`,
            categoria: "filme",
            usuario: data.sugeridoPor?.nome || "Membro Oculto",
            foto: data.sugeridoPor?.foto || `https://api.dicebear.com/7.x/initials/svg?seed=${data.sugeridoPor?.nome || 'M'}`,
            autorEmail: data.sugeridoPor?.email || "", 
            acao: "Sugeriu um filme para a fila",
            titulo: data.titulo,
            capa: formatarCapa(data.capa),
            trailerKey: data.trailerKey,
            texto: data.sinopse,
            data: new Date(data.dataCriacao || 0),
            isLive: false,
            likes: data.likes || [] 
          });
        } 
        else if (data.status === "assistido") {
          const dataInicio = new Date(data.dataAssistido || data.dataCriacao || 0);
          const duracaoMs = (data.duracao || 120) * 60 * 1000;
          const estaAoVivo = agora >= dataInicio && agora < new Date(dataInicio.getTime() + duracaoMs);

          posts.push({
            id: `ass_${doc.id}`,
            categoria: "sessão",
            usuario: "A Galera FDG",
            foto: `https://api.dicebear.com/7.x/initials/svg?seed=Galera`,
            autorEmail: "", 
            acao: estaAoVivo ? "Está a assistir agora" : "Assistiu a este filme",
            titulo: data.titulo,
            capa: formatarCapa(data.capa),
            trailerKey: estaAoVivo ? null : data.trailerKey,
            texto: estaAoVivo ? "Sessão a decorrer! Pega nas pipocas e vem." : `A sessão acabou. Média: ${data.notaGeral} ⭐`,
            data: dataInicio,
            isLive: estaAoVivo,
            likes: data.likes || []
          });
        }
      });

      const horaAtual = agora.getHours();
      
      if (lixaoFilmes.length > 0) {
        const filmeLixo = lixaoFilmes[horaAtual % lixaoFilmes.length];
        posts.push({
          id: `bot_lixo_${filmeLixo.id}`,
          tipoPost: "lixao",
          titulo: filmeLixo.titulo,
          capa: formatarCapa(filmeLixo.capa),
          nota: filmeLixo.notaGeral,
          duracao: filmeLixo.duracao || 120,
          culpadoNome: filmeLixo.sugeridoPor?.nome || "Membro Oculto",
          culpadoFoto: filmeLixo.sugeridoPor?.foto || `https://api.dicebear.com/7.x/initials/svg?seed=U`,
          data: new Date(filmeLixo.dataAssistido || filmeLixo.dataCriacao || 0),
          likes: []
        });
      }

      if (olimpoFilmes.length > 0) {
        const filmeOlimpo = olimpoFilmes[(horaAtual + 5) % olimpoFilmes.length];
        posts.push({
          id: `bot_olimpo_${filmeOlimpo.id}`,
          tipoPost: "olimpo",
          titulo: filmeOlimpo.titulo,
          capa: formatarCapa(filmeOlimpo.capa),
          nota: filmeOlimpo.notaGeral,
          duracao: filmeOlimpo.duracao || 120,
          culpadoNome: filmeOlimpo.sugeridoPor?.nome || "Membro Oculto",
          culpadoFoto: filmeOlimpo.sugeridoPor?.foto || `https://api.dicebear.com/7.x/initials/svg?seed=U`,
          data: new Date(filmeOlimpo.dataAssistido || filmeOlimpo.dataCriacao || 0),
          likes: []
        });
      }

      comentariosSnap.forEach(docComent => {
        const c = docComent.data();
        const filme = filmesSnap.docs.find(d => d.id === c.filmeId)?.data();
        if (filme) {
          posts.push({
            id: `com_${docComent.id}`,
            categoria: "resenha",
            usuario: c.usuarioNome || "Membro Oculto",
            foto: c.usuarioFoto || `https://api.dicebear.com/7.x/initials/svg?seed=${c.usuarioNome || 'M'}`,
            autorEmail: c.usuarioEmail || "",
            acao: "Publicou uma resenha",
            titulo: filme.titulo,
            capa: formatarCapa(filme.capa),
            texto: c.texto,
            data: new Date(c.dataCriacao || 0),
            isLive: false,
            likes: c.likes || []
          });
        }
      });

      postsLivresSnap.forEach(d => {
        const data = d.data();
        posts.push({
          id: `post_${d.id}`,
          categoria: data.categoria,
          usuario: data.autor?.nome || "Membro Oculto",
          foto: data.autor?.foto || `https://api.dicebear.com/7.x/initials/svg?seed=${data.autor?.nome || 'M'}`,
          autorEmail: data.autor?.email || "",
          acao: data.categoria === 'livro' ? 'Começou a ler' : data.categoria === 'musica' ? 'Está a ouvir' : 'Partilhou com a galera',
          titulo: data.tituloObra,
          capa: formatarCapa(data.capaUrl),
          texto: data.texto,
          data: new Date(data.dataCriacao),
          isLive: false,
          tipoPost: "livre",
          likes: data.likes || []
        });
      });

      usuariosSnap.forEach(doc => {
        const u = doc.data();
        if (u.sessaoJam?.isPlaying && u.sessaoJam?.track) {
          posts.push({
            id: `jam_${doc.id}`,
            categoria: "Música",
            usuario: u.nome || "Membro",
            foto: u.foto || `https://api.dicebear.com/7.x/initials/svg?seed=${u.nome || 'M'}`,
            autorEmail: u.email || doc.id, 
            acao: "Está a ouvir agora",
            titulo: u.sessaoJam.track.titulo,
            capa: u.sessaoJam.track.capa,
            artista: u.sessaoJam.track.artista,
            trackInfo: u.sessaoJam.track,
            offset: (Date.now() - u.sessaoJam.startTimestamp) / 1000,
            data: new Date(u.sessaoJam.startTimestamp),
            isLive: true,
            tipoPost: "jam"
          });
        }
      });

      culturaSnap.forEach(doc => {
        const item = doc.data();
        if (item.tipo === "Música") return;

        const autorDoItem = mapUsuarios[item.uid] || { nome: "Membro Oculto", foto: `https://api.dicebear.com/7.x/initials/svg?seed=${item.uid || 'M'}`, email: "" };
        const dataAcao = item.dataAtualizacao ? new Date(item.dataAtualizacao) : new Date(item.dataCriacao);
        
        let acaoTexto = "Adicionou à coleção";
        if (item.progresso > 0) {
          acaoTexto = item.progresso >= item.total ? "Concluiu a obra!" : `Atualizou o progresso (${item.progresso}/${item.total})`;
        }

        posts.push({
          id: `cult_${doc.id}`,
          categoria: item.tipo,
          usuario: autorDoItem.nome,
          foto: autorDoItem.foto,
          autorEmail: autorDoItem.email || "",
          acao: acaoTexto,
          titulo: item.titulo,
          capa: formatarCapa(item.capa),
          texto: item.sinopse || "",
          progresso: parseInt(item.progresso) || 0,
          total: parseInt(item.total) || 1,
          data: dataAcao,
          isLive: false,
          tipoPost: "progresso",
          likes: item.likes || []
        });
      });

      try {
        const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=pt-BR`);
        const tmdbData = await res.json();
        if (tmdbData.results && tmdbData.results.length > 0) {
          const filmeSugestao = tmdbData.results[horaAtual % tmdbData.results.length];
          posts.push({
            id: `sug_auto_${filmeSugestao.id}`,
            categoria: "Em Alta",
            usuario: "Radar FDG",
            foto: "https://api.dicebear.com/7.x/shapes/svg?seed=Radar&backgroundColor=000000",
            autorEmail: "",
            acao: "Sugestão da Hora",
            titulo: filmeSugestao.title || filmeSugestao.name,
            capa: `https://image.tmdb.org/t/p/w1280${filmeSugestao.backdrop_path || filmeSugestao.poster_path}`,
            texto: "A bombar no mundo inteiro agora. Alguém alinha colocar na fila?",
            data: new Date(agora.getTime() + 1000), 
            isLive: false,
            tipoPost: "radar",
            isSugestaoAuto: true
          });
        }
      } catch (e) {}

      posts.sort((a, b) => b.data - a.data);
      setFeed(posts);

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
        autor: { uid: user.uid, nome: user.displayName, foto: user.photoURL, email: user.email },
        categoria: postCategoria,
        tituloObra: postTitulo,
        capaUrl: postCapa,
        texto: postTexto,
        dataCriacao: new Date().toISOString(),
        likes: []
      });
      toast.success("Publicado no Feed!");
      setModalPost(false);
      setPostTitulo(""); setPostCapa(""); setPostTexto("");
      carregarFeedCompleto();
    } catch (error) { toast.error("Erro ao publicar."); }
    setEnviandoPost(false);
  };

  const feedFiltrado = feed.filter(post => {
    if (filtroAtivo === "Todos") return true;
    if (filtroAtivo === "Música 🎵") return post.tipoPost === "jam" || post.categoria === "Música";
    if (filtroAtivo === "Cinema 🎬") return ["filme", "sessão", "resenha", "Em Alta"].includes(post.categoria) || ["lixao", "olimpo", "radar"].includes(post.tipoPost);
    if (filtroAtivo === "Coleção 📚") return post.tipoPost === "progresso";
    if (filtroAtivo === "Comunidade 🗣️") return post.tipoPost === "livre";
    return true;
  });

  const feedFinal = [...feedFiltrado].sort((a, b) => {
    if (ordemRecente) return b.data - a.data;
    return a.data - b.data;
  });

  if (!mounted) return null;

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
                  <button type="button" key={cat} onClick={() => setPostCategoria(cat)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${postCategoria === cat ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {cat}
                  </button>
                ))}
              </div>
              
              <input type="text" placeholder="Nome da Obra (Ex: Berserk, Starboy...)" value={postTitulo} onChange={e => setPostTitulo(e.target.value)} required className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500 outline-none" />
              <input type="url" placeholder="URL da Capa (Opcional, cola o link de uma imagem)" value={postCapa} onChange={e => setPostCapa(e.target.value)} className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500 outline-none" />
              <textarea placeholder="O que achaste disto?" value={postTexto} onChange={e => setPostTexto(e.target.value)} required className="w-full bg-[#161616] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-500 outline-none min-h-[100px] resize-none" />
              
              <button type="submit" disabled={enviandoPost} className="w-full bg-white text-black hover:bg-red-600 hover:text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg">
                {enviandoPost ? "A publicar..." : "Publicar na Timeline"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[600px] mx-auto px-0 sm:px-4 pt-24 sm:pt-36">
        
        <div className="px-4 sm:px-0 mb-6 flex flex-col gap-4 border-b border-white/5 pb-4">
          <div className="flex justify-between items-end">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Timeline <span className="text-red-600 text-3xl leading-none">.</span></h1>
            <button onClick={() => setModalPost(true)} className="bg-red-600/20 border border-red-600/50 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <span className="text-lg leading-none">+</span> Partilhar
            </button>
          </div>

          <div className="flex items-center justify-between">
            {/* 🪄 FIX: CLASSES TAILWIND PARA ESCONDER A BARRA DE SCROLL FEIA! */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {["Todos", "Música 🎵", "Cinema 🎬", "Coleção 📚", "Comunidade 🗣️"].map(f => (
                <button
                  key={f}
                  onClick={() => setFiltroAtivo(f)}
                  className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    filtroAtivo === f 
                      ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                      : 'bg-[#111] border border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button onClick={() => setOrdemRecente(!ordemRecente)} className="shrink-0 mb-2 ml-4 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-2">
              {ordemRecente ? (
                <>Mais Recentes <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg></>
              ) : (
                <>Mais Antigos <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg></>
              )}
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="text-center text-gray-600 text-xs font-black uppercase tracking-widest mt-20 animate-pulse">
            A vigiar a atividade da galera... 👀
          </div>
        ) : feedFinal.length === 0 ? (
          <div className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest mt-20">
            Nenhuma atividade encontrada neste filtro.
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:gap-8 pb-10">
            {feedFinal.slice(0, 60).map(post => (
               <PostCard key={post.id} post={post} user={user} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}