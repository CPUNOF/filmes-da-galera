/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; 
import Navbar from "@/components/Navbar";
import CartaoFilme from "@/components/CartaoFilme";
import GestorCultura from "@/components/GestorCultura";
import HeaderPerfil from "@/components/HeaderPerfil";
import PainelInterativo from "@/components/PainelInterativo";
import AbaCultura from "@/components/AbaCultura"; 
import AbaMusica from "@/components/AbaMusica";
import PlayerGlobal from "@/components/PlayerGlobal";
import EstatisticasWrapped from "@/components/EstatisticasWrapped";
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
  const [itensCultura, setItemsCultura] = useState([]); 

  const [abaAtiva, setAbaAtiva] = useState("filmes"); // 🪄 AGORA COMEÇA EM 'filmes'
  const [subAbaFilmes, setSubAbaFilmes] = useState("sugeridos"); // 🪄 NOVO ESTADO PARA AS SUB-ABAS
  
  const [carregando, setCarregando] = useState(true);

  const [dadosGamer, setDadosGamer] = useState({ ingressos: 0, progresso: 0, ultimoAcesso: null, trailerCapa: null });
  const [temaPerfil, setTemaPerfil] = useState("padrao"); 
  const [modalTema, setModalTema] = useState(false); 
  
  const [rankingInfo, setRankingInfo] = useState({ posicao: 0, pontos: 0 });
  const [matchScore, setMatchScore] = useState(null);
  const [todosMembros, setTodosMembros] = useState([]);

  const [filmeParaSugerir, setFilmeParaSugerir] = useState(null);
  const [salvandoSugestao, setSalvandoSugestao] = useState(false);
  const [filmeParaExcluir, setFilmeParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const [isShaking, setIsShaking] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [cutucadores, setCutucadores] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuarioLogado(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (usuarioLogado) updateDoc(doc(db, "usuarios", usuarioLogado.email.toLowerCase()), { ultimoAcesso: serverTimestamp() }).catch(() => {});
  }, [usuarioLogado]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const q = query(collection(db, "notificacoes"), where("paraUid", "==", usuarioLogado.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const novasCutucadas = [];
      snap.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().lida === false) novasCutucadas.push({ id: change.doc.id, ...change.doc.data() });
      });
      if (novasCutucadas.length > 0) {
        setIsShaking(true); setTimeout(() => setIsShaking(false), 1000); 
        const uniqueCutucadores = []; const mapUids = new Set();
        novasCutucadas.forEach(n => {
          if (!mapUids.has(n.deUid)) { mapUids.add(n.deUid); uniqueCutucadores.push({ uid: n.deUid, nome: n.deNome, foto: n.deFoto }); }
          updateDoc(doc(db, "notificacoes", n.id), { lida: true }).catch(() => {});
        });
        setCutucadores(uniqueCutucadores); setShowNudgeModal(true); 
      }
    });
    return () => unsubscribe();
  }, [usuarioLogado]);

  const revidarCutucada = async () => {
    setShowNudgeModal(false); const t = toast.loading("A devolver o toque... 👉💥");
    try {
      for (const c of cutucadores) await addDoc(collection(db, "notificacoes"), { deUid: usuarioLogado.uid, paraUid: c.uid, deNome: usuarioLogado.displayName, deFoto: usuarioLogado.photoURL, data: serverTimestamp(), lida: false });
      toast.dismiss(t); toast.success("Revidado com sucesso! 😂", { icon: "🔥" });
    } catch(e) { toast.dismiss(t); toast.error("Erro ao revidar."); }
  }

  useEffect(() => {
    let emailBusca = usuarioPerfil?.email;
    if (!emailBusca && usuarioLogado && usuarioPerfil?.uid === usuarioLogado.uid) emailBusca = usuarioLogado.email;
    if (!emailBusca) return;
    const unsubscribe = onSnapshot(doc(db, "usuarios", emailBusca.toLowerCase()), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setDadosGamer({ 
          ingressos: d.ingressosDourados || 0, 
          progresso: d.votosParaIngresso || 0, 
          ultimoAcesso: d.ultimoAcesso?.toDate() || null, 
          trailerCapa: d.trailerCapa || null,
          humorDoDia: d.humorDoDia || null,
          sessaoJam: d.sessaoJam || null
        });
        setTemaPerfil(d.temaPerfil || "padrao"); 
      }
    });
    return () => unsubscribe();
  }, [usuarioPerfil, usuarioLogado]);

  const carregarPerfilDatabase = async () => {
    try {
      const resolvedParams = await params;
      const uidUrl = resolvedParams?.id;
      if (!uidUrl) return;

      const snapFilmes = await getDocs(collection(db, "filmes"));
      const todosFilmes = snapFilmes.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodosOsFilmes(todosFilmes); 

      const mapaMembros = new Map();
      todosFilmes.forEach(f => { if (f.sugeridoPor && f.sugeridoPor.uid) mapaMembros.set(f.sugeridoPor.uid, f.sugeridoPor); });
      setTodosMembros(Array.from(mapaMembros.values()));

      setIndicacoes(todosFilmes.filter(f => f.sugeridoPor?.uid === uidUrl).sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));
      setUpvoted(todosFilmes.filter(f => f.status === "sugerido" && f.upvotes?.includes(uidUrl)));

      const snapComentarios = await getDocs(collection(db, "comentarios"));
      const userComentarios = [];
      snapComentarios.forEach(d => { const data = d.data(); if (data.uid === uidUrl || data.usuarioUid === uidUrl) userComentarios.push({ id: d.id, ...data }); });
      setComentarios(userComentarios.sort((a, b) => (b.dataCriacao || 0) - (a.dataCriacao || 0)));

      try {
        const snapDiario = await getDocs(query(collection(db, "filmes_pessoais"), where("sugeridoPor.uid", "==", uidUrl)));
        setDiarioPessoal(snapDiario.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));
      } catch(e) {}

      try {
        const snapCultura = await getDocs(query(collection(db, "perfil_cultura"), where("uid", "==", uidUrl)));
        setItemsCultura(snapCultura.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)));
      } catch(e) { console.error("Erro Cultura:", e); }

      const promessasDeVotos = todosFilmes.map(async (filme) => {
        try {
          const votoSnap = await getDoc(doc(db, `filmes/${filme.id}/votos/${uidUrl}`));
          if (votoSnap.exists()) return { ...filme, notaDoUsuario: Number(votoSnap.data().nota) };
        } catch (e) {} return null;
      });
      const resultadosVotos = await Promise.all(promessasDeVotos);
      setFilmesComNotas(resultadosVotos.filter(f => f !== null).sort((a, b) => b.notaDoUsuario - a.notaDoUsuario));

      let nome = "Cinéfilo Desconhecido"; let foto = "https://via.placeholder.com/150"; let emailEncontrado = "";
      try {
        const snapUser = await getDocs(query(collection(db, "usuarios"), where("uid", "==", uidUrl)));
        if (!snapUser.empty) { const dataU = snapUser.docs[0].data(); nome = dataU.nome; foto = dataU.foto; emailEncontrado = dataU.email; }
      } catch(e) {}
      
      if (nome === "Cinéfilo Desconhecido" && todosFilmes.filter(f => f.sugeridoPor?.uid === uidUrl).length > 0) {
        const first = todosFilmes.filter(f => f.sugeridoPor?.uid === uidUrl)[0];
        nome = first.sugeridoPor?.nome; foto = first.sugeridoPor?.foto; emailEncontrado = first.sugeridoPor?.email || "";
      }
      setUsuarioPerfil({ uid: uidUrl, nome, foto, email: emailEncontrado });

      if (usuarioLogado && usuarioLogado.uid !== uidUrl) {
        const char1 = usuarioLogado.uid.charCodeAt(0) || 50; const char2 = uidUrl.charCodeAt(0) || 50;
        setMatchScore(65 + ((char1 + char2) % 34));
      }

      try {
        const placar = {};
        todosFilmes.forEach(f => { if (f.status === "sugerido" && Array.isArray(f.upvotes)) f.upvotes.forEach(u => { placar[u] = (placar[u] || 0) + 1; }); });
        snapComentarios.forEach(d => { const dc = d.data(); const uA = dc.uid || dc.usuarioUid; if (uA) placar[uA] = (placar[uA] || 0) + 2; });
        const listaRanking = Object.keys(placar).map(k => ({ uid: k, pontos: placar[k] }));
        if (!listaRanking.find(u => u.uid === uidUrl)) listaRanking.push({ uid: uidUrl, pontos: 0 });
        const rOrd = listaRanking.sort((a, b) => b.pontos - a.pontos);
        setRankingInfo({ posicao: rOrd.findIndex(u => u.uid === uidUrl) + 1, pontos: placar[uidUrl] || 0 });
      } catch (e) {}

    } catch (error) { console.error(error); } finally { setCarregando(false); }
  }

  useEffect(() => { carregarPerfilDatabase(); }, [params, usuarioLogado]);

  const handleClickDiario = async (filme) => {
    if (!usuarioLogado || usuarioLogado.uid !== usuarioPerfil?.uid) return toast("Apenas o dono pode sugerir.", { icon: "🔒" });
    const t = toast.loading("Checando acervo...");
    try {
      const snapGrupo = await getDocs(query(collection(db, "filmes"), where("tmdbId", "==", filme.tmdbId)));
      if (!snapGrupo.empty) { toast.dismiss(t); return toast.error("Já indicaram esse filme!"); }
      toast.dismiss(t); setFilmeParaSugerir(filme);
    } catch (error) { toast.dismiss(t); toast.error("Erro ao verificar."); }
  };

  const confirmarSugestaoDoDiario = async () => {
    setSalvandoSugestao(true); const t = toast.loading("Enviando para a Fila...");
    try {
      const novoFilme = {
        tmdbId: filmeParaSugerir.tmdbId, titulo: filmeParaSugerir.titulo, capa: filmeParaSugerir.capa, sinopse: filmeParaSugerir.sinopse || "Sem sinopse.",
        generos: filmeParaSugerir.generos || [], trailerKey: filmeParaSugerir.trailerKey || null, dataLancamento: filmeParaSugerir.dataLancamento || "",
        sugeridoPor: { nome: usuarioLogado.displayName, foto: usuarioLogado.photoURL, uid: usuarioLogado.uid, email: usuarioLogado.email },
        dataCriacao: new Date().toISOString(), status: "sugerido", notaGeral: 0, notaTMDB: filmeParaSugerir.notaTMDB || "N/A", quantidadeVotos: 0,
        seloJaAssistido: true, notaAutor: filmeParaSugerir.notaPessoal, upvotes: [usuarioLogado.uid]
      };
      await addDoc(collection(db, "filmes"), novoFilme);
      toast.dismiss(t); toast.success("Sugerido com Selo 🥇!"); setFilmeParaSugerir(null); setAbaAtiva("filmes"); setSubAbaFilmes("sugeridos");
    } catch (error) { toast.dismiss(t); toast.error("Falha ao sugerir."); } finally { setSalvandoSugestao(false); }
  };

  const excluirIndicacaoConfirmada = async () => {
    if (!filmeParaExcluir) return; setExcluindo(true); const t = toast.loading("A apagar...");
    try {
      await deleteDoc(doc(db, "filmes", filmeParaExcluir.id));
      setIndicacoes(indicacoes.filter(f => f.id !== filmeParaExcluir.id));
      toast.dismiss(t); toast.success("Removida com sucesso! 🗑️"); setFilmeParaExcluir(null);
    } catch (error) { toast.dismiss(t); toast.error("Erro ao remover."); } finally { setExcluindo(false); }
  };

  const cutucarAmigo = async () => {
    if (!usuarioLogado) return toast.error("Inicie sessão!"); const t = toast.loading("Preparando dedo...");
    try {
      const qCheck = query(collection(db, "notificacoes"), where("deUid", "==", usuarioLogado.uid));
      const snapCheck = await getDocs(qCheck);
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0); let jaCutucouHoje = false;
      snapCheck.forEach((d) => { const dataNotif = d.data().data?.toDate(); if (d.data().paraUid === usuarioPerfil.uid && dataNotif && dataNotif >= hoje) jaCutucouHoje = true; });
      if (jaCutucouHoje) { toast.dismiss(t); return toast.error("Já cutucou hoje! 🛑"); }
      await addDoc(collection(db, "notificacoes"), { deUid: usuarioLogado.uid, paraUid: usuarioPerfil.uid, deNome: usuarioLogado.displayName, deFoto: usuarioLogado.photoURL, texto: "Cutucou-te!", data: serverTimestamp(), lida: false });
      toast.dismiss(t); toast.success("Cutucada enviada! 👉");
    } catch (error) { toast.dismiss(t); toast.error("Erro ao cutucar."); }
  };

  const checarStatusOnline = () => {
    if (!dadosGamer.ultimoAcesso) return { texto: "Status Desconhecido", cor: "bg-gray-500" };
    const diff = (new Date() - dadosGamer.ultimoAcesso) / 1000 / 60;
    if (diff < 5) return { texto: "Online", cor: "bg-green-500", glow: "shadow-[0_0_10px_rgba(34,197,94,0.8)]" };
    const dt = dadosGamer.ultimoAcesso; const hoje = new Date();
    const ehHoje = dt.getDate() === hoje.getDate() && dt.getMonth() === hoje.getMonth();
    const hr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { texto: ehHoje ? `Visto hoje às ${hr}` : `Visto em ${dt.toLocaleDateString('pt-BR')} às ${hr}`, cor: "bg-gray-500" };
  };

  const alterarTema = async (novoTema) => {
    setTemaPerfil(novoTema);
    const t = toast.loading("Aplicando Skin...");
    try {
      await updateDoc(doc(db, "usuarios", usuarioLogado.email.toLowerCase()), { temaPerfil: novoTema });
      toast.dismiss(t); toast.success("Tema atualizado!"); setModalTema(false);
    } catch(e) { toast.dismiss(t); toast.error("Erro ao salvar tema."); }
  };

  const getThemeClasses = () => {
    switch(temaPerfil) {
      case "cyberpunk": return "bg-gradient-to-br from-[#0a001a] via-[#1a0b2e] to-[#2d0b4e] bg-animate";
      case "vampiro": return "bg-gradient-to-br from-[#1a0000] via-[#2a0808] to-[#4a0808] bg-animate";
      case "matrix": return "bg-[#020a04] matrix-bg";
      case "oceano": return "bg-gradient-to-br from-[#000a1a] via-[#081b2a] to-[#082b4a] bg-animate";
      default: return "bg-[#070707]"; // Padrão
    }
  };

  if (carregando) return <main className="min-h-screen bg-[#070707] text-white flex items-center justify-center font-black uppercase tracking-widest text-xs">A carregar o Dossiê...</main>;
  if (!usuarioPerfil) return <main className="min-h-screen bg-[#070707] text-white p-8 text-center uppercase font-black pt-40">Utilizador não encontrado.</main>;

  const statusUsuario = checarStatusOnline();
  const isOwner = usuarioLogado?.uid === usuarioPerfil.uid;

  const seriesCultura = itensCultura.filter(i => i.tipo === 'Série');
  const animesCultura = itensCultura.filter(i => i.tipo === 'Anime');
  const livrosCultura = itensCultura.filter(i => i.tipo === 'Livro');
  const mangasCultura = itensCultura.filter(i => i.tipo === 'Mangá');
  const musicasCultura = itensCultura.filter(i => i.tipo === 'Música');

  return (
    <main className={`min-h-screen text-white pb-20 overflow-x-hidden font-sans relative ${isShaking ? 'anim-shake' : ''} ${getThemeClasses()} transition-colors duration-1000`}>
      <Navbar />
      <style>{`
        .anim-shake { animation: extremeShake 0.4s cubic-bezier(.36,.07,.19,.97) both; animation-iteration-count: 2; } 
        @keyframes extremeShake { 0% { transform: translate(1px, 1px) rotate(0deg); } 20% { transform: translate(-4px, 0px) rotate(1deg); } 40% { transform: translate(2px, -2px) rotate(1deg); } 60% { transform: translate(-4px, 1px) rotate(0deg); } 80% { transform: translate(-2px, -2px) rotate(1deg); } 100% { transform: translate(1px, -3px) rotate(-1deg); } } 
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; border-radius: 10px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; } 
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes animatedGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bg-animate {
          background-size: 200% 200%;
          animation: animatedGradient 12s ease infinite;
        }
        .matrix-bg {
          background-image: linear-gradient(rgba(34, 197, 94, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>

      {/* MODAL DE TEMAS */}
      {modalTema && isOwner && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setModalTema(false)}></div>
          <div className="relative bg-[#111111] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-fade-in-up text-center">
            <button onClick={() => setModalTema(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white w-8 h-8 rounded-full bg-white/5 font-black">✕</button>
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-2xl font-black uppercase italic mb-2 text-white">Skin do Perfil</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-6">Escolha a sua Vibe</p>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => alterarTema('padrao')} className={`p-4 rounded-2xl border ${temaPerfil === 'padrao' ? 'border-white bg-white/10' : 'border-white/5 bg-[#0a0a0a]'} font-black uppercase tracking-widest text-[10px] hover:border-white/50 transition-all flex items-center justify-between`}><span>🌑 Padrão Escuro</span> {temaPerfil === 'padrao' && '✅'}</button>
              <button onClick={() => alterarTema('cyberpunk')} className={`p-4 rounded-2xl border ${temaPerfil === 'cyberpunk' ? 'border-purple-500 bg-purple-500/20' : 'border-purple-500/30 bg-[#1a0b2e]'} font-black uppercase tracking-widest text-[10px] text-purple-400 hover:border-purple-500 transition-all flex items-center justify-between`}><span>👾 Cyberpunk Neon</span> {temaPerfil === 'cyberpunk' && '✅'}</button>
              <button onClick={() => alterarTema('vampiro')} className={`p-4 rounded-2xl border ${temaPerfil === 'vampiro' ? 'border-red-600 bg-red-600/20' : 'border-red-900/30 bg-[#2a0808]'} font-black uppercase tracking-widest text-[10px] text-red-500 hover:border-red-500 transition-all flex items-center justify-between`}><span>🩸 Castelo Vampiro</span> {temaPerfil === 'vampiro' && '✅'}</button>
              <button onClick={() => alterarTema('matrix')} className={`p-4 rounded-2xl border ${temaPerfil === 'matrix' ? 'border-green-500 bg-green-500/20' : 'border-green-900/30 bg-[#051c0d]'} font-black uppercase tracking-widest text-[10px] text-green-500 hover:border-green-500 transition-all flex items-center justify-between`}><span>💻 Sistema Hacker</span> {temaPerfil === 'matrix' && '✅'}</button>
              <button onClick={() => alterarTema('oceano')} className={`p-4 rounded-2xl border ${temaPerfil === 'oceano' ? 'border-blue-500 bg-blue-500/20' : 'border-blue-900/30 bg-[#081b2a]'} font-black uppercase tracking-widest text-[10px] text-blue-500 hover:border-blue-500 transition-all flex items-center justify-between`}><span>🌊 Oceano Profundo</span> {temaPerfil === 'oceano' && '✅'}</button>
            </div>
          </div>
        </div>
      )}

      {showNudgeModal && cutucadores.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowNudgeModal(false)}></div>
          <div className="relative bg-[#111111] border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.4)] animate-fade-in-up text-center">
            <div className="text-6xl mb-4 animate-bounce">👉</div>
            <h3 className="text-xl font-black uppercase italic mb-2 text-white">Eita!</h3>
            <p className="text-sm text-gray-300 uppercase font-bold mb-6">{cutucadores.map(c => c.nome.split(" ")[0]).join(", ")} cutucou-te!<br/><span className="text-[9px] text-red-400">Estão a cobrar a tua presença!</span></p>
            <div className="flex flex-col gap-3">
              <button onClick={revidarCutucada} className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl">Sim (Revidar!)</button>
              <button onClick={() => setShowNudgeModal(false)} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase tracking-widest text-[10px] py-3 rounded-xl border border-white/5">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {filmeParaExcluir && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => !excluindo && setFilmeParaExcluir(null)}></div>
          <div className="relative bg-[#111111] border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-fade-in-up text-center">
            <div className="text-4xl mb-4">🗑️</div>
            <h3 className="text-xl font-black uppercase italic mb-2 text-white">Excluir Indicação?</h3>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-6">Apagar "{filmeParaExcluir.titulo}"?</p>
            <div className="flex gap-3">
              <button onClick={() => setFilmeParaExcluir(null)} disabled={excluindo} className="flex-1 bg-white/5 text-white font-black uppercase text-[10px] py-3 rounded-xl border border-white/5">Cancelar</button>
              <button onClick={excluirIndicacaoConfirmada} disabled={excluindo} className="flex-1 bg-red-600 text-white font-black uppercase text-[10px] py-3 rounded-xl">{excluindo ? "A apagar..." : "Apagar"}</button>
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
              <button onClick={() => setFilmeParaSugerir(null)} className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full text-white font-black">✕</button>
            </div>
            <div className="relative px-6 pb-8 -mt-16 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <img src={filmeParaSugerir.capa} alt={filmeParaSugerir.titulo} className="w-32 sm:w-48 rounded-2xl shadow-2xl border-2 border-white/10" />
              <div className="flex-1 mt-6 w-full">
                <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter mb-2">{filmeParaSugerir.titulo}</h2>
                <p className="text-gray-400 text-sm mb-6 line-clamp-3">{filmeParaSugerir.sinopse}</p>
                <button onClick={confirmarSugestaoDoDiario} disabled={salvandoSugestao} className="w-full sm:w-auto bg-red-600 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest">{salvandoSugestao ? "A processar..." : "🔥 Indicar para a Galera"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <HeaderPerfil 
        usuarioPerfil={usuarioPerfil} usuarioLogado={usuarioLogado} isOwner={isOwner} 
        dadosGamer={dadosGamer} setDadosGamer={setDadosGamer} 
        statusUsuario={statusUsuario} rankingInfo={rankingInfo} matchScore={matchScore} 
        cutucarAmigo={cutucarAmigo} filmesComNotas={filmesComNotas} indicacoes={indicacoes} 
        comentarios={comentarios} diarioPessoal={diarioPessoal} upvoted={upvoted} itensCultura={itensCultura}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10 relative z-50">
        
        <PainelInterativo dadosGamer={dadosGamer} todosMembros={todosMembros} />
        <EstatisticasWrapped itensCultura={itensCultura} filmesComNotas={filmesComNotas} />

        {/* 🪄 BARRA DE NAVEGAÇÃO PRINCIPAL (MENOR E MAIS LIMPA) */}
        <div className="flex flex-col xl:flex-row items-center gap-4 mb-8 max-w-[100%]">
          <div className="flex overflow-x-auto hide-scrollbar bg-black/40 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl sm:rounded-full w-full shadow-lg gap-2 snap-x snap-mandatory">
            
            {/* O BOTÃO UNIFICADO "FILMES" */}
            <button onClick={() => setAbaAtiva("filmes")} className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${abaAtiva === 'filmes' ? 'bg-blue-600/30 text-blue-300 shadow-md border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🎬 Filmes</button>
            
            {/* O RESTO DAS ABAS */}
            <button onClick={() => setAbaAtiva("series")} className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${abaAtiva === 'series' ? 'bg-purple-600/30 text-purple-300 shadow-md border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>📺 Séries</button>
            <button onClick={() => setAbaAtiva("animes")} className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${abaAtiva === 'animes' ? 'bg-orange-600/30 text-orange-300 shadow-md border border-orange-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🎌 Animes</button>
            <button onClick={() => setAbaAtiva("livros")} className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${abaAtiva === 'livros' ? 'bg-emerald-600/30 text-emerald-300 shadow-md border border-emerald-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>📚 Livros</button>
            <button onClick={() => setAbaAtiva("mangas")} className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${abaAtiva === 'mangas' ? 'bg-red-600/30 text-red-300 shadow-md border border-red-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🏮 Mangás</button>
            <button onClick={() => setAbaAtiva("musicas")} className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${abaAtiva === 'musicas' ? 'bg-pink-600/30 text-pink-300 shadow-md border border-pink-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>🎵 Músicas</button>
            <button onClick={() => setAbaAtiva("avaliacoes")} className={`px-4 sm:px-5 py-3 rounded-xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${abaAtiva === 'avaliacoes' ? 'bg-white/20 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>💬 Resenhas</button>

          </div>
          
          {isOwner && (
            <button onClick={() => setModalTema(true)} className="w-full xl:w-auto shrink-0 bg-white/5 hover:bg-white/20 backdrop-blur-xl border border-white/10 px-6 py-3.5 rounded-2xl sm:rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg">
              ✨ Skin
            </button>
          )}
        </div>

        <div className="animate-fade-in-up min-h-[400px]">
          
          {/* 🪄 A NOVA ÁREA UNIFICADA DE FILMES */}
          {abaAtiva === "filmes" && (
            <div className="animate-fade-in-up max-w-5xl mx-auto">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                  <span className="text-blue-500 drop-shadow-md">🎬</span> Obras Cinematográficas
                </h2>
              </div>

              {/* AS SUB-ABAS (PÍLULAS DE FILTRO) */}
              <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 snap-x pb-2">
                <button onClick={() => setSubAbaFilmes("sugeridos")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${subAbaFilmes === 'sugeridos' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-black/30 border-white/5 text-gray-500 hover:text-blue-400'}`}>🎬 Indicações</button>
                <button onClick={() => setSubAbaFilmes("fila")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${subAbaFilmes === 'fila' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>🔥 Na Fila</button>
                <button onClick={() => setSubAbaFilmes("notas")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${subAbaFilmes === 'notas' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>⭐ Com Notas</button>
                <button onClick={() => setSubAbaFilmes("diario")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all snap-center shrink-0 border ${subAbaFilmes === 'diario' ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : 'bg-black/30 border-white/5 text-gray-500 hover:text-white'}`}>🍿 Diário Pessoal</button>
              </div>

              {/* CONTEÚDO RENDERIZADO DENTRO DAS SUB-ABAS */}
              {subAbaFilmes === "sugeridos" && (
                <div className="animate-fade-in-up">
                  {indicacoes.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {indicacoes.map(filme => (
                        <div key={filme.id} className="relative group">
                          {isOwner && filme.status === "sugerido" && (
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilmeParaExcluir({ id: filme.id, titulo: filme.titulo }); }} className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 border-[#0a0a0a] z-[60] transition-all hover:scale-110">🗑️</button>
                          )}
                          <CartaoFilme filme={filme} isSugestao={filme.status === "sugerido"} />
                        </div>
                      ))}
                    </div>
                  ) : <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl opacity-70 uppercase font-black text-[10px] bg-black/20 backdrop-blur-md">Sem indicações de filmes.</div>}
                </div>
              )}

              {subAbaFilmes === "fila" && (
                <div className="animate-fade-in-up">
                  {upvoted.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {upvoted.map(filme => <CartaoFilme key={filme.id} filme={filme} isSugestao={true} />)}
                    </div>
                  ) : <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl opacity-70 uppercase font-black text-[10px] bg-black/20 backdrop-blur-md">Nenhum filme na fila.</div>}
                </div>
              )}

              {subAbaFilmes === "notas" && (
                <div className="animate-fade-in-up">
                  {filmesComNotas.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {filmesComNotas.map(filme => (
                        <div key={filme.id} className="relative group">
                          <CartaoFilme filme={filme} isSugestao={false} />
                          <div className="absolute -top-3 -right-3 bg-yellow-500 text-[#070707] w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-[#070707] z-50"><span className="text-[8px] font-black uppercase opacity-80">Nota</span><span className="text-lg font-black leading-none">{filme.notaDoUsuario}</span></div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl opacity-70 uppercase font-black text-[10px] bg-black/20 backdrop-blur-md">Sem notas registadas.</div>}
                </div>
              )}

              {subAbaFilmes === "diario" && (
                <div className="animate-fade-in-up">
                  {diarioPessoal.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {diarioPessoal.map(filme => <CartaoFilme key={filme.id} filme={filme} isSugestao={false} isDiario={true} onClickDiario={handleClickDiario} />)}
                    </div>
                  ) : <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl opacity-70 uppercase font-black text-[10px] bg-black/20 backdrop-blur-md">Diário vazio.</div>}
                </div>
              )}
            </div>
          )}

          {/* AS OUTRAS ABAS PERMANECEM IGUAIS */}
          {abaAtiva === "avaliacoes" && (
            <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto">
              {comentarios.length > 0 ? comentarios.map(coment => {
                  const filme = todosOsFilmes.find(f => f.id === coment.filmeId);
                  return (
                    <div key={coment.id} className="bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row gap-6">
                      {filme && <Link href={`/filme/${filme.id}`} className="shrink-0 group mx-auto sm:mx-0"><img src={filme.capa} className="w-24 h-36 object-cover rounded-xl border border-white/10 shadow-lg group-hover:scale-105 transition-transform" alt="" /></Link>}
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="font-black text-lg text-white uppercase italic mb-1">{filme?.titulo || "Desconhecido"}</h4>
                        <p className="text-gray-300 text-sm leading-relaxed italic bg-black/30 p-4 rounded-2xl border border-white/5 mt-2">"{coment.texto}"</p>
                      </div>
                    </div>
                  )
              }) : <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl opacity-50 uppercase font-black text-[10px] bg-black/20 backdrop-blur-md">Sem resenhas.</div>}
            </div>
          )}

          {abaAtiva === "series" && <AbaCultura itens={seriesCultura} categoria="Séries de TV" tipo="Série" cor="purple" isOwner={isOwner} icon="📺" />}
          {abaAtiva === "animes" && <AbaCultura itens={animesCultura} categoria="Mundo Otaku" tipo="Anime" cor="orange" isOwner={isOwner} icon="🎌" />}
          {abaAtiva === "livros" && <AbaCultura itens={livrosCultura} categoria="Cabeceira" tipo="Livro" cor="emerald" isOwner={isOwner} icon="📚" />}
          {abaAtiva === "mangas" && <AbaCultura itens={mangasCultura} categoria="Mangás & HQs" tipo="Mangá" cor="red" isOwner={isOwner} icon="🏮" />}
          {abaAtiva === "musicas" && <AbaMusica itens={musicasCultura} isOwner={isOwner} icon="🎵" />}

          {/* MOTOR DE CULTURA (POP-UP) */}
          <GestorCultura usuarioLogado={usuarioLogado} recarregarDados={carregarPerfilDatabase} />
        </div>
          {/* MOTOR DE CULTURA (POP-UP) */}
     <GestorCultura usuarioLogado={usuarioLogado} recarregarDados={carregarPerfilDatabase} />

     {/* 🪄 O PLAYER GLOBAL - SEMPRE POR CIMA DE TUDO */}
     <PlayerGlobal isOwner={isOwner} usuarioLogado={usuarioLogado} />

      </div>
    </main>
  );
}