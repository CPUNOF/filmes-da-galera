"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

export default function AreaComentarios({ filmeId }) {
  const [user, setUser] = useState(null);
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));

    // Busca os comentários em tempo real
    const q = query(
      collection(db, "comentarios"), 
      where("filmeId", "==", filmeId),
      orderBy("data", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComentarios(docs);
    });

    return () => unsubscribe();
  }, [filmeId]);

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim() || !user) return;

    setEnviando(true);
    const t = toast.loading("A publicar a sua resenha...");

    try {
      // 1. Salva o comentário no banco de dados
      await addDoc(collection(db, "comentarios"), {
        filmeId,
        texto: comentario,
        autor: user.displayName,
        foto: user.photoURL,
        uid: user.uid,
        data: serverTimestamp()
      });

      setComentario("");

      // 2. 🪄 LÓGICA ANTI-FARM E PONTUAÇÃO (+2 Pontos)
      const filmeDoc = await getDoc(doc(db, "filmes", filmeId));
      const donoDoFilme = filmeDoc.exists() ? filmeDoc.data().sugeridoPor?.uid : null;

      // Verifica se é a primeira vez que este utilizador comenta neste filme
      const qComent = query(collection(db, "comentarios"), where("filmeId", "==", filmeId), where("uid", "==", user.uid));
      const snapComent = await getDocs(qComent);
      
      // Se o tamanho for <= 1, significa que o comentário que acabamos de adicionar é o primeiro!
      const isPrimeiraResenha = snapComent.size <= 1;

      if (isPrimeiraResenha) {
        if (donoDoFilme === user.uid) {
          toast.dismiss(t);
          toast("Resenha publicada! (Os seus filmes não dão pontos para o ingresso 😅)", { 
            icon: '💬', style: { background: '#111', color: '#fff', fontSize: '11px', border: '1px solid #333' } 
          });
        } else {
          const userRef = doc(db, "usuarios", user.email.toLowerCase());
          const userSnap = await getDoc(userRef);
          
          let progresso = 0;
          let ingressos = 0;

          if (userSnap.exists()) {
            progresso = userSnap.data().votosParaIngresso || 0;
            ingressos = userSnap.data().ingressosDourados || 0;
          }

          progresso += 2; // Resenha vale O DOBRO de pontos!

          toast.dismiss(t);

          if (progresso >= 20) {
            const resto = progresso - 20; // Guarda os pontos que passarem de 20
            progresso = resto;
            ingressos += 1;
            toast.success("🎫 INGRESSO DOURADO GANHO!\nVocê é um Crítico de Elite!", { 
              duration: 6000, 
              style: { background: '#ca8a04', color: '#fff', fontWeight: '900', textTransform: 'uppercase', textAlign: 'center', fontSize: '12px' }
            });
          } else {
            toast(`💬 Resenha Salva! +2 Pontos!\nFaltam ${20 - progresso} para o Ingresso Dourado.`, { 
              icon: '🎟️', 
              style: { background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold', border: '1px solid #333' } 
            });
          }

          await setDoc(userRef, { votosParaIngresso: progresso, ingressosDourados: ingressos }, { merge: true });
        }
      } else {
        // Se já tiver comentado antes, apenas avisa que publicou com sucesso
        toast.dismiss(t);
        toast.success("Nova resenha adicionada ao mural!");
      }

    } catch (error) {
      console.error(error);
      toast.dismiss(t);
      toast.error("Erro ao publicar a resenha.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
        <span className="w-2 h-8 bg-red-600 rounded-full"></span>
        Mural de Resenhas
      </h3>

      {user ? (
        <form onSubmit={enviarComentario} className="mb-12 flex gap-4">
          <img src={user.photoURL} className="w-12 h-12 rounded-2xl border border-white/10" alt="Avatar" />
          <div className="flex-1 flex flex-col gap-3">
            <textarea 
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              disabled={enviando}
              placeholder="O que achou deste filme? Manda o papo..."
              className="bg-[#141414] border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-red-500 min-h-[100px] resize-none disabled:opacity-50"
            />
            <button 
              disabled={enviando || !comentario.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white font-black py-3 px-8 rounded-xl self-end text-xs uppercase tracking-widest transition-all"
            >
              {enviando ? "A Enviar..." : "Postar Resenha"}
            </button>
          </div>
        </form>
      ) : (
        <p className="bg-white/5 p-6 rounded-2xl text-gray-500 text-center border border-dashed border-white/10 mb-12">
          Inicie sessão para deixar a sua resenha e ganhar pontos.
        </p>
      )}

      <div className="space-y-6">
        {comentarios.map((c) => (
          <div key={c.id} className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex gap-4">
            <img src={c.foto} className="w-10 h-10 rounded-xl" alt="Foto" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-white">{c.autor}</span>
                <span className="text-[10px] text-gray-600 font-bold uppercase">
                   {c.data ? c.data.toDate().toLocaleDateString('pt-BR') : "Agora"}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{c.texto}</p>
            </div>
          </div>
        ))}
        {comentarios.length === 0 && (
          <p className="text-center text-gray-600 text-sm italic border border-dashed border-white/5 p-8 rounded-2xl">Ninguém comentou ainda. Seja o primeiro a resenhar e ganhe 2 pontos!</p>
        )}
      </div>
    </div>
  );
}