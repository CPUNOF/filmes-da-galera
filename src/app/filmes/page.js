/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CartaoFilme from "@/components/CartaoFilme";
import RoletaModal from "@/components/RoletaModal";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, doc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from "firebase/firestore";
import toast from "react-hot-toast";

function formatarData(dataISO) {
  if (!dataISO) return "";
  return new Date(dataISO).toLocaleDateString('pt-BR');
}

function GaleriaConteudo() {
  const searchParams = useSearchParams();
  const searchInital = searchParams.get('search') || "";

  const [usuario, setUsuario] = useState(null);
  const [filmes, setFilmes] = useState([]);
  const [sugestoesTop, setSugestoesTop] = useState([]);
  const [termoBusca, setTermoBusca] = useState(searchInital);
  const [abaAtiva, setAbaAtiva] = useState("recentes");
  const [stats, setStats] = useState({ vistos: 0, naFila: 0 });
  const [carregando, setCarregando] = useState(true);
  const [modalRoletaAberto, setModalRoletaAberto] = useState(false);

  // ESTADOS DO EVENTO E CRONÔMETRO
  const [eventoConfig, setEventoConfig] = useState({ ativo: false, titulo: "", data: "", local: "", confirmados: [] });
  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [carregandoPresenca, setCarregandoPresenca] = useState(false);
  
  // ESTADOS DO POP-UP DE EDIÇÃO DO EVENTO
  const [modalEventoAberto, setModalEventoAberto] = useState(false);
  const [formEvento, setFormEvento] = useState({ titulo: "", data: "", hora: "", local: "Discord" });

  // 🪄 ESTADOS DO MURAL AO VIVO (TICKER)
  const [atividades, setAtividades] = useState([]);
  const [indiceAtividade, setIndiceAtividade] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  // TÚNEL DO EVENTO (Apenas busca os dados, sem criar relógios)
  useEffect(() => {
    const eventoRef = doc(db, "configuracoes", "proximoEvento");
    const unsubscribe = onSnapshot(eventoRef, (snap) => {
      if (snap.exists() && snap.data().ativo) {
        setEventoConfig(snap.data());
      } else {
        setEventoConfig({ ativo: false, titulo: "", data: "", local: "", confirmados: [] });
      }
    });
    return () => unsubscribe();
  }, []);

  // O CRONÔMETRO BLINDADO
  useEffect(() => {
    if (!eventoConfig.ativo || !eventoConfig.data) return;

    const calcularTempo = () => {
      const dataEvento = new Date(eventoConfig.data).getTime();
      const agora = new Date().getTime();
      const diferenca = dataEvento - agora;

      if (diferenca > 0) {
        setTempoRestante({
          dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
          horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
          segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
        });
      } else {
        setTempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
      }
    };

    calcularTempo(); 
    const intervalo = setInterval(calcularTempo, 1000);
    return () => clearInterval(intervalo);
  }, [eventoConfig.data, eventoConfig.ativo]);

  useEffect(() => {
    async function carregarDados() {
      try {
        const querySnapshot = await getDocs(collection(db, "filmes"));
        const listaCompleta = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const assistidos = listaCompleta.filter(f => f.status === "assistido");
        const sugeridos = listaCompleta.filter(f => f.status === "sugerido");

        setStats({ vistos: assistidos.length, naFila: sugeridos.length });
        setFilmes(assistidos);

        const topSugestoes = sugeridos
          .sort((a, b) => {
            const prioridadeA = a.ingressoDourado ? 1 : 0;
            const prioridadeB = b.ingressoDourado ? 1 : 0;
            if (prioridadeA !== prioridadeB) return prioridadeB - prioridadeA;
            const votosA = a.upvotes?.length || a.quantidadeVotos || 0;
            const votosB = b.upvotes?.length || b.quantidadeVotos || 0;
            return votosB - votosA;
          })
          .slice(0, 4);
          
        setSugestoesTop(topSugestoes);

        // 🪄 GERA AS MANCHETES DO MURAL AO VIVO
        const novasAtividades = [];
        const recentesSug = [...sugeridos].sort((a,b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0)).slice(0, 4);
        const recentesAss = [...assistidos].sort((a,b) => new Date(b.dataAssistido || 0) - new Date(a.dataAssistido || 0)).slice(0, 4);

        recentesSug.forEach(f => {
          const autor = f.sugeridoPor?.nome?.split(' ')[0] || "Um membro";
          novasAtividades.push({ id: `sug_${f.id}`, icone: "🍿", texto: `${autor} indicou "${f.titulo}" para a Fila.` });
        });

        recentesAss.forEach(f => {
          const nota = Number(f.notaGeral);
          const icone = nota >= 8 ? "🏆" : (nota <= 5 ? "💩" : "🎬");
          novasAtividades.push({ id: `ass_${f.id}`, icone, texto: `A galera assistiu "${f.titulo}" e deu nota ${f.notaGeral}` });
        });

        // Embaralha para ficar dinâmico
        setAtividades(novasAtividades.sort(() => Math.random() - 0.5));

      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, []);

  // 🪄 CONTROLA A TROCA DE MENSAGENS NO MURAL
  useEffect(() => {
    if (atividades.length === 0) return;
    const interval = setInterval(() => {
      setIndiceAtividade((prev) => (prev + 1) % atividades.length);
    }, 4000); // Troca a cada 4 segundos
    return () => clearInterval(interval);
  }, [atividades]);

  const alternarPresenca = async () => {
    if (!usuario) return toast.error("Faça login para confirmar presença!");
    
    setCarregandoPresenca(true);
    const eventoRef = doc(db, "configuracoes", "proximoEvento");
    const confirmados = eventoConfig.confirmados || [];
    const jaConfirmado = confirmados.some(p => p.uid === usuario.uid);

    try {
      const dadosUsuario = { uid: usuario.uid, nome: usuario.displayName, foto: usuario.photoURL };

      if (jaConfirmado) {
        const pessoaParaRemover = confirmados.find(p => p.uid === usuario.uid);
        await updateDoc(eventoRef, { confirmados: arrayRemove(pessoaParaRemover) });
        toast("Nome retirado da lista.", { icon: "😢" });
      } else {
        await updateDoc(eventoRef, { confirmados: arrayUnion(dadosUsuario) });
        toast.success("Presença Confirmada! 🍿");
      }
    } catch (error) {
      toast.error("Erro ao registrar presença.");
    } finally {
      setCarregandoPresenca(false);
    }
  };

  const abrirModalEdicao = () => {
    if (!usuario) return toast.error("Faça login para criar um evento!");
    if (eventoConfig.ativo && eventoConfig.data) {
      const dataObj = new Date(eventoConfig.data);
      const dataStr = dataObj.toISOString().split('T')[0];
      const horaStr = dataObj.toTimeString().substring(0, 5);
      setFormEvento({ titulo: eventoConfig.titulo, data: dataStr, hora: horaStr, local: eventoConfig.local });
    } else {
      setFormEvento({ titulo: "", data: "", hora: "20:00", local: "Discord" });
    }
    setModalEventoAberto(true);
  };

  const salvarEvento = async (e) => {
    e.preventDefault();
    if (!formEvento.titulo || !formEvento.data || !formEvento.hora) return toast.error("Preencha Título, Data e Hora!");
    
    const t = toast.loading("Salvando evento...");
    try {
      const dataISO = `${formEvento.data}T${formEvento.hora}:00`;
      await setDoc(doc(db, "configuracoes", "proximoEvento"), {
        ativo: true,
        titulo: formEvento.titulo,
        local: formEvento.local || "Discord",
        data: dataISO,
        confirmados: eventoConfig.confirmados || [] 
      }, { merge: true });
      
      setModalEventoAberto(false);
      toast.dismiss(t);
      toast.success("Evento marcado com sucesso! 🎬");
    } catch (error) {
      toast.dismiss(t);
      toast.error("Erro ao salvar o evento.");
    }
  };

  const filmesExibidos = filmes
    .filter(f => JSON.stringify(f).toLowerCase().includes(termoBusca.toLowerCase()))
    .sort((a, b) => abaAtiva === "recentes" 
      ? new Date(b.dataAssistido || 0) - new Date(a.dataAssistido || 0)
      : (b.notaGeral || 0) - (a.notaGeral || 0)
    );

  const jaConfirmou = usuario && (eventoConfig.confirmados || []).some(p => p.uid === usuario.uid);

  return (
    <div className="relative min-h-screen">
      
      <style>{`
        @keyframes tickerFade {
          0% { opacity: 0; transform: translateY(5px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-5px); }
        }
        .anim-ticker { animation: tickerFade 4s ease-in-out infinite; }
      `}</style>

      {/* MODAL DE CRIAR/EDITAR EVENTO */}
      {modalEventoAberto && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer" onClick={() => setModalEventoAberto(false)}></div>
          <div className="relative bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
            <button onClick={() => setModalEventoAberto(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6 text-white flex items-center gap-2">
              <span className="text-red-600">🍿</span> Marcar Sessão
            </h2>
            <form onSubmit={salvarEvento} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Qual o Filme / Tema?</label>
                <input type="text" value={formEvento.titulo} onChange={e => setFormEvento({...formEvento, titulo: e.target.value})} placeholder="Ex: Maratona Shrek, Votação do Top 1..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Data</label>
                  <input type="date" value={formEvento.data} onChange={e => setFormEvento({...formEvento, data: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none [color-scheme:dark]" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Hora</label>
                  <input type="time" value={formEvento.hora} onChange={e => setFormEvento({...formEvento, hora: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Local</label>
                <input type="text" value={formEvento.local} onChange={e => setFormEvento({...formEvento, local: e.target.value})} placeholder="Ex: Discord, Casa do Breno..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 outline-none" />
              </div>
              <button type="submit" className="mt-2 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-colors">
                Confirmar Evento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER HERO */}
      <div className="relative w-full pt-24 sm:pt-40 pb-6 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-20 scale-105" style={{ backgroundImage: "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5pIpk2JBiryNHSRzvS9_LOHB3-um8JSzqNQ&s')" }}></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* 🪄 MURAL DA GALERA AO VIVO (TICKER) */}
          {atividades.length > 0 && (
            <div className="w-full max-w-xl mx-auto xl:mx-0 bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-1.5 sm:py-2 px-3 mb-6 flex items-center shadow-lg relative overflow-hidden">
              <span className="shrink-0 flex items-center gap-1.5 bg-red-600/20 border border-red-600/30 px-2 py-0.5 rounded-full z-10">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-[7px] sm:text-[8px] font-black uppercase text-red-500 tracking-widest">Ao Vivo</span>
              </span>
              
              <div className="flex-1 ml-3 overflow-hidden whitespace-nowrap">
                <p key={atividades[indiceAtividade].id} className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-300 truncate anim-ticker">
                  <span className="mr-1.5">{atividades[indiceAtividade].icone}</span>
                  {atividades[indiceAtividade].texto}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-5 sm:gap-8 mb-6 sm:mb-12">
            
            {/* Título e Subtítulo */}
            <div className="max-w-xl shrink-0 w-full text-center xl:text-left">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-2 sm:mb-4 uppercase italic leading-none">
                FILMES DA <br className="hidden sm:block" />GALERA<span className="text-red-600">.</span>
              </h1>
              <p className="text-gray-400 text-[10px] sm:text-base font-medium leading-relaxed max-w-[90%] mx-auto xl:mx-0">
                Nossa curadoria particular de cinema. Onde a gente decide o que presta e o que vai pro lixo.
              </p>
            </div>

            {/* WIDGET DO PRÓXIMO EVENTO */}
            <div className="flex-1 w-full xl:max-w-md 2xl:max-w-lg shrink-0 z-30">
              {eventoConfig.ativo ? (
                <div className="bg-red-900/20 backdrop-blur-md border border-red-500/30 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.1)] relative group w-full flex items-center justify-between gap-3 sm:gap-4">
                  {usuario && (
                    <button onClick={abrirModalEdicao} className="absolute top-2 right-2 text-xs bg-black/50 p-1.5 rounded-lg hover:bg-white/20 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity border border-white/5" title="Editar Evento">✏️</button>
                  )}
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 mb-0.5 sm:mb-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-red-400">Próxima Sessão</span>
                    </div>
                    <h3 className="text-xs sm:text-base font-black uppercase italic text-white leading-tight mb-0.5 sm:mb-1 truncate pr-6">{eventoConfig.titulo}</h3>
                    <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 truncate">
                      <span>📍</span> {eventoConfig.local}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 sm:gap-2 shrink-0 border-l border-white/10 pl-3 sm:pl-4">
                    <div className="text-center">
                      <span className="block text-[11px] sm:text-[16px] font-black text-white leading-none">
                        {tempoRestante.dias}d {tempoRestante.horas.toString().padStart(2,'0')}:{tempoRestante.minutos.toString().padStart(2,'0')}:{tempoRestante.segundos.toString().padStart(2,'0')}
                      </span>
                    </div>
                    <button 
                      onClick={alternarPresenca} disabled={carregandoPresenca}
                      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-black uppercase tracking-widest text-[7px] sm:text-[9px] transition-all flex items-center gap-1 sm:gap-1.5 shadow-md ${
                        jaConfirmou ? 'bg-green-600/20 text-green-400 border border-green-500' : 'bg-red-600 text-white hover:bg-red-500'
                      }`}
                    >
                      {carregandoPresenca ? "..." : (jaConfirmou ? "✔️ Confirmado" : "🍿 Vou Assistir")}
                      <span className="bg-black/40 px-1 py-0.5 rounded text-[6px] sm:text-[7px]">{eventoConfig.confirmados?.length || 0}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={abrirModalEdicao} className="bg-black/40 backdrop-blur-md border border-dashed border-white/20 p-3 sm:p-5 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors w-full min-h-[60px] sm:min-h-[90px]">
                  <span className="text-gray-400 font-black uppercase tracking-widest text-[9px] sm:text-xs">📅 Criar Evento da Galera</span>
                </div>
              )}
            </div>
            
            {/* 🪄 ESTATÍSTICAS SLIM (Fininhos no mobile) */}
            <div className="flex gap-2 w-full xl:w-auto shrink-0 justify-center">
              <div className="bg-[#111]/80 backdrop-blur-md border border-white/5 px-4 py-1.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-0 sm:flex-col shadow-xl flex-1 max-w-[140px]">
                <span className="text-lg sm:text-3xl font-black text-red-600 leading-none">{stats.vistos}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-0 sm:mt-0.5">Vistos</span>
              </div>
              <div className="bg-[#111]/80 backdrop-blur-md border border-white/5 px-4 py-1.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-0 sm:flex-col shadow-xl flex-1 max-w-[140px]">
                <span className="text-lg sm:text-3xl font-black text-blue-500 leading-none">{stats.naFila}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-0 sm:mt-0.5">Na Fila</span>
              </div>
            </div>

          </div>

          {/* 🪄 BARRA DE PESQUISA E FILTROS COMPACTOS NO MOBILE */}
          <div className="bg-[#111111]/90 backdrop-blur-xl border border-white/5 p-1 sm:p-2 rounded-xl sm:rounded-full flex flex-col sm:flex-row justify-between items-center shadow-lg relative gap-1.5 sm:gap-1 group">
            <div className="flex bg-[#141414]/60 p-1 rounded-lg sm:rounded-full border border-white/5 shadow-inner w-full sm:w-auto">
              <button onClick={() => setAbaAtiva("recentes")} className={`px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-md sm:rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none ${abaAtiva === 'recentes' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'}`}>Recentes</button>
              <button onClick={() => setAbaAtiva("melhores")} className={`px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-md sm:rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none ${abaAtiva === 'melhores' ? 'bg-transparent text-white' : 'text-gray-500 hover:text-white'}`}>Os Melhores</button>
            </div>

            <div className="relative w-full sm:flex-1 flex items-center">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-600">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input type="text" placeholder="Buscar filmes, atores..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full bg-[#111111] border border-white/5 rounded-lg sm:rounded-full py-2 sm:py-3.5 pl-8 sm:pl-12 pr-3 sm:pr-32 text-[10px] sm:text-sm outline-none placeholder:text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10 relative z-30 pb-24">
        
        {/* SUGESTÕES COM LOGICA DE FURA-FILA APLICADA */}
        {sugestoesTop.length > 0 && (
          <div className="mb-16 sm:mb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
                  <span className="text-orange-500 animate-pulse">🔥</span> Em Alta na Fila
                </h2>
                <p className="text-gray-500 text-[9px] sm:text-[10px] mt-1 sm:mt-2 font-black uppercase tracking-[0.2em]">Os preferidos e os que furaram a fila 🎫</p>
              </div>
              
              <div className="flex w-full sm:w-auto items-center gap-3 justify-between sm:justify-end">
                <button onClick={() => setModalRoletaAberto(true)} className="bg-yellow-600/20 hover:bg-yellow-500 border border-yellow-600/50 hover:border-yellow-400 text-yellow-500 hover:text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg flex-1 sm:flex-none">
                  <span className="text-sm">🎲</span> Sortear
                </button>
                <Link href="/sugestoes" className="bg-[#111111] border border-white/10 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-300 flex-1 sm:flex-none text-center">Fila Completa ➔</Link>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {sugestoesTop.map((filme) => (
                <CartaoFilme key={filme.id} filme={filme} isSugestao={true} />
              ))}
            </div>
          </div>
        )}

        <div className="pt-10 sm:pt-16 border-t border-white/5">
          <div className="mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-2 sm:gap-3">
              <span className="text-red-600">🎬</span> Acervo de Assistidos
            </h2>
            <p className="text-gray-500 text-[9px] sm:text-[10px] mt-1 sm:mt-2 font-black uppercase tracking-[0.2em]">O que já vimos no grupo</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {filmesExibidos.map((filme) => (
              <CartaoFilme key={filme.id} filme={filme} isSugestao={false} dataLabel={formatarData(filme.dataAssistido)} />
            ))}
          </div>
        </div>
      </div>

      <RoletaModal isOpen={modalRoletaAberto} onClose={() => setModalRoletaAberto(false)} filmes={sugestoesTop} />

      {/* RODAPÉ PROFISSIONAL */}
      <footer className="w-full bg-[#050505] border-t border-white/5 pt-12 pb-8 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <span className="font-black text-white text-2xl tracking-widest italic">FDG<span className="text-red-600">.</span></span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-widest">
            <Link href="/" className="text-gray-500 hover:text-white transition-colors">Início</Link>
            <Link href="/sugestoes" className="text-gray-500 hover:text-white transition-colors">Sugestões</Link>
            <Link href="/recompensas" className="text-gray-500 hover:text-yellow-500 transition-colors">Regras</Link>
            <Link href="/lixeira" className="text-gray-500 hover:text-green-500 transition-colors">Lixeira</Link>
          </div>

          <div className="w-24 h-[1px] bg-white/10 my-2"></div>

          <p className="text-center text-[9px] font-bold uppercase tracking-widest text-gray-600 leading-relaxed">
            Feito com 🍿 e ódio por filmes ruins.<br />
            &copy; {new Date().getFullYear()} Filmes da Galera. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function FilmesHome() {
  return (
    <main className="min-h-screen bg-[#070707] text-white font-sans">
      <Navbar />
      <Suspense fallback={<div className="pt-40 text-center font-black uppercase text-gray-500 tracking-widest text-xs">Carregando Acervo...</div>}>
        <GaleriaConteudo />
      </Suspense>
    </main>
  );
}