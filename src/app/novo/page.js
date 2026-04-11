/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const MAPA_GENEROS = {
  28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime", 
  99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia", 
  36: "História", 27: "Terror", 10402: "Música", 9648: "Mistério", 
  10749: "Romance", 878: "Ficção Científica", 10770: "Cinema TV", 
  53: "Suspense", 10752: "Guerra", 37: "Faroeste"
};

export default function NovoFilme() {
  const [usuario, setUsuario] = useState(null);
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (busca.trim().length > 2) {
        realizarBuscaAuto(busca);
      } else if (busca.trim().length === 0) {
        setResultados([]); 
      }
    }, 600); 
    return () => clearTimeout(timer);
  }, [busca]);

  const realizarBuscaAuto = async (termo) => {
    setBuscando(true);
    try {
      const res = await fetch(`/api/tmdb?q=${termo}`);
      const dados = await res.json();
      setResultados(dados.filter(filme => filme.poster_path)); 
    } catch (error) {
      toast.error("Erro ao buscar filmes.");
    } finally {
      setBuscando(false);
    }
  };

  const confirmarESalvarFilme = async () => {
    if (!usuario) {
      toast.error("Você precisa estar logado para indicar um filme!");
      return;
    }
    if (!filmeSelecionado) return;

    setSalvando(true);
    const t = toast.loading("Verificando autorização...");

    try {
      // 🛑 NOVA TRAVA DE SEGURANÇA: Só membros ou admins podem indicar
      const membroSnap = await getDoc(doc(db, "membros", usuario.email));
      const adminSnap = await getDoc(doc(db, "admins", usuario.email));

      if (!membroSnap.exists() && !adminSnap.exists()) {
        toast.dismiss(t);
        toast.error("Acesso Negado! Seu e-mail não está na lista de Convidados Autorizados.");
        setSalvando(false);
        return; 
      }

      toast.loading("Checando o acervo...", { id: t });

      // 🛑 TRAVA ANTI-DUPLICATAS PRESERVADA
      const q = query(collection(db, "filmes"), where("tmdbId", "==", filmeSelecionado.id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.dismiss(t);
        toast.error("Ops! A galera já indicou ou assistiu esse filme.");
        setSalvando(false);
        return; 
      }

      toast.loading("Preparando os rolos de filme...", { id: t }); 
      
      const resTrailer = await fetch(`/api/tmdb/trailer?id=${filmeSelecionado.id}`);
      const { key } = await resTrailer.json();
      const nomesGeneros = filmeSelecionado.genre_ids.map(id => MAPA_GENEROS[id]).filter(Boolean);

      const novoFilme = {
        tmdbId: filmeSelecionado.id,
        titulo: filmeSelecionado.title,
        capa: `https://image.tmdb.org/t/p/w500${filmeSelecionado.poster_path}`,
        sinopse: filmeSelecionado.overview || "Sinopse não disponível em português.",
        generos: nomesGeneros,
        trailerKey: key || null,
        dataLancamento: filmeSelecionado.release_date,
        status: "sugerido",
        notaGeral: 0,
        notaTMDB: filmeSelecionado.vote_average ? filmeSelecionado.vote_average.toFixed(1) : "N/A",
        quantidadeVotos: 0,
        sugeridoPor: {
          nome: usuario.displayName,
          foto: usuario.photoURL,
          uid: usuario.uid
        },
        dataCriacao: new Date().toISOString()
      };

      await addDoc(collection(db, "filmes"), novoFilme);
      
      toast.dismiss(t);
      toast.success("Sucesso! O filme foi para a fila de Sugestões.");
      setFilmeSelecionado(null);
      
      setTimeout(() => {
        router.push("/sugestoes"); 
      }, 1500);

    } catch (error) {
      toast.dismiss(t);
      toast.error("Falha ao salvar o filme.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden relative font-sans">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-red-900/20 blur-[120px] pointer-events-none z-0"></div>

      {filmeSelecionado && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 opacity-100 transition-opacity">
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer"
            onClick={() => setFilmeSelecionado(null)}
          ></div>
          
          <div className="relative w-full max-w-4xl bg-[#111111] rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 animate-fade-in-up">
            
            <div className="relative w-full h-48 sm:h-72 bg-black">
              {filmeSelecionado.backdrop_path ? (
                <img 
                  src={`https://image.tmdb.org/t/p/w1280${filmeSelecionado.backdrop_path}`} 
                  alt="Fundo" 
                  className="w-full h-full object-cover opacity-40 mask-image-b"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-gray-900 to-[#111111]"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent"></div>
              
              <button 
                onClick={() => setFilmeSelecionado(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 bg-black/50 hover:bg-red-600 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors z-50 text-white font-black"
              >
                ✕
              </button>
            </div>

            <div className="relative px-6 sm:px-12 pb-8 sm:pb-12 -mt-16 sm:-mt-24 flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-start text-center sm:text-left">
              <img 
                src={`https://image.tmdb.org/t/p/w500${filmeSelecionado.poster_path}`} 
                alt={filmeSelecionado.title}
                className="w-32 sm:w-48 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-white/10 transform sm:hover:scale-105 transition-transform"
              />

              <div className="flex-1 mt-2 sm:mt-8">
                <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter leading-tight mb-2">
                  {filmeSelecionado.title}
                </h2>
                
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-6">
                  <span className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                    {filmeSelecionado.release_date?.substring(0,4) || "????"}
                  </span>
                  <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1">
                    ⭐ {filmeSelecionado.vote_average ? filmeSelecionado.vote_average.toFixed(1) : "N/A"} <span className="text-gray-500">/ 10</span>
                  </span>
                </div>

                <p className="text-gray-400 text-sm sm:text-base leading-relaxed italic mb-8 line-clamp-4 sm:line-clamp-none">
                  {filmeSelecionado.overview || "Este filme ainda não possui sinopse em português."}
                </p>

                <button 
                  onClick={confirmarESalvarFilme}
                  disabled={salvando}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white px-8 py-4 rounded-xl sm:rounded-full text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] flex items-center justify-center gap-3"
                >
                  {salvando ? "Processando..." : "🔥 Confirmar Indicação"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 pt-6 sm:pt-10 relative z-10">
        <Navbar />

        <div className="max-w-3xl mx-auto mt-16 sm:mt-24 text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            INDICAR FILME
          </h1>
          <p className="text-gray-400 mb-10 text-sm sm:text-base font-medium">
            Pesquise no acervo mundial e jogue sua sugestão na nossa fila.
          </p>
          
          <div className="relative flex items-center mb-16 shadow-2xl">
            <input 
              type="text" 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-2xl py-5 pl-6 pr-32 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-lg font-medium shadow-inner placeholder:text-gray-600"
              placeholder="Digite o nome do filme (ex: O Telefone Preto)..."
            />
            <div className="absolute right-2 top-2 bottom-2 bg-white/5 border border-white/10 text-white/50 font-black px-6 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center min-w-[120px]">
              {buscando ? "Buscando..." : "🔎"}
            </div>
          </div>
        </div>

        {resultados.length > 0 && (
          <div className="max-w-6xl mx-auto border-t border-white/5 pt-12 animate-fade-in">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-red-600 rounded-full"></span>
              Resultados Encontrados
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {resultados.map((filme) => (
                <div 
                  key={filme.id} 
                  onClick={() => setFilmeSelecionado(filme)}
                  className="group relative bg-[#141414] rounded-2xl overflow-hidden shadow-xl border border-white/5 cursor-pointer hover:border-red-500/50 transition-all aspect-[2/3]"
                >
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    alt={filme.title}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h4 className="font-black text-white text-sm leading-tight mb-1">
                      {filme.title}
                    </h4>
                    <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest mb-4">
                      {filme.release_date ? filme.release_date.substring(0, 4) : "Data Indisponível"}
                    </span>
                    
                    <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:border-transparent transition-all shadow-lg">
                      Ver Mais
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}