"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  const pesquisarFilme = async (e) => {
    e.preventDefault();
    if (!busca) return;
    
    setBuscando(true);
    try {
      const res = await fetch(`/api/tmdb?q=${busca}`);
      const dados = await res.json();
      setResultados(dados.filter(filme => filme.poster_path)); 
    } catch (error) {
      toast.error("Erro ao buscar filmes. Tente novamente.");
    } finally {
      setBuscando(false);
    }
  };

  const escolherESalvarFilme = async (filmeTMDB) => {
    if (!usuario) {
      toast.error("Você precisa estar logado para indicar um filme!");
      return;
    }

    setSalvando(true);
    const t = toast.loading("Preparando os rolos de filme...");

    try {
      const resTrailer = await fetch(`/api/tmdb/trailer?id=${filmeTMDB.id}`);
      const { key } = await resTrailer.json();
      const nomesGeneros = filmeTMDB.genre_ids.map(id => MAPA_GENEROS[id]).filter(Boolean);

      const novoFilme = {
        tmdbId: filmeTMDB.id,
        titulo: filmeTMDB.title,
        capa: `https://image.tmdb.org/t/p/w500${filmeTMDB.poster_path}`,
        sinopse: filmeTMDB.overview || "Sinopse não disponível em português.",
        generos: nomesGeneros,
        trailerKey: key || null,
        dataLancamento: filmeTMDB.release_date,
        status: "sugerido",
        notaGeral: 0,
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
      
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (error) {
      toast.dismiss(t);
      toast.error("Falha ao salvar o filme.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden relative">
      
      {/* 🔴 Luz ambiente vermelha desfocada no fundo para dar clima de cinema */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-red-900/20 blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-[1400px] mx-auto px-6 pt-6 sm:pt-10 relative z-10">
        <Navbar />

        {/* 🎬 HEADER DE BUSCA */}
        <div className="max-w-3xl mx-auto mt-16 sm:mt-24 text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            INDICAR FILME
          </h1>
          <p className="text-gray-400 mb-10 text-sm sm:text-base font-medium">
            Pesquise no acervo mundial e jogue sua sugestão na nossa fila.
          </p>
          
          <form onSubmit={pesquisarFilme} className="relative flex items-center mb-16 shadow-2xl">
            <input 
              type="text" 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-2xl py-5 pl-6 pr-32 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-lg font-medium shadow-inner"
              placeholder="Digite o nome do filme (ex: O Telefone Preto)..."
            />
            <button 
              type="submit" 
              disabled={buscando}
              className="absolute right-2 top-2 bottom-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-black px-6 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center min-w-[120px]"
            >
              {buscando ? "Buscando..." : "Pesquisar"}
            </button>
          </form>
        </div>

        {/* 🍿 RESULTADOS DA BUSCA */}
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
                  onClick={() => escolherESalvarFilme(filme)}
                  className="group relative bg-[#141414] rounded-2xl overflow-hidden shadow-xl border border-white/5 cursor-pointer hover:border-red-500/50 transition-all aspect-[2/3]"
                >
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${filme.poster_path}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    alt={filme.title}
                  />
                  
                  {/* Overlay interativo que sobe quando passa o mouse */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h4 className="font-black text-white text-sm leading-tight mb-1">
                      {filme.title}
                    </h4>
                    <span className="text-red-500 font-bold text-[10px] uppercase tracking-widest mb-4">
                      {filme.release_date ? filme.release_date.substring(0, 4) : "Data Indisponível"}
                    </span>
                    
                    <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:border-transparent transition-all shadow-lg">
                      {salvando ? "Salvando..." : "Indicar Filme"}
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