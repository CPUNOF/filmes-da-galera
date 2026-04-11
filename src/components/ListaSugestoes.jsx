/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CartaoFilme from "./CartaoFilme";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ListaSugestoes({ filmesIniciais }) {
  const [filmes, setFilmes] = useState(filmesIniciais);
  const [usuario, setUsuario] = useState(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [filmeDoDia, setFilmeDoDia] = useState(null);

  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [eventoConfig, setEventoConfig] = useState({ data: null, titulo: "", ativo: false, confirmados: [] });
  const [carregandoPresenca, setCarregandoPresenca] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  // 🪄 FILME DO DIA SINCRONIZADO (Muda à meia-noite)
  useEffect(() => {
    if (filmesIniciais && filmesIniciais.length > 0) {
      const hoje = new Date();
      const diaSemente = hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate();
      const index = diaSemente % filmesIniciais.length;
      setFilmeDoDia(filmesIniciais[index]);
    }
  }, [filmesIniciais]);

  // 🪄 ESCUTA O EVENTO EM TEMPO REAL (Para sumir se o Admin desativar)
  useEffect(() => {
    const eventoRef = doc(db, "configuracoes", "proximoEvento");
    const unsubscribe = onSnapshot(eventoRef, (snap) => {
      if (snap.exists()) {
        setEventoConfig(snap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  // 🪄 CRONÔMETRO
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
      }
    };

    const intervalo = setInterval(calcularTempo, 1000);
    return () => clearInterval(intervalo);
  }, [eventoConfig]);

  const alternarPresenca = async () => {
    if (!usuario) return toast.error("Faça login para confirmar!");
    setCarregandoPresenca(true);
    const eventoRef = doc(db, "configuracoes", "proximoEvento");
    const jaConfirmado = (eventoConfig.confirmados || []).some(p => p.uid === usuario.uid);

    try {
      const dadosUsuario = { uid: usuario.uid, nome: usuario.displayName, foto: usuario.photoURL };
      if (jaConfirmado) {
        const pessoaParaRemover = eventoConfig.confirmados.find(p => p.uid === usuario.uid);
        await updateDoc(eventoRef, { confirmados: arrayRemove(pessoaParaRemover) });
        toast("Presença cancelada.", { icon: "👋" });
      } else {
        await updateDoc(eventoRef, { confirmados: arrayUnion(dadosUsuario) });
        toast.success("Confirmado! 🍿");
      }
    } catch (e) { toast.error("Erro ao processar."); }
    finally { setCarregandoPresenca(false); }
  };

  const filmesOrdenados = [...filmes].sort((a, b) => {
    const votosA = a.upvotes?.length || 0;
    const votosB = b.upvotes?.length || 0;
    if (a.ingressoDourado && !b.ingressoDourado) return -1;
    if (!a.ingressoDourado && b.ingressoDourado) return 1;
    return votosB - votosA;
  });

  const filmesFiltrados = filmesOrdenados.filter(f => f.titulo.toLowerCase().includes(termoBusca.toLowerCase()));
  const jaConfirmou = usuario && (eventoConfig.confirmados || []).some(p => p.uid === usuario.uid);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-12 sm:mb-16">
        
        {/* HERO FILME DO DIA */}
        {filmeDoDia && (
          <div className="flex-1 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
              <span className="text-lg animate-bounce">🎲</span>
              <h2 className="text-sm sm:text-xl font-black italic uppercase text-white">Sugestão do <span className="text-red-600">Dia</span></h2>
            </div>
            <Link href={`/filme/${filmeDoDia.id}`} className="block relative w-full h-[180px] sm:h-[260px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group border border-white/10 hover:border-red-500/50 transition-all">
              <div className="absolute inset-0 bg-black">
                <img src={filmeDoDia.capa} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-all" alt={filmeDoDia.titulo} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 flex items-end gap-4">
                <img src={filmeDoDia.capa} className="hidden sm:block w-24 sm:w-28 rounded-lg shadow-2xl border border-white/10" alt="" />
                <div className="flex-1">
                  <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[7px] sm:text-[9px] font-black uppercase mb-1 inline-block">O Escolhido</span>
                  <h3 className="text-lg sm:text-3xl font-black uppercase italic text-white leading-tight mb-1">{filmeDoDia.titulo}</h3>
                  <p className="text-gray-400 text-[9px] sm:text-xs line-clamp-2 max-w-lg mb-2">{filmeDoDia.sinopse}</p>
                  <span className="bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase group-hover:bg-red-600 transition-colors">Ver Dossiê</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* WIDGET CONTAGEM REGRESSIVA (Só aparece se Ativo) */}
        {eventoConfig.ativo && (
          <div className="w-full lg:w-[350px] bg-[#111111] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col shrink-0">
            <div className="relative z-10 w-full text-center">
              <div className="inline-flex items-center gap-1.5 bg-red-900/20 border border-red-500/30 px-2 py-0.5 rounded-full mb-2">
                <span className="text-[7px] sm:text-[9px] font-black uppercase text-red-400 tracking-widest">Sessão Marcada</span>
              </div>
              <h2 className="text-sm sm:text-lg font-black uppercase italic text-white mb-3 truncate">{eventoConfig.titulo}</h2>
              
              <div className="flex justify-center gap-1.5 mb-4">
                {[
                  { v: tempoRestante.dias, l: "Dias" },
                  { v: tempoRestante.horas, l: "Horas" },
                  { v: tempoRestante.minutos, l: "Min" },
                  { v: tempoRestante.segundos, l: "Seg", c: "text-red-500" }
                ].map((t, i) => (
                  <div key={i} className="flex flex-col items-center bg-black/50 border border-white/5 rounded-lg w-10 h-12 sm:w-12 sm:h-14 justify-center">
                    <span className={`text-base sm:text-lg font-black leading-none ${t.c || "text-white"}`}>{t.v.toString().padStart(2, '0')}</span>
                    <span className="text-[5px] sm:text-[6px] uppercase font-bold text-gray-500 mt-1">{t.l}</span>
                  </div>
                ))}
              </div>

              <button onClick={alternarPresenca} disabled={carregandoPresenca} className={`w-full py-2.5 rounded-xl font-black uppercase text-[8px] sm:text-[10px] transition-all flex items-center justify-center gap-2 mb-3 ${jaConfirmou ? 'bg-green-600/20 text-green-400 border border-green-500' : 'bg-white text-black hover:bg-red-600 hover:text-white'}`}>
                {carregandoPresenca ? "..." : (jaConfirmou ? "✔️ Confirmado" : "🍿 Vou Assistir")}
              </button>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 max-h-[80px] overflow-y-auto custom-scrollbar">
              <p className="text-[7px] sm:text-[8px] font-black uppercase text-gray-500 mb-2">Confirmados ({eventoConfig.confirmados?.length || 0})</p>
              <div className="flex flex-col gap-1.5">
                {eventoConfig.confirmados?.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/5 p-1 rounded-md">
                    <img src={p.foto || "https://via.placeholder.com/150"} className="w-5 h-5 rounded-full object-cover" alt="" />
                    <span className="text-[7px] sm:text-[8px] font-black text-gray-300 uppercase truncate">{p.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FILA DE SUGESTÕES */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h2 className="text-xl sm:text-3xl font-black italic uppercase text-white">Fila de <span className="text-orange-500">Sugestões</span></h2>
        <div className="relative w-full sm:w-[250px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔎</span>
          <input type="text" placeholder="Filtrar fila..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-full py-2.5 pl-9 pr-4 text-[10px] sm:text-xs text-white outline-none focus:border-red-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 animate-fade-in-up pb-20">
        {filmesFiltrados.map((filme, index) => (
          <div key={filme.id} className="relative group pt-4"> 
            <div className={`absolute -top-3 -left-2 w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center z-40 border font-black text-[9px] sm:text-xs transition-colors ${index === 0 && termoBusca === "" ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-[#141414] text-gray-400 border-white/10'}`}>
              {index === 0 && termoBusca === "" ? "👑" : `#${index + 1}`}
            </div>
            <CartaoFilme filme={filme} isSugestao={true} />
          </div>
        ))}
      </div>
    </>
  );
}