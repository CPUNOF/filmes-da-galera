"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, collection, getDocs, updateDoc, getDoc } from "firebase/firestore"; // Adicionamos o getDoc aqui
import toast from "react-hot-toast";

export default function AreaVotacao({ filmeId }) {
  const [usuario, setUsuario] = useState(null);
  const [nota, setNota] = useState(10);
  const [jaVotou, setJaVotou] = useState(false); // Sabe se é voto novo ou edição
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUsuario(user));
    return () => unsubscribe();
  }, []);

  // Novo: Assim que descobrir quem é o usuário, vai no banco ver se ele já votou nesse filme
  useEffect(() => {
    async function buscarVotoAnterior() {
      if (!usuario) return;
      const votoRef = doc(db, "filmes", filmeId, "votos", usuario.uid);
      const votoSnap = await getDoc(votoRef);
      
      if (votoSnap.exists()) {
        setNota(votoSnap.data().nota); // Pré-seleciona a nota que ele tinha dado
        setJaVotou(true); // Muda o botão para "Atualizar"
      }
    }
    buscarVotoAnterior();
  }, [usuario, filmeId]);

  const registrarVoto = async () => {
    if (!usuario) return;
    setCarregando(true);
    
    try {
      await setDoc(doc(db, "filmes", filmeId, "votos", usuario.uid), {
        nota: Number(nota),
        nome: usuario.displayName
      });

      const votosRef = collection(db, "filmes", filmeId, "votos");
      const votosSnap = await getDocs(votosRef);
      
      let soma = 0;
      votosSnap.forEach(doc => { soma += doc.data().nota; });
      const novaMedia = (soma / votosSnap.size).toFixed(1); 

      await updateDoc(doc(db, "filmes", filmeId), {
        notaGeral: Number(novaMedia),
        quantidadeVotos: votosSnap.size
      });

      setJaVotou(true);
      toast.success(jaVotou ? "Voto atualizado com sucesso!" : "Voto registrado com sucesso!");
      window.location.reload(); // Recarrega a página para mostrar a nova média atualizada na hora!
    } catch (error) {
      console.error("Erro ao votar:", error);
      toast.error("Putz, deu um erro ao registrar o voto.");
    } finally {
      setCarregando(false);
    }
  };

  if (!usuario) {
    return (
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mt-8">
        <h3 className="text-lg font-bold mb-2">Sua Avaliação</h3>
        <p className="text-gray-400 text-sm">Faça login no topo da página para dar sua nota.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 mt-8">
      <h3 className="text-lg font-bold mb-4">
        {jaVotou ? "Você já avaliou este filme" : "Sua Avaliação"}
      </h3>
      
      <div className="flex gap-4 items-center">
        <select
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          className="bg-gray-800 text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:border-red-500 font-bold"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>{num} Estrelas</option>
          ))}
        </select>
        
        <button 
          onClick={registrarVoto} 
          disabled={carregando}
          className={`${jaVotou ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white font-black py-4 px-6 rounded-xl transition-all w-full text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-600/20 mt-4`}
        >
          {carregando ? "Salvando..." : (jaVotou ? "Atualizar Voto" : "Confirmar Voto")}
        </button>
      </div>
    </div>
  );
}