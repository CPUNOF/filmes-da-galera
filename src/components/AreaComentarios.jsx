/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, getDoc, setDoc, getDocs, deleteDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

export default function AreaComentarios({ filmeId }) {
  const [user, setUser] = useState(null);
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState([]);
  const [enviando, setEnviando] = useState(false);
  
  // Estados para Edição
  const [editandoId, setEditandoId] = useState(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));

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
    const t = toast.loading("Publicando resenha...");

    try {
      await addDoc(collection(db, "comentarios"), {
        filmeId,
        texto: comentario,
        autor: user.displayName,
        foto: user.photoURL,
        uid: user.uid,
        likes: [], // Inicia sem likes
        data: serverTimestamp()
      });

      setComentario("");
      const qComent = query(collection(db, "comentarios"), where("filmeId", "==", filmeId), where("uid", "==", user.uid));
      const snapComent = await getDocs(qComent);
      const isPrimeiraResenha = snapComent.size <= 1;

      if (isPrimeiraResenha) {
        const userRef = doc(db, "usuarios", user.email.toLowerCase());
        const userSnap = await getDoc(userRef);
        let progresso = userSnap.exists() ? userSnap.data().votosParaIngresso || 0 : 0;
        let ingressos = userSnap.exists() ? userSnap.data().ingressosDourados || 0 : 0;
        progresso += 2;

        if (progresso >= 20) {
          await setDoc(userRef, { votosParaIngresso: progresso - 20, ingressosDourados: ingressos + 1 }, { merge: true });
          toast.success("🎫 INGRESSO DOURADO GANHO!", { id: t });
        } else {
          await setDoc(userRef, { votosParaIngresso: progresso }, { merge: true });
          toast.success("💬 +2 Pontos ganhos!", { id: t });
        }
      } else {
        toast.success("Resenha publicada!", { id: t });
      }
    } catch (e) { toast.error("Erro ao postar.", { id: t }); }
    finally { setEnviando(false); }
  };

  const excluirComentario = async (id) => {
    if (window.confirm("Deseja apagar sua resenha?")) {
      try {
        await deleteDoc(doc(db, "comentarios", id));
        toast.success("Resenha removida.");
      } catch (e) { toast.error("Erro ao apagar."); }
    }
  };

  const salvarEdicao = async (id) => {
    if (!textoEdicao.trim()) return;
    try {
      await updateDoc(doc(db, "comentarios", id), { texto: textoEdicao });
      setEditandoId(null);
      toast.success("Resenha atualizada!");
    } catch (e) { toast.error("Erro ao salvar."); }
  };

  const alternarLike = async (id, jaDeuLike) => {
    if (!user) return toast.error("Faça login para dar like!");
    const ref = doc(db, "comentarios", id);
    const dadosLike = { uid: user.uid, nome: user.displayName, foto: user.photoURL };
    
    try {
      if (jaDeuLike) {
        // Remove o objeto completo buscando pelo uid
        const coment = comentarios.find(c => c.id === id);
        const likeObj = coment.likes.find(l => l.uid === user.uid);
        await updateDoc(ref, { likes: arrayRemove(likeObj) });
      } else {
        await updateDoc(ref, { likes: arrayUnion(dadosLike) });
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
        <span className="w-2 h-8 bg-red-600 rounded-full"></span>
        Mural de Resenhas
      </h3>

      {user ? (
        <form onSubmit={enviarComentario} className="mb-12 flex gap-4">
          <img src={user.photoURL} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
          <div className="flex-1 flex flex-col gap-3">
            <textarea 
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="O que achou deste filme?..."
              className="bg-[#141414] border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-red-500 min-h-[100px] resize-none"
            />
            <button className="bg-red-600 text-white font-black py-3 px-8 rounded-xl self-end text-xs uppercase tracking-widest">Postar Resenha</button>
          </div>
        </form>
      ) : <p className="text-center text-gray-500 mb-12">Faça login para resenhar.</p>}

      <div className="space-y-6">
        {comentarios.map((c) => {
          const meusLikes = c.likes || [];
          const jaDeuLike = meusLikes.some(l => l.uid === user?.uid);

          return (
            <div key={c.id} className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex flex-col gap-4 relative group">
              <div className="flex gap-4">
                <img src={c.foto} className="w-10 h-10 rounded-xl object-cover" alt="" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{c.autor}</span>
                      <span className="text-[10px] text-gray-600 font-bold uppercase">{c.data ? c.data.toDate().toLocaleDateString('pt-BR') : "Agora"}</span>
                    </div>
                    {user?.uid === c.uid && (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditandoId(c.id); setTextoEdicao(c.texto); }} className="text-[10px] text-blue-500 hover:underline uppercase font-black">Editar</button>
                        <button onClick={() => excluirComentario(c.id)} className="text-[10px] text-red-500 hover:underline uppercase font-black">Excluir</button>
                      </div>
                    )}
                  </div>

                  {editandoId === c.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea value={textoEdicao} onChange={(e) => setTextoEdicao(e.target.value)} className="bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500" />
                      <div className="flex gap-2 self-end">
                        <button onClick={() => setEditandoId(null)} className="text-[10px] text-gray-500 uppercase font-black">Cancelar</button>
                        <button onClick={() => salvarEdicao(c.id)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] uppercase font-black">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm leading-relaxed">{c.texto}</p>
                  )}
                </div>
              </div>

              {/* Sistema de Like e Quem Deu Like */}
              <div className="flex items-center gap-4 mt-2 pt-4 border-t border-white/5">
                <button 
                  onClick={() => alternarLike(c.id, jaDeuLike)}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${jaDeuLike ? 'text-red-500' : 'text-gray-600 hover:text-white'}`}
                >
                  🍿 {meusLikes.length} Likes
                </button>

                {meusLikes.length > 0 && (
                  <div className="flex -space-x-2">
                    {meusLikes.slice(0, 5).map((l, i) => (
                      <div key={i} className="relative group/user">
                        <img src={l.foto} className="w-5 h-5 rounded-full border border-[#141414] object-cover" alt="" title={l.nome} />
                        {/* Pop-up de nome no Hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-[8px] rounded opacity-0 group-hover/user:opacity-100 whitespace-nowrap pointer-events-none z-50">
                          {l.nome}
                        </div>
                      </div>
                    ))}
                    {meusLikes.length > 5 && <span className="text-[8px] text-gray-500 ml-3 self-center">+{meusLikes.length - 5}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}