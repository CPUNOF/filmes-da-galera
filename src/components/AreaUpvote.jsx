/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function AreaUpvote({ filmeId }) {
  const [usuario, setUsuario] = useState(null);
  const [upvotes, setUpvotes] = useState([]);
  const [votosDados, setVotosDados] = useState([]); // Guarda {uid, nome, foto}
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  
  const [donoFilme, setDonoFilme] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "filmes", filmeId), (filmeSnap) => {
      if (filmeSnap.exists()) {
        const data = filmeSnap.data();
        if (data.upvotes) setUpvotes(data.upvotes);
        if (data.votosInfo) setVotosDados(data.votosInfo);
        setDonoFilme(data.sugeridoPor?.uid);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [filmeId]);

  const alternarVoto = async () => {
    if (!usuario) {
      toast.error("Faça login para votar nas sugestões!");
      return;
    }
    
    setProcessando(true);
    const filmeRef = doc(db, "filmes", filmeId);
    const userRef = doc(db, "usuarios", usuario.email.toLowerCase());
    const jaVotou = upvotes.includes(usuario.uid);

    try {
      if (jaVotou) {
        // TIRA O VOTO
        const novaListaInfo = votosDados.filter(v => v.uid !== usuario.uid);
        await updateDoc(filmeRef, { 
          upvotes: arrayRemove(usuario.uid),
          votosInfo: novaListaInfo
        });
        
        // ANTI-FARM: Só tira o ponto se o filme NÃO for seu
        if (donoFilme !== usuario.uid) {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            let progresso = userSnap.data().votosParaIngresso || 0;
            if (progresso > 0) {
              await updateDoc(userRef, { votosParaIngresso: progresso - 1 });
            }
          }
        }
      } else {
        // ADICIONA O VOTO
        const infoVoto = { uid: usuario.uid, foto: usuario.photoURL, nome: usuario.displayName };
        
        await updateDoc(filmeRef, { 
          upvotes: arrayUnion(usuario.uid),
          votosInfo: arrayUnion(infoVoto)
        });

        // ANTI-FARM: Verifica se o filme é seu
        if (donoFilme === usuario.uid) {
          toast("Voto registrado! (Seus filmes não dão pontos 😅)", { 
            icon: '🔥', style: { background: '#111', color: '#fff', fontSize: '11px', border: '1px solid #333' } 
          });
        } else {
          // Se não for seu, ganha o ponto para a meta de 20!
          const userSnap = await getDoc(userRef);
          let progresso = 0;
          let ingressos = 0;

          if (userSnap.exists()) {
            progresso = userSnap.data().votosParaIngresso || 0;
            ingressos = userSnap.data().ingressosDourados || 0;
          }

          progresso += 1;

          if (progresso >= 20) {
            progresso = 0;
            ingressos += 1;
            toast.success("🎫 INGRESSO DOURADO GANHO!\nVocê ajudou a galera 20 vezes!", { 
              duration: 6000, 
              style: { background: '#ca8a04', color: '#fff', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', fontSize: '12px' }
            });
          } else {
            toast(`🔥 +1 Ponto! Faltam ${20 - progresso} para o Ingresso Dourado.`, { 
              icon: '🔥', 
              style: { background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold', border: '1px solid #333' } 
            });
          }

          await setDoc(userRef, { votosParaIngresso: progresso, ingressosDourados: ingressos }, { merge: true });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar o voto.");
    } finally {
      setProcessando(false);
    }
  };

  const jaVotou = usuario && upvotes.includes(usuario.uid);

  return (
    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner mt-8 w-full flex flex-col gap-4">
      
      <div className="text-center w-full">
        <h3 className="text-sm sm:text-base font-black uppercase italic tracking-tighter mb-1 text-white">Queremos assistir!</h3>
        <p className="text-gray-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
          Quem quer que este filme fure a fila:
        </p>
      </div>

      <div className="flex flex-row items-center justify-between gap-3 w-full bg-[#141414] p-2 rounded-xl border border-white/5">
        <div className="text-center px-3 sm:px-4 border-r border-white/10 shrink-0">
          <span className="block text-xl sm:text-2xl font-black text-orange-500 leading-none mb-1">
            {upvotes.length}
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
            {upvotes.length === 1 ? "Voto" : "Votos"}
          </span>
        </div>

        <button 
          onClick={alternarVoto}
          disabled={carregando || processando}
          className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-3.5 rounded-lg font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 ${
            jaVotou 
              ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
              : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10'
          } ${(carregando || processando) ? 'opacity-50 cursor-wait' : ''}`}
        >
          {jaVotou ? (
             <><span>✔️</span> Já Votei</>
          ) : (
             <><span>🔥</span> Dar Voto</>
          )}
        </button>
      </div>

      {/* 🪄 MURAL DE QUEM VOTOU */}
      <div className="pt-3 border-t border-white/5 flex flex-wrap justify-center gap-2">
        {votosDados.map((v, i) => (
          <div key={i} className="relative group/voto">
            <img src={v.foto || "https://via.placeholder.com/150"} className="w-8 h-8 rounded-full border border-white/10 object-cover" alt="" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 text-white text-[8px] rounded opacity-0 group-hover/voto:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
              {v.nome}
            </div>
          </div>
        ))}
        {votosDados.length === 0 && (
          <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Ninguém votou ainda.</p>
        )}
      </div>
      
      {!usuario && <p className="text-red-400 text-[9px] uppercase tracking-widest font-bold mt-1 text-center w-full">Faça login para votar.</p>}
    </div>
  );
}