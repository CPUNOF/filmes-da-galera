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
import { collection, getDocs, query, where, doc, getDoc, addDoc, onSnapshot, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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
  const [todosOsFilmes, setTodosOsFilmes] = useState([]);

  const [abaAtiva, setAbaAtiva] = useState("indicacoes"); 
  const [carregando, setCarregando] = useState(true);

  const [dadosGamer, setDadosGamer] = useState({ ingressos: 0, progresso: 0, ultimoAcesso: null, trailerCapa: null });
  const [rankingInfo, setRankingInfo] = useState({ posicao: 0, pontos: 0 });
  const [filmeParaSugerir, setFilmeParaSugerir] = useState(null);
  const [salvandoSugestao, setSalvandoSugestao] = useState(false);

  const [buscaMembro, setBuscaMembro] = useState("");
  const [todosMembros, setTodosMembros] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [filmeParaExcluir, setFilmeParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const [editandoCapa, setEditandoCapa] = useState(false);
  const [linkYoutube, setLinkYoutube] = useState("");

  const [isShaking, setIsShaking] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [cutucadores, setCutucadores] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuarioLogado(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (usuarioLogado) {
      const userRef = doc(db, "usuarios", usuarioLogado.email.toLowerCase());
      updateDoc(userRef, { ultimoAcesso: serverTimestamp() }).catch(() => {});
    }
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;

    const q = query(
      collection(db, "notificacoes"),
      where("paraUid", "==", usuarioLogado.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const novasCutucadas = [];
      
      snap.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().lida === false) {
          novasCutucadas.push({ id: change.doc.id, ...change.doc.data() });
        }
      });

      if (novasCutucadas.length > 0) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 1000); 

        const uniqueCutucadores = [];
        const mapUids = new Set();
        
        novasCutucadas.forEach(n => {
          if (!mapUids.has(n.deUid)) {
            mapUids.add(n.deUid);
            uniqueCutucadores.push({ uid: n.deUid, nome: n.deNome, foto: n.deFoto });
          }
          updateDoc(doc(db, "notificacoes", n.id), { lida: true }).catch(() => {});
        });

        setCutucadores(uniqueCutucadores);
        setShowNudgeModal(true); 
      }
    });

    return () => unsubscribe();
  }, [usuarioLogado]);

  const revidarCutucada = async () => {
    setShowNudgeModal(false);
    const t = toast.loading("Devolvendo o toque... 👉💥");
    try {
      for (const c of cutucadores) {
        await addDoc(collection(db, "notificacoes"), {
          deUid: usuarioLogado.uid,
          paraUid: c.uid,
          deNome: usuarioLogado.displayName,
          deFoto: usuarioLogado.photoURL,
          data: serverTimestamp(),
          lida: false
        });
      }
      toast.dismiss(t);
      toast.success("Revidado com sucesso! 😂", { icon: "🔥" });
    } catch(e) {
      toast.dismiss(t);
      toast.error("Erro ao revidar.");
    }
  }

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
          progresso: docSnap.data().votosParaIngresso || 0,
          ultimoAcesso: docSnap.data().ultimoAcesso?.toDate() || null,
          trailerCapa: docSnap.data().trailerCapa || null
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
        setTodosOsFilmes(todosFilmes); 

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
        if (!emailEncontrado && userIndicacoes.length > 0) emailEncontrado = userIndicacoes[0].sugeridoPor?.email || "";

        setUsuarioPerfil({ uid: uidUrl, nome, foto, email: emailEncontrado });

        try {
          const placar = {};
          todosFilmes.forEach(f => {
            if (f.status === "sugerido" && Array.isArray(f.upvotes)) {
              f.upvotes.forEach(uidVotante => { placar[uidVotante] = (placar[uidVotante] || 0) + 1; });
            }
          });
          snapComentarios.forEach(docComent => {
            const dataComent = docComent.data();
            const uidAutor = dataComent.uid || dataComent.usuarioUid;
            if (uidAutor) placar[uidAutor] = (placar[uidAutor] || 0) + 2;
          });
          const listaRanking = Object.keys(placar).map(keyUid => ({ uid: keyUid, pontos: placar[keyUid] }));
          if (!listaRanking.find(u => u.uid === uidUrl)) listaRanking.push({ uid: uidUrl, pontos: 0 });
          
          const rankingOrdenado = listaRanking.sort((a, b) => b.pontos - a.pontos);
          const minhaPos = rankingOrdenado.findIndex(u => u.uid === uidUrl) + 1;
          const meusPontos = placar[uidUrl] || 0;
          setRankingInfo({ posicao: minhaPos, pontos: meusPontos });
        } catch (errRank) {
          console.error(errRank);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setCarregando(false);
      }
    }
    carregarPerfil();
  }, [params]);

  const handleClickDiario = async (filme) => {
    if (!usuarioLogado || usuarioLogado.uid !== usuarioPerfil?.uid) return toast("Apenas o dono do perfil pode sugerir.", { icon: "🔒" });
    const t = toast.loading("Checando acervo...");
    try {
      const snapGrupo = await getDocs(query(collection(db, "filmes"), where("tmdbId", "==", filme.tmdbId)));
      if (!snapGrupo.empty) {
        toast.dismiss(t);
        return toast.error("O Grupo já indicou esse filme!");
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
    const t = toast.loading("Enviando para a Fila...");
    try {
      const novoFilmeGrupo = {
        tmdbId: filmeParaSugerir.tmdbId, titulo: filmeParaSugerir.titulo, capa: filmeParaSugerir.capa,
        sinopse: filmeParaSugerir.sinopse || "Sem sinopse.", generos: filmeParaSugerir.generos || [],
        trailerKey: filmeParaSugerir.trailerKey || null, dataLancamento: filmeParaSugerir.dataLancamento || "",
        sugeridoPor: { nome: usuarioLogado.displayName, foto: usuarioLogado.photoURL, uid: usuarioLogado.uid, email: usuarioLogado.email },
        dataCriacao: new Date().toISOString(), status: "sugerido", notaGeral: 0, notaTMDB: filmeParaSugerir.notaTMDB || "N/A",
        quantidadeVotos: 0, seloJaAssistido: true, notaAutor: filmeParaSugerir.notaPessoal, upvotes: [usuarioLogado.uid]
      };
      await addDoc(collection(db, "filmes"), novoFilmeGrupo);
      toast.dismiss(t);
      toast.success("Indicado com Selo de Ouro 🥇!");
      setFilmeParaSugerir(null);
      setAbaAtiva("indicacoes");
    } catch (error) {
      toast.dismiss(t);
      toast.error("Falha ao sugerir.");
    } finally {
      setSalvandoSugestao(false);
    }
  };

  const excluirIndicacaoConfirmada = async () => {
    if (!filmeParaExcluir) return;
    setExcluindo(true);
    const t = toast.loading("Apagando...");
    try {
      await deleteDoc(doc(db, "filmes", filmeParaExcluir.id));
      setIndicacoes(indicacoes.filter(f => f.id !== filmeParaExcluir.id));
      toast.dismiss(t);
      toast.success("Removida com sucesso! 🗑️");
      setFilmeParaExcluir(null);
    } catch (error) {
      toast.dismiss(t);
      toast.error("Erro ao remover.");
    } finally {
      setExcluindo(false);
    }
  };

  const salvarCapaVideo = async () => {
    if (!linkYoutube) return setEditandoCapa(false);
    const t = toast.loading("A atualizar cenário...");
    try {
      let videoId = null;
      if (linkYoutube.includes("v=")) videoId = linkYoutube.split("v=")[1].substring(0, 11);
      else if (linkYoutube.includes("youtu.be/")) videoId = linkYoutube.split("youtu.be/")[1].substring(0, 11);
      
      if (!videoId) throw new Error("Link inválido");

      await updateDoc(doc(db, "usuarios", usuarioLogado.email.toLowerCase()), { trailerCapa: videoId });
      setDadosGamer(prev => ({ ...prev, trailerCapa: videoId }));
      toast.dismiss(t);
      toast.success("Capa atualizada com sucesso!");
    } catch (error) {
      toast.dismiss(t);
      toast.error("Coloque um link válido do YouTube.");
    } finally {
      setEditandoCapa(false);
      setLinkYoutube("");
    }
  };

  const cutucarAmigo = async () => {
    if (!usuarioLogado) return toast.error("Inicie sessão para cutucar!");
    const t = toast.loading("Preparando o dedo...");
    
    try {
      const qCheck = query(
        collection(db, "notificacoes"),
        where("deUid", "==", usuarioLogado.uid)
      );

      const snapCheck = await getDocs(qCheck);
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      let jaCutucouHoje = false;

      snapCheck.forEach((documento) => {
        const d = documento.data();
        if (d.paraUid === usuarioPerfil.uid) {
          const dataNotif = d.data?.toDate();
          if (dataNotif && dataNotif >= hoje) {
            jaCutucouHoje = true;
          }
        }
      });

      if (jaCutucouHoje) {
        toast.dismiss(t);
        return toast.error("Você já cutucou essa pessoa hoje! Deixa ela descansar. 🛑");
      }

      await addDoc(collection(db, "notificacoes"), {
        deUid: usuarioLogado.uid,
        paraUid: usuarioPerfil.uid,
        deNome: usuarioLogado.displayName,
        deFoto: usuarioLogado.photoURL,
        texto: "Cutucou você bem gostoso!",
        data: serverTimestamp(),
        lida: false
      });
      
      toast.dismiss(t);
      toast.success(`${usuarioPerfil.nome.split(" ")[0]} levou uma dedada! 👉`);
    } catch (error) {
      console.error(error);
      toast.dismiss(t);
      toast.error("Erro ao cutucar.");
    }
  };

  const checarStatusOnline = () => {
    if (!dadosGamer.ultimoAcesso) return { texto: "Status Desconhecido", cor: "bg-gray-500" };
    const diffMinutos = (new Date() - dadosGamer.ultimoAcesso) / 1000 / 60;
    if (diffMinutos < 5) return { texto: "Online", cor: "bg-green-500", glow: "shadow-[0_0_10px_rgba(34,197,94,0.8)]" };
    
    const dataAcesso = dadosGamer.ultimoAcesso;
    const hoje = new Date();
    const ehHoje = dataAcesso.getDate() === hoje.getDate() && dataAcesso.getMonth() === hoje.getMonth();
    const horaFormatada = dataAcesso.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    if (ehHoje) return { texto: `Visto hoje às ${horaFormatada}`, cor: "bg-gray-500" };
    return { texto: `Visto em ${dataAcesso.toLocaleDateString('pt-BR')} às ${horaFormatada}`, cor: "bg-gray-500" };
  };
  const statusUsuario = checarStatusOnline();

  const isCult = (filmesComNotas.filter(f => parseInt(f.dataLancamento?.substring(0, 4)) < 1990).length + indicacoes.filter(f => parseInt(f.dataLancamento?.substring(0, 4)) < 1990).length) >= 3;
  const isHater = filmesComNotas.filter(f => f.notaDoUsuario < 5).length >= 3;
  const isTagarela = comentarios.length >= 10;
  const isVisionario = indicacoes.some(f => f.status === "assistido" && Number(f.notaGeral) >= 9.0);
  const totalLikes = comentarios.reduce((acc, c) => acc + (c.likes?.length || 0), 0);
  const isInfluenciador = totalLikes >= 5; 
  const isCurador = indicacoes.filter(f => f.status === "assistido").length >= 3;
  const isMagnata = dadosGamer.ingressos >= 3; 
  const isExplorador = diarioPessoal.length >= 10; 
  const isVozDoPovo = comentarios.some(c => c.likes?.length >= 5); 
  const isMestreFila = upvoted.length >= 10; 
  const isCinefiloExtremo = filmesComNotas.length >= 20; 

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
    <main className={`min-h-screen bg-[#070707] text-white pb-20 overflow-x-hidden font-sans relative ${isShaking ? 'anim-shake' : ''}`}>
      <Navbar />

      <style>{`
        @keyframes extremeShake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-2px, -3px) rotate(-1deg); }
          20% { transform: translate(-4px, 0px) rotate(1deg); }
          30% { transform: translate(4px, 3px) rotate(0deg); }
          40% { transform: translate(2px, -2px) rotate(1deg); }
          50% { transform: translate(-2px, 3px) rotate(-1deg); }
          60% { transform: translate(-4px, 1px) rotate(0deg); }
          70% { transform: translate(4px, 1px) rotate(-1deg); }
          80% { transform: translate(-2px, -2px) rotate(1deg); }
          90% { transform: translate(2px, 3px) rotate(0deg); }
          100% { transform: translate(1px, -3px) rotate(-1deg); }
        }
        .anim-shake {
          animation: extremeShake 0.4s cubic-bezier(.36,.07,.19,.97) both;
          animation-iteration-count: 2;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {showNudgeModal && cutucadores.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowNudgeModal(false)}></div>
          <div className="relative bg-[#111111] border border-white/10 rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.4)] animate-fade-in-up text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="text-6xl mb-4 animate-bounce relative z-10">👉</div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 text-white relative z-10">Eita!</h3>
            
            <p className="text-xs sm:text-sm text-gray-300 uppercase font-bold mb-6 leading-relaxed relative z-10">
              {cutucadores.map(c => c.nome.split(" ")[0]).join(", ")} cutucou vc bem gostoso!
              <br/><br/>
              <span className="text-[9px] text-red-400 font-black tracking-widest">Estão cobrando sua presença na sessão e seus votos!</span>
            </p>
            
            <div className="flex flex-col gap-3 relative z-10">
              <button 
                onClick={revidarCutucada} 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] active:scale-95"
              >
                Sim caramba (Revidar!)
              </button>
              <button 
                onClick={() => setShowNudgeModal(false)} 
                className="w-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all border border-white/5 active:scale-95"
              >
                Ser passivo (Fechar)
              </button>
            </div>
          </div>
        </div>
      )}

      {filmeParaExcluir && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer" onClick={() => !excluindo && setFilmeParaExcluir(null)}></div>
          <div className="relative bg-[#111111] border border-white/10 rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-fade-in-up text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-red-500/30 relative z-10">🗑️</div>
            
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2 text-white relative z-10">Excluir Indicação?</h3>
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest font-bold mb-6 relative z-10">
              Tem certeza que deseja apagar <br/>
              <span className="text-white">"{filmeParaExcluir.titulo}"</span>?<br/>
              <span className="text-red-500 text-[8px] sm:text-[9px]">Essa ação não pode ser desfeita.</span>
            </p>
            
            <div className="flex gap-3 relative z-10">
              <button 
                onClick={() => setFilmeParaExcluir(null)} 
                disabled={excluindo}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-colors border border-white/5"
              >
                Cancelar
              </button>
              <button 
                onClick={excluirIndicacaoConfirmada} 
                disabled={excluindo} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                {excluindo ? "Apagando..." : "Sim, Apagar"}
              </button>
            </div>
          </div>
        </div>
      )}

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

      <div className="relative w-full pt-32 sm:pt-40 pb-10 sm:pb-12 bg-[#111111] border-b border-white/10 overflow-hidden min-h-[350px]">
        {dadosGamer.trailerCapa ? (
          <div className="absolute inset-0 z-0 w-full h-full pointer-events-none">
            <iframe 
              className="absolute w-[300vw] h-[300vh] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" 
              src={`https://www.youtube.com/embed/${dadosGamer.trailerCapa}?autoplay=1&mute=1&controls=0&loop=1&playlist=${dadosGamer.trailerCapa}&modestbranding=1`} 
              allow="autoplay; encrypted-media" 
            ></iframe>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop')" }}></div>
        )}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          
          {/* 🪄 FIX: BOTÃO MUDAR FUNDO COM MARGEM CORRETA (sm:-mt-6) P/ NÃO FICAR ATRÁS DA NAVBAR */}
          {usuarioLogado?.uid === usuarioPerfil.uid && (
            <div className="absolute top-0 right-4 sm:right-6 z-50 -mt-20 sm:-mt-6">
              {editandoCapa ? (
                <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-2xl flex gap-2 items-center animate-fade-in">
                  <input type="text" value={linkYoutube} onChange={(e) => setLinkYoutube(e.target.value)} placeholder="Cole o link do YouTube..." className="bg-[#141414] text-xs px-3 py-2 rounded-lg text-white outline-none w-[200px]" />
                  <button onClick={salvarCapaVideo} className="bg-red-600 text-white text-[9px] font-black px-3 py-2 rounded-lg uppercase">Salvar</button>
                  <button onClick={() => setEditandoCapa(false)} className="text-gray-400 hover:text-white px-2">✕</button>
                </div>
              ) : (
                <button onClick={() => setEditandoCapa(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all">
                  <span>🎬</span> Mudar Fundo
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-8 mt-8 sm:mt-0">
            <div className="relative shrink-0 flex flex-col items-center">
              <div className="relative">
                <img src={usuarioPerfil.foto} alt={usuarioPerfil.nome} className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[#070707] shadow-xl bg-[#141414]" />
                <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#070707] ${statusUsuario.cor} ${statusUsuario.glow || ''}`}></div>
              </div>
              <span className="bg-black/60 backdrop-blur-md border border-white/5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400 mt-3 shadow-md">
                {statusUsuario.texto}
              </span>

              {rankingInfo.posicao === 1 && rankingInfo.pontos > 0 && (
                <div className="absolute -top-3 -right-3 text-4xl sm:text-5xl animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] z-30" title="1º Lugar no Ranking!">👑</div>
              )}
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl sm:text-6xl font-black uppercase italic tracking-tighter mb-1 drop-shadow-lg">{usuarioPerfil.nome}</h1>
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

              {(isCult || isHater || isTagarela || isVisionario || isInfluenciador || isCurador || isMagnata || isExplorador || isVozDoPovo || isMestreFila || isCinefiloExtremo) && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 pt-3 border-t border-white/10 w-fit">
                  {isVisionario && (
                    <div className="bg-yellow-900/30 border border-yellow-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(234,179,8,0.2)] group cursor-help relative" title="Indicou um filme que terminou com média 9.0+">
                      <span className="text-sm group-hover:scale-125 transition-transform">🎯</span><span className="text-[8px] font-black uppercase tracking-widest text-yellow-500">O Visionário</span>
                    </div>
                  )}
                  {isInfluenciador && (
                    <div className="bg-pink-900/30 border border-pink-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(236,72,153,0.2)] group cursor-help relative" title="Recebeu 5 ou mais curtidas no total">
                      <span className="text-sm group-hover:scale-125 transition-transform">🌟</span><span className="text-[8px] font-black uppercase tracking-widest text-pink-500">O Influenciador</span>
                    </div>
                  )}
                  {isCurador && (
                    <div className="bg-purple-900/30 border border-purple-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.2)] group cursor-help relative" title="Sugeriu 3 ou mais filmes aprovados">
                      <span className="text-sm group-hover:scale-125 transition-transform">🏛️</span><span className="text-[8px] font-black uppercase tracking-widest text-purple-400">O Curador</span>
                    </div>
                  )}
                  {isMagnata && (
                    <div className="bg-amber-900/30 border border-amber-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)] group cursor-help relative" title="Acumulou 3 ou mais Ingressos Dourados">
                      <span className="text-sm group-hover:scale-125 transition-transform">💰</span><span className="text-[8px] font-black uppercase tracking-widest text-amber-500">O Magnata</span>
                    </div>
                  )}
                  {isVozDoPovo && (
                    <div className="bg-emerald-900/30 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)] group cursor-help relative" title="Escreveu uma resenha com 5 ou mais curtidas">
                      <span className="text-sm group-hover:scale-125 transition-transform">🗣️</span><span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Voz do Povo</span>
                    </div>
                  )}
                  {isMestreFila && (
                    <div className="bg-orange-900/30 border border-orange-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(249,115,22,0.2)] group cursor-help relative" title="Apoiou 10 ou mais filmes na fila atual">
                      <span className="text-sm group-hover:scale-125 transition-transform">🎟️</span><span className="text-[8px] font-black uppercase tracking-widest text-orange-500">Mestre da Fila</span>
                    </div>
                  )}
                  {isCinefiloExtremo && (
                    <div className="bg-red-900/30 border border-red-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)] group cursor-help relative" title="Avaliou mais de 20 filmes do grupo">
                      <span className="text-sm group-hover:scale-125 transition-transform">🏆</span><span className="text-[8px] font-black uppercase tracking-widest text-red-500">Cinéfilo Extremo</span>
                    </div>
                  )}
                  {isExplorador && (
                    <div className="bg-cyan-900/30 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)] group cursor-help relative" title="Guardou 10+ filmes no Diário Pessoal">
                      <span className="text-sm group-hover:scale-125 transition-transform">📓</span><span className="text-[8px] font-black uppercase tracking-widest text-cyan-400">O Explorador</span>
                    </div>
                  )}
                  {isCult && (
                    <div className="bg-stone-800/60 border border-stone-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(120,113,108,0.2)] group cursor-help relative" title="Assistiu ou Indicou 3+ filmes antes de 1990">
                      <span className="text-sm group-hover:scale-125 transition-transform">👴</span><span className="text-[8px] font-black uppercase tracking-widest text-stone-400">O Cult</span>
                    </div>
                  )}
                  {isHater && (
                    <div className="bg-rose-900/30 border border-rose-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(225,29,72,0.2)] group cursor-help relative" title="Deu nota abaixo de 5 para 3+ filmes da galera">
                      <span className="text-sm group-hover:scale-125 transition-transform">😡</span><span className="text-[8px] font-black uppercase tracking-widest text-rose-500">O Hater</span>
                    </div>
                  )}
                  {isTagarela && (
                    <div className="bg-blue-900/30 border border-blue-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.2)] group cursor-help relative" title="Escreveu 10 ou mais resenhas no mural">
                      <span className="text-sm group-hover:scale-125 transition-transform">✍️</span><span className="text-[8px] font-black uppercase tracking-widest text-blue-500">O Tagarela</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center sm:items-end gap-3">
              {usuarioLogado && usuarioLogado.uid !== usuarioPerfil.uid && (
                <button onClick={cutucarAmigo} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-95 flex items-center gap-2">
                  <span className="text-sm">👉</span> Dar um Toque
                </button>
              )}

              <div className="flex gap-4 sm:gap-6 bg-[#070707]/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 mt-4 sm:mt-0">
                <div className="text-center"><span className="block text-xl font-black">{indicacoes.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Sugestões</span></div>
                <div className="text-center border-l border-white/10 pl-4"><span className="block text-xl font-black text-orange-500">{upvoted.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Na Fila</span></div>
                <div className="text-center border-l border-white/10 pl-4"><span className="block text-xl font-black text-blue-500">{diarioPessoal.length}</span><span className="text-[8px] text-gray-500 uppercase font-black">Diário</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10 relative z-50">
        
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

        {/* CARTEIRA SLIM E COMPACTA */}
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
                  {indicacoes.map(filme => (
                    <div key={filme.id} className="relative group">
                      {usuarioLogado?.uid === usuarioPerfil?.uid && filme.status === "sugerido" && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFilmeParaExcluir({ id: filme.id, titulo: filme.titulo });
                          }}
                          className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white w-10 h-10 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-[#0a0a0a] z-[60] transition-all hover:scale-110"
                          title="Apagar Indicação"
                        >
                          <span className="text-sm">🗑️</span>
                        </button>
                      )}
                      <CartaoFilme filme={filme} isSugestao={filme.status === "sugerido"} />
                    </div>
                  ))}
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
                  const filme = todosOsFilmes.find(f => f.id === coment.filmeId);
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
                        
                        <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                            🍿 {coment.likes?.length || 0} Curtidas
                          </span>
                          {filme && (
                            <Link href={`/filme/${filme.id}`} className="bg-blue-600/10 text-blue-500 border border-blue-500/30 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-sm">
                              <span>✏️</span> Editar no Dossiê
                            </Link>
                          )}
                        </div>
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