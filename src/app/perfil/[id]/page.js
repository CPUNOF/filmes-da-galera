/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import Navbar from "@/components/Navbar";
import CartaoFilme from "@/components/CartaoFilme";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc, addDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PerfilUsuario({ params }) {
  const router = useRouter();
  
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [usuarioPerfil, setUsuarioPerfil] = useState(null);
  const [indicacoes, setIndicacoes] = useState([]);
  const [upvoted, setUpvoted] = useState([]);
  const [comentarios, setComentarios] = useState([]);
  const [filmesComNotas, setFilmesComNotas] = useState([]); 
  const [diarioPessoal, setDiarioPessoal] = useState([]); 
  const [abaAtiva, setAbaAtiva] = useState("indicacoes"); 
  const [carregando, setCarregando] = useState(true);

  const [dadosGamer, setDadosGamer] = useState({ ingressos: 0, progresso: 0 });
  const [rankingInfo, setRankingInfo] = useState({ posicao: 0, pontos: 0 });
  const [filmeParaSugerir, setFilmeParaSugerir] = useState(null);
  const [salvandoSugestao, setSalvandoSugestao] = useState(false);

  // ESTADOS DA BARRA DE BUSCA DE MEMBROS
  const [buscaMembro, setBuscaMembro] = useState("");
  const [todosMembros, setTodosMembros] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuarioLogado(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let emailParaBuscar = usuarioPerfil?.email;
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

        const snapFilmes = await getDocs(collection(db, "filmes"));
        const todosFilmes = snapFilmes.docs.map(documento => ({ id: documento.id, ...documento.data() }));

        const mapaMembros = new Map();
        todosFilmes.forEach(f => {
          if (f.sugeridoPor && f.sugeridoPor.uid) {
            mapaMembros.set(f.sugeridoPor.uid, f.sugeridoPor);
          }
        });
        setTodosMembros(Array.from(mapaMembros.values()));

        const userIndicacoes = todosFilmes.filter(f => f.sugeridoPor?.uid === uidUrl);
        setIndicacoes(userIndicacoes.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));

        const userUpvoted = todosFilmes.filter(f => f.status === "sugerido" && f.upvotes?.includes(uidUrl));
        setUpvoted(userUpvoted);

        const snapComentarios = await getDocs(collection(db, "comentarios"));
        const userComentarios = [];
        snapComentarios.forEach(documento => {
          const data = documento.data();
          if (data.uid === uidUrl || data.usuarioUid === uidUrl) {
            userComentarios.push({ id: documento.id, ...data });
          }
        });
        setComentarios(userComentarios.sort((a, b) => (b.dataCriacao || 0) - (a.dataCriacao || 0)));

        try {
          const snapDiario = await getDocs(query(collection(db, "filmes_pessoais"), where("sugeridoPor.uid", "==", uidUrl)));
          const diarioDocs = snapDiario.docs.map(d => ({id: d.id, ...d.data()}));
          setDiarioPessoal(diarioDocs.sort((a,b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));
        } catch(e) {}

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

        try {
          const placar = {};
          todosFilmes.forEach(f => {
            if (f.status === "sugerido" && Array.isArray(f.upvotes)) {
              f.upvotes.forEach(uidVotante => {
                placar[uidVotante] = (placar[uidVotante] || 0) + 1;
              });
            }
          });
          snapComentarios.forEach(docComent => {
            const dataComent = docComent.data();
            const uidAutor = dataComent.uid || dataComent.usuarioUid;
            if (uidAutor) {
              placar[uidAutor] = (placar[uidAutor] || 0) + 2;
            }
          });
          const listaRanking = Object.keys(placar).map(keyUid => ({ 
            uid: keyUid, 
            pontos: placar[keyUid] 
          }));
          if (!listaRanking.find(u => u.uid === uidUrl)) {
            listaRanking.push({ uid: uidUrl, pontos: 0 });
          }
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

  const filmesAntigosAssistidos = filmesComNotas.filter(f => f.dataLancamento && parseInt(f.dataLancamento.substring(0, 4)) < 1990).length;
  const filmesAntigosIndicados = indicacoes.filter(f => f.dataLancamento && parseInt(f.dataLancamento.substring(0, 4)) < 1990).length;
  const isCult = (filmesAntigosAssistidos + filmesAntigosIndicados) >= 3;
  const isHater = filmesComNotas.filter(f => f.notaDoUsuario < 5).length >= 3;
  const isTagarela = comentarios.length >= 10;
  const isVisionario = indicacoes.some(f => f.status === "assistido" && Number(f.notaGeral) >= 9.0);

  const membrosFiltrados = todosMembros.filter(m => m.nome.toLowerCase().includes(buscaMembro.toLowerCase()));

  const handleKeyDownBusca = (e) => {
    if (e.key === 'Enter' && membrosFiltrados.length > 0) {
      setMostrarDropdown(false);
      setBuscaMembro("");
      router.push(`/perfil/${membrosFiltrados[0].uid}`);
    }
  };

  if (carregando) return <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center font-black uppercase tracking-widest italic text-xs">Acessando Dossiê...</main>;
  if (!usuarioPerfil) return <main className="min-h-screen bg-[#070707] text-white p-8 text-center uppercase font-black pt-40">Utilizador não encontrado.</main>;

  return (
    <main className="min-h-screen bg-[#070707] text-white pb-20 overflow-x-hidden font-sans relative">
      <Navbar />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

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

      {/* HEADER DO PERFIL */}
      <div className="relative w-full pt-32 sm:pt-40 pb-10 sm:pb-12 bg-[#111111] border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')" }}></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-8 mt-8 sm:mt-0">
          <div className="relative shrink-0">
            <img src={usuarioPerfil.foto} alt={usuarioPerfil.nome} className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#070707] shadow-xl bg-[#141414]" />
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-[#070707]"></div>
            {rankingInfo.posicao === 1 && rankingInfo.pontos > 0 && (
              <div className="absolute -top-3 -right-3 text-4xl sm:text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] z-30" title="1º Lugar no Ranking!">👑</div>
            )}
          </div>
          
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-6xl font-black uppercase italic tracking-tighter mb-1">{usuarioPerfil.nome}</h1>
            <p className="text-gray-400 text-[10px] sm:text-sm font-black uppercase tracking-widest mb-3">
              <span className="text-red-500">Membro da Galera</span> • <span className="opacity-50">ID: {usuarioPerfil.uid.substring(0,6)}</span>
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              {rankingInfo.pontos > 0 ? (
                <>
                  <div className="bg-red-600/20 border border-red-600/30 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="text-sm sm:text-base">🏆</span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-red-500">{rankingInfo.posicao}º Maior Crítico</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="text-sm sm:text-base">⭐</span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">{rankingInfo.pontos} Pts de Atividade</span>
                  </div>
                </>
              ) : (
                <div className="bg-gray-800/30 border border-white/5 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500">0 Pts - Vote para pontuar</span>
                </div>
              )}
            </div>
            {(isCult || isHater || isTagarela || isVisionario) && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 pt-3 border-t border-white/10 w-fit">
                {isVisionario && (
                  <div className="bg-yellow-900/30 border border-yellow-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(234,179,8,0.2)] group cursor-help relative" title="Indicou um filme que terminou com média 9.0+">
                    <span className="text-sm group-hover:scale-125 transition-transform">🎯</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-yellow-500">O Visionário</span>
                  </div>
                )}
                {isCult && (
                  <div className="bg-stone-800/60 border border-stone-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(120,113,108,0.2)] group cursor-help relative" title="Assistiu ou Indicou 3+ filmes lançados antes de 1990">
                    <span className="text-sm group-hover:scale-125 transition-transform">👴</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">O Cult</span>
                  </div>
                )}
                {isHater && (
                  <div className="bg-red-900/30 border border-red-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(220,38,38,0.2)] group cursor-help relative" title="Deu nota abaixo de 5 para 3+ filmes da galera">
                    <span className="text-sm group-hover:scale-125 transition-transform">😡</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-red-500">O Hater</span>
                  </div>
                )}
                {isTagarela && (
                  <div className="bg-blue-900/30 border border-blue-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.2)] group cursor-help relative" title="Escreveu 10 ou mais resenhas no mural">
                    <span className="text-sm group-hover:scale-125 transition-transform">✍️</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">O Tagarela</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4 sm:gap-6 bg-[#070707]/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 mt-4 sm:mt-0">
            <div className="text-center"><span className="block text-xl font-black">{indicacoes.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Sugestões</span></div>
            <div className="text-center border-l border-white/10 pl-4"><span className="block text-xl font-black text-orange-500">{upvoted.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Na Fila</span></div>
            <div className="text-center border-l border-white/10 pl-4"><span className="block text-xl font-black text-blue-500">{diarioPessoal.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Diário</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10 relative z-50">
        
        {/* 🪄 BARRA DE BUSCA COMPACTA E ELEGANTE */}
        <div className="max-w-5xl mx-auto mb-6 flex justify-end">
          <div className="relative w-full sm:w-[300px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔎</span>
            <input 
              type="text" 
              placeholder="Buscar amigos..." 
              value={buscaMembro}
              onFocus={() => setMostrarDropdown(true)}
              onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
              onChange={(e) => {
                setBuscaMembro(e.target.value);
                setMostrarDropdown(true);
              }}
              onKeyDown={handleKeyDownBusca}
              className="w-full bg-[#111111] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-red-500 transition-colors placeholder:text-gray-600 shadow-lg"
            />
            {mostrarDropdown && buscaMembro.trim() !== "" && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#141414] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden max-h-[250px] overflow-y-auto z-[100] animate-fade-in-up custom-scrollbar">
                {membrosFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-gray-500 uppercase font-black tracking-widest border border-dashed border-white/5 m-2 rounded-xl">Fantasma não encontrado 👻</div>
                ) : (
                  <div className="flex flex-col p-1.5 gap-1">
                    {membrosFiltrados.map((membro) => (
                      <div key={membro.uid} onMouseDown={() => { setMostrarDropdown(false); setBuscaMembro(""); router.push(`/perfil/${membro.uid}`); }} className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-blue-600/20 hover:border-blue-500/50 cursor-pointer transition-all rounded-xl border border-transparent">
                        <img src={membro.foto} alt={membro.nome} className="w-8 h-8 rounded-full border border-white/10 object-cover shadow-sm" />
                        <div className="flex flex-col"><span className="text-[11px] font-black text-white uppercase italic tracking-tighter leading-none">{membro.nome}</span><span className="text-[7px] text-blue-400 uppercase tracking-widest font-black mt-1">Acessar Perfil ➔</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 🪄 CARTEIRA SLIM E COMPACTA */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="bg-[#111111]/40 border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-8 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-600/5 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shrink-0 w-full sm:w-auto justify-center">
              <span className="text-xl sm:text-2xl animate-pulse">🎫</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white leading-none">{dadosGamer.ingressos}</span>
                <span className="text-[8px] font-black uppercase text-yellow-500 tracking-widest">Ingressos</span>
              </div>
            </div>

            <div className="flex-1 w-full flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Próximo: <span className="text-white">{dadosGamer.progresso}/20</span></p>
                <p className="text-[7px] font-black uppercase text-gray-600 italic">{20 - dadosGamer.progresso} faltam</p>
              </div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-400 transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.4)] rounded-full"
                  style={{ width: `${(dadosGamer.progresso / 20) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex overflow-x-auto hide-scrollbar bg-[#111111]/90 backdrop-blur-xl border border-white/5 p-2 rounded-xl sm:rounded-full w-full max-w-5xl mx-auto shadow-lg gap-1 mb-8 sm:mb-12">
          <button onClick={() => setAbaAtiva("indicacoes")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'indicacoes' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>🎬 Indicações</button>
          <button onClick={() => setAbaAtiva("fila")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'fila' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>🔥 Na Fila</button>
          <button onClick={() => setAbaAtiva("notas")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'notas' ? 'bg-yellow-600 text-black shadow-md' : 'text-gray-500 hover:text-white'}`}>⭐ Notas</button>
          <button onClick={() => setAbaAtiva("diario")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'diario' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>🍿 Diário</button>
          <button onClick={() => setAbaAtiva("avaliacoes")} className={`px-5 py-3 rounded-lg sm:rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 ${abaAtiva === 'avaliacoes' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}>💬 Resenhas</button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="animate-fade-in-up min-h-[400px]">
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