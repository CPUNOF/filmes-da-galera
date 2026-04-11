/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CartaoFilme from "@/components/CartaoFilme";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function PerfilUsuario({ params }) {
  const [usuarioPerfil, setUsuarioPerfil] = useState(null);
  const [indicacoes, setIndicacoes] = useState([]);
  const [upvoted, setUpvoted] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [filmesComNotas, setFilmesComNotas] = useState([]); // 🪄 NOVO: O Histórico de Votos do Usuário
  const [abaAtiva, setAbaAtiva] = useState("indicacoes"); 
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const resolvedParams = await params;
        const uidUrl = resolvedParams?.id;
        if (!uidUrl) return;

        const snapFilmes = await getDocs(collection(db, "filmes"));
        const todosFilmes = snapFilmes.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 1. Indicações (Filmes que ELE sugeriu)
        const userIndicacoes = todosFilmes.filter(f => f.sugeridoPor?.uid === uidUrl);
        setIndicacoes(userIndicacoes.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));

        // 2. Fila de Votação (Filmes que ELE deu 🔥 Upvote)
        const userUpvoted = todosFilmes.filter(f => f.status === "sugerido" && f.upvotes?.includes(uidUrl));
        setUpvoted(userUpvoted);

        // 3. Comentários/Resenhas
        const snapComentarios = await getDocs(collection(db, "comentarios"));
        const userComentarios = [];
        snapComentarios.forEach(doc => {
          const data = doc.data();
          if (data.uid === uidUrl || data.usuarioUid === uidUrl) {
            userComentarios.push({ id: doc.id, ...data });
          }
        });
        setComentarios(userComentarios.sort((a, b) => (b.dataCriacao || 0) - (a.dataCriacao || 0)));

        // 4. 🪄 A FUNÇÃO CAÇADORA DE NOTAS (Procura onde o usuário votou)
        let votosCollection = [];
        try {
          const snapVotos = await getDocs(query(collection(db, "votos"), where("uid", "==", uidUrl)));
          votosCollection = snapVotos.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch(e) {} // Ignora se não existir coleção global de votos

        const filmesVotadosPeloUsuario = [];
        todosFilmes.forEach(f => {
          let notaExata = null;
          // A) Checa se o voto tá salvo dentro do próprio filme (Array)
          if (f.votos && Array.isArray(f.votos)) {
            const votoNoArray = f.votos.find(v => v.uid === uidUrl);
            if (votoNoArray) notaExata = votoNoArray.nota;
          }
          // B) Checa se tá salvo numa coleção separada de votos
          const votoNaCollection = votosCollection.find(v => v.filmeId === f.id);
          if (votoNaCollection) notaExata = votoNaCollection.nota;

          // Se achou a nota dele, guarda o filme e a nota!
          if (notaExata !== null) {
            filmesVotadosPeloUsuario.push({ ...f, notaDoUsuario: notaExata });
          }
        });
        
        // Ordena para mostrar as maiores notas primeiro (Os favoritos dele)
        setFilmesComNotas(filmesVotadosPeloUsuario.sort((a, b) => b.notaDoUsuario - a.notaDoUsuario));

        // 5. Resgata a Foto e Nome
        let nome = "Cinéfilo Desconhecido";
        let foto = "https://via.placeholder.com/150";
        if (userIndicacoes.length > 0) {
          nome = userIndicacoes[0].sugeridoPor?.nome;
          foto = userIndicacoes[0].sugeridoPor?.foto;
        } else if (userComentarios.length > 0) {
          nome = userComentarios[0].usuarioNome;
          foto = userComentarios[0].usuarioFoto;
        }

        setUsuarioPerfil({ uid: uidUrl, nome, foto });

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarPerfil();
  }, [params]);

  if (carregando) return <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center font-black uppercase tracking-widest italic text-xs">Acessando Dossiê...</main>;
  if (!usuarioPerfil) return <main className="min-h-screen bg-[#070707] text-white p-8 text-center uppercase font-black pt-40">Usuário não encontrado nos registros.</main>;

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 overflow-x-hidden font-sans">
      <Navbar />

      {/* CSS PARA SCROLL NAS ABAS MOBILE */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 🎬 HEADER DO PERFIL RESPONSIVO */}
      <div className="relative w-full pt-32 sm:pt-40 pb-10 sm:pb-12 bg-[#111111] border-b border-white/10 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')" }}
        ></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-8">
          
          {/* Avatar Centralizado no Mobile, Alinhado no Desktop */}
          <div className="relative mt-4 sm:mt-0">
            <img 
              src={usuarioPerfil.foto} 
              alt={usuarioPerfil.nome} 
              className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#070707] shadow-[0_0_50px_rgba(220,38,38,0.3)] bg-[#141414] z-20 relative"
            />
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-4 border-[#070707] z-30" title="Membro Ativo"></div>
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-6xl font-black uppercase italic tracking-tighter mb-1 sm:mb-2">{usuarioPerfil.nome}</h1>
            <p className="text-gray-400 text-[10px] sm:text-sm font-black uppercase tracking-widest flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2">
              <span className="text-red-500">Membro da Galera</span> <span className="hidden sm:inline">•</span> <span className="opacity-50">ID: {usuarioPerfil.uid.substring(0,6)}</span>
            </p>
          </div>

          {/* ESTATÍSTICAS RÁPIDAS NO HEADER (Grid no mobile para não quebrar) */}
          <div className="flex gap-4 sm:gap-6 mt-4 sm:mt-0 bg-[#070707]/50 backdrop-blur-md p-3 sm:p-0 rounded-2xl sm:bg-transparent sm:backdrop-blur-none border border-white/5 sm:border-none w-full sm:w-auto justify-center">
            <div className="text-center px-2">
              <span className="block text-2xl sm:text-3xl font-black text-white leading-none mb-1">{indicacoes.length}</span>
              <span className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-black tracking-widest">Sugestões</span>
            </div>
            <div className="text-center px-2 border-l border-white/10 sm:border-none pl-4 sm:pl-0">
              <span className="block text-2xl sm:text-3xl font-black text-orange-500 leading-none mb-1">{upvoted.length}</span>
              <span className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-black tracking-widest">Na Fila</span>
            </div>
            <div className="text-center px-2 border-l border-white/10 sm:border-none pl-4 sm:pl-0">
              <span className="block text-2xl sm:text-3xl font-black text-yellow-500 leading-none mb-1">{filmesComNotas.length}</span>
              <span className="text-[8px] sm:text-[9px] text-gray-500 uppercase font-black tracking-widest">Avaliados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        
        {/* 🪄 AS ABAS DE NAVEGAÇÃO: Agora com overflow horizontal para mobile */}
        <div className="flex overflow-x-auto hide-scrollbar bg-[#111111]/90 backdrop-blur-xl border border-white/5 p-1.5 sm:p-2 rounded-xl sm:rounded-full w-full max-w-3xl mx-auto shadow-lg relative gap-1 sm:gap-2 mb-10 sm:mb-16">
          <button 
            onClick={() => setAbaAtiva("indicacoes")} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'indicacoes' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
          >
            🎬 Indicações
          </button>
          <button 
            onClick={() => setAbaAtiva("fila")} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'fila' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
          >
            🔥 Na Fila
          </button>
          <button 
            onClick={() => setAbaAtiva("notas")} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'notas' ? 'bg-yellow-600 text-black shadow-md' : 'text-gray-500 hover:text-white'}`}
          >
            ⭐ Notas
          </button>
          <button 
            onClick={() => setAbaAtiva("avaliacoes")} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'avaliacoes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
          >
            💬 Resenhas
          </button>
        </div>

        {/* 🎬 CONTEÚDO: INDICAÇÕES */}
        {abaAtiva === "indicacoes" && (
          <div className="animate-fade-in-up">
            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
              <span className="text-red-600">🎬</span> Trazidos por {usuarioPerfil.nome.split(" ")[0]}
            </h2>
            {indicacoes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                {indicacoes.map(filme => <CartaoFilme key={filme.id} filme={filme} isSugestao={filme.status === "sugerido"} />)}
              </div>
            ) : (
              <div className="py-12 sm:py-16 text-center border border-dashed border-white/5 rounded-3xl">
                <span className="text-3xl sm:text-4xl mb-4 block">👻</span>
                <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Esse usuário ainda não indicou filmes.</p>
              </div>
            )}
          </div>
        )}

        {/* 🔥 CONTEÚDO: FILA DE VOTOS */}
        {abaAtiva === "fila" && (
          <div className="animate-fade-in-up">
            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
              <span className="text-orange-500 animate-pulse">🔥</span> Aguardando na Fila
            </h2>
            {upvoted.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                {upvoted.map(filme => <CartaoFilme key={filme.id} filme={filme} isSugestao={true} />)}
              </div>
            ) : (
              <div className="py-12 sm:py-16 text-center border border-dashed border-white/5 rounded-3xl">
                <span className="text-3xl sm:text-4xl mb-4 block">🧊</span>
                <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Nenhum voto pendente na fila.</p>
              </div>
            )}
          </div>
        )}

        {/* ⭐ CONTEÚDO: HISTÓRICO DE NOTAS DO USUÁRIO (A MÁGICA ACONTECE AQUI) */}
        {abaAtiva === "notas" && (
          <div className="animate-fade-in-up">
            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
              <span className="text-yellow-500">⭐</span> O Veredito de {usuarioPerfil.nome.split(" ")[0]}
            </h2>
            {filmesComNotas.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                {filmesComNotas.map(filme => (
                  <div key={filme.id} className="relative group">
                    <CartaoFilme filme={filme} isSugestao={false} />
                    
                    {/* 🪄 O BADGE COM A NOTA EXATA DO USUÁRIO */}
                    <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-yellow-500 text-[#070707] w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(234,179,8,0.5)] border-4 border-[#070707] z-50 transform group-hover:scale-110 transition-transform">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase leading-none opacity-80">Nota</span>
                      <span className="text-lg sm:text-xl font-black leading-none">{filme.notaDoUsuario}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 sm:py-16 text-center border border-dashed border-white/5 rounded-3xl">
                <span className="text-3xl sm:text-4xl mb-4 block">😶</span>
                <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">O usuário ainda não deu nota para nenhum filme.</p>
              </div>
            )}
          </div>
        )}

        {/* 💬 CONTEÚDO: AVALIAÇÕES/RESENHAS */}
        {abaAtiva === "avaliacoes" && (
          <div className="animate-fade-in-up space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
              <span className="text-blue-500">💬</span> Diário de Bordo
            </h2>
            {comentarios.length > 0 ? (
              comentarios.map(coment => {
                const filme = filmesAvaliados.find(f => f.id === coment.filmeId);
                return (
                  <div key={coment.id} className="bg-[#111111] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 shadow-xl flex flex-col sm:flex-row gap-4 sm:gap-6 hover:border-blue-500/30 transition-colors">
                    {filme && (
                      <Link href={`/filme/${filme.id}`} className="shrink-0 group mx-auto sm:mx-0">
                        <img src={filme.capa} className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-xl shadow-lg border border-white/10 group-hover:border-blue-500 transition-colors" alt={filme.titulo} />
                      </Link>
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-start justify-between mb-3 sm:mb-4 text-center sm:text-left">
                        <div className="w-full">
                          <h4 className="font-black text-base sm:text-lg text-white uppercase italic tracking-tighter">{filme?.titulo || "Filme Desconhecido"}</h4>
                          <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest">Resenha Pública</span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm leading-relaxed italic bg-black/40 p-3 sm:p-4 rounded-xl border border-white/5 relative">
                        <span className="absolute -top-2 -left-1 sm:-top-3 sm:-left-2 text-3xl sm:text-4xl text-blue-500/20 font-serif">"</span>
                        {coment.texto}
                        <span className="absolute -bottom-4 -right-1 sm:-bottom-6 sm:-right-2 text-3xl sm:text-4xl text-blue-500/20 font-serif">"</span>
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 sm:py-16 text-center border border-dashed border-white/5 rounded-3xl">
                <span className="text-3xl sm:text-4xl mb-4 block">🤐</span>
                <p className="text-gray-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">O usuário ainda não escreveu nenhuma resenha.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}