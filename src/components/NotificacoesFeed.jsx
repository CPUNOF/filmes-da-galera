"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function NotificacoesFeed({ usuarioLogado }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    if (!usuarioLogado) return;
    const q = query(collection(db, "notificacoes"), where("paraUid", "==", usuarioLogado.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const notifs = [];
      let countNaoLidas = 0;
      snap.forEach(docSnap => {
        const data = docSnap.data();
        notifs.push({ id: docSnap.id, ...data });
        if (!data.lida) countNaoLidas++;
      });
      notifs.sort((a, b) => {
        const dataA = a.data?.toDate ? a.data.toDate() : new Date(a.data || 0);
        const dataB = b.data?.toDate ? b.data.toDate() : new Date(b.data || 0);
        return dataB - dataA;
      });
      setNotificacoes(notifs);
      setNaoLidas(countNaoLidas);
    });
    return () => unsubscribe();
  }, [usuarioLogado]);

  const marcarComoLida = async (id) => {
    try { await updateDoc(doc(db, "notificacoes", id), { lida: true }); } catch(e) {}
  };

  const marcarTodas = () => {
    notificacoes.forEach(n => { if (!n.lida) marcarComoLida(n.id); });
  };

  const tempoAtras = (data) => {
    const min = Math.floor((new Date() - data) / 60000);
    if (min < 1) return "Agora";
    if (min < 60) return `${min}m`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `${horas}h`;
    return `${Math.floor(horas / 24)}d`;
  };

  if (!usuarioLogado) return null;

  return (
    <>
      {/* 🔔 O SINO (Botão Flutuante) */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="relative bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0"
      >
        <span className="text-sm sm:text-base leading-none">🔔</span>
        {naoLidas > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse border border-[#111111]">
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {/* FUNDO DO DRAWER */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[999998] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOpen(false)}
      ></div>
      
      {/* 🪄 DRAWER LATERAL PREMIUM (Com pt-[85px] no mobile para não chocar com a Navbar) */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#0a0a0a] border-l border-white/5 shadow-[-30px_0_50px_rgba(0,0,0,0.9)] z-[999999] flex flex-col transition-transform duration-300 ease-in-out pt-[85px] sm:pt-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* CABEÇALHO DO DRAWER */}
        <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
          <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-white">
            Notificações
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white w-8 h-8 rounded-full bg-white/5 hover:bg-red-600 transition-colors flex items-center justify-center font-black shrink-0 shadow-sm">✕</button>
        </div>

        {/* LISTA DE NOTIFICAÇÕES */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
          {notificacoes.length > 0 ? notificacoes.map(n => {
            let tipo = n.tipo || "cutucada";
            let icone = "👉"; let bgIcon = "bg-orange-500";
            
            if (tipo === "like") { icone = "❤️"; bgIcon = "bg-red-500"; }
            else if (tipo === "comentario") { icone = "💬"; bgIcon = "bg-blue-500"; }

            return (
              <div key={n.id} onClick={() => marcarComoLida(n.id)} className={`relative flex items-center gap-4 p-4 rounded-3xl border ${!n.lida ? 'border-white/10 bg-[#141414] shadow-lg' : 'border-transparent bg-transparent opacity-60'} hover:bg-white/5 transition-all cursor-pointer group`}>
                
                {!n.lida && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"></div>}
                
                <div className={`relative shrink-0 ${!n.lida ? 'ml-2' : ''}`}>
                  <img src={n.deFoto || "https://via.placeholder.com/150"} className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md" alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bgIcon} text-white border border-[#141414] shadow-md`}>
                    {icone}
                  </div>
                </div>

                <div className="flex flex-col justify-center flex-1">
                  <p className="text-xs text-gray-300 leading-snug mb-1">
                    <span className="font-black text-white uppercase">{n.deNome?.split(" ")[0]}</span> {n.texto || "interagiu com você."}
                  </p>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    {n.data?.toDate ? tempoAtras(n.data.toDate()) : "Agora"}
                  </span>
                </div>
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <span className="text-6xl mb-4 grayscale">🔕</span>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Caixa Vazia</p>
            </div>
          )}
        </div>

        {/* FOOTER DO DRAWER */}
        {naoLidas > 0 && (
          <div className="p-6 border-t border-white/5 bg-[#0a0a0a]">
            <button onClick={marcarTodas} className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md">
              Marcar todas como lidas ✓
            </button>
          </div>
        )}
      </div>
    </>
  );
}