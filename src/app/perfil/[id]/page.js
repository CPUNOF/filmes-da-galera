/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CartaoFilme from "@/components/CartaoFilme";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc, addDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PerfilUsuario({ params }) {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [usuarioPerfil, setUsuarioPerfil] = useState(null);
  const [indicacoes, setIndicacoes] = useState([]);
  const [upvoted, setUpvoted] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [filmesComNotas, setFilmesComNotas] = useState([]); 
  const [diarioPessoal, setDiarioPessoal] = useState([]); 
  const [abaAtiva, setAbaAtiva] = useState("indicacoes"); 
  const [carregando, setCarregando] = useState(true);

  // 🪄 ESTADOS DA GAMIFICAÇÃO (INGRESSO DOURADO)
  const [dadosGamer, setDadosGamer] = useState({ ingressos: 0, progresso: 0 });

  // 🏆 ESTADOS DO RANKING (PÓDIO DOS CRÍTICOS)
  const [rankingInfo, setRankingInfo] = useState({ posicao: 0, pontos: 0 });

  // 🪄 ESTADOS DO MODAL DE TRANSFERÊNCIA DIÁRIO -> GRUPO
  const [filmeParaSugerir, setFilmeParaSugerir] = useState(null);
  const [salvandoSugestao, setSalvandoSugestao] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuarioLogado(user));
    return () => unsubscribe();
  }, []);

  // 🪄 TÚNEL DE RADAR BLINDADO: Puxa os ingressos sem falhar
  useEffect(() => {
    let emailParaBuscar = usuarioPerfil?.email;
    
    // Se o banco não achar o email, mas for o SEU perfil, pega do seu login!
    if (!emailParaBuscar && usuarioLogado && usuarioPerfil?.uid === usuarioLogado.uid) {
      emailParaBuscar = usuarioLogado.email;
    }

    if (!emailParaBuscar) return;

    const unsubscribe = onSnapshot(doc(db, "usuarios", emailParaBuscar.toLowerCase()), (docSnap) => {
      if (docSnap.exists()) {
        setDadosGamer({
          ingressos: docSnap.data().ingressosDourados || 0,
          progresso: docSnap.data().votosParaIngresso || 0
        });
      }
    });

    return () => unsubscribe();
  }, [usuarioPerfil, usuarioLogado]);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const resolvedParams = await params;
        const uidUrl = resolvedParams?.id;
        if (!uidUrl) return;

        // 1. Busca dados básicos do acervo
        const snapFilmes = await getDocs(collection(db, "filmes"));
        const todosFilmes = snapFilmes.docs.map(documento => ({ id: documento.id, ...documento.data() }));

        const userIndicacoes = todosFilmes.filter(f => f.sugeridoPor?.uid === uidUrl);
        setIndicacoes(userIndicacoes.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));

        const userUpvoted = todosFilmes.filter(f => f.status === "sugerido" && f.upvotes?.includes(uidUrl));
        setUpvoted(userUpvoted);

        // 2. Busca Comentários
        const snapComentarios = await getDocs(collection(db, "comentarios"));
        const userComentarios = [];
        snapComentarios.forEach(documento => {
          const data = documento.data();
          if (data.uid === uidUrl || data.usuarioUid === uidUrl) {
            userComentarios.push({ id: documento.id, ...data });
          }
        });
        setComentarios(userComentarios.sort((a, b) => (b.dataCriacao || 0) - (a.dataCriacao || 0)));

        // 3. Busca Diário
        try {
          const snapDiario = await getDocs(query(collection(db, "filmes_pessoais"), where("sugeridoPor.uid", "==", uidUrl)));
          const diarioDocs = snapDiario.docs.map(d => ({id: d.id, ...d.data()}));
          setDiarioPessoal(diarioDocs.sort((a,b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));
        } catch(e) {}

        // 4. Busca Notas
        const promessasDeVotos = todosFilmes.map(async (filme) => {
          try {
            const votoRef = doc(db, `filmes/${filme.id}/votos/${uidUrl}`);
            const votoSnap = await getDoc(votoRef);
            if (votoSnap.exists()) return { ...filme, notaDoUsuario: Number(votoSnap.data().nota) };
          } catch (e) {}
          return null;
        });

        const resultadosVotos = await Promise.all(promessasDeVotos);
        const filmesVotadosPeloUsuario = resultadosVotos.filter(f => f !== null);
        setFilmesComNotas(filmesVotadosPeloUsuario.sort((a, b) => b.notaDoUsuario - a.notaDoUsuario));

        // 5. Identifica o Usuário do Perfil
        let nome = "Cinéfilo Desconhecido";
        let foto = "https://via.placeholder.com/150";
        let emailEncontrado = "";

        try {
          const snapUser = await getDocs(query(collection(db, "usuarios"), where("uid", "==", uidUrl)));
          if (!snapUser.empty) {
            const dataU = snapUser.docs[0].data();
            nome = dataU.nome;
            foto = dataU.foto;
            emailEncontrado = dataU.email;
          }
        } catch(e) {}

        if (nome === "Cinéfilo Desconhecido" && userIndicacoes.length > 0) {
          nome = userIndicacoes[0].sugeridoPor?.nome;
          foto = userIndicacoes[0].sugeridoPor?.foto;
        }
        
        if (!emailEncontrado && userIndicacoes.length > 0) {
          emailEncontrado = userIndicacoes[0].sugeridoPor?.email || "";
        }

        setUsuarioPerfil({ uid: uidUrl, nome, foto, email: emailEncontrado });

        // 🏆 6. CÁLCULO DO PÓDIO DOS CRÍTICOS (LÓGICA CORRIGIDA)
        try {
          const placar = {};

          // A. Contabiliza 1 Ponto por cada Upvote na Fila
          todosFilmes.forEach(f => {
            if (f.status === "sugerido" && Array.isArray(f.upvotes)) {
              f.upvotes.forEach(uidVotante => {
                placar[uidVotante] = (placar[uidVotante] || 0) + 1;
              });
            }
          });

          // B. Contabiliza 2 Pontos por cada Resenha Escrita
          snapComentarios.forEach(docComent => {
            const dataComent = docComent.data();
            const uidAutor = dataComent.uid || dataComent.usuarioUid;
            if (uidAutor) {
              placar[uidAutor] = (placar[uidAutor] || 0) + 2;
            }
          });

          // Converte o placar num array pra gente poder ordenar
          const listaRanking = Object.keys(placar).map(keyUid => ({ 
            uid: keyUid, 
            pontos: placar[keyUid] 
          }));

          // Se o usuário do perfil tiver 0 pontos, ele não vai estar no placar, então a gente insere ele com 0
          if (!listaRanking.find(u => u.uid === uidUrl)) {
            listaRanking.push({ uid: uidUrl, pontos: 0 });
          }

          // Ordena quem tem mais pontos primeiro
          const rankingOrdenado = listaRanking.sort((a, b) => b.pontos - a.pontos);
          
          const minhaPos = rankingOrdenado.findIndex(u => u.uid === uidUrl) + 1;
          const meusPontos = placar[uidUrl] || 0;

          setRankingInfo({ posicao: minhaPos, pontos: meusPontos });

        } catch (errRank) {
          console.error("Erro ao calcular o ranking:", errRank);
        }

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarPerfil();
  }, [params]);

  const handleClickDiario = async (filme) => {
    if (!usuarioLogado || usuarioLogado.uid !== usuarioPerfil?.uid) {
      return toast("Apenas o dono do perfil pode sugerir seus próprios filmes.", { icon: "🔒" });
    }
    
    const t = toast.loading("Checando acervo da Galera...");
    try {
      const qGrupo = query(collection(db, "filmes"), where("tmdbId", "==", filme.tmdbId));
      const snapGrupo = await getDocs(qGrupo);
      
      if (!snapGrupo.empty) {
        toast.dismiss(t);
        return toast.error("O Grupo já indicou ou assistiu esse filme!");
      }
      
      toast.dismiss(t);
      setFilmeParaSugerir(filme);
    } catch (error) {
      toast.dismiss(t);
      toast.error("Erro ao verificar o filme.");
    }
  };

  const confirmarSugestaoDoDiario = async () => {
    setSalvandoSugestao(true);
    const t = toast.loading("Enviando para a Fila do Grupo...");
    
    try {
      const novoFilmeGrupo = {
        tmdbId: filmeParaSugerir.tmdbId,
        titulo: filmeParaSugerir.titulo,
        capa: filmeParaSugerir.capa,
        sinopse: filmeParaSugerir.sinopse || "Sem sinopse disponível.",
        generos: filmeParaSugerir.generos || [],
        trailerKey: filmeParaSugerir.trailerKey || null,
        dataLancamento: filmeParaSugerir.dataLancamento || "",
        sugeridoPor: { 
          nome: usuarioLogado.displayName || filmeParaSugerir.sugeridoPor.nome, 
          foto: usuarioLogado.photoURL || filmeParaSugerir.sugeridoPor.foto, 
          uid: usuarioLogado.uid,
          email: usuarioLogado.email 
        },
        dataCriacao: new Date().toISOString(),
        status: "sugerido",
        notaGeral: 0,
        notaTMDB: filmeParaSugerir.notaTMDB || "N/A",
        quantidadeVotos: 0,
        seloJaAssistido: true,
        notaAutor: filmeParaSugerir.notaPessoal,
        upvotes: [usuarioLogado.uid]
      };

      await addDoc(collection(db, "filmes"), novoFilmeGrupo);
      toast.dismiss(t);
      toast.success("Indicado para a Galera com Selo de Ouro 🥇!");
      setFilmeParaSugerir(null);
      setAbaAtiva("indicacoes");
    } catch (error) {
      toast.dismiss(t);
      toast.error("Falha ao sugerir o filme.");
    } finally {
      setSalvandoSugestao(false);
    }
  };

  if (carregando) return <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center font-black uppercase tracking-widest italic text-xs">Acessando Dossiê...</main>;
  if (!usuarioPerfil) return <main className="min-h-screen bg-[#070707] text-white p-8 text-center uppercase font-black pt-40">Utilizador não encontrado.</main>;

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 overflow-x-hidden font-sans relative">
      <Navbar />

      {/* MODAL DE TRANSFERÊNCIA */}
      {filmeParaSugerir && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer" onClick={() => setFilmeParaSugerir(null)}></div>
          <div className="relative w-full max-w-4xl bg-[#111111] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 animate-fade-in-up">
            <div className="relative w-full h-48 sm:h-64 bg-black">
              <img src={filmeParaSugerir.capa} alt="Fundo" className="w-full h-full object-cover opacity-30 blur-2xl" />
              <button onClick={() => setFilmeParaSugerir(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white font-black">✕</button>
            </div>
            <div className="relative px-6 sm:px-12 pb-8 sm:pb-12 -mt-16 sm:-mt-20 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <img src={filmeParaSugerir.capa} alt={filmeParaSugerir.titulo} className="w-32 sm:w-48 rounded-2xl shadow-2xl border-2 border-white/10" />
              <div className="flex-1 mt-2 sm:mt-6 w-full">
                <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-2">{filmeParaSugerir.titulo}</h2>
                <span className="inline-block bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-black text-yellow-500 mb-6">🥇 Selo de Ouro: {filmeParaSugerir.notaPessoal} / 10</span>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed italic mb-8">{filmeParaSugerir.sinopse}</p>
                <button onClick={confirmarSugestaoDoDiario} disabled={salvandoSugestao} className="w-full sm:w-auto bg-red-600 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest">
                  {salvandoSugestao ? "Processando..." : "🔥 Indicar para a Galera"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full pt-32 sm:pt-40 pb-10 sm:pb-12 bg-[#111111] border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')" }}></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-8">
          
          <div className="relative shrink-0">
            <img src={usuarioPerfil.foto} alt={usuarioPerfil.nome} className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#070707] shadow-xl bg-[#141414]" />
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#070707]"></div>
            
            {/* 👑 SÓ MOSTRA A COROA SE FOR O 1º E TIVER PELO MENOS 1 PONTO */}
            {rankingInfo.posicao === 1 && rankingInfo.pontos > 0 && (
              <div className="absolute -top-3 -right-3 text-4xl sm:text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] z-30" title="1º Lugar no Ranking!">👑</div>
            )}
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-6xl font-black uppercase italic tracking-tighter mb-1">{usuarioPerfil.nome}</h1>
            <p className="text-gray-400 text-[10px] sm:text-sm font-black uppercase tracking-widest mb-3">
              <span className="text-red-500">Membro da Galera</span> • <span className="opacity-50">ID: {usuarioPerfil.uid.substring(0,6)}</span>
            </p>

            {/* 🏆 BADGES DE RANKING */}
            {rankingInfo.pontos > 0 ? (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <div className="bg-red-600/20 border border-red-600/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="text-sm sm:text-base">🏆</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-500">
                    {rankingInfo.posicao}º Maior Crítico
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="text-sm sm:text-base">⭐</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {rankingInfo.pontos} Pts de Atividade
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/30 border border-white/5 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mt-2">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500">
                  0 Pts de Atividade - Vote para pontuar
                </span>
              </div>
            )}

          </div>

          <div className="flex gap-4 sm:gap-6 bg-[#070707]/50 backdrop-blur-md p-4 rounded-2xl border border-white/5">
            <div className="text-center"><span className="block text-xl font-black">{indicacoes.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Sugestões</span></div>
            <div className="text-center border-l border-white/10 pl-4"><span className="block text-xl font-black text-orange-500">{upvoted.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Na Fila</span></div>
            <div className="text-center border-l border-white/10 pl-4"><span className="block text-xl font-black text-blue-500">{diarioPessoal.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Diário</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        
        {/* 🪄 NOVO MINI DASHBOARD COMPACTO E RESPONSIVO */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="bg-[#111111]/40 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-600/5 blur-3xl rounded-full pointer-events-none"></div>
            
            {/* Ingressos */}
            <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-xl border border-white/5 shrink-0 w-full sm:w-auto justify-center sm:justify-start">
              <span className="text-2xl animate-pulse">🎫</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white leading-none">{dadosGamer.ingressos}</span>
                <span className="text-[8px] font-black uppercase text-yellow-500 tracking-widest">Ingressos</span>
              </div>
            </div>

            {/* Barra de Progresso Slim */}
            <div className="flex-1 w-full flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Próximo Ingresso: <span className="text-white">{dadosGamer.progresso}/5</span></p>
                <p className="text-[8px] font-black uppercase text-gray-700 italic">{5 - dadosGamer.progresso} votos faltam</p>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-400 transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.3)] rounded-full"
                  style={{ width: `${(dadosGamer.progresso / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex overflow-x-auto hide-scrollbar bg-[#111111]/90 backdrop-blur-xl border border-white/5 p-2 rounded-xl sm:rounded-full w-full max-w-5xl mx-auto shadow-lg gap-1 mb-10 sm:mb-16">
          <button onClick={() => setAbaAtiva("indicacoes")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'indicacoes' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>🎬 Indicações</button>
          <button onClick={() => setAbaAtiva("fila")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'fila' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>🔥 Na Fila</button>
          <button onClick={() => setAbaAtiva("notas")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'notas' ? 'bg-yellow-600 text-black shadow-md' : 'text-gray-500 hover:text-white'}`}>⭐ Notas</button>
          <button onClick={() => setAbaAtiva("diario")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'diario' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>🍿 Diário</button>
          <button onClick={() => setAbaAtiva("avaliacoes")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'avaliacoes' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>💬 Resenhas</button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="animate-fade-in-up">
          {abaAtiva === "indicacoes" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><span className="text-red-600">🎬</span> Trazidos por {usuarioPerfil.nome.split(" ")[0]}</h2>
              {indicacoes.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {indicacoes.map(filme => <CartaoFilme key={filme.id} filme={filme} isSugestao={filme.status === "sugerido"} />)}
                </div>
              ) : <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl opacity-50 uppercase font-black text-[10px] tracking-widest">Nenhuma indicação ainda.</div>}
            </div>
          )}

          {abaAtiva === "fila" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><span className="text-orange-500 animate-pulse">🔥</span> Aguardando na Fila</h2>
              {upvoted.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {upvoted.map(filme => <CartaoFilme key={filme.id} filme={filme} isSugestao={true} />)}
                </div>
              ) : <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl opacity-50 uppercase font-black text-[10px] tracking-widest">Nenhum voto pendente.</div>}
            </div>
          )}

          {abaAtiva === "notas" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><span className="text-yellow-500">⭐</span> O Veredito de {usuarioPerfil.nome.split(" ")[0]}</h2>
              {filmesComNotas.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {filmesComNotas.map(filme => (
                    <div key={filme.id} className="relative group">
                      <CartaoFilme filme={filme} isSugestao={false} />
                      <div className="absolute -top-3 -right-3 bg-yellow-500 text-[#070707] w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-[#070707] z-50 transform group-hover:scale-110 transition-transform">
                        <span className="text-[8px] font-black uppercase leading-none opacity-80">Nota</span>
                        <span className="text-lg font-black leading-none">{filme.notaDoUsuario}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl opacity-50 uppercase font-black text-[10px] tracking-widest">Nenhuma nota registrada.</div>}
            </div>
          )}

          {abaAtiva === "diario" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><span className="text-blue-500">🍿</span> Vistos em Off</h2>
              {diarioPessoal.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {diarioPessoal.map(filme => (
                    <CartaoFilme key={filme.id} filme={filme} isSugestao={false} isDiario={true} onClickDiario={handleClickDiario} />
                  ))}
                </div>
              ) : <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl opacity-50 uppercase font-black text-[10px] tracking-widest">Diário Pessoal vazio.</div>}
            </div>
          )}

          {abaAtiva === "avaliacoes" && (
            <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3"><span className="text-gray-400">💬</span> Resenhas Escritas</h2>
              {comentarios.length > 0 ? (
                comentarios.map(coment => {
                  const filme = filmesComNotas.find(f => f.id === coment.filmeId);
                  return (
                    <div key={coment.id} className="bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col sm:flex-row gap-6 hover:border-gray-500/30 transition-colors">
                      {filme && (
                        <Link href={`/filme/${filme.id}`} className="shrink-0 group mx-auto sm:mx-0">
                          <img src={filme.capa} className="w-24 h-36 object-cover rounded-xl shadow-lg border border-white/10 group-hover:border-gray-500 transition-colors" alt={filme.titulo} />
                        </Link>
                      )}
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="mb-4 text-center sm:text-left">
                          <h4 className="font-black text-lg text-white uppercase italic tracking-tighter leading-tight">{filme?.titulo || "Filme Desconhecido"}</h4>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Resenha Pública</span>
                        </div>
                        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed italic bg-black/40 p-4 rounded-xl border border-white/5 relative">
                          <span className="absolute -top-3 -left-2 text-4xl text-gray-500/20 font-serif">"</span>
                          {coment.texto}
                          <span className="absolute -bottom-6 -right-2 text-4xl text-gray-500/20 font-serif">"</span>
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl opacity-50 uppercase font-black text-[10px] tracking-widest">Nenhuma resenha escrita.</div>}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}