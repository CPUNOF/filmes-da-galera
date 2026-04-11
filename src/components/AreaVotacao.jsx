/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

// Função para recalcular a média (Mantida para garantir a integridade do dado)
async function calcMedia(filmeId) {
  const votosRef = collection(db, `filmes/${filmeId}/votos`);
  const votosSnap = await getDocs(votosRef);
  const totalVotos = votosSnap.size;
  if (totalVotos === 0) return 0;
  let soma = 0;
  votosSnap.forEach(documento => soma += Number(documento.data().nota));
  return (soma / totalVotos).toFixed(1);
}

export default function AreaVotacao({ filmeId }) {
  const [user, setUser] = useState(null);
  const [novaNota, setNovaNota] = useState(null); 
  const [votoUsuario, setVotoUsuario] = useState(null); 
  const [salvando, setSalvando] = useState(false);
  const [votosGrupo, setVotosGrupo] = useState([]); // 🪄 GUARDA OS VOTOS DA GALERA
  
  // ESTADO PARA O ÍCONE DE FEEDBACK ANIMADO
  const [feedbackIcon, setFeedbackIcon] = useState(null); 

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 🪄 BUSCA TODOS OS VOTOS DO FILME EM TEMPO REAL
    const unsubscribeVotos = onSnapshot(collection(db, `filmes/${filmeId}/votos`), (snap) => {
      const lista = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setVotosGrupo(lista);
      
      if (auth.currentUser) {
        const meuVoto = lista.find(v => v.uid === auth.currentUser.uid);
        if (meuVoto) {
          setVotoUsuario(Number(meuVoto.nota));
          setNovaNota(Number(meuVoto.nota));
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeVotos();
    };
  }, [filmeId]);

  const handleVotar = async () => {
    if (!user) {
      toast.error("Você precisa de iniciar sessão para avaliar!");
      return;
    }
    if (novaNota === null) {
      toast.error("Selecione uma nota antes de avaliar!");
      return;
    }
    if (novaNota === votoUsuario) {
      toast("A sua nota já é essa.", { icon: '🤔' });
      return;
    }

    setSalvando(true);
    const votoRef = doc(db, `filmes/${filmeId}/votos/${user.uid}`);
    const userRef = doc(db, "usuarios", user.email.toLowerCase());
    
    // Verifica se é a primeira vez que vota neste filme
    const isNovoVoto = votoUsuario === null;

    try {
      // Salva ou Atualiza o voto
      await setDoc(votoRef, {
        nota: novaNota,
        dataVoto: new Date(),
        usuarioNome: user.displayName,
        usuarioFoto: user.photoURL
      });

      // Recalcula a média geral do filme
      const media = await calcMedia(filmeId);
      await updateDoc(doc(db, "filmes", filmeId), { notaGeral: media });

      setVotoUsuario(novaNota); 

      // ANTI-FARM: Verifica quem é o dono do filme antes de dar o ponto
      const filmeDocSnap = await getDoc(doc(db, "filmes", filmeId));
      const donoDoFilme = filmeDocSnap.exists() ? filmeDocSnap.data().sugeridoPor?.uid : null;

      // LÓGICA DO INGRESSO DOURADO: Só ganha pontos se for a primeira vez a avaliar este filme
      if (isNovoVoto) {
        if (donoDoFilme === user.uid) {
           toast("Avaliação Salva! (Seus filmes não dão pontos pro ingresso 😅)", { 
            icon: '⭐', style: { background: '#111', color: '#fff', fontSize: '11px', border: '1px solid #333' } 
          });
        } else {
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
            toast.success("🎫 INGRESSO DOURADO GANHO!\nVocê avaliou 20 filmes da Galera!", { 
              duration: 6000, 
              style: { background: '#ca8a04', color: '#fff', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', fontSize: '12px' }
            });
          } else {
            toast(`⭐ Avaliação Salva! +1 Ponto!\nFaltam ${20 - progresso} para o Ingresso Dourado.`, { 
              icon: '🎟️', 
              style: { background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold', border: '1px solid #333' } 
            });
          }

          await setDoc(userRef, { votosParaIngresso: progresso, ingressosDourados: ingressos }, { merge: true });
        }
      } else {
        toast.success("Avaliação atualizada com sucesso!");
      }

      // ACIONA A ANIMAÇÃO CIRÚRGICA DE FEEDBACK
      if (novaNota >= 9) {
        setFeedbackIcon('trophy');
      } else if (novaNota <= 5) {
        setFeedbackIcon('poop');
      }
      
      // Remove o ícone após 3 segundos
      setTimeout(() => setFeedbackIcon(null), 3000);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao guardar a avaliação.");
    } finally {
      setSalvando(false);
    }
  };

  const notas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <>
      <style>{`
        /* ANIMAÇÕES CIRÚRGICAS FDG PREMIUM */
        @keyframes popAndGlow {
          0% { transform: translate(-50%, -50%) scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.7)); }
        }
        @keyframes poopSpin {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); opacity: 1; }
        }
        
        .feedback-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 50;
          pointer-events: none;
        }
        .icon-trophy {
          font-size: 100px;
          animation: popAndGlow 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .icon-poop {
          font-size: 80px;
          animation: poopSpin 1s ease-out forwards;
        }
      `}</style>

      <div className="bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner relative overflow-hidden min-h-[220px] flex flex-col gap-6">
        
        {/* CONDITIONAL RENDER DO ÍCONE DE FEEDBACK ANIMADO */}
        {feedbackIcon && (
          <div className="feedback-overlay">
            {feedbackIcon === 'trophy' && <span className="icon-trophy">🏆</span>}
            {feedbackIcon === 'poop' && <span className="icon-poop">💩</span>}
          </div>
        )}

        <div className={`transition-all duration-300 ${feedbackIcon ? 'blur-sm opacity-30' : ''}`}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-5 text-center flex items-center justify-center gap-2">
            <span className="w-6 h-[1px] bg-gray-800"></span> 
            {user ? "Sua Avaliação Livre" : "Inicie Sessão para Avaliar"}
            <span className="w-6 h-[1px] bg-gray-800"></span>
          </p>
          
          <div className="flex flex-wrap justify-center gap-2.5 mb-7">
            {notas.map((num) => (
              <button
                key={num}
                disabled={!user || salvando}
                onClick={() => setNovaNota(num)}
                className={`w-10 h-10 rounded-xl font-black text-xs transition-all duration-300 border cursor-pointer active:scale-90 ${
                  novaNota === num 
                    ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] scale-110" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white hover:-translate-y-0.5"
                } ${!user && 'opacity-30 cursor-not-allowed'}`}
              >
                {num}
              </button>
            ))}
          </div>

          <button 
            disabled={!user || salvando || novaNota === votoUsuario || novaNota === null}
            onClick={handleVotar}
            className={`w-full font-black py-4 rounded-xl text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
              salvando
                ? "bg-gray-800 text-gray-600 cursor-wait"
                : "bg-white text-black hover:bg-red-600 hover:text-white cursor-pointer"
            } ${(!user || novaNota === votoUsuario || novaNota === null) && 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
          >
            {salvando ? "A processar no Cofre..." : (votoUsuario ? "Atualizar Avaliação" : "Confirmar Avaliação")}
          </button>
        </div>

        {/* 🪄 MURAL: O VEREDITO DA GALERA */}
        <div className={`border-t border-white/5 pt-5 transition-all duration-300 ${feedbackIcon ? 'blur-sm opacity-30' : ''}`}>
          <p className="text-[10px] font-black uppercase text-gray-500 text-center mb-4 tracking-[0.2em]">O Veredito da Galera</p>
          
          {votosGrupo.length === 0 ? (
            <p className="text-center text-[9px] text-gray-600 uppercase font-black py-2">Ninguém avaliou ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {votosGrupo.map((v) => (
                <div key={v.uid} className="flex items-center gap-3 bg-[#141414] p-2 sm:p-3 rounded-xl border border-white/5">
                  <img src={v.usuarioFoto || "https://via.placeholder.com/150"} className="w-8 h-8 rounded-lg object-cover border border-white/10" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-white uppercase truncate">{v.usuarioNome}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px]">⭐</span>
                      <span className="text-[11px] font-black text-yellow-500">{v.nota}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}