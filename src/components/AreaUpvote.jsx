"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function AreaUpvote({ filmeId }) {
  const [usuario, setUsuario] = useState(null);
  const [upvotes, setUpvotes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Vigia quem está logado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  // Busca a quantidade de votos desse filme
  useEffect(() => {
    async function buscarVotos() {
      const filmeSnap = await getDoc(doc(db, "filmes", filmeId));
      if (filmeSnap.exists() && filmeSnap.data().upvotes) {
        setUpvotes(filmeSnap.data().upvotes);
      }
      setCarregando(false);
    }
    buscarVotos();
  }, [filmeId]);

  const alternarVoto = async () => {
    if (!usuario) return alert("Faça login para votar nas sugestões!");
    
    const filmeRef = doc(db, "filmes", filmeId);
    const jaVotou = upvotes.includes(usuario.uid);

    // Se já votou, tira o voto. Se não votou, adiciona. (Igual like de Instagram)
    if (jaVotou) {
      await updateDoc(filmeRef, { upvotes: arrayRemove(usuario.uid) });
      setUpvotes(upvotes.filter(id => id !== usuario.uid));
    } else {
      await updateDoc(filmeRef, { upvotes: arrayUnion(usuario.uid) });
      setUpvotes([...upvotes, usuario.uid]);
    }
  };

  const jaVotou = usuario && upvotes.includes(usuario.uid);

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mt-8">
      <h3 className="text-lg font-bold mb-2">Queremos assistir!</h3>
      <p className="text-gray-400 text-sm mb-4">
        Vote para este filme subir na fila da galera.
      </p>

      <div className="flex items-center gap-4">
        <button 
          onClick={alternarVoto}
          disabled={carregando}
          className={`flex items-center gap-2 px-6 py-3 rounded-md font-bold transition-all ${
            jaVotou 
              ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <span className="text-xl">🔥</span> 
          {jaVotou ? "Voto Registrado!" : "Votar neste filme"}
        </button>
        
        <div className="text-2xl font-bold text-blue-400">
          {upvotes.length} {upvotes.length === 1 ? "voto" : "votos"}
        </div>
      </div>
      
      {!usuario && <p className="text-red-400 text-sm mt-3">Faça login no topo da página para votar.</p>}
    </div>
  );
}