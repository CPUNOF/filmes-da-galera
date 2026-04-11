/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

const TMDB_API_KEY = "5e0b606e87348f0592b761526df56825";

const MAPA_GENEROS = {
  28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime", 
  99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia", 
  36: "História", 27: "Terror", 10402: "Música", 9648: "Mistério", 
  10749: "Romance", 878: "Ficção Científica", 10770: "Cinema TV", 
  53: "Suspense", 10752: "Guerra", 37: "Faroeste"
};

const LISTA_FILTROS_REC = [
  { id: "todas", nome: "🔥 Para Você" },
  { id: "28", nome: "Ação" },
  { id: "27", nome: "Terror" },
  { id: "53", nome: "Suspense" },
  { id: "35", nome: "Comédia" },
  { id: "878", nome: "Ficção Científica" },
  { id: "18", nome: "Drama" },
  { id: "14", nome: "Fantasia" },
  { id: "12", nome: "Aventura" }
];

export default function NovoFilme() {
  const [usuario, setUsuario] = useState(null);
  const [busca, setBusca] = useState("");
  const [modoBusca, setModoBusca] = useState("titulo"); 
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  
  const [jaAssisti, setJaAssisti] = useState(false);
  const [minhaNota, setMinhaNota] = useState(0);

  const [meusIngressos, setMeusIngressos] = useState(0);
  const [ultimoUsoIngresso, setUltimoUsoIngresso] = useState(null);
  const [usarIngresso, setUsarIngresso] = useState(false);

  const [filmesBonsAcervo, setFilmesBonsAcervo] = useState([]);
  const [filtroRecAtivo, setFiltroRecAtivo] = useState(LISTA_FILTROS_REC[0]);
  const [recomendados, setRecomendados] = useState([]);
  const [motivoRecomendacao, setMotivoRecomendacao] = useState("");
  const [carregandoRecs, setCarregandoRecs] = useState(true);
  
  const [acervoIds, setAcervoIds] = useState({}); 

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const unsubscribe = onSnapshot(doc(db, "usuarios", usuario.email.toLowerCase()), (snap) => {
      if (snap.exists()) {
        setMeusIngressos(snap.data().ingressosDourados || 0);
        setUltimoUsoIngresso(snap.data().ultimoIngressoUsado || null);
      }
    });
    return () => unsubscribe();
  }, [usuario]);

  useEffect(() => {
    async function carregarAcervo() {
      try {
        const snapFilmes = await getDocs(collection(db, "filmes"));
        const bons = [];
        const idsGuardados = {}; 
        
        snapFilmes.forEach(doc => {
          const data = doc.data();
          idsGuardados[data.tmdbId] = data.status; 
          
          if (data.status === "assistido" && Number(data.notaGeral) > 6) {
            bons.push(data);
          }
        });

        setAcervoIds(idsGuardados);
        setFilmesBonsAcervo(bons);
        
        buscarRecomendacoesInteligentes(LISTA_FILTROS_REC[0], bons);

      } catch (error) {
        console.error("Erro ao carregar acervo:", error);
      }
    }
    carregarAcervo();
  }, []);

  const buscarRecomendacoesInteligentes = async (categoria, acervoBons) => {
    setCarregandoRecs(true);
    setRecomendados([]);
    try {
      let url = "";
      let motivo = "";

      if (categoria.id === "todas") {
        if (acervoBons.length > 0) {
          const filmeBase = acervoBons[Math.floor(Math.random() * acervoBons.length)];
          url = `https://api.themoviedb.org/3/movie/${filmeBase.tmdbId}/recommendations?api_key=${TMDB_API_KEY}&language=pt-BR`;
          motivo = `Continuações e Similares de "${filmeBase.titulo}" (Nota da Galera: ${filmeBase.notaGeral})`;
        } else {
          url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`;
          motivo = "Filmes em alta no mundo esta semana";
        }
      } else {
        const filmesDaCategoria = acervoBons.filter(f => f.generos && f.generos.includes(categoria.nome));
        
        if (filmesDaCategoria.length > 0) {
          const filmeBase = filmesDaCategoria[Math.floor(Math.random() * filmesDaCategoria.length)];
          url = `https://api.themoviedb.org/3/movie/${filmeBase.tmdbId}/recommendations?api_key=${TMDB_API_KEY}&language=pt-BR`;
          motivo = `Buscando continuações e obras do tipo "${filmeBase.titulo}"`;
        } else {
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${categoria.id}&language=pt-BR&sort_by=popularity.desc`;
          motivo = `Sucessos globais da categoria ${categoria.nome}`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setRecomendados(data.results.filter(f => f.poster_path).slice(0, 15));
        setMotivoRecomendacao(motivo);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCarregandoRecs(false);
    }
  };

  // 🪄 PESQUISA POR CATEGORIA
  const realizarBuscaCategoria = async (idCategoria) => {
    setBuscando(true);
    try {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${idCategoria}&language=pt-BR&sort_by=popularity.desc`;
      const res = await fetch(url);
      const dados = await res.json();
      setResultados(dados.results.filter(filme => filme.poster_path)); 
    } catch (error) {
      toast.error("Erro ao buscar categorias.");
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (modoBusca === "categoria") return; // 🪄 Previne que a barra de texto interfira com as categorias
    
    const timer = setTimeout(() => {
      if (busca.trim().length >= 3) { 
        realizarBuscaAuto(busca, modoBusca);
      } else if (busca.trim().length === 0) {
        setResultados([]); 
      }
    }, 800); 
    return () => clearTimeout(timer);
  }, [busca, modoBusca]);

  const realizarBuscaAuto = async (termo, modo) => {
    setBuscando(true);
    try {
      let url = "";
      if (modo === "titulo") {
        url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`;
      } else if (modo === "ano") {
        if (termo.length === 4 && !isNaN(termo)) {
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&primary_release_year=${termo}&language=pt-BR&sort_by=popularity.desc`;
        } else {
          setBuscando(false);
          return; 
        }
      } else if (modo === "ator") {
        const resAtor = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`);
        const dadosAtor = await resAtor.json();
        if (dadosAtor.results && dadosAtor.results.length > 0) {
          const atorId = dadosAtor.results[0].id;
          url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_cast=${atorId}&language=pt-BR&sort_by=popularity.desc`;
        } else {
          setResultados([]);
          setBuscando(false);
          return;
        }
      }

      if (url) {
        const res = await fetch(url);
        const dados = await res.json();
        setResultados(dados.results.filter(filme => filme.poster_path)); 
      }
    } catch (error) {
      toast.error("Erro ao buscar no acervo mundial.");
    } finally {
      setBuscando(false);
    }
  };

  const selecionarFilme = (filme) => {
    setFilmeSelecionado(filme);
    setUsarIngresso(false);
    setJaAssisti(false);
    setMinhaNota(0);
  };

  const confirmarESalvarFilme = async (destino) => {
    if (!usuario) return toast.error("Você precisa estar logado!");
    if (!filmeSelecionado) return;
    if (jaAssisti && minhaNota === 0) return toast.error("Por favor, selecione a sua nota!");

    if (destino === "grupo" && acervoIds[filmeSelecionado.id]) {
      return toast.error("Este filme já está no acervo da galera!");
    }

    setSalvando(true);
    const t = toast.loading("Verificando autorização...");

    try {
      const membroSnap = await getDoc(doc(db, "membros", usuario.email));
      const adminSnap = await getDoc(doc(db, "admins", usuario.email));

      if (!membroSnap.exists() && !adminSnap.exists()) {
        toast.dismiss(t);
        return toast.error("Acesso Negado! E-mail não está na Whitelist.");
      }

      toast.loading("Checando diário pessoal...", { id: t });

      if (destino === "pessoal") {
        const qPessoal = query(collection(db, "filmes_pessoais"), where("tmdbId", "==", filmeSelecionado.id), where("sugeridoPor.uid", "==", usuario.uid));
        const snapPessoal = await getDocs(qPessoal);
        if (!snapPessoal.empty) {
          toast.dismiss(t);
          setSalvando(false);
          return toast.error("Você já salvou esse filme no seu Diário!");
        }
      }

      toast.loading("Gravando os dados...", { id: t }); 
      
      const resDetails = await fetch(`https://api.themoviedb.org/3/movie/${filmeSelecionado.id}?api_key=${TMDB_API_KEY}&language=pt-BR`);
      const dataDetails = await resDetails.json();
      const duracaoFilme = dataDetails.runtime || 0;

      const resTrailer = await fetch(`https://api.themoviedb.org/3/movie/${filmeSelecionado.id}/videos?api_key=${TMDB_API_KEY}&language=pt-BR`);
      const dataTrailer = await resTrailer.json();
      let videoKey = null;
      if (dataTrailer.results && dataTrailer.results.length > 0) {
        const trailer = dataTrailer.results.find(v => v.type === "Trailer" && v.site === "YouTube") || dataTrailer.results[0];
        videoKey = trailer.key;
      }

      const nomesGeneros = filmeSelecionado.genre_ids ? filmeSelecionado.genre_ids.map(id => MAPA_GENEROS[id]).filter(Boolean) : [];

      const novoFilmeBase = {
        tmdbId: filmeSelecionado.id,
        titulo: filmeSelecionado.title,
        capa: `https://image.tmdb.org/t/p/w500${filmeSelecionado.poster_path}`,
        sinopse: filmeSelecionado.overview || "Sinopse não disponível.",
        generos: nomesGeneros,
        duracao: duracaoFilme, 
        trailerKey: videoKey,
        dataLancamento: filmeSelecionado.release_date || "",
        sugeridoPor: { nome: usuario.displayName, foto: usuario.photoURL, uid: usuario.uid, email: usuario.email },
        dataCriacao: new Date().toISOString()
      };

      if (destino === "grupo") {
        const filmeParaGrupo = { ...novoFilmeBase };
        filmeParaGrupo.status = "sugerido";
        filmeParaGrupo.notaGeral = 0;
        filmeParaGrupo.notaTMDB = filmeSelecionado.vote_average ? filmeSelecionado.vote_average.toFixed(1) : "N/A";
        filmeParaGrupo.quantidadeVotos = 0;
        
        if (usarIngresso && meusIngressos > 0) {
          filmeParaGrupo.ingressoDourado = true;
          await updateDoc(doc(db, "usuarios", usuario.email.toLowerCase()), {
            ingressosDourados: meusIngressos - 1,
            ultimoIngressoUsado: new Date().toISOString()
          });
        }
        
        if (jaAssisti) {
          filmeParaGrupo.seloJaAssistido = true;
          filmeParaGrupo.notaAutor = minhaNota;

          const qPessoalCheck = query(collection(db, "filmes_pessoais"), where("tmdbId", "==", filmeSelecionado.id), where("sugeridoPor.uid", "==", usuario.uid));
          const snapPessoalCheck = await getDocs(qPessoalCheck);
          if (snapPessoalCheck.empty) {
            const filmePessoal = { ...novoFilmeBase, notaPessoal: minhaNota };
            await addDoc(collection(db, "filmes_pessoais"), filmePessoal);
          }
        }
        
        await addDoc(collection(db, "filmes"), filmeParaGrupo);
        toast.dismiss(t);
        
        if (usarIngresso) {
          toast.success("🎫 FURA-FILA ATIVADO! Seu filme está no Topo!", { style: { background: '#ca8a04', color: '#fff' }});
        } else {
          toast.success(jaAssisti ? "Indicado com Selo 🥇 e salvo no seu Diário! 🍿" : "Sucesso! Foi para a fila de Sugestões.");
        }
        
        // 🪄 NÃO REDIRECIONA MAIS! ATUALIZA O CARTÃO LOCALMENTE NA HORA.
        setAcervoIds(prev => ({ ...prev, [filmeSelecionado.id]: "sugerido" }));
        
      } else {
        const filmePessoal = { ...novoFilmeBase, notaPessoal: minhaNota };
        await addDoc(collection(db, "filmes_pessoais"), filmePessoal);
        toast.dismiss(t);
        toast.success("Salvo no seu Diário Pessoal! 🍿");
        
        // 🪄 NÃO REDIRECIONA MAIS! ATUALIZA O CARTÃO LOCALMENTE NA HORA.
        setAcervoIds(prev => ({ ...prev, [filmeSelecionado.id]: "assistido" }));
      }

      // Fecha o Modal
      setFilmeSelecionado(null);
      setJaAssisti(false);
      setMinhaNota(0);
      setUsarIngresso(false);

    } catch (error) {
      toast.dismiss(t);
      toast.error("Falha ao salvar o filme.");
    } finally {
      setSalvando(false);
    }
  };

  const statusNoGrupo = filmeSelecionado ? acervoIds[filmeSelecionado.id] : null;

  const agora = new Date();
  const dataUltimoUso = ultimoUsoIngresso ? new Date(ultimoUsoIngresso) : null;
  const diasPassados = dataUltimoUso ? (agora - dataUltimoUso) / (1000 * 60 * 60 * 24) : 7;
  const emCooldown = diasPassados < 7;
  const diasRestantes = Math.ceil(7 - diasPassados);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden relative font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-red-900/20 blur-[120px] pointer-events-none z-0"></div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {filmeSelecionado && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer" onClick={() => setFilmeSelecionado(null)}></div>
          
          <div className="relative w-full max-w-4xl bg-[#111111] rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="relative w-full h-40 sm:h-64 bg-black shrink-0">
              {filmeSelecionado.backdrop_path ? (
                <img src={`https://image.tmdb.org/t/p/w1280${filmeSelecionado.backdrop_path}`} alt="Fundo" className={`w-full h-full object-cover mask-image-b ${statusNoGrupo ? 'opacity-20 grayscale' : 'opacity-40'}`} />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-900 to-[#111111]"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent"></div>
              <button onClick={() => setFilmeSelecionado(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 bg-black/50 hover:bg-red-600 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors z-50 text-white font-black">✕</button>
            </div>

            <div className="relative px-6 sm:px-12 pb-8 sm:pb-12 -mt-16 sm:-mt-20 flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start text-center sm:text-left overflow-y-auto custom-scrollbar">
              <img src={`https://image.tmdb.org/t/p/w500${filmeSelecionado.poster_path}`} alt={filmeSelecionado.title} className={`w-32 sm:w-48 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-white/10 transform sm:hover:scale-105 transition-all shrink-0 ${statusNoGrupo ? 'grayscale' : ''}`} />

              <div className="flex-1 mt-2 sm:mt-6 w-full">
                <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter leading-tight mb-2">{filmeSelecionado.title}</h2>
                
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-4">
                  <span className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">{filmeSelecionado.release_date?.substring(0,4) || "????"}</span>
                  <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1">⭐ {filmeSelecionado.vote_average ? filmeSelecionado.vote_average.toFixed(1) : "N/A"}</span>
                </div>

                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed italic mb-6 line-clamp-4 sm:line-clamp-none text-center sm:text-left">
                  {filmeSelecionado.overview || "Este filme ainda não possui sinopse oficial em português."}
                </p>

                {statusNoGrupo && (
                  <div className="bg-orange-900/20 border border-orange-500/30 p-3 rounded-xl mb-4 flex items-center gap-3 w-fit mx-auto sm:mx-0">
                    <span className="text-xl">⚠️</span>
                    <p className="text-[10px] sm:text-xs text-orange-200 uppercase font-black tracking-widest leading-relaxed text-left">
                      A galera já {statusNoGrupo === 'assistido' ? 'assistiu a' : 'colocou na fila'} este filme.<br/>Você só pode guardá-lo no seu Diário Pessoal.
                    </p>
                  </div>
                )}

                {meusIngressos > 0 && !statusNoGrupo && (
                  <div className={`mb-4 border p-4 rounded-xl flex items-center gap-3 w-fit mx-auto sm:mx-0 transition-colors ${emCooldown ? 'bg-black/40 border-orange-500/30' : 'bg-yellow-900/20 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]'}`}>
                    {emCooldown ? (
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] sm:text-xs text-orange-500 uppercase font-black tracking-widest leading-relaxed flex items-center gap-2">
                          <span className="text-lg">⏳</span> Ingresso em Cooldown
                        </span>
                        <span className="text-[8px] text-gray-400 mt-1">
                          Aguarde <strong className="text-white">{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}</strong> para usar o fura-fila novamente. (Regra: 1 por semana).
                        </span>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={usarIngresso} onChange={(e) => setUsarIngresso(e.target.checked)} className="w-5 h-5 accent-yellow-500 rounded cursor-pointer" />
                        <span className="text-[10px] sm:text-xs text-yellow-500 uppercase font-black tracking-widest leading-relaxed text-left">
                          USAR 1 INGRESSO DOURADO 🎫 (Você tem {meusIngressos})<br/>
                          <span className="text-[8px] text-yellow-600">Este filme vai ignorar os votos e ir direto para o Topo da Fila!</span>
                        </span>
                      </label>
                    )}
                  </div>
                )}

                <div className={`mt-2 bg-black/40 border border-white/5 p-4 rounded-2xl mb-6 ${statusNoGrupo ? 'border-blue-500/30' : ''}`}>
                  <label className="flex items-center gap-3 cursor-pointer mb-2 w-fit mx-auto sm:mx-0">
                    <input type="checkbox" checked={jaAssisti} onChange={(e) => { setJaAssisti(e.target.checked); setMinhaNota(0); }} className="w-5 h-5 accent-yellow-500 rounded cursor-pointer" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-yellow-500">
                      {statusNoGrupo ? "Para guardar no Diário, avalie:" : "Eu já assisti a este filme sozinho"}
                    </span>
                  </label>

                  {jaAssisti && (
                    <div className="animate-fade-in-up mt-4">
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-2 text-center sm:text-left">Deixe a sua nota para continuar:</p>
                      <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <button key={n} onClick={() => setMinhaNota(n)} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-black text-xs sm:text-sm transition-all ${minhaNota === n ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110" : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  {!statusNoGrupo && (
                    <button onClick={() => confirmarESalvarFilme("grupo")} disabled={salvando || (jaAssisti && minhaNota === 0)} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white py-3 sm:py-4 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2 shrink-0">
                      🔥 Indicar p/ Galera {jaAssisti && "com Selo"} {usarIngresso && "🎫"}
                    </button>
                  )}

                  {jaAssisti && (
                    <button onClick={() => confirmarESalvarFilme("pessoal")} disabled={salvando || minhaNota === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white py-3 sm:py-4 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 shrink-0">
                      🔒 Guardar no Meu Diário
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 pt-6 sm:pt-10 relative z-10">
        <Navbar />

        <div className="max-w-3xl mx-auto mt-16 sm:mt-24 text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            ACERVO MUNDIAL
          </h1>
          <p className="text-gray-400 mb-8 text-sm sm:text-base font-medium">
            O que vamos assistir? Busque, filtre e sugira.
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
            <button onClick={() => { setModoBusca("titulo"); setBusca(""); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${modoBusca === "titulo" ? "bg-red-600 text-white shadow-lg shadow-red-600/30" : "bg-[#111111] text-gray-500 border border-white/10 hover:text-white"}`}>
              🎬 Título
            </button>
            <button onClick={() => { setModoBusca("ator"); setBusca(""); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${modoBusca === "ator" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "bg-[#111111] text-gray-500 border border-white/10 hover:text-white"}`}>
              👤 Ator
            </button>
            <button onClick={() => { setModoBusca("ano"); setBusca(""); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${modoBusca === "ano" ? "bg-yellow-600 text-black shadow-lg shadow-yellow-600/30" : "bg-[#111111] text-gray-500 border border-white/10 hover:text-white"}`}>
              📅 Ano
            </button>
            {/* 🪄 NOVO BOTÃO DE CATEGORIA */}
            <button onClick={() => { setModoBusca("categoria"); setBusca(""); }} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${modoBusca === "categoria" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" : "bg-[#111111] text-gray-500 border border-white/10 hover:text-white"}`}>
              🏷️ Categoria
            </button>
          </div>
          
          {/* 🪄 ALTERNA ENTRE BARRA DE TEXTO E GRELHA DE CATEGORIAS */}
          {modoBusca === "categoria" ? (
            <div className="flex flex-wrap justify-center gap-3 mb-16 max-w-4xl mx-auto animate-fade-in-up">
              {Object.entries(MAPA_GENEROS).map(([id, nome]) => (
                <button 
                  key={id} 
                  onClick={() => {
                    setBusca(nome); 
                    realizarBuscaCategoria(id);
                  }}
                  className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${busca === nome ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)] scale-105' : 'bg-[#141414] text-gray-400 border-white/10 hover:border-purple-500/50 hover:text-white'}`}
                >
                  {nome}
                </button>
              ))}
            </div>
          ) : (
            <div className="relative flex items-center mb-16 shadow-2xl animate-fade-in-up">
              <input 
                type="text" 
                value={busca} 
                onChange={(e) => setBusca(e.target.value)} 
                className="w-full bg-[#141414] border border-white/10 rounded-2xl py-5 pl-6 pr-32 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-lg font-medium shadow-inner placeholder:text-gray-600" 
                placeholder={
                  modoBusca === "titulo" ? "Ex: O Telefone Preto..." :
                  modoBusca === "ator" ? "Ex: Leonardo DiCaprio..." :
                  "Ex: 2023..."
                } 
              />
              <div className="absolute right-2 top-2 bottom-2 bg-white/5 border border-white/10 text-white/50 font-black px-6 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center min-w-[120px]">
                {buscando ? "Buscando..." : "🔎"}
              </div>
            </div>
          )}
        </div>

        {resultados.length > 0 && (
          <div className="max-w-6xl mx-auto border-t border-white/5 pt-12 animate-fade-in">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-red-600 rounded-full"></span> Resultados Encontrados
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {resultados.map((filme) => {
                const status = acervoIds[filme.id]; 
                return (
                  <div key={filme.id} onClick={() => selecionarFilme(filme)} className={`group relative bg-[#141414] rounded-2xl overflow-hidden shadow-xl border border-white/5 cursor-pointer transition-all aspect-[2/3] ${status ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:border-blue-500/50' : 'hover:border-red-500/50'}`}>
                    
                    {status && (
                      <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-white/10 z-20">
                        {status === "assistido" ? "👀 Já Assistido" : "⏳ Na Fila"}
                      </div>
                    )}

                    <img src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={filme.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h4 className="font-black text-white text-sm leading-tight mb-1">{filme.title}</h4>
                      <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest mb-4">{filme.release_date ? filme.release_date.substring(0, 4) : "Data Indisponível"}</span>
                      <button className={`w-full backdrop-blur-md border border-white/20 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${status ? 'bg-blue-600/50 hover:bg-blue-600' : 'bg-white/10 hover:bg-red-600 hover:border-transparent'}`}>
                        {status ? "Ver no Diário" : "Sugerir"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {resultados.length === 0 && !buscando && busca.trim().length === 0 && (
          <div className="max-w-6xl mx-auto border-t border-white/5 pt-12 animate-fade-in mb-20">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-3 mb-1">
                  <span className="w-2 h-8 bg-blue-600 rounded-full"></span> 💡 Recomendações Inteligentes
                </h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{motivoRecomendacao}</p>
              </div>
            </div>

            {/* PÍLULAS DE FILTRO POR GÊNERO */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-8 snap-x pb-2 border-b border-white/5">
              {LISTA_FILTROS_REC.map(gen => (
                <button
                  key={gen.id}
                  onClick={() => {
                    setFiltroRecAtivo(gen);
                    buscarRecomendacoesInteligentes(gen, filmesBonsAcervo);
                  }}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 transition-all snap-start ${filtroRecAtivo.id === gen.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#111111] border border-white/10 text-gray-500 hover:text-white hover:border-white/30'}`}
                >
                  {gen.nome}
                </button>
              ))}
            </div>
            
            {carregandoRecs ? (
              <div className="text-center py-20 text-gray-500 uppercase tracking-widest font-black text-xs">Analisando o gosto da galera...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {recomendados.map((filme) => {
                  const status = acervoIds[filme.id]; 
                  return (
                    <div key={filme.id} onClick={() => selecionarFilme(filme)} className={`group relative bg-[#141414] rounded-2xl overflow-hidden shadow-xl border border-white/5 cursor-pointer transition-all aspect-[2/3] ${status ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:border-blue-500/50' : 'hover:border-blue-500/50'}`}>
                      
                      {status && (
                        <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-white/10 z-20">
                          {status === "assistido" ? "👀 Já Assistido" : "⏳ Na Fila"}
                        </div>
                      )}

                      <img src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={filme.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h4 className="font-black text-white text-sm leading-tight mb-1">{filme.title}</h4>
                        <span className="text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-4">Recomendado</span>
                        <button className={`w-full backdrop-blur-md border border-white/20 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${status ? 'bg-blue-600/50 hover:bg-blue-600' : 'bg-white/10 hover:bg-blue-600 hover:border-transparent'}`}>
                          {status ? "Ver no Diário" : "Ver Mais"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}