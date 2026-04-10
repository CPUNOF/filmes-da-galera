"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AreaComentarios({ filmeId }) {
  const [user, setUser] = useState(null);
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState([]);

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

    await addDoc(collection(db, "comentarios"), {
      filmeId,
      texto: comentario,
      autor: user.displayName,
      foto: user.photoURL,
      uid: user.uid,
      data: serverTimestamp()
    });
    setComentario("");
  };

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
        <span className="w-2 h-8 bg-red-600 rounded-full"></span>
        Mural de Resenhas
      </h3>

      {user ? (
        <form onSubmit={enviarComentario} className="mb-12 flex gap-4">
          <img src={user.photoURL} className="w-12 h-12 rounded-2xl border border-white/10" />
          <div className="flex-1 flex flex-col gap-3">
            <textarea 
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="O que você achou desse filme? Manda o papo..."
              className="bg-[#141414] border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-red-500 min-h-[100px] resize-none"
            />
            <button className="bg-red-600 hover:bg-red-700 text-white font-black py-3 px-8 rounded-xl self-end text-xs uppercase tracking-widest transition-all">
              Postar Resenha
            </button>
          </div>
        </form>
      ) : (
        <p className="bg-white/5 p-6 rounded-2xl text-gray-500 text-center border border-dashed border-white/10 mb-12">
          Faça login para deixar sua resenha.
        </p>
      )}

      <div className="space-y-6">
        {comentarios.map((c) => (
          <div key={c.id} className="bg-[#141414] p-6 rounded-3xl border border-white/5 flex gap-4">
            <img src={c.foto} className="w-10 h-10 rounded-xl" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm text-white">{c.autor}</span>
                <span className="text-[10px] text-gray-600 font-bold uppercase">
                   {c.data?.toDate().toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{c.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}